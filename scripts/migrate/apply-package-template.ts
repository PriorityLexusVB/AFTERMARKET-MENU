/**
 * Migration Script: Apply printed menu package template (safe, idempotent)
 *
 * - Baseline:
 *   Elite (col 2): RustGuard, ToughGuard, Interior, Diamond Shield (all AND)
 *   Platinum (col 3): RustGuard, ToughGuard, Interior (all AND)
 *   Gold (col 1): RustGuard AND ToughGuard OR Interior (last item OR)
 * - Creates missing duplicates when needed and assigns strict columns/positions.
 * - DRY_RUN=1 by default. Set DRY_RUN=0 to commit writes.
 * - Logs before/after placement summary and skips A La Carte.
 */

import admin from 'firebase-admin';
import type { ProductFeature } from '../../src/types';

type Connector = 'AND' | 'OR';

const isDryRun = process.env['DRY_RUN'] !== '0';
const DIVIDER = '='.repeat(60);

interface TemplateLane {
  label: string;
  column: 1 | 2 | 3;
  items: Array<{ match: string; connector: Connector }>;
}

const TEMPLATE: TemplateLane[] = [
  {
    label: 'Elite (Column 2)',
    column: 2,
    items: [
      { match: 'rustguard', connector: 'AND' },
      { match: 'toughguard', connector: 'AND' },
      { match: 'interior', connector: 'AND' },
      { match: 'diamond shield', connector: 'AND' },
    ],
  },
  {
    label: 'Platinum (Column 3)',
    column: 3,
    items: [
      { match: 'rustguard', connector: 'AND' },
      { match: 'toughguard', connector: 'AND' },
      { match: 'interior', connector: 'AND' },
    ],
  },
  {
    label: 'Gold (Column 1)',
    column: 1,
    items: [
      { match: 'rustguard', connector: 'AND' },
      { match: 'toughguard', connector: 'AND' },
      { match: 'interior', connector: 'OR' }, // Last item OR
    ],
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

const matches = (feature: ProductFeature, needle: string) =>
  normalize(feature.name).includes(normalize(needle));

const summarize = (features: ProductFeature[], column: number) => {
  return features
    .filter((f) => f.column === column)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((f) => `${f.name} (pos ${f.position ?? 'n/a'}, ${f.connector ?? 'AND'})`);
};

const basePayload = (name: string, column: number, position: number, connector: Connector, source?: ProductFeature) => {
  return {
    name: source?.name ?? name,
    description: source?.description ?? `${name} (template baseline)`,
    points: source?.points ?? ['Template placeholder'],
    useCases: source?.useCases ?? [],
    price: source?.price ?? 0,
    cost: source?.cost ?? 0,
    warranty: source?.warranty,
    imageUrl: source?.imageUrl,
    thumbnailUrl: source?.thumbnailUrl,
    videoUrl: source?.videoUrl,
    column,
    position,
    connector,
  };
};

async function run(): Promise<void> {
  console.log(' Starting package template apply');
  console.log(DIVIDER);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (set DRY_RUN=0 to write)' : 'LIVE (writes enabled)'}`);

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  const db = admin.firestore();

  try {
    console.log('\n Fetching features...');
    const snapshot = await db.collection('features').get();
    const features: ProductFeature[] = snapshot.docs.map((doc) => ({ ...(doc.data() as ProductFeature), id: doc.id }));
    console.log(`Found ${features.length} feature(s).\n`);

    for (const lane of TEMPLATE) {
      console.log(DIVIDER);
      console.log(`Lane: ${lane.label}`);
      console.log('Current:', summarize(features, lane.column).join(' | ') || 'None');

      lane.items.forEach((item, index) => {
        const existing = features.find(
          (f) => f.column === lane.column && matches(f, item.match)
        );
        if (existing) {
          existing.position = index;
          existing.connector = item.connector;
          return;
        }
        const donor = features.find((f) => matches(f, item.match));
        const payload = basePayload(
          donor?.name ?? item.match,
          lane.column,
          index,
          item.connector,
          donor
        );
        features.push({ id: `__new__${lane.column}-${index}-${item.match}`, ...payload });
      });

      console.log('Planned:', summarize(features, lane.column).join(' | '));
    }

    const plannedWrites: Array<{ ref: FirebaseFirestore.DocumentReference; data: Partial<ProductFeature>; create?: boolean }> =
      [];

    for (const lane of TEMPLATE) {
      lane.items.forEach((item, index) => {
        const target = features.find(
          (f) => f.column === lane.column && matches(f, item.match) && !f.id.startsWith('__new__')
        );
        if (target) {
          const updates: Partial<ProductFeature> = {
            column: lane.column,
            position: index,
            connector: item.connector,
          };
          plannedWrites.push({ ref: db.collection('features').doc(target.id), data: updates });
        } else {
          const fallback = features.find(
            (f) => f.column === lane.column && f.id.startsWith(`__new__${lane.column}-${index}`)
          );
          if (!fallback) return;
          const { id: _id, ...rest } = fallback;
          plannedWrites.push({
            ref: db.collection('features').doc(),
            data: rest,
            create: true,
          });
        }
      });
    }

    if (plannedWrites.length === 0) {
      console.log('\nNothing to write. Template already applied.');
      await admin.app().delete();
      return;
    }

    console.log('\n' + DIVIDER);
    plannedWrites.forEach((op) => {
      const idLabel = op.create ? '(new doc)' : op.ref.id;
      console.log(
        `${op.create ? ' Create' : ' Update'} ${idLabel} -> column ${op.data.column}, position ${op.data.position}, connector ${op.data.connector}`
      );
    });

    if (isDryRun) {
      console.log('\n DRY RUN complete. No writes performed.');
      await admin.app().delete();
      return;
    }

    const batch = db.batch();
    plannedWrites.forEach((op) => batch.set(op.ref, op.data, { merge: true }));
    await batch.commit();

    console.log('\n Template applied successfully.');
    await admin.app().delete();
  } catch (err) {
    console.error('\n Error applying template:', err);
    try {
      await admin.app().delete();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

run();
