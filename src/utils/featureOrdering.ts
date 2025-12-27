// src/utils/featureOrdering.ts
import type { ProductFeature, OrderableItem } from '../types';

/**
 * Compare two orderable items for sorting by column first, then position.
 * Items without column/position are placed at the end.
 */
export function compareOrderableItems<T extends OrderableItem>(a: T, b: T): number {
  // Items without column go to end
  const aCol = a.column ?? Number.MAX_SAFE_INTEGER;
  const bCol = b.column ?? Number.MAX_SAFE_INTEGER;
  
  if (aCol !== bCol) {
    return aCol - bCol;
  }
  
  // Within same column, sort by position
  const aPos = a.position ?? Number.MAX_SAFE_INTEGER;
  const bPos = b.position ?? Number.MAX_SAFE_INTEGER;
  
  return aPos - bPos;
}

/**
 * Sort orderable items by column and position (non-mutating).
 */
export function sortOrderableItems<T extends OrderableItem>(items: T[]): T[] {
  return [...items].sort(compareOrderableItems);
}

/**
 * Compare two features for sorting by column first, then position.
 * Features without column/position are placed at the end.
 */
export function compareFeatures(a: ProductFeature, b: ProductFeature): number {
  return compareOrderableItems(a, b);
}

/**
 * Sort features by column and position (non-mutating).
 */
export function sortFeatures(features: ProductFeature[]): ProductFeature[] {
  return sortOrderableItems(features);
}

/**
 * Normalize positions to sequential 0, 1, 2, ... (non-mutating).
 * Generic version that works with any type that has a position field.
 */
export function normalizePositions<T extends { position?: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, position: index }));
}

/**
 * Group orderable items by column number, sorting each group by position.
 * Returns an object with column numbers as keys and arrays of items as values.
 * Items without a column are placed in 'unassigned'.
 * 
 * Generic version that works with any OrderableItem type (features, a la carte, etc.)
 */
export interface GroupedItems<T extends OrderableItem> {
  1: T[];
  2: T[];
  3: T[];
  4: T[];
  unassigned: T[];
}

export function groupItemsByColumn<T extends OrderableItem>(items: T[]): GroupedItems<T> {
  const grouped: GroupedItems<T> = {
    1: [],
    2: [],
    3: [],
    4: [],
    unassigned: [],
  };
  
  for (const item of items) {
    let assigned = false;
    
    // Check new multi-column format first
    if (item.columns && item.columns.length > 0) {
      for (const col of item.columns) {
        if (col === 1 || col === 2 || col === 3 || col === 4) {
          grouped[col].push(item);
          assigned = true;
        }
      }
    } else if (item.column === 1 || item.column === 2 || item.column === 3 || item.column === 4) {
      // Fall back to legacy single column
      grouped[item.column].push(item);
      assigned = true;
    }
    
    if (!assigned) {
      grouped.unassigned.push(item);
    }
  }
  
  // Sort each group by position
  grouped[1] = sortOrderableItems(grouped[1]);
  grouped[2] = sortOrderableItems(grouped[2]);
  grouped[3] = sortOrderableItems(grouped[3]);
  grouped[4] = sortOrderableItems(grouped[4]);
  grouped.unassigned = sortOrderableItems(grouped.unassigned);
  
  return grouped;
}

/**
 * Group features by column number, sorting each group by position.
 * Returns an object with column numbers as keys and arrays of features as values.
 * Features without a column are placed in 'unassigned'.
 */
export interface GroupedFeatures {
  1: ProductFeature[];
  2: ProductFeature[];
  3: ProductFeature[];
  4: ProductFeature[];
  unassigned: ProductFeature[];
}

export function groupFeaturesByColumn(features: ProductFeature[]): GroupedFeatures {
  return groupItemsByColumn(features);
}

/**
 * Normalize positions within each column group (non-mutating).
 * Generic version that works with any OrderableItem type.
 */
export function normalizeGroupedItems<T extends OrderableItem>(grouped: GroupedItems<T>): GroupedItems<T> {
  return {
    1: normalizePositions(grouped[1]),
    2: normalizePositions(grouped[2]),
    3: normalizePositions(grouped[3]),
    4: normalizePositions(grouped[4]),
    unassigned: normalizePositions(grouped.unassigned),
  };
}

/**
 * Normalize positions within each column group (non-mutating).
 */
export function normalizeGroupedPositions(grouped: GroupedFeatures): GroupedFeatures {
  return normalizeGroupedItems(grouped);
}

/**
 * Get the single column number for a tier (1:1 mapping for backwards compatibility).
 * Returns null for unknown tiers.
 * 
 * Column mapping:
 * - Elite = Column 1
 * - Platinum = Column 2
 * - Gold = Column 3
 */
export function getTierColumn(tier: string): number | null {
  const normalized = tier.toLowerCase();
  
  switch (normalized) {
    case 'elite':
      return 1;
    case 'platinum':
      return 2;
    case 'gold':
      return 3;
    default:
      return null;
  }
}

/**
 * Strict tier mapping (no inheritance).
 *
 * - Elite:    [1]
 * - Platinum: [2]
 * - Gold:     [3]
 *
 * Column 4 is "Popular Add-ons" and not part of any tier package.
 */
export function getTierColumns(tier: string): number[] {
  const normalized = tier.toLowerCase();
  
  switch (normalized) {
    case 'elite':
      return [1];
    case 'platinum':
      return [2];
    case 'gold':
      return [3];
    default:
      return [];
  }
}

/**
 * Checks if a feature belongs to a specific column.
 * Supports both legacy single column and new multi-column assignment.
 * 
 * @param feature - Feature to check
 * @param columnNum - Column number to check
 * @returns true if feature belongs to the column
 */
export function featureBelongsToColumn(
  feature: ProductFeature,
  columnNum: number
): boolean {
  // Check new multi-column format first
  if (feature.columns && feature.columns.length > 0) {
    return feature.columns.includes(columnNum);
  }
  
  // Fall back to legacy single column
  return feature.column === columnNum;
}

/**
 * Derives the feature list for a tier using strict per-column mapping (no inheritance).
 *
 * - Elite: column 1 only
 * - Platinum: column 2 only
 * - Gold: column 3 only
 *
 * Supports both legacy single column and new multi-column assignment.
 * Features are ordered by column and position. Duplicates within the same column are removed (case-insensitive by name), keeping first occurrence.
 */
export function deriveTierFeatures(
  tier: string,
  features: ProductFeature[]
): ProductFeature[] {
  const columns = getTierColumns(tier);
  
  if (columns.length === 0) {
    return [];
  }
  
  const columnSet = new Set(columns);
  const columnFeatures = features
    .filter(f => {
      // Check if feature belongs to any of the tier's columns
      for (const col of columnSet) {
        if (featureBelongsToColumn(f, col)) {
          return true;
        }
      }
      return false;
    })
    .sort(compareFeatures);

  // Deduplicate by column + name (case-insensitive), keeping first occurrence
  const seen = new Set<string>();
  const deduped: ProductFeature[] = [];
  
  for (const feature of columnFeatures) {
    const key = `${feature.column ?? 'unassigned'}::${feature.name.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push({ ...feature });
    }
  }
  
  return deduped;
}

/**
 * Get popular add-ons (column 4 features).
 * Supports both legacy single column and new multi-column assignment.
 */
export function getPopularAddons(features: ProductFeature[]): ProductFeature[] {
  return features
    .filter(f => featureBelongsToColumn(f, 4))
    .sort(compareFeatures);
}
