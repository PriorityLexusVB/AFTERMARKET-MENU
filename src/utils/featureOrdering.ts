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
