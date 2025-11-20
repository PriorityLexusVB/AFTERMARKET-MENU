#!/usr/bin/env tsx

/**
 * Data Integrity Verification Script
 * Checks Firestore data for:
 * - Missing required fields
 * - Invalid pricing (negative values)
 * - Broken references (package features that don't exist)
 * - Orphaned data
 * - Schema validation
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { config } from 'dotenv';
import { ProductFeatureSchema, PackageTierSchema, AlaCarteOptionSchema } from '../src/schemas';

// Load environment variables
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
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface ValidationResult {
  collection: string;
  totalItems: number;
  validItems: number;
  invalidItems: number;
  errors: Array<{ id: string; error: string }>;
  warnings: Array<{ id: string; warning: string }>;
}

async function verifyFeatures(): Promise<ValidationResult> {
  console.log('\n📋 Verifying Features...');
  const result: ValidationResult = {
    collection: 'features',
    totalItems: 0,
    validItems: 0,
    invalidItems: 0,
    errors: [],
    warnings: [],
  };

  try {
    const snapshot = await getDocs(collection(db, 'features'));
    result.totalItems = snapshot.size;

    snapshot.docs.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const validation = ProductFeatureSchema.safeParse(data);

      if (validation.success) {
        result.validItems++;

        // Check for warnings
        if (validation.data.price === 0 && validation.data.cost === 0) {
          result.warnings.push({
            id: doc.id,
            warning: 'Both price and cost are $0 - verify this is intentional',
          });
        }
        if (!validation.data.imageUrl && !validation.data.thumbnailUrl) {
          result.warnings.push({
            id: doc.id,
            warning: 'No images set - consider adding visual content',
          });
        }
      } else {
        result.invalidItems++;
        result.errors.push({
          id: doc.id,
          error: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        });
      }
    });
  } catch (error) {
    console.error('❌ Error fetching features:', error);
  }

  return result;
}

async function verifyPackages(): Promise<ValidationResult> {
  console.log('\n📦 Verifying Packages...');
  const result: ValidationResult = {
    collection: 'packages',
    totalItems: 0,
    validItems: 0,
    invalidItems: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Get all features first to validate references
    const featuresSnapshot = await getDocs(collection(db, 'features'));
    const validFeatureIds = new Set(featuresSnapshot.docs.map(doc => doc.id));

    const snapshot = await getDocs(collection(db, 'packages'));
    result.totalItems = snapshot.size;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const packageData = { id: doc.id, ...data };

      // Check for broken feature references
      if (data.featureIds && Array.isArray(data.featureIds)) {
        const brokenRefs = data.featureIds.filter((id: string) => !validFeatureIds.has(id));
        if (brokenRefs.length > 0) {
          result.errors.push({
            id: doc.id,
            error: `References non-existent features: ${brokenRefs.join(', ')}`,
          });
          result.invalidItems++;
          continue;
        }

        // Fetch actual features for full validation
        const features = await Promise.all(
          data.featureIds.map(async (featureId: string) => {
            const featureDoc = featuresSnapshot.docs.find(d => d.id === featureId);
            return featureDoc ? { id: featureDoc.id, ...featureDoc.data() } : null;
          })
        );

        const validFeatures = features.filter(f => f !== null);
        packageData.features = validFeatures;
      } else {
        packageData.features = [];
      }

      const validation = PackageTierSchema.safeParse(packageData);

      if (validation.success) {
        result.validItems++;

        // Warnings
        if (validation.data.features.length === 0) {
          result.warnings.push({
            id: doc.id,
            warning: 'Package has no features assigned',
          });
        }

        const totalCost = validation.data.features.reduce((sum, f) => sum + f.cost, 0);
        const margin = validation.data.price - totalCost;
        if (margin < 0) {
          result.warnings.push({
            id: doc.id,
            warning: `Negative margin: Selling at $${validation.data.price} but costs $${totalCost}`,
          });
        }
      } else {
        result.invalidItems++;
        result.errors.push({
          id: doc.id,
          error: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        });
      }
    }
  } catch (error) {
    console.error('❌ Error fetching packages:', error);
  }

  return result;
}

async function verifyAlaCarteOptions(): Promise<ValidationResult> {
  console.log('\n🛒 Verifying À La Carte Options...');
  const result: ValidationResult = {
    collection: 'alaCarteOptions',
    totalItems: 0,
    validItems: 0,
    invalidItems: 0,
    errors: [],
    warnings: [],
  };

  try {
    const snapshot = await getDocs(collection(db, 'alaCarteOptions'));
    result.totalItems = snapshot.size;

    snapshot.docs.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const validation = AlaCarteOptionSchema.safeParse(data);

      if (validation.success) {
        result.validItems++;

        // Warnings
        const margin = validation.data.price - validation.data.cost;
        if (margin < 0) {
          result.warnings.push({
            id: doc.id,
            warning: `Negative margin: Selling at $${validation.data.price} but costs $${validation.data.cost}`,
          });
        }
        if (margin / validation.data.price < 0.2) {
          result.warnings.push({
            id: doc.id,
            warning: `Low margin: Only ${((margin / validation.data.price) * 100).toFixed(1)}%`,
          });
        }
      } else {
        result.invalidItems++;
        result.errors.push({
          id: doc.id,
          error: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        });
      }
    });
  } catch (error) {
    console.error('❌ Error fetching à la carte options:', error);
  }

  return result;
}

function printResults(results: ValidationResult[]) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATA INTEGRITY REPORT');
  console.log('='.repeat(60));

  let totalErrors = 0;
  let totalWarnings = 0;

  results.forEach(result => {
    console.log(`\n${result.collection.toUpperCase()}`);
    console.log(`  Total Items: ${result.totalItems}`);
    console.log(`  ✅ Valid: ${result.validItems}`);
    console.log(`  ❌ Invalid: ${result.invalidItems}`);
    console.log(`  ⚠️  Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0) {
      console.log('\n  Errors:');
      result.errors.forEach(({ id, error }) => {
        console.log(`    ❌ ${id}: ${error}`);
      });
      totalErrors += result.errors.length;
    }

    if (result.warnings.length > 0) {
      console.log('\n  Warnings:');
      result.warnings.forEach(({ id, warning }) => {
        console.log(`    ⚠️  ${id}: ${warning}`);
      });
      totalWarnings += result.warnings.length;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);

  if (totalErrors === 0) {
    console.log('\n✅ All data passed validation!');
  } else {
    console.log('\n❌ Fix errors before deploying to production');
    process.exit(1);
  }

  if (totalWarnings > 0) {
    console.log('⚠️  Review warnings - they may indicate issues');
  }
}

async function main() {
  console.log('🔍 Starting Data Integrity Verification...');
  console.log(`📍 Project: ${firebaseConfig.projectId}`);

  const results = await Promise.all([
    verifyFeatures(),
    verifyPackages(),
    verifyAlaCarteOptions(),
  ]);

  printResults(results);
}

main().catch(console.error);
