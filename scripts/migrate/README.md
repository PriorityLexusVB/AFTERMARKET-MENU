# Migration Scripts

This directory contains one-time migration scripts for updating Firestore data.

## Backfill A La Carte isPublished Field

**Script:** `backfill-alacarte-isPublished.ts`

**Purpose:** Sets `isPublished=true` for legacy A La Carte options where the field is undefined, making them visible in admin and manageable under the new curated rules.

### Running from Cloud Shell

1. **Set the project:**
   ```bash
   gcloud config set project gen-lang-client-0877787739
   ```

2. **Install dependencies:**
   ```bash
   pnpm i
   # or
   npm i
   ```

3. **Run the migration:**
   ```bash
   pnpm migrate:alacarte:publish-backfill
   # or
   npm run migrate:alacarte:publish-backfill
   ```

### Expected Output

```
🚀 Starting A La Carte isPublished Backfill Migration

============================================================
✅ Firebase Admin SDK initialized

📦 Reading A La Carte options...
   Found X A La Carte options

🔄 Processing options...

  ✏️  Backfilling isPublished=true for "Option Name 1"
  ✏️  Backfilling isPublished=true for "Option Name 2"
  ⏭️  Skipping "Option Name 3" (isPublished=true)
  ⏭️  Skipping "Option Name 4" (isPublished=false)
  💾 Committed batch of Y updates

============================================================
📈 Migration Summary
============================================================
   Scanned:   X
   Updated:   Y
   Skipped:   Z
   Errors:    0

✅ Migration complete!
```

### Notes

- The script is **idempotent** - safe to run multiple times
- It will **NOT** overwrite `isPublished=false` (respects intentional unpublish)
- Uses Application Default Credentials (no explicit credentials file needed in Cloud Shell)
- Batch writes are used for efficiency (max 400 operations per batch)
