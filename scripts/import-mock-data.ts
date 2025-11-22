/**
 * Import mock data to Firestore
 * Run with: npx tsx scripts/import-mock-data.ts
 */

import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore/lite';
import { MOCK_PACKAGES, MOCK_FEATURES, MOCK_ALA_CARTE_OPTIONS } from '../src/mock';

// Load environment variables from .env.local
config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env['VITE_FIREBASE_API_KEY'],
  authDomain: process.env['VITE_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['VITE_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['VITE_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['VITE_FIREBASE_APP_ID'],
};

// Verify all required config values are present
const missingVars = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== 'messagingSenderId' && !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required Firebase configuration:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nMake sure .env.local exists with VITE_FIREBASE_* variables.');
  process.exit(1);
}

console.log('🔥 Initializing Firebase...');
console.log(`📁 Project ID: ${firebaseConfig.projectId}\n`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importData() {
  try {
    console.log('\n📊 Starting data import...\n');

    // Import Features
    console.log('📦 Importing features...');
    const featuresCol = collection(db, 'features');
    const existingFeatures = await getDocs(featuresCol);

    const featureIds: Record<string, string> = {};

    if (existingFeatures.empty) {
      for (const feature of MOCK_FEATURES) {
        const { id: mockId, ...featureData } = feature;
        const docRef = await addDoc(featuresCol, featureData);
        featureIds[mockId] = docRef.id;
        console.log(`  ✓ Added feature: ${feature.name} (${docRef.id})`);
      }

      console.log(`\n✓ Imported ${MOCK_FEATURES.length} features\n`);
    } else {
      console.log(`⚠️  Features collection already has ${existingFeatures.size} documents. Skipping features import.\n`);

      // Map existing features to featureIds for package import
      existingFeatures.forEach(doc => {
        const data = doc.data();
        if (!('name' in data)) {
          console.warn(`⚠️  Feature document ${doc.id} is missing 'name' field. Skipping.`);
          return;
        }
        const mockFeature = MOCK_FEATURES.find(mf => mf.name === data['name']);
        if (mockFeature) {
          featureIds[mockFeature.id] = doc.id;
        } else {
          console.warn(`⚠️  Feature document ${doc.id} with name '${data['name']}' could not be matched to any mock feature.`);
        }
      });
    }

    // If features collection was skipped but no matching features found, abort package import
    if (Object.keys(featureIds).length === 0 && !existingFeatures.empty) {
      console.error('❌ Error: No matching features found between Firestore and MOCK_FEATURES.');
      console.error('   Cannot import packages without feature mappings.\n');
      console.log('✅ Data import complete!\n');
      return;
    }

    // Import Packages (with correct feature IDs)
    console.log('📦 Importing packages...');
    const packagesCol = collection(db, 'packages');
    const existingPackages = await getDocs(packagesCol);

    if (existingPackages.empty) {
      let importedCount = 0;

      for (const pkg of MOCK_PACKAGES) {
        const { id: mockId, features, ...packageData } = pkg;

        // Map feature IDs from mock to actual Firestore IDs
        const featureIds_array: string[] = [];
        const missingFeatureNames: string[] = [];
        const missingImportedFeatures: string[] = [];

        for (const f of features) {
          const mockFeatureId = MOCK_FEATURES.find(mf => mf.name === f.name)?.id;
          if (!mockFeatureId) {
            missingFeatureNames.push(f.name);
            continue;
          }
          if (!featureIds[mockFeatureId]) {
            console.error(`  ❌ Error: Package "${pkg.name}" requires feature "${f.name}" but it wasn't imported to Firestore`);
            missingImportedFeatures.push(f.name);
          } else {
            featureIds_array.push(featureIds[mockFeatureId]);
          }
        }

        if (missingFeatureNames.length > 0) {
          console.error(`  ❌ Error: Package "${pkg.name}" has features whose names are not found in MOCK_FEATURES: ${missingFeatureNames.join(', ')}`);
        }
        if (missingImportedFeatures.length > 0) {
          console.error(`  ❌ Error: Package "${pkg.name}" has features that exist in MOCK_FEATURES but were not imported to Firestore: ${missingImportedFeatures.join(', ')}`);
        }
        if (missingFeatureNames.length > 0 || missingImportedFeatures.length > 0) {
          console.error('  Skipping this package import.\n');
          continue;
        }

        const packageDoc = {
          ...packageData,
          featureIds: featureIds_array,
        };

        const docRef = await addDoc(packagesCol, packageDoc);
        console.log(`  ✓ Added package: ${pkg.name} (${docRef.id})`);
        importedCount++;
      }

      console.log(`\n✓ Imported ${importedCount} packages\n`);
    } else {
      console.log(`⚠️  Packages collection already has ${existingPackages.size} documents. Skipping packages import.\n`);
    }

    // Import A La Carte Options
    console.log('📦 Importing a la carte options...');
    const alaCarteCol = collection(db, 'ala_carte_options');
    const existingAlaCarteOptions = await getDocs(alaCarteCol);

    if (existingAlaCarteOptions.empty) {
      for (const option of MOCK_ALA_CARTE_OPTIONS) {
        const { id: mockId, ...optionData } = option;
        const docRef = await addDoc(alaCarteCol, optionData);
        console.log(`  ✓ Added a la carte: ${option.name} (${docRef.id})`);
      }

      console.log(`\n✓ Imported ${MOCK_ALA_CARTE_OPTIONS.length} a la carte options\n`);
    } else {
      console.log(`⚠️  A la carte collection already has ${existingAlaCarteOptions.size} documents. Skipping import.\n`);
    }

    console.log('✅ Data import complete!\n');
    console.log('🌐 Refresh your app to see the data.\n');

  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

importData().then(() => process.exit(0));
