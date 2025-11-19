/**
 * Import mock data to Firestore
 * Run with: npm run import-data
 */

import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore/lite';
import { MOCK_PACKAGES, MOCK_FEATURES, MOCK_ALA_CARTE_OPTIONS } from '../src/mock.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('❌ Firebase configuration is missing required fields:');
  missingFields.forEach(field => console.error(`  - ${field}`));
  console.error('Make sure .env.local exists with all VITE_FIREBASE_* variables.');
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
      
      // Build featureIds map from existing features for package import
      existingFeatures.forEach(doc => {
        const featureData = doc.data();
        const mockFeature = MOCK_FEATURES.find(mf => mf.name === featureData.name);
        if (mockFeature) {
          featureIds[mockFeature.id] = doc.id;
        }
      });
    }

    // Import Packages (checked independently)
    console.log('📦 Importing packages...');
    const packagesCol = collection(db, 'packages');
    const existingPackages = await getDocs(packagesCol);

    if (existingPackages.empty) {
      let importedPackageCount = 0;
      
      for (const pkg of MOCK_PACKAGES) {
        const { id: mockId, features, ...packageData } = pkg;

        // Map feature IDs from mock to actual Firestore IDs with validation
        const featureIdsArray: string[] = [];
        const missingFeatures: string[] = [];
        
        for (const f of features) {
          const mockFeatureId = MOCK_FEATURES.find(mf => mf.name === f.name)?.id;
          if (!mockFeatureId || !featureIds[mockFeatureId]) {
            missingFeatures.push(f.name);
          } else {
            featureIdsArray.push(featureIds[mockFeatureId]);
          }
        }

        if (missingFeatures.length > 0) {
          console.error(`  ❌ Error: Package "${pkg.name}" has features not found in MOCK_FEATURES: ${missingFeatures.join(', ')}`);
          console.error('  Skipping this package import.\n');
          continue;
        }

        const packageDoc = {
          ...packageData,
          featureIds: featureIdsArray,
        };

        const docRef = await addDoc(packagesCol, packageDoc);
        console.log(`  ✓ Added package: ${pkg.name} (${docRef.id})`);
        importedPackageCount++;
      }

      console.log(`\n✓ Imported ${importedPackageCount} packages\n`);
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
