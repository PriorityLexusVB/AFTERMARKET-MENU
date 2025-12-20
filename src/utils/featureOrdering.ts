// src/utils/featureOrdering.ts

/**
 * Tier ladder / inheritance mapping.
 *
 * Columns are referred to by their numeric sequence (1..n).
 *
 * - Gold:     [1]
 * - Platinum: [1, 3]
 * - Elite:    [1, 3, 2]
 */
export type TierName = 'Gold' | 'Platinum' | 'Elite' | string;

export const TIER_COLUMNS: Record<string, number[]> = {
  Gold: [1],
  Platinum: [1, 3],
  Elite: [1, 3, 2],
};

/**
 * Returns the ordered column sequence for a tier, defaulting to [1].
 */
export function getTierColumns(tier: TierName): number[] {
  return TIER_COLUMNS[tier] ?? [1];
}

export type Feature = {
  name: string;
  /**
   * Optional tier/level metadata used by callers.
   */
  tier?: TierName;
  /**
   * When present, indicates the originating column for admin display ordering.
   */
  column?: number;
  /**
   * Expression shown in UI, e.g. "A OR B".
   */
  expression?: string;
  [key: string]: unknown;
};

/**
 * Converts logical OR to AND for display/meaning, without mutating the original string.
 *
 * Only applies for non-Gold tiers.
 */
export function convertOrToAndForNonGold(expression: string, tier: TierName): string {
  if (!expression) return expression;
  if (tier === 'Gold') return expression;
  // Replace standalone OR tokens (case-insensitive) with AND.
  return expression.replace(/\bOR\b/gi, 'AND');
}

/**
 * Dedupe features by case-insensitive name, keeping the first occurrence.
 */
export function dedupeByNameKeepFirst(features: Feature[]): Feature[] {
  const seen = new Set<string>();
  const result: Feature[] = [];
  for (const f of features) {
    const key = (f?.name ?? '').trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(f);
  }
  return result;
}

/**
 * Derives the feature list for a tier from tier columns.
 *
 * - Uses getTierColumns(tier) to determine column inclusion and order.
 * - Orders features by column sequence (1,3,2 etc.).
 * - Dedupes by case-insensitive name, keeping first occurrence based on that order.
 * - For non-Gold tiers, converts OR -> AND in expression-like fields without mutating the original.
 *
 * Assumes input "columns" is a map keyed by column sequence number (1..n).
 */
export function deriveTierFeatures(
  tier: TierName,
  columns: Record<number, Feature[] | undefined>
): Feature[] {
  const columnOrder = getTierColumns(tier);

  const ordered: Feature[] = [];
  for (const col of columnOrder) {
    const list = columns[col] ?? [];
    for (const f of list) {
      // Copy to avoid mutation of upstream source objects.
      const next: Feature = { ...f, column: col };
      if (typeof next.expression === 'string') {
        next.expression = convertOrToAndForNonGold(next.expression, tier);
      }
      ordered.push(next);
    }
  }

  return dedupeByNameKeepFirst(ordered);
}
