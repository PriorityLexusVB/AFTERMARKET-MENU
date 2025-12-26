import { describe, it, expect } from 'vitest';
import {
  compareFeatures,
  sortFeatures,
  normalizePositions,
  groupFeaturesByColumn,
  normalizeGroupedPositions,
  getTierColumn,
  getTierColumns,
  deriveTierFeatures,
  getPopularAddons,
} from './featureOrdering';
import type { ProductFeature } from '../types';

// Helper factory to create test features
const createTestFeature = (overrides: Partial<ProductFeature> = {}): ProductFeature => ({
  id: 'test-id',
  name: 'Test Feature',
  description: 'Test description',
  points: [],
  useCases: [],
  price: 100,
  cost: 50,
  ...overrides,
});

describe('featureOrdering utility', () => {
  describe('compareFeatures', () => {
    it('should sort features by column first', () => {
      const featureCol1 = createTestFeature({ id: 'f1', column: 1, position: 0 });
      const featureCol2 = createTestFeature({ id: 'f2', column: 2, position: 0 });

      expect(compareFeatures(featureCol1, featureCol2)).toBeLessThan(0);
      expect(compareFeatures(featureCol2, featureCol1)).toBeGreaterThan(0);
    });

    it('should sort by position within the same column', () => {
      const featurePos0 = createTestFeature({ id: 'f1', column: 1, position: 0 });
      const featurePos1 = createTestFeature({ id: 'f2', column: 1, position: 1 });

      expect(compareFeatures(featurePos0, featurePos1)).toBeLessThan(0);
      expect(compareFeatures(featurePos1, featurePos0)).toBeGreaterThan(0);
    });

    it('should return 0 for features with same column and position', () => {
      const feature1 = createTestFeature({ id: 'f1', column: 1, position: 0 });
      const feature2 = createTestFeature({ id: 'f2', column: 1, position: 0 });

      expect(compareFeatures(feature1, feature2)).toBe(0);
    });

    it('should place features without column at the end', () => {
      const featureWithColumn = createTestFeature({ id: 'f1', column: 1, position: 0 });
      const featureWithoutColumn = createTestFeature({ id: 'f2', position: 0 });

      expect(compareFeatures(featureWithColumn, featureWithoutColumn)).toBeLessThan(0);
      expect(compareFeatures(featureWithoutColumn, featureWithColumn)).toBeGreaterThan(0);
    });

    it('should place features without position at the end within same column', () => {
      const featureWithPosition = createTestFeature({ id: 'f1', column: 1, position: 0 });
      const featureWithoutPosition = createTestFeature({ id: 'f2', column: 1 });

      expect(compareFeatures(featureWithPosition, featureWithoutPosition)).toBeLessThan(0);
      expect(compareFeatures(featureWithoutPosition, featureWithPosition)).toBeGreaterThan(0);
    });

    it('should handle features with no column or position', () => {
      const featureWithBoth = createTestFeature({ id: 'f1', column: 1, position: 0 });
      const featureWithNeither = createTestFeature({ id: 'f2' });

      expect(compareFeatures(featureWithBoth, featureWithNeither)).toBeLessThan(0);
    });
  });

  describe('sortFeatures', () => {
    it('should sort an array of features by column and position', () => {
      const features = [
        createTestFeature({ id: 'f3', name: 'Column 2 Pos 0', column: 2, position: 0 }),
        createTestFeature({ id: 'f1', name: 'Column 1 Pos 0', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Column 1 Pos 1', column: 1, position: 1 }),
      ];

      const sorted = sortFeatures(features);

      expect(sorted.map(f => f.name)).toEqual([
        'Column 1 Pos 0',
        'Column 1 Pos 1',
        'Column 2 Pos 0',
      ]);
    });

    it('should not mutate the original array', () => {
      const original = [
        createTestFeature({ id: 'f2', column: 2, position: 0 }),
        createTestFeature({ id: 'f1', column: 1, position: 0 }),
      ];
      const originalOrder = original.map(f => f.id);

      sortFeatures(original);

      expect(original.map(f => f.id)).toEqual(originalOrder);
    });

    it('should place features without column/position at the end', () => {
      const features = [
        createTestFeature({ id: 'f3', name: 'No Column' }),
        createTestFeature({ id: 'f1', name: 'Column 1 Pos 0', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Column 1 No Pos', column: 1 }),
      ];

      const sorted = sortFeatures(features);

      expect(sorted.map(f => f.name)).toEqual([
        'Column 1 Pos 0',
        'Column 1 No Pos',
        'No Column',
      ]);
    });
  });

  describe('normalizePositions', () => {
    it('should assign sequential positions starting from 0', () => {
      const features = [
        createTestFeature({ id: 'f1', position: 5 }),
        createTestFeature({ id: 'f2', position: 10 }),
        createTestFeature({ id: 'f3', position: 15 }),
      ];

      const normalized = normalizePositions(features);

      expect(normalized.map(f => f.position)).toEqual([0, 1, 2]);
    });

    it('should not mutate the original array', () => {
      const original = [
        createTestFeature({ id: 'f1', position: 5 }),
        createTestFeature({ id: 'f2', position: 10 }),
      ];

      normalizePositions(original);

      expect(original[0]?.position).toBe(5);
      expect(original[1]?.position).toBe(10);
    });

    it('should preserve other feature properties', () => {
      const features = [
        createTestFeature({
          id: 'f1',
          name: 'Feature 1',
          column: 1,
          position: 5,
          connector: 'OR',
        }),
      ];

      const normalized = normalizePositions(features);

      expect(normalized[0]).toEqual({
        ...features[0],
        position: 0,
      });
    });

    it('should handle empty array', () => {
      const normalized = normalizePositions([]);
      expect(normalized).toEqual([]);
    });

    it('should keep connector values unchanged', () => {
      const features = [
        createTestFeature({ id: 'f1', position: 5, connector: 'AND' }),
        createTestFeature({ id: 'f2', position: 10, connector: 'OR' }),
      ];

      const normalized = normalizePositions(features);

      expect(normalized[0]?.connector).toBe('AND');
      expect(normalized[1]?.connector).toBe('OR');
    });
  });

  describe('groupFeaturesByColumn', () => {
    it('should group features by column number', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Column 1', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Column 2', column: 2, position: 0 }),
        createTestFeature({ id: 'f3', name: 'Column 3', column: 3, position: 0 }),
        createTestFeature({ id: 'f4', name: 'Column 4', column: 4, position: 0 }),
      ];

      const grouped = groupFeaturesByColumn(features);

      expect(grouped[1].map(f => f.name)).toEqual(['Column 1']);
      expect(grouped[2].map(f => f.name)).toEqual(['Column 2']);
      expect(grouped[3].map(f => f.name)).toEqual(['Column 3']);
      expect(grouped[4].map(f => f.name)).toEqual(['Column 4']);
      expect(grouped.unassigned).toEqual([]);
    });

    it('should place features without column in unassigned', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Has Column', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'No Column' }),
      ];

      const grouped = groupFeaturesByColumn(features);

      expect(grouped[1].map(f => f.name)).toEqual(['Has Column']);
      expect(grouped.unassigned.map(f => f.name)).toEqual(['No Column']);
    });

    it('should sort features by position within each group', () => {
      const features = [
        createTestFeature({ id: 'f3', name: 'Pos 2', column: 1, position: 2 }),
        createTestFeature({ id: 'f1', name: 'Pos 0', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Pos 1', column: 1, position: 1 }),
      ];

      const grouped = groupFeaturesByColumn(features);

      expect(grouped[1].map(f => f.name)).toEqual(['Pos 0', 'Pos 1', 'Pos 2']);
    });
  });

  describe('normalizeGroupedPositions', () => {
    it('should normalize positions in all column groups', () => {
      const grouped = {
        1: [
          createTestFeature({ id: 'f1', column: 1, position: 5 }),
          createTestFeature({ id: 'f2', column: 1, position: 10 }),
        ],
        2: [createTestFeature({ id: 'f3', column: 2, position: 7 })],
        3: [],
        4: [],
        unassigned: [createTestFeature({ id: 'f4', position: 100 })],
      };

      const normalized = normalizeGroupedPositions(grouped);

      expect(normalized[1].map(f => f.position)).toEqual([0, 1]);
      expect(normalized[2].map(f => f.position)).toEqual([0]);
      expect(normalized[3]).toEqual([]);
      expect(normalized[4]).toEqual([]);
      expect(normalized.unassigned.map(f => f.position)).toEqual([0]);
    });
  });

  describe('integration: admin to customer ordering', () => {
    it('should produce consistent ordering for admin and customer views', () => {
      // Simulate features as they would be stored after admin edits
      const storedFeatures = [
        createTestFeature({
          id: 'diamond-shield',
          name: 'Diamond Shield',
          column: 2,
          position: 0,
          connector: 'AND',
        }),
        createTestFeature({
          id: 'rustguard',
          name: 'RustGuard Pro',
          column: 1,
          position: 0,
          connector: 'AND',
        }),
        createTestFeature({
          id: 'toughguard',
          name: 'ToughGuard Premium',
          column: 1,
          position: 1,
          connector: 'AND',
        }),
        createTestFeature({
          id: 'interior',
          name: 'Interior Protection',
          column: 1,
          position: 2,
          connector: 'OR',
        }),
      ];

      // Group and sort as admin panel would
      const grouped = groupFeaturesByColumn(storedFeatures);

      // Expected admin order in column 1
      expect(grouped[1].map(f => f.id)).toEqual(['rustguard', 'toughguard', 'interior']);
      expect(grouped[2].map(f => f.id)).toEqual(['diamond-shield']);

      // Sort as customer view would
      const customerSorted = sortFeatures(storedFeatures);

      // Customer should see same order: column 1 features, then column 2
      expect(customerSorted.map(f => f.id)).toEqual([
        'rustguard',
        'toughguard',
        'interior',
        'diamond-shield',
      ]);

      // Verify connector is preserved
      expect(customerSorted[2]?.connector).toBe('OR');
    });

    it('should handle features with gaps in positions', () => {
      const features = [
        createTestFeature({ id: 'f1', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', column: 1, position: 5 }),
        createTestFeature({ id: 'f3', column: 1, position: 10 }),
      ];

      const grouped = groupFeaturesByColumn(features);
      const normalized = normalizeGroupedPositions(grouped);

      // After normalization, positions should be sequential
      expect(normalized[1].map(f => f.position)).toEqual([0, 1, 2]);
    });
  });

  describe('getTierColumn', () => {
    it('should return 1 for Gold tier', () => {
      expect(getTierColumn('Gold')).toBe(1);
      expect(getTierColumn('gold')).toBe(1);
      expect(getTierColumn('GOLD')).toBe(1);
    });

    it('should return 2 for Elite tier', () => {
      expect(getTierColumn('Elite')).toBe(2);
      expect(getTierColumn('elite')).toBe(2);
    });

    it('should return 3 for Platinum tier', () => {
      expect(getTierColumn('Platinum')).toBe(3);
      expect(getTierColumn('platinum')).toBe(3);
    });

    it('should return null for unknown tier', () => {
      expect(getTierColumn('Unknown')).toBeNull();
      expect(getTierColumn('')).toBeNull();
    });
  });

  describe('getTierColumns', () => {
    it('should return [1] for Gold tier', () => {
      expect(getTierColumns('Gold')).toEqual([1]);
      expect(getTierColumns('gold')).toEqual([1]);
    });

    it('should return [2] for Elite tier', () => {
      expect(getTierColumns('Elite')).toEqual([2]);
      expect(getTierColumns('elite')).toEqual([2]);
    });

    it('should return [3] for Platinum tier', () => {
      expect(getTierColumns('Platinum')).toEqual([3]);
      expect(getTierColumns('platinum')).toEqual([3]);
    });

    it('should return empty array for unknown tier', () => {
      expect(getTierColumns('Unknown')).toEqual([]);
      expect(getTierColumns('')).toEqual([]);
    });
  });

  describe('deriveTierFeatures', () => {
    it('should derive Gold tier features from column 1 only', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Gold Feature 1', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Gold Feature 2', column: 1, position: 1 }),
        createTestFeature({ id: 'f3', name: 'Elite Feature', column: 2, position: 0 }),
        createTestFeature({ id: 'f4', name: 'Add-on', column: 4, position: 0 }),
      ];

      const goldFeatures = deriveTierFeatures('Gold', features);

      expect(goldFeatures.map(f => f.name)).toEqual(['Gold Feature 1', 'Gold Feature 2']);
    });

    it('should derive Platinum tier features from column 3 only', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Gold Feature', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Elite Feature', column: 2, position: 0 }),
        createTestFeature({ id: 'f3', name: 'Platinum Feature', column: 3, position: 1 }),
        createTestFeature({ id: 'f5', name: 'Platinum Feature B', column: 3, position: 0 }),
        createTestFeature({ id: 'f4', name: 'Add-on', column: 4, position: 0 }),
      ];

      const platinumFeatures = deriveTierFeatures('Platinum', features);

      expect(platinumFeatures.map(f => f.name)).toEqual(['Platinum Feature B', 'Platinum Feature']);
    });

    it('should derive Elite tier features from column 2 only', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Gold Feature', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Elite Feature', column: 2, position: 1 }),
        createTestFeature({ id: 'f6', name: 'Elite Feature A', column: 2, position: 0 }),
        createTestFeature({ id: 'f3', name: 'Platinum Feature', column: 3, position: 0 }),
        createTestFeature({ id: 'f4', name: 'Add-on', column: 4, position: 0 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);

      expect(eliteFeatures.map(f => f.name)).toEqual(['Elite Feature A', 'Elite Feature']);
    });

    it('should return empty array for unknown tier', () => {
      const features = [
        createTestFeature({ id: 'f1', column: 1, position: 0 }),
      ];

      expect(deriveTierFeatures('Unknown', features)).toEqual([]);
    });

    it('should return empty array when no features in relevant columns', () => {
      const features = [
        createTestFeature({ id: 'f1', column: 4, position: 0 }), // Add-on only
      ];

      expect(deriveTierFeatures('Gold', features)).toEqual([]);
    });

    it('should sort features by position within a tier column', () => {
      const features = [
        createTestFeature({ id: 'g2', name: 'Gold Pos 1', column: 1, position: 1 }),
        createTestFeature({ id: 'g1', name: 'Gold Pos 0', column: 1, position: 0 }),
        createTestFeature({ id: 'e2', name: 'Elite Pos 1', column: 2, position: 1 }),
        createTestFeature({ id: 'e1', name: 'Elite Pos 0', column: 2, position: 0 }),
        createTestFeature({ id: 'p1', name: 'Platinum Pos 0', column: 3, position: 0 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);

      expect(eliteFeatures.map(f => f.name)).toEqual([
        'Elite Pos 0',
        'Elite Pos 1',
      ]);
    });

    it('should exclude features without column assignment', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Assigned', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Unassigned' }), // No column
      ];

      const goldFeatures = deriveTierFeatures('Gold', features);

      expect(goldFeatures.map(f => f.name)).toEqual(['Assigned']);
    });

    it('should deduplicate by name within the same column (case-insensitive), keeping first occurrence', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'RustGuard Pro', column: 2, position: 0 }),
        createTestFeature({ id: 'f2', name: 'rustguard pro', column: 2, position: 1 }), // duplicate in same column
        createTestFeature({ id: 'f4', name: 'Diamond Shield', column: 2, position: 2 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);

      expect(eliteFeatures.map(f => f.name)).toEqual(['RustGuard Pro', 'Diamond Shield']);
    });

    it('should preserve OR connector for Gold tier', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Feature A', column: 1, position: 0, connector: 'OR' }),
        createTestFeature({ id: 'f2', name: 'Feature B', column: 1, position: 1, connector: 'AND' }),
      ];

      const goldFeatures = deriveTierFeatures('Gold', features);

      expect(goldFeatures[0]?.connector).toBe('OR');
      expect(goldFeatures[1]?.connector).toBe('AND');
    });

    it('should preserve connector values for Platinum tier', () => {
      const features = [
        createTestFeature({ id: 'f3', name: 'Feature C', column: 3, position: 0, connector: 'OR' }),
        createTestFeature({ id: 'f5', name: 'Feature D', column: 3, position: 1, connector: 'AND' }),
      ];

      const platinumFeatures = deriveTierFeatures('Platinum', features);

      expect(platinumFeatures[0]?.connector).toBe('OR');
      expect(platinumFeatures[1]?.connector).toBe('AND');
    });

    it('should preserve connector values for Elite tier', () => {
      const features = [
        createTestFeature({ id: 'f2', name: 'Feature B', column: 2, position: 0, connector: 'OR' }),
        createTestFeature({ id: 'f6', name: 'Feature F', column: 2, position: 1, connector: 'AND' }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);

      expect(eliteFeatures[0]?.connector).toBe('OR');
      expect(eliteFeatures[1]?.connector).toBe('AND');
    });
  });

  describe('getPopularAddons', () => {
    it('should return only column 4 features', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Gold Feature', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Add-on 1', column: 4, position: 0 }),
        createTestFeature({ id: 'f3', name: 'Add-on 2', column: 4, position: 1 }),
      ];

      const addons = getPopularAddons(features);

      expect(addons.map(f => f.name)).toEqual(['Add-on 1', 'Add-on 2']);
    });

    it('should return empty array when no add-ons exist', () => {
      const features = [
        createTestFeature({ id: 'f1', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', column: 2, position: 0 }),
      ];

      expect(getPopularAddons(features)).toEqual([]);
    });

    it('should sort add-ons by position', () => {
      const features = [
        createTestFeature({ id: 'f2', name: 'Second', column: 4, position: 1 }),
        createTestFeature({ id: 'f1', name: 'First', column: 4, position: 0 }),
        createTestFeature({ id: 'f3', name: 'Third', column: 4, position: 2 }),
      ];

      const addons = getPopularAddons(features);

      expect(addons.map(f => f.name)).toEqual(['First', 'Second', 'Third']);
    });
  });
});
