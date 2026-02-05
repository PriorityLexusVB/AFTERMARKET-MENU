# Migration Scripts

This directory contains one-time migration scripts for updating Firestore data.

## ONE HUB Backfill - Publish legacy A La Carte items to Features

**Script:** `backfill-onehub-alacarte.ts`

**Purpose:** Ensures every legacy `ala_carte_options` doc is marked published and mirrored into the `features` hub (same ID), without assigning any columns.

### Running from Cloud Shell

1. Set the project
   ```bash
   gcloud config set project gen-lang-client-0877787739
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the migration
   ```bash
   npm run migrate:onehub:backfill-alacarte
   ```

### Expected output

The script logs counts for scanned options, updated options (isPublished backfill), created features, updated features, and skipped (no changes).

---

## Backfill A La Carte isPublished Field

**Script:** `backfill-alacarte-isPublished.ts`

**Purpose:** Sets `isPublished=true` for legacy A La Carte options where the field is undefined, making them visible in admin and manageable under the new curated rules.

### Running from Cloud Shell

```bash
gcloud config set project gen-lang-client-0877787739
npm install
npm run migrate:alacarte:publish-backfill
```

## Remove legacy package featureIds

**Script:** `remove-package-featureIds.ts`

**Purpose:** Backs up deprecated `featureIds` arrays to `legacyFeatureIds` (when missing) and removes the `featureIds` field from every doc in the `packages` collection so customer rendering is strictly column-based.

**Running from Cloud Shell**

```bash
gcloud config set project <your-project-id>
npm install
# DRY_RUN=1 by default (logs only). Set DRY_RUN=0 to write changes.
DRY_RUN=0 npm run migrate:packages:remove-featureids
```
