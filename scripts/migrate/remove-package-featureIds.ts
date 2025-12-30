/**
 * Migration Script: Remove legacy package featureIds
 *
 * - Removes the deprecated featureIds array from every doc in the `packages` collection
 * - Backs up any existing featureIds into legacyFeatureIds (only if missing)
 * - Uses Application Default Credentials (no manual key needed in Cloud Shell)
 * - DRY_RUN=1 by default (logs planned changes). Set DRY_RUN=0 to commit writes.
 * - Batch commits are capped at 400 operations.
 */

import admin from 'firebase-admin';

const MAX_BATCH_SIZE = 400;
const DIVIDER = '='.repeat(60);
const isDryRun = process.env['DRY_RUN'] !== '0';

interface MigrationStats {
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function run(): Promise<void> {
  const stats: MigrationStats = { scanned: 0, updated: 0, skipped: 0, errors: 0 };

  console.log('🚀 Starting package featureIds removal');
  console.log(DIVIDER);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (set DRY_RUN=0 to commit)' : 'LIVE (writes enabled)'}`);

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    const db = admin.firestore();

    console.log('\n📦 Fetching packages...');
    const snapshot = await db.collection('packages').get();
    stats.scanned = snapshot.size;
    console.log(`Found ${stats.scanned} package doc(s)\n`);

    if (stats.scanned === 0) {
      console.log('No packages found. Nothing to migrate.');
      await admin.app().delete();
      return;
    }

    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const hasFeatureIdsField = 'featureIds' in data;
      const rawFeatureIds = Array.isArray(data['featureIds']) ? data['featureIds'] : [];
      const hasLegacyBackup = Array.isArray(data['legacyFeatureIds']) && data['legacyFeatureIds'].length > 0;

      if (!hasFeatureIdsField) {
        stats.skipped++;
        continue;
      }

      const updatePayload: Record<string, unknown> = {
        featureIds: admin.firestore.FieldValue.delete(),
      };

      if (!hasLegacyBackup && rawFeatureIds.length > 0) {
        updatePayload['legacyFeatureIds'] = rawFeatureIds;
      }

      stats.updated++;

      if (isDryRun) {
        console.log(
          `🔎 DRY RUN: Would update package ${doc.id} (${data['name'] ?? 'unnamed'}) - ` +
          `${hasLegacyBackup ? 'remove featureIds only' : 'backup to legacyFeatureIds and remove featureIds'}`
        );
        continue;
      }

      batch.set(doc.ref, updatePayload, { merge: true });
      batchCount++;

      if (batchCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        console.log(`💾 Committed batch of ${batchCount} updates`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (!isDryRun && batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} updates`);
    }

    console.log('\n' + DIVIDER);
    console.log('📈 Migration Summary');
    console.log(DIVIDER);
    console.log(`Scanned : ${stats.scanned}`);
    console.log(`Updated : ${stats.updated}`);
    console.log(`Skipped : ${stats.skipped}`);
    console.log(`Errors  : ${stats.errors}`);

    if (!isDryRun && stats.errors > 0) {
      console.error('\n⚠️  Completed with errors. Please review logs.');
      await admin.app().delete();
      process.exit(1);
    }

    console.log('\n✅ Migration finished.');
    await admin.app().delete();
  } catch (err) {
    stats.errors++;
    console.error('\n❌ Fatal error during migration:', err);
    try {
      await admin.app().delete();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

run();
