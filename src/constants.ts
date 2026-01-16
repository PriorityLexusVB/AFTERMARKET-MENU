// All data arrays have been removed and are now fetched from the Supabase backend.
// See the data.ts file for fetching logic and the README.md for backend setup instructions.

// We keep this static list to define which a la carte items appear on the main "Packages" page.
// This could also be moved to the database with a new column if more dynamic control is needed.
export const MAIN_PAGE_ADDON_IDS = [
  "suntek-standard",
  "screen-defender",
  "evernew",
];

// Column range for product organization in admin panel
// Columns: 1 = Gold, 2 = Elite, 3 = Platinum, 4 = Featured
export const MIN_COLUMN = 1;
export const MAX_COLUMN = 4;

// UI timeout constants (in milliseconds)
export const ERROR_AUTO_HIDE_TIMEOUT = 5000;
