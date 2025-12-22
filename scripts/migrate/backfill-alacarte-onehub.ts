/**
 * Migration Script: ONE HUB backfill for A La Carte options
 *
 * This script:
 * 1) Reads all docs from ala_carte_options
 * 2) Ensures legacy docs are marked isPublished=true when missing
 * 3) Ensures a matching feature doc exists with the same id
 *    - Creates the feature when missing (no column/position)
 *    - Sets publishToAlaCarte=true and alaCartePrice from option.price
 *    - Preserves existing feature fields when present
 * 4) Does NOT assign columns or positions
 * 5) Is idempotent
 *
 * Usage:
 *   pnpm migrate:onehub:backfill-alacarte
 *   # or npm run migrate:onehub:backfill-alacarte
 */

import admin from 'firebase-admin';

const DIVIDER = '='.repeat(60);
const MAX_BATCH_SIZE = 400;

interface MigrationStats {
  scanned: number;
  updatedOptions: number;
  createdFeatures: number;
  updatedFeatures: number;
  skipped: number;
}

function coerceNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

async function runMigration(): Promise<void> {
  console.log('🚀 Starting ONE HUB A La Carte → Feature backfill\n');
  console.log(DIVIDER);

  const stats: MigrationStats = {
    scanned: 0,
    updatedOptions: 0,
    createdFeatures: 0,
    updatedFeatures: 0,
    skipped: 0,
  };

  try {
    admin.initializeApp();
    const db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized\n');

    console.log('📦 Reading A La Carte options...');
    const optionsSnapshot = await db.collection('ala_carte_options').get();
    stats.scanned = optionsSnapshot.size;
    console.log(`   Found ${stats.scanned} A La Carte options\n`);

    if (stats.scanned === 0) {
      console.log('⚠️  No A La Carte options found. Nothing to migrate.');
      await admin.app().delete();
      return;
    }

    let batch = db.batch();
    let batchCount = 0;

    const commitBatch = async () => {
      if (batchCount === 0) return;
      await batch.commit();
      console.log(`  💾 Committed batch of ${batchCount} writes`);
      batch = db.batch();
      batchCount = 0;
    };

    for (const docSnap of optionsSnapshot.docs) {
      const optionData = docSnap.data();
      let optionIsPublished = optionData['isPublished'];
      const optionPrice = optionData['price'];
      const optionCost = optionData['cost'];
      const optionWarranty = optionData['warranty'];
      const optionIsNew = optionData['isNew'];
      const optionConnector = optionData['connector'];
      const optionImageUrl = optionData['imageUrl'];
      const optionThumbnailUrl = optionData['thumbnailUrl'];
      const optionVideoUrl = optionData['videoUrl'];
      let madeChange = false;

      // A) Ensure option.isPublished set when missing
      if (optionIsPublished === undefined) {
        batch.set(docSnap.ref, { isPublished: true }, { merge: true });
        batchCount++;
        stats.updatedOptions++;
        madeChange = true;
        optionIsPublished = true;
      }

      // Respect explicit unpublish signals
      if (optionIsPublished === false) {
        if (!madeChange) {
          stats.skipped++;
        }
        if (batchCount >= MAX_BATCH_SIZE) {
          await commitBatch();
        }
        continue;
      }

      // B) Ensure matching feature doc exists
      const featureRef = db.collection('features').doc(docSnap.id);
      const featureSnap = await featureRef.get();

      if (!featureSnap.exists) {
        const newFeature = {
          name: optionData['name'] ?? docSnap.id,
          description: optionData['description'] ?? '',
          points: normalizeStringArray(optionData['points']),
          useCases: normalizeStringArray(optionData['useCases']),
          price: coerceNumber(optionPrice, 0),
          cost: coerceNumber(optionCost, 0),
          connector: optionConnector ?? 'AND',
          publishToAlaCarte: true,
          alaCartePrice: coerceNumber(optionPrice, 0),
          ...(optionWarranty !== undefined ? { alaCarteWarranty: optionWarranty, warranty: optionWarranty } : {}),
          ...(optionIsNew !== undefined ? { alaCarteIsNew: optionIsNew } : {}),
          ...(optionImageUrl !== undefined ? { imageUrl: optionImageUrl } : {}),
          ...(optionThumbnailUrl !== undefined ? { thumbnailUrl: optionThumbnailUrl } : {}),
          ...(optionVideoUrl !== undefined ? { videoUrl: optionVideoUrl } : {}),
        };

        batch.set(featureRef, newFeature, { merge: true });
        batchCount++;
        stats.createdFeatures++;
        madeChange = true;
      } else {
        const existing = featureSnap.data() || {};
        const updatePayload: Record<string, unknown> = {};

        if (!existing['publishToAlaCarte']) {
          updatePayload['publishToAlaCarte'] = true;
        }
        if (existing['alaCartePrice'] === undefined) {
          updatePayload['alaCartePrice'] = coerceNumber(optionPrice, 0);
        }
        if (existing['alaCarteWarranty'] === undefined && optionWarranty !== undefined) {
          updatePayload['alaCarteWarranty'] = optionWarranty;
        }
        if (existing['alaCarteIsNew'] === undefined && optionIsNew !== undefined) {
          updatePayload['alaCarteIsNew'] = optionIsNew;
        }

        if (Object.keys(updatePayload).length > 0) {
          batch.set(featureRef, updatePayload, { merge: true });
          batchCount++;
          stats.updatedFeatures++;
          madeChange = true;
        }
      }

      if (!madeChange) {
        stats.skipped++;
      }

      if (batchCount >= MAX_BATCH_SIZE) {
        await commitBatch();
      }
    }

    await commitBatch();

    console.log('\n' + DIVIDER);
    console.log('📈 Migration Summary');
    console.log(DIVIDER);
    console.log(`   Scanned options:     ${stats.scanned}`);
    console.log(`   Options updated:     ${stats.updatedOptions}`);
    console.log(`   Features created:    ${stats.createdFeatures}`);
    console.log(`   Features updated:    ${stats.updatedFeatures}`);
    console.log(`   Skipped (no change): ${stats.skipped}`);

    console.log('\n✅ Migration complete!');
    await admin.app().delete();
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
