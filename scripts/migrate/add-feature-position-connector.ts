/**
 * Migration Script: Add position and connector fields to feature documents
 * 
 * This script:
 * 1. Creates a backup of all feature documents
 * 2. Assigns sequential positions per column (0-indexed)
 * 3. Sets connector='AND' for all features that don't have a connector
 * 4. Uses chunked batch writes (max 500 per batch) with retry logic
 * 5. Is idempotent - can be run multiple times safely
 * 
 * Usage:
 *   npm run migrate:feature-positions -- [--dry-run] [--backup-dir=./backup]
 * 
 * Environment:
 *   GOOGLE_APPLICATION_CREDENTIALS - Path to Firebase Admin SDK service account JSON
 *   FIREBASE_PROJECT_ID - Firebase project ID (optional if in credentials)
 * 
 * Example:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run migrate:feature-positions
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run migrate:feature-positions -- --dry-run
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BATCH_SIZE = 500; // Firestore limit
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_CONNECTOR = 'AND' as const;
const DIVIDER = '='.repeat(60);

interface FeatureDocument {
  id: string;
  name: string;
  column?: number;
  position?: number;
  connector?: 'AND' | 'OR';
  [key: string]: unknown;
}

interface MigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Parse command line arguments
function parseArgs(): { dryRun: boolean; backupDir: string } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let backupDir = './backup';

  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--backup-dir=')) {
      backupDir = arg.split('=')[1] || backupDir;
    }
  }

  return { dryRun, backupDir };
}

// Sleep helper for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize Firebase Admin SDK
function initializeFirebase(): admin.app.App {
  const credentialsPath = process.env['GOOGLE_APPLICATION_CREDENTIALS'];
  
  if (!credentialsPath) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.\n' +
      'Please set it to the path of your Firebase Admin SDK service account JSON file.'
    );
  }

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Service account file not found: ${credentialsPath}`);
  }

  const credential = admin.credential.cert(credentialsPath);
  
  return admin.initializeApp({
    credential,
    projectId: process.env['FIREBASE_PROJECT_ID'],
  });
}

// Create backup of features collection
async function createBackup(
  db: admin.firestore.Firestore,
  backupDir: string
): Promise<FeatureDocument[]> {
  console.log(' Creating backup of features collection...');
  
  const featuresRef = db.collection('features');
  const snapshot = await featuresRef.get();
  
  const features: FeatureDocument[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as FeatureDocument[];
  
  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `features-backup-${timestamp}.json`);
  
  fs.writeFileSync(backupPath, JSON.stringify(features, null, 2));
  console.log(` Backup created: ${backupPath}`);
  console.log(`   Total features backed up: ${features.length}`);
  
  return features;
}

// Group features by column
function groupByColumn(features: FeatureDocument[]): Map<number | null, FeatureDocument[]> {
  const groups = new Map<number | null, FeatureDocument[]>();
  
  for (const feature of features) {
    const column = feature.column ?? null;
    const group = groups.get(column) || [];
    group.push(feature);
    groups.set(column, group);
  }
  
  return groups;
}

// Compute position updates for features
function computeUpdates(features: FeatureDocument[]): Map<string, { position: number; connector: 'AND' | 'OR' }> {
  const updates = new Map<string, { position: number; connector: 'AND' | 'OR' }>();
  const groupedByColumn = groupByColumn(features);
  
  for (const [column, columnFeatures] of groupedByColumn) {
    // Sort by existing position first, then by name for consistency
    columnFeatures.sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      if (a.position !== undefined) return -1;
      if (b.position !== undefined) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    
    console.log(`  Column ${column ?? 'unassigned'}: ${columnFeatures.length} features`);
    
    // Assign positions and set connector
    for (let i = 0; i < columnFeatures.length; i++) {
      const feature = columnFeatures[i];
      if (!feature) continue;
      
      const existingPosition = feature.position;
      const existingConnector = feature.connector;
      const needsPositionUpdate = existingPosition !== i;
      const needsConnectorUpdate = existingConnector === undefined;
      
      if (needsPositionUpdate || needsConnectorUpdate) {
        updates.set(feature.id, {
          position: i,
          connector: existingConnector || DEFAULT_CONNECTOR,
        });
      }
    }
  }
  
  return updates;
}

// Execute batch updates with retry logic
async function executeBatchUpdates(
  db: admin.firestore.Firestore,
  updates: Map<string, { position: number; connector: 'AND' | 'OR' }>,
  dryRun: boolean
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: updates.size,
    updated: 0,
    skipped: 0,
    errors: 0,
  };
  
  if (dryRun) {
    console.log('\n DRY RUN - No changes will be made');
    for (const [id, update] of updates) {
      console.log(`  Would update ${id}: position=${update.position}, connector=${update.connector}`);
    }
    stats.skipped = updates.size;
    return stats;
  }
  
  // Convert to array for chunking
  const updateEntries = Array.from(updates.entries());
  const chunks: [string, { position: number; connector: 'AND' | 'OR' }][][] = [];
  
  for (let i = 0; i < updateEntries.length; i += BATCH_SIZE) {
    chunks.push(updateEntries.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`\n Processing ${chunks.length} batch(es)...`);
  
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    if (!chunk) continue;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const batch = db.batch();
        
        for (const [id, update] of chunk) {
          const docRef = db.collection('features').doc(id);
          batch.update(docRef, {
            position: update.position,
            connector: update.connector,
          });
        }
        
        await batch.commit();
        stats.updated += chunk.length;
        console.log(`   Batch ${chunkIndex + 1}/${chunks.length}: ${chunk.length} documents updated`);
        lastError = null;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`   Batch ${chunkIndex + 1} attempt ${attempt + 1} failed:`, lastError.message);
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    if (lastError) {
      stats.errors += chunk.length;
      console.error(`   Batch ${chunkIndex + 1} failed after ${MAX_RETRIES} attempts`);
    }
  }
  
  return stats;
}

// Main migration function
async function runMigration(): Promise<void> {
  console.log(' Starting Feature Position & Connector Migration\n');
  console.log(DIVIDER);
  
  const { dryRun, backupDir } = parseArgs();
  
  if (dryRun) {
    console.log('  Running in DRY RUN mode - no changes will be made\n');
  }
  
  try {
    // Initialize Firebase
    const app = initializeFirebase();
    const db = admin.firestore(app);
    console.log(' Firebase Admin SDK initialized\n');
    
    // Create backup
    const features = await createBackup(db, backupDir);
    
    if (features.length === 0) {
      console.log('\n No features found in the collection. Nothing to migrate.');
      process.exit(0);
    }
    
    // Compute updates
    console.log('\n Computing updates...');
    const updates = computeUpdates(features);
    
    if (updates.size === 0) {
      console.log('\n All features already have position and connector set. Nothing to update.');
      process.exit(0);
    }
    
    console.log(`   ${updates.size} features need updates`);
    
    // Execute updates
    const stats = await executeBatchUpdates(db, updates, dryRun);
    
    // Summary
    console.log('\n' + DIVIDER);
    console.log(' Migration Summary');
    console.log(DIVIDER);
    console.log(`   Total features:   ${features.length}`);
    console.log(`   Updates needed:   ${stats.total}`);
    console.log(`   Updated:          ${stats.updated}`);
    console.log(`   Skipped:          ${stats.skipped}`);
    console.log(`   Errors:           ${stats.errors}`);
    
    if (stats.errors > 0) {
      console.log('\n Some updates failed. Please review the errors above and re-run the migration.');
      process.exit(1);
    }
    
    if (dryRun) {
      console.log('\n Dry run complete. Run without --dry-run to apply changes.');
    } else {
      console.log('\n Migration complete!');
    }
    
    // Clean up
    await app.delete();
    
  } catch (error) {
    console.error('\n Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
