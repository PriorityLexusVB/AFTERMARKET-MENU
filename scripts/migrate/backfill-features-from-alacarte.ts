/**
 * Migration Script: Backfill features from existing A La Carte options
 * 
 * This script:
 * 1. Reads all docs from ala_carte_options collection
 * 2. For each option:
 *    - Fetches or creates a corresponding feature document
 *    - Updates the feature to enable A La Carte publishing
 *    - Updates the A La Carte option with sourceFeatureId and isPublished
 * 3. Is idempotent - can be run multiple times safely
 * 4. Preserves existing feature data when feature exists
 * 5. Does NOT overwrite column/position in features or options
 * 
 * Usage:
 *   npm run migrate:backfill-features-from-alacarte
 * 
 * Environment:
 *   GOOGLE_APPLICATION_CREDENTIALS - Path to Firebase Admin SDK service account JSON
 *   FIREBASE_PROJECT_ID - Firebase project ID (optional if in credentials)
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Configuration
const DIVIDER = '='.repeat(60);

interface AlaCarteOptionDoc {
  id: string;
  name: string;
  description: string;
  points: string[];
  price: number;
  cost?: number;
  warranty?: string;
  isNew?: boolean;
  useCases?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  column?: number;
  position?: number;
  connector?: 'AND' | 'OR';
  sourceFeatureId?: string;
  isPublished?: boolean;
}

interface FeatureDoc {
  id: string;
  name: string;
  description: string;
  points: string[];
  useCases: string[];
  price: number;
  cost: number;
  warranty?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  column?: number;
  position?: number;
  connector?: 'AND' | 'OR';
  publishToAlaCarte?: boolean;
  alaCartePrice?: number;
  alaCarteWarranty?: string;
  alaCarteIsNew?: boolean;
}

interface MigrationStats {
  optionsFound: number;
  featuresCreated: number;
  featuresUpdated: number;
  optionsUpdated: number;
  errors: number;
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

// Main migration function
async function runMigration(): Promise<void> {
  console.log('🚀 Starting A La Carte to Features Backfill Migration\n');
  console.log(DIVIDER);

  const stats: MigrationStats = {
    optionsFound: 0,
    featuresCreated: 0,
    featuresUpdated: 0,
    optionsUpdated: 0,
    errors: 0,
  };

  try {
    // Initialize Firebase
    const app = initializeFirebase();
    const db = admin.firestore(app);
    console.log('✅ Firebase Admin SDK initialized\n');

    // Step 1: Read all A La Carte options
    console.log('📦 Reading A La Carte options...');
    const optionsSnapshot = await db.collection('ala_carte_options').get();
    const options: AlaCarteOptionDoc[] = optionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as AlaCarteOptionDoc));

    stats.optionsFound = options.length;
    console.log(`   Found ${options.length} A La Carte options\n`);

    if (options.length === 0) {
      console.log('⚠️  No A La Carte options found. Nothing to migrate.');
      await app.delete();
      process.exit(0);
    }

    // Step 2: Process each option
    console.log('🔄 Processing options...\n');

    for (const option of options) {
      try {
        const featureId = option.id;
        const featureRef = db.collection('features').doc(featureId);
        const featureDoc = await featureRef.get();

        if (!featureDoc.exists) {
          // Create new feature
          console.log(`  ➕ Creating feature ${featureId} from option "${option.name}"`);
          
          const newFeature: Omit<FeatureDoc, 'id'> = {
            name: option.name,
            description: option.description,
            points: option.points || [],
            useCases: option.useCases || [],
            price: 0, // Default price for feature
            cost: option.cost || 0,
            warranty: option.warranty || '',
            imageUrl: option.imageUrl,
            thumbnailUrl: option.thumbnailUrl,
            videoUrl: option.videoUrl,
            connector: 'AND', // Default connector
            publishToAlaCarte: true,
            alaCartePrice: option.price,
            alaCarteWarranty: option.warranty || '',
            alaCarteIsNew: option.isNew || false,
            // Do NOT set column/position from option
          };

          await featureRef.set(newFeature);
          stats.featuresCreated++;
        } else {
          // Update existing feature
          console.log(`  🔄 Updating feature ${featureId} for A La Carte publishing`);
          
          const existingFeature = featureDoc.data() as FeatureDoc;
          
          const updates: Partial<FeatureDoc> = {
            publishToAlaCarte: true,
            // Keep existing alaCartePrice if present, else use option price
            alaCartePrice: existingFeature.alaCartePrice !== undefined 
              ? existingFeature.alaCartePrice 
              : option.price,
            // Keep existing alaCarteWarranty if present, else use option warranty
            alaCarteWarranty: existingFeature.alaCarteWarranty !== undefined
              ? existingFeature.alaCarteWarranty
              : option.warranty,
            // Keep existing alaCarteIsNew if present, else use option isNew
            alaCarteIsNew: existingFeature.alaCarteIsNew !== undefined
              ? existingFeature.alaCarteIsNew
              : (option.isNew || false),
          };

          await featureRef.update(updates);
          stats.featuresUpdated++;
        }

        // Step 3: Update A La Carte option with sourceFeatureId and isPublished
        const optionRef = db.collection('ala_carte_options').doc(option.id);
        const optionUpdates = {
          sourceFeatureId: featureId,
          isPublished: true,
          // Do NOT overwrite column/position
        };

        await optionRef.update(optionUpdates);
        stats.optionsUpdated++;

      } catch (error) {
        console.error(`  ❌ Error processing option ${option.id}:`, error);
        stats.errors++;
      }
    }

    // Summary
    console.log('\n' + DIVIDER);
    console.log('📈 Migration Summary');
    console.log(DIVIDER);
    console.log(`   Options found:       ${stats.optionsFound}`);
    console.log(`   Features created:    ${stats.featuresCreated}`);
    console.log(`   Features updated:    ${stats.featuresUpdated}`);
    console.log(`   Options updated:     ${stats.optionsUpdated}`);
    console.log(`   Errors:              ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\n⚠️  Some operations failed. Please review the errors above.');
      await app.delete();
      process.exit(1);
    }

    console.log('\n✅ Migration complete!');

    // Clean up
    await app.delete();

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
