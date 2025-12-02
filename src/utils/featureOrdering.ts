/**
 * Centralized feature ordering utility.
 * Provides canonical sorting behavior for features used across the application:
 * - AdminPanel (for featuresByColumn derivation and optimistic updates)
 * - Customer rendering (PackageCard, PackageSelector)
 *
 * Sort order: column (ascending), then position (ascending).
 * Features with undefined column/position are sorted last.
 */

import type { ProductFeature } from '../types';

/**
 * Compares two features for sorting purposes.
 * Sort order: column (ascending), then position (ascending).
 * Features without column/position are placed at the end.
 *
 * @param a - First feature to compare
 * @param b - Second feature to compare
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export function compareFeatures(a: ProductFeature, b: ProductFeature): number {
  // First sort by column (undefined columns go last)
  const colA = a.column ?? Number.MAX_SAFE_INTEGER;
  const colB = b.column ?? Number.MAX_SAFE_INTEGER;
  if (colA !== colB) return colA - colB;

  // Then by position within column (undefined positions go last)
  const posA = a.position ?? Number.MAX_SAFE_INTEGER;
  const posB = b.position ?? Number.MAX_SAFE_INTEGER;
  return posA - posB;
}

/**
 * Sorts an array of features by column and position.
 * Returns a new sorted array (does not mutate the input).
 *
 * @param features - Array of features to sort
 * @returns New array of features sorted by column and position
 */
export function sortFeatures(features: ProductFeature[]): ProductFeature[] {
  return [...features].sort(compareFeatures);
}

/**
 * Normalizes positions for all features in a column to be sequential (0..n-1).
 * Preserves the existing order and keeps all other properties unchanged.
 *
 * @param features - Array of features (should be pre-sorted by position within the column)
 * @returns New array with normalized positions (0, 1, 2, ...)
 */
export function normalizePositions(features: ProductFeature[]): ProductFeature[] {
  return features.map((feature, index) => ({
    ...feature,
    position: index,
  }));
}

/**
 * Groups features by column and sorts each group by position.
 * Features without a column are placed in the 'unassigned' group.
 *
 * @param features - Array of features to group
 * @returns Object with columns 1-4 and unassigned, each sorted by position
 */
export interface GroupedFeaturesByColumn {
  1: ProductFeature[];
  2: ProductFeature[];
  3: ProductFeature[];
  4: ProductFeature[];
  unassigned: ProductFeature[];
}

export function groupFeaturesByColumn(features: ProductFeature[]): GroupedFeaturesByColumn {
  const grouped: GroupedFeaturesByColumn = {
    1: [],
    2: [],
    3: [],
    4: [],
    unassigned: [],
  };

  for (const feature of features) {
    const column = feature.column;
    if (column === 1 || column === 2 || column === 3 || column === 4) {
      grouped[column].push(feature);
    } else {
      grouped.unassigned.push(feature);
    }
  }

  // Sort each group by position
  grouped[1] = sortFeatures(grouped[1]);
  grouped[2] = sortFeatures(grouped[2]);
  grouped[3] = sortFeatures(grouped[3]);
  grouped[4] = sortFeatures(grouped[4]);
  grouped.unassigned = sortFeatures(grouped.unassigned);

  return grouped;
}

/**
 * Normalizes all positions within each column of a grouped features object.
 * Returns a new object with normalized positions in each group.
 *
 * @param grouped - Grouped features object from groupFeaturesByColumn
 * @returns New grouped features object with normalized positions
 */
export function normalizeGroupedPositions(
  grouped: GroupedFeaturesByColumn
): GroupedFeaturesByColumn {
  return {
    1: normalizePositions(grouped[1]),
    2: normalizePositions(grouped[2]),
    3: normalizePositions(grouped[3]),
    4: normalizePositions(grouped[4]),
    unassigned: normalizePositions(grouped.unassigned),
  };
}

/**
 * Column-to-package tier mapping (1:1 direct mapping):
 * - Column 1 (Gold Tier): Features that appear ONLY in the Gold package
 * - Column 2 (Elite Tier): Features that appear ONLY in the Elite package
 * - Column 3 (Platinum Tier): Features that appear ONLY in the Platinum package
 * - Column 4 (Popular Add-ons): For admin organization of standalone add-ons, not part of tier packages.
 *   Note: Column 4 does NOT directly control what appears in the customer's "Popular Add-ons" section.
 *   The customer-facing "Popular Add-ons" section is populated from `alaCarteOptions` filtered by `MAIN_PAGE_ADDON_IDS` (see `App.tsx`).
 * 
 * Each column directly controls what appears in that tier's package (except column 4, which is for admin organization only).
 * If a column is empty in admin, that package will be empty on customer view.
 * There is NO hierarchy or inheritance between tiers.
 */

/**
 * Maps a package tier name to its corresponding column number.
 * This is a direct 1:1 mapping where each tier gets ONLY features from its own column.
 * 
 * @param tierName - The package tier name (case-insensitive)
 * @returns The column number for this tier, or null if unknown
 */
export function getTierColumn(tierName: string): number | null {
  const normalizedName = tierName.toLowerCase();
  
  switch (normalizedName) {
    case 'gold':
      return 1; // Gold = Column 1 ONLY
    case 'elite':
      return 2; // Elite = Column 2 ONLY
    case 'platinum':
      return 3; // Platinum = Column 3 ONLY
    default:
      // For unknown tier names, return null (features will be empty)
      return null;
  }
}

/**
 * @deprecated Use getTierColumn instead for the correct 1:1 column-to-tier mapping.
 * This wrapper function is kept for API backwards compatibility but now uses the
 * correct single-column mapping internally.
 */
export function getTierColumns(tierName: string): number[] {
  const column = getTierColumn(tierName);
  return column !== null ? [column] : [];
}

/**
 * Derives package features from column assignments.
 * This is the single source of truth for package composition, ensuring
 * admin column assignments directly control customer-facing package content.
 * 
 * Each tier gets ONLY the features from its corresponding column:
 * - Gold → Column 1 only
 * - Elite → Column 2 only
 * - Platinum → Column 3 only
 * 
 * If a column is empty in admin, the corresponding package will have no features.
 * 
 * @param tierName - The package tier name (e.g., 'Gold', 'Elite', 'Platinum')
 * @param features - All features with column assignments
 * @returns Array of features that should be in this package, sorted by position
 */
export function deriveTierFeatures(
  tierName: string,
  features: ProductFeature[]
): ProductFeature[] {
  const column = getTierColumn(tierName);
  
  if (column === null) {
    return [];
  }
  
  // Filter features that belong to this tier's column ONLY
  const tierFeatures = features.filter(f => f.column === column);
  
  // Sort by position for consistent ordering within the column
  return sortFeatures(tierFeatures);
}

/**
 * Gets features assigned to Column 4 in the admin panel.
 * 
 * Note: Column 4 is used for organizing features in the admin panel,
 * but does NOT directly control the customer-facing "Popular Add-ons" section.
 * The "Popular Add-ons" section is populated from alaCarteOptions filtered by MAIN_PAGE_ADDON_IDS.
 * 
 * @param features - All features with column assignments
 * @returns Array of features in Column 4, sorted by position
 */
export function getPopularAddons(features: ProductFeature[]): ProductFeature[] {
  const addons = features.filter(f => f.column === 4);
  return sortFeatures(addons);
}
