/**
 * Seed Firebase emulator with test data
 *
 * This script imports the seed data from firestore-seed.json into the Firebase emulator.
 *
 * Prerequisites:
 * - Firebase emulator must be running: firebase emulators:start
 * - Environment variable FIRESTORE_EMULATOR_HOST must be set (e.g., localhost:8081)
 *   Note: Check your firebase.json for the actual Firestore emulator port (typically 8081)
 *
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=localhost:8081 npx tsx tools/seed-emulator.ts
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
} from "firebase/firestore/lite";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get directory name using recommended ES module approach for cross-platform compatibility
const __dirname = dirname(fileURLToPath(import.meta.url));

interface SeedDocument {
  [key: string]: unknown;
}

interface SeedCollection {
  [documentId: string]: SeedDocument;
}

interface SeedData {
  __collections__: {
    [collectionName: string]: SeedCollection;
  };
}

async function seedEmulator(): Promise<void> {
  const emulatorHost = process.env["FIRESTORE_EMULATOR_HOST"];

  if (!emulatorHost) {
    console.error(" Error: FIRESTORE_EMULATOR_HOST environment variable is not set.");
    console.error(
      "   Make sure the Firebase emulator is running and set the environment variable."
    );
    console.error(
      "   Example: FIRESTORE_EMULATOR_HOST=localhost:8081 npx tsx tools/seed-emulator.ts"
    );
    process.exit(1);
  }

  console.log(` Connecting to Firebase emulator at ${emulatorHost}...`);

  // Initialize Firebase with a demo project (emulator doesn't need real credentials)
  const app = initializeApp({
    projectId: "demo-aftermarket-menu",
  });

  const db = getFirestore(app);

  // Parse emulator host for connection
  const [host, portStr] = emulatorHost.split(":");
  const port = parseInt(portStr || "8081", 10);

  if (!host) {
    console.error(" Error: Invalid FIRESTORE_EMULATOR_HOST format. Expected format: host:port");
    process.exit(1);
  }

  connectFirestoreEmulator(db, host, port);

  // Read seed data
  const seedPath = join(__dirname, "firestore-seed.json");
  console.log(` Reading seed data from ${seedPath}...`);

  const seedDataRaw = readFileSync(seedPath, "utf-8");
  const seedData: SeedData = JSON.parse(seedDataRaw);

  if (!seedData.__collections__) {
    console.error(" Error: Invalid seed data format. Expected __collections__ key.");
    process.exit(1);
  }

  console.log("\n Starting data import...\n");

  let totalDocuments = 0;

  // Iterate through collections
  for (const [collectionName, documents] of Object.entries(seedData.__collections__)) {
    console.log(` Importing collection: ${collectionName}`);

    const documentIds = Object.keys(documents);

    for (const documentId of documentIds) {
      const documentData = documents[documentId];
      if (!documentData) continue;

      const docRef = doc(collection(db, collectionName), documentId);
      await setDoc(docRef, documentData);
      console.log(`   Added document: ${documentId}`);
      totalDocuments++;
    }

    console.log(`   Imported ${documentIds.length} documents to ${collectionName}\n`);
  }

  console.log(` Import complete! Added ${totalDocuments} documents total.\n`);
  console.log(" You can now start the app with:");
  console.log("   npm run dev:emulator\n");
}

seedEmulator()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(" Error during import:", error);
    process.exit(1);
  });
