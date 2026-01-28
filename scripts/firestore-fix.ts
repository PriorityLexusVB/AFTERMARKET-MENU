import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type Args = {
  projectId?: string;
  apply: boolean;
  deleteAlaCarteIds: string[];
  hydrateAlaCarteIds: string[];
  setPackageCosts: Array<{ id: string; cost: number }>;
  setPackagePrices: Array<{ id: string; price: number }>;
  defaultMissingPackageCostToZero: boolean;
  bumpMissingOrZeroTo100: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    apply: false,
    deleteAlaCarteIds: [],
    hydrateAlaCarteIds: [],
    setPackageCosts: [],
    setPackagePrices: [],
    defaultMissingPackageCostToZero: false,
    bumpMissingOrZeroTo100: false,
  };

  const rest = [...argv];
  while (rest.length) {
    const token = rest.shift();
    if (!token) break;

    if (token === "--apply") {
      args.apply = true;
      continue;
    }

    if (token === "--project" || token === "--projectId") {
      args.projectId = rest.shift();
      continue;
    }

    if (token === "--delete-alacarte") {
      const id = rest.shift();
      if (id) args.deleteAlaCarteIds.push(id);
      continue;
    }

    if (token === "--hydrate-alacarte") {
      const id = rest.shift();
      if (id) args.hydrateAlaCarteIds.push(id);
      continue;
    }

    if (token === "--set-package-cost") {
      const spec = rest.shift();
      if (spec) {
        const [id, value] = spec.split("=");
        const cost = Number(value);
        if (id && Number.isFinite(cost)) args.setPackageCosts.push({ id, cost });
      }
      continue;
    }

    if (token === "--set-package-price") {
      const spec = rest.shift();
      if (spec) {
        const [id, value] = spec.split("=");
        const price = Number(value);
        if (id && Number.isFinite(price)) args.setPackagePrices.push({ id, price });
      }
      continue;
    }

    if (token === "--default-missing-package-cost-to-0") {
      args.defaultMissingPackageCostToZero = true;
      continue;
    }

    if (token === "--bump-missing-or-zero-to-100") {
      args.bumpMissingOrZeroTo100 = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp(): void {
  // Keep help short and action-oriented.
  // This script intentionally does not handle credentials; it relies on ADC.
  console.log(`
Firestore fix helper (dry-run by default)

Usage:
  npm run firestore:fix -- [options]

Options:
  --project <id>                         Firebase project id (required)
  --apply                                Actually write changes (otherwise dry-run)
  --delete-alacarte <docId>              Delete an ala_carte_options doc (repeatable)
  --hydrate-alacarte <docId>             Add placeholder required fields to an ala_carte_options doc (repeatable)
  --set-package-cost <docId>=<number>    Set packages/<docId>.cost (repeatable)
  --set-package-price <docId>=<number>   Set packages/<docId>.price (repeatable)
  --default-missing-package-cost-to-0    If a package is missing cost, set it to 0
  --bump-missing-or-zero-to-100          Set missing/0 packages.cost and missing/0 ala_carte price/cost to 100

Examples:
  npm run firestore:fix -- --project YOUR_PROJECT \
    --hydrate-alacarte dDHf8LW8zS1Tgxh9IDGW \
    --set-package-cost MNdL47EheZE7wfJK0IPA=100 \
    --bump-missing-or-zero-to-100 \
    --apply
`);
}

function requireProjectId(projectId?: string): string {
  if (projectId && projectId.trim().length > 0) return projectId.trim();
  throw new Error("Missing --project <id>. Run with --help for usage.");
}

function initAdmin(projectId: string): void {
  if (getApps().length) return;
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const projectId = requireProjectId(args.projectId);
  initAdmin(projectId);

  const db = getFirestore();
  let plannedChanges = 0;
  const writes: Array<() => Promise<unknown>> = [];

  // ala_carte_options deletes
  for (const id of args.deleteAlaCarteIds) {
    const ref = db.collection("ala_carte_options").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[SKIP] ala_carte_options/${id} does not exist`);
      continue;
    }

    console.log(`[PLAN] Delete ala_carte_options/${id}`);
    plannedChanges += 1;
    if (args.apply) {
      writes.push(async () => ref.delete());
    }
  }

  // ala_carte_options hydration (fills required fields so schema validation passes)
  for (const id of args.hydrateAlaCarteIds) {
    const ref = db.collection("ala_carte_options").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[SKIP] ala_carte_options/${id} does not exist`);
      continue;
    }

    const data = snap.data() as Record<string, unknown>;
    const patch: Record<string, unknown> = {};

    if (typeof data["name"] !== "string" || String(data["name"]).trim().length === 0) {
      patch["name"] = "TEMP - Fix in Product Hub";
    }
    if (
      typeof data["description"] !== "string" ||
      String(data["description"]).trim().length === 0
    ) {
      patch["description"] = "TEMP - Fix later";
    }
    if (!Array.isArray(data["points"]) || (data["points"] as unknown[]).length === 0) {
      patch["points"] = ["TEMP"];
    }

    const price = data["price"];
    const cost = data["cost"];
    if (price === undefined || price === null || price === 0 || typeof price !== "number") {
      patch["price"] = 100;
    }
    if (cost === undefined || cost === null || cost === 0 || typeof cost !== "number") {
      patch["cost"] = 100;
    }

    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) {
      console.log(`[SKIP] ala_carte_options/${id} already has required fields`);
      continue;
    }

    console.log(`[PLAN] Hydrate ala_carte_options/${id}: ${patchKeys.join(", ")}`);
    plannedChanges += 1;
    if (args.apply) {
      writes.push(async () => ref.set(patch, { merge: true }));
    }
  }

  // packages updates
  for (const { id, cost } of args.setPackageCosts) {
    const ref = db.collection("packages").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[SKIP] packages/${id} does not exist`);
      continue;
    }
    console.log(`[PLAN] Set packages/${id}.cost = ${cost}`);
    plannedChanges += 1;
    if (args.apply) {
      writes.push(async () => ref.update({ cost }));
    }
  }

  for (const { id, price } of args.setPackagePrices) {
    const ref = db.collection("packages").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[SKIP] packages/${id} does not exist`);
      continue;
    }
    console.log(`[PLAN] Set packages/${id}.price = ${price}`);
    plannedChanges += 1;
    if (args.apply) {
      writes.push(async () => ref.update({ price }));
    }
  }

  if (args.defaultMissingPackageCostToZero) {
    // Only touch docs that are missing cost entirely; do not overwrite existing values.
    const snap = await db.collection("packages").get();
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (data["cost"] === undefined) {
        console.log(`[PLAN] Set packages/${doc.id}.cost = 0 (was missing)`);
        plannedChanges += 1;
        if (args.apply) {
          const ref = db.collection("packages").doc(doc.id);
          writes.push(async () => ref.update({ cost: 0 }));
        }
      }
    }
  }

  if (args.bumpMissingOrZeroTo100) {
    // Packages: set cost to 100 when missing or 0.
    const packagesSnap = await db.collection("packages").get();
    for (const doc of packagesSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const cost = data["cost"];
      if (cost === undefined || cost === null || cost === 0) {
        console.log(`[PLAN] Set packages/${doc.id}.cost = 100 (was ${String(cost)})`);
        plannedChanges += 1;
        if (args.apply) {
          const ref = db.collection("packages").doc(doc.id);
          writes.push(async () => ref.update({ cost: 100 }));
        }
      }
    }

    // A La Carte: set price/cost to 100 when missing or 0.
    const alaSnap = await db.collection("ala_carte_options").get();
    for (const doc of alaSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      const price = data["price"];
      const cost = data["cost"];

      if (price === undefined || price === null || price === 0) patch["price"] = 100;
      if (cost === undefined || cost === null || cost === 0) patch["cost"] = 100;

      const keys = Object.keys(patch);
      if (!keys.length) continue;

      console.log(`[PLAN] Patch ala_carte_options/${doc.id}: ${keys.join(", ")}`);
      plannedChanges += 1;
      if (args.apply) {
        const ref = db.collection("ala_carte_options").doc(doc.id);
        writes.push(async () => ref.set(patch, { merge: true }));
      }
    }
  }

  if (!plannedChanges) {
    console.log(args.apply ? "No changes to apply." : "No changes planned.");
    return;
  }

  if (!args.apply) {
    console.log(
      `\nDry-run complete. Planned ${plannedChanges} change(s). Re-run with --apply to write changes.`
    );
    return;
  }

  console.log(`\nApplying ${writes.length} change(s)...`);
  for (const w of writes) await w();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
