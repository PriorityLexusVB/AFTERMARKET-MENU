/**
 * Migration Script: Backfill isPublished field for legacy A La Carte options
 * 
 * This script:
 * 1. Reads all docs from ala_carte_options collection
 * 2. For each doc where isPublished is undefined:
 *    - Sets isPublished=true (making legacy docs visible in admin)
 * 3. Does NOT overwrite explicit isPublished=false (respects intentional unpublish)
 * 4. Is idempotent - safe to run multiple times
 * 5. Uses batch writes (max 400 ops per batch)
 * 
 * Usage (from Cloud Shell or local environment with credentials):
 *   npm run migrate:alacarte:publish-backfill
 * 
 * Environment:
 *   Uses Application Default Credentials (no explicit credentials file needed)
 *   Project: gen-lang-client-0877787739
 */

import admin from 'firebase-admin';

// Configuration
const DIVIDER = '='.repeat(60);
const MAX_BATCH_SIZE = 400;

interface MigrationStats {
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Main migration function
async function runMigration(): Promise<void> {
  console.log('🚀 Starting A La Carte isPublished Backfill Migration\n');
  console.log(DIVIDER);

  const stats: MigrationStats = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Initialize Firebase Admin SDK with Application Default Credentials
    admin.initializeApp();
    const db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized\n');

    // Step 1: Read all A La Carte options
    console.log('📦 Reading A La Carte options...');
    const optionsSnapshot = await db.collection('ala_carte_options').get();
    
    stats.scanned = optionsSnapshot.docs.length;
    console.log(`   Found ${stats.scanned} A La Carte options\n`);

    if (stats.scanned === 0) {
      console.log('⚠️  No A La Carte options found. Nothing to migrate.');
      await admin.app().delete();
      process.exit(0);
    }

    // Step 2: Process docs in batches
    console.log('🔄 Processing options...\n');

    let batch = db.batch();
    let batchCount = 0;

    for (const doc of optionsSnapshot.docs) {
      const data = doc.data();
      
      // Only update if isPublished is undefined
      if (data['isPublished'] === undefined) {
        console.log(`  ✏️  Backfilling isPublished=true for "${data['name'] || doc.id}"`);
        batch.set(doc.ref, { isPublished: true }, { merge: true });
        batchCount++;
        stats.updated++;

        // Commit batch if we've reached the max size
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`  💾 Committed batch of ${batchCount} updates`);
          batch = db.batch();
          batchCount = 0;
        }
      } else {
        // Skip docs where isPublished is explicitly set (true or false)
        console.log(`  ⏭️  Skipping "${data['name'] || doc.id}" (isPublished=${data['isPublished']})`);
        stats.skipped++;
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  💾 Committed final batch of ${batchCount} updates`);
    }

    // Summary
    console.log('\n' + DIVIDER);
    console.log('📈 Migration Summary');
    console.log(DIVIDER);
    console.log(`   Scanned:   ${stats.scanned}`);
    console.log(`   Updated:   ${stats.updated}`);
    console.log(`   Skipped:   ${stats.skipped}`);
    console.log(`   Errors:    ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\n⚠️  Some operations failed. Please review the errors above.');
      await admin.app().delete();
      process.exit(1);
    }

    console.log('\n✅ Migration complete!');

    // Clean up
    await admin.app().delete();

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
