import { describe, it, expect } from 'vitest';
import {
  featureBelongsToColumn,
  deriveTierFeatures,
  getPopularAddons,
  groupItemsByColumn,
} from './featureOrdering';
import type { ProductFeature, OrderableItem } from '../types';

/**
 * Test suite for multi-column feature assignment.
 * Ensures backward compatibility with legacy single column assignment.
 */

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

describe('Multi-Column Feature Assignment', () => {
  describe('featureBelongsToColumn', () => {
    it('should return true for legacy single column assignment', () => {
      const feature = createTestFeature({ column: 2 });
      expect(featureBelongsToColumn(feature, 2)).toBe(true);
    });

    it('should return false for legacy single column assignment when column does not match', () => {
      const feature = createTestFeature({ column: 2 });
      expect(featureBelongsToColumn(feature, 1)).toBe(false);
    });

    it('should return true for new multi-column assignment', () => {
      const feature = createTestFeature({ columns: [1, 2, 3] });
      expect(featureBelongsToColumn(feature, 1)).toBe(true);
      expect(featureBelongsToColumn(feature, 2)).toBe(true);
      expect(featureBelongsToColumn(feature, 3)).toBe(true);
    });

    it('should return false for new multi-column assignment when column is not in array', () => {
      const feature = createTestFeature({ columns: [1, 2] });
      expect(featureBelongsToColumn(feature, 3)).toBe(false);
      expect(featureBelongsToColumn(feature, 4)).toBe(false);
    });

    it('should prefer columns array over legacy column field', () => {
      const feature = createTestFeature({ column: 1, columns: [2, 3] });
      // columns array takes precedence
      expect(featureBelongsToColumn(feature, 2)).toBe(true);
      expect(featureBelongsToColumn(feature, 3)).toBe(true);
      expect(featureBelongsToColumn(feature, 1)).toBe(false);
    });

    it('should handle empty columns array by falling back to column', () => {
      const feature = createTestFeature({ column: 2, columns: [] });
      expect(featureBelongsToColumn(feature, 2)).toBe(true);
    });

    it('should return false when neither column nor columns is set', () => {
      const feature = createTestFeature({});
      expect(featureBelongsToColumn(feature, 1)).toBe(false);
    });
  });

  describe('deriveTierFeatures with multi-column', () => {
    it('should include features with legacy single column assignment', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Elite Feature', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Platinum Feature', column: 2, position: 0 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);
      expect(eliteFeatures.map(f => f.name)).toEqual(['Elite Feature']);
    });

    it('should include features with new multi-column assignment', () => {
      const features = [
        createTestFeature({ 
          id: 'f1', 
          name: 'Multi Feature', 
          columns: [1, 2], 
          column: 1,
          positionsByColumn: { 1: 0, 2: 0 },
          position: 0,
        }),
        createTestFeature({ id: 'f2', name: 'Elite Only', column: 1, position: 1 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);
      expect(eliteFeatures.map(f => f.name)).toEqual(['Multi Feature', 'Elite Only']);
    });

    it('should include same feature in multiple tiers when assigned to multiple columns', () => {
      const features = [
        createTestFeature({ 
          id: 'f1', 
          name: 'Elite & Platinum Feature', 
          columns: [1, 2],
          column: 1,
          positionsByColumn: { 1: 0, 2: 0 },
          position: 0,
        }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);
      const platinumFeatures = deriveTierFeatures('Platinum', features);

      expect(eliteFeatures.map(f => f.name)).toEqual(['Elite & Platinum Feature']);
      expect(platinumFeatures.map(f => f.name)).toEqual(['Elite & Platinum Feature']);
    });

    it('should handle mixed legacy and multi-column features', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Legacy Elite', column: 1, position: 0 }),
        createTestFeature({ 
          id: 'f2', 
          name: 'Multi Elite Platinum', 
          columns: [1, 2],
          column: 1,
          positionsByColumn: { 1: 1, 2: 0 },
          position: 1,
        }),
        createTestFeature({ id: 'f3', name: 'Legacy Platinum', column: 2, position: 1 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);
      const platinumFeatures = deriveTierFeatures('Platinum', features);

      expect(eliteFeatures.map(f => f.name)).toEqual(['Legacy Elite', 'Multi Elite Platinum']);
      expect(platinumFeatures.map(f => f.name)).toEqual(['Multi Elite Platinum', 'Legacy Platinum']);
    });

    it('should support Popular Add-ons (column 4) in multi-column assignment', () => {
      const features = [
        createTestFeature({ 
          id: 'f1', 
          name: 'Elite & Add-on', 
          columns: [1, 4],
          column: 1,
          positionsByColumn: { 1: 0, 4: 0 },
          position: 0,
        }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', features);
      const addons = getPopularAddons(features);

      expect(eliteFeatures.map(f => f.name)).toEqual(['Elite & Add-on']);
      expect(addons.map(f => f.name)).toEqual(['Elite & Add-on']);
    });
  });

  describe('getPopularAddons with multi-column', () => {
    it('should include features with legacy column 4 assignment', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'Add-on 1', column: 4, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Elite Feature', column: 1, position: 0 }),
      ];

      const addons = getPopularAddons(features);
      expect(addons.map(f => f.name)).toEqual(['Add-on 1']);
    });

    it('should include features with multi-column assignment including column 4', () => {
      const features = [
        createTestFeature({ 
          id: 'f1', 
          name: 'Multi Add-on', 
          columns: [1, 4],
          column: 1,
          positionsByColumn: { 1: 0, 4: 0 },
          position: 0,
        }),
        createTestFeature({ id: 'f2', name: 'Legacy Add-on', column: 4, position: 1 }),
      ];

      const addons = getPopularAddons(features);
      expect(addons.map(f => f.name)).toEqual(['Multi Add-on', 'Legacy Add-on']);
    });
  });

  describe('groupItemsByColumn with multi-column', () => {
    it('should place legacy single column items in their column', () => {
      const items: OrderableItem[] = [
        { id: 'f1', column: 1, position: 0 },
        { id: 'f2', column: 2, position: 0 },
      ];

      const grouped = groupItemsByColumn(items);

      expect(grouped[1].map(f => f.id)).toEqual(['f1']);
      expect(grouped[2].map(f => f.id)).toEqual(['f2']);
      expect(grouped[3]).toEqual([]);
      expect(grouped[4]).toEqual([]);
    });

    it('should place multi-column items in all their columns', () => {
      const items: OrderableItem[] = [
        { 
          id: 'f1', 
          columns: [1, 2, 3],
          column: 1,
          positionsByColumn: { 1: 0, 2: 0, 3: 0 },
          position: 0,
        },
      ];

      const grouped = groupItemsByColumn(items);

      expect(grouped[1].map(f => f.id)).toEqual(['f1']);
      expect(grouped[2].map(f => f.id)).toEqual(['f1']);
      expect(grouped[3].map(f => f.id)).toEqual(['f1']);
      expect(grouped[4]).toEqual([]);
    });

    it('should handle mixed legacy and multi-column items', () => {
      const items: OrderableItem[] = [
        { id: 'f1', column: 1, position: 0 },
        { 
          id: 'f2', 
          columns: [1, 2],
          column: 1,
          positionsByColumn: { 1: 1, 2: 0 },
          position: 1,
        },
        { id: 'f3', column: 2, position: 1 },
      ];

      const grouped = groupItemsByColumn(items);

      expect(grouped[1].map(f => f.id)).toEqual(['f1', 'f2']);
      expect(grouped[2].map(f => f.id)).toEqual(['f2', 'f3']);
    });

    it('should place items with no column in unassigned', () => {
      const items: OrderableItem[] = [
        { id: 'f1', column: 1, position: 0 },
        { id: 'f2' },
      ];

      const grouped = groupItemsByColumn(items);

      expect(grouped[1].map(f => f.id)).toEqual(['f1']);
      expect(grouped.unassigned.map(f => f.id)).toEqual(['f2']);
    });

    it('should prefer columns array over legacy column when both exist', () => {
      const items: OrderableItem[] = [
        { 
          id: 'f1', 
          column: 1, // legacy
          columns: [2, 3], // new - should take precedence
          positionsByColumn: { 2: 0, 3: 0 },
          position: 0,
        },
      ];

      const grouped = groupItemsByColumn(items);

      // Should be in columns 2 and 3 (from columns array), not in column 1
      expect(grouped[1]).toEqual([]);
      expect(grouped[2].map(f => f.id)).toEqual(['f1']);
      expect(grouped[3].map(f => f.id)).toEqual(['f1']);
    });

    it('should handle empty columns array by falling back to column', () => {
      const items: OrderableItem[] = [
        { id: 'f1', column: 1, columns: [], position: 0 },
      ];

      const grouped = groupItemsByColumn(items);

      expect(grouped[1].map(f => f.id)).toEqual(['f1']);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work seamlessly with legacy features that only have column/position', () => {
      const legacyFeatures = [
        createTestFeature({ id: 'f1', name: 'Elite 1', column: 1, position: 0 }),
        createTestFeature({ id: 'f2', name: 'Elite 2', column: 1, position: 1 }),
        createTestFeature({ id: 'f3', name: 'Platinum 1', column: 2, position: 0 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', legacyFeatures);
      const platinumFeatures = deriveTierFeatures('Platinum', legacyFeatures);

      expect(eliteFeatures.map(f => f.name)).toEqual(['Elite 1', 'Elite 2']);
      expect(platinumFeatures.map(f => f.name)).toEqual(['Platinum 1']);
    });

    it('should work with new multi-column features', () => {
      const newFeatures = [
        createTestFeature({ 
          id: 'f1', 
          name: 'Shared Feature', 
          columns: [1, 2],
          column: 1,
          positionsByColumn: { 1: 0, 2: 0 },
          position: 0,
        }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', newFeatures);
      const platinumFeatures = deriveTierFeatures('Platinum', newFeatures);

      expect(eliteFeatures.map(f => f.name)).toEqual(['Shared Feature']);
      expect(platinumFeatures.map(f => f.name)).toEqual(['Shared Feature']);
    });

    it('should work with mixed legacy and new features', () => {
      const mixedFeatures = [
        createTestFeature({ id: 'f1', name: 'Legacy Elite', column: 1, position: 0 }),
        createTestFeature({ 
          id: 'f2', 
          name: 'Multi Feature', 
          columns: [1, 2],
          column: 1,
          positionsByColumn: { 1: 1, 2: 0 },
          position: 1,
        }),
        createTestFeature({ id: 'f3', name: 'Legacy Platinum', column: 2, position: 1 }),
      ];

      const eliteFeatures = deriveTierFeatures('Elite', mixedFeatures);
      const platinumFeatures = deriveTierFeatures('Platinum', mixedFeatures);

      expect(eliteFeatures.map(f => f.name)).toEqual(['Legacy Elite', 'Multi Feature']);
      expect(platinumFeatures.map(f => f.name)).toEqual(['Multi Feature', 'Legacy Platinum']);
    });
  });
});
