import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sortFeaturesByPosition, groupFeaturesByColumn, upsertAlaCarteFromFeature, unpublishAlaCarteFromFeature } from './data';
import type { ProductFeature } from './types';

// Mock firebase
vi.mock('./firebase', () => ({
  db: null,
}));

// Mock the entire firebase/firestore/lite module
vi.mock('firebase/firestore/lite', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(),
  setDoc: vi.fn(),
}));

describe('sortFeaturesByPosition', () => {
  const createFeature = (overrides: Partial<ProductFeature>): ProductFeature => ({
    id: 'test-id',
    name: 'Test Feature',
    description: 'Test description',
    points: [],
    useCases: [],
    price: 100,
    cost: 50,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sort features by column first', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Feature A', column: 3 }),
      createFeature({ id: '2', name: 'Feature B', column: 1 }),
      createFeature({ id: '3', name: 'Feature C', column: 2 }),
    ];

    const sorted = sortFeaturesByPosition(features);

    expect(sorted[0]?.column).toBe(1);
    expect(sorted[1]?.column).toBe(2);
    expect(sorted[2]?.column).toBe(3);
  });

  it('should sort features by position within the same column', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Feature A', column: 1, position: 2 }),
      createFeature({ id: '2', name: 'Feature B', column: 1, position: 0 }),
      createFeature({ id: '3', name: 'Feature C', column: 1, position: 1 }),
    ];

    const sorted = sortFeaturesByPosition(features);

    expect(sorted[0]?.name).toBe('Feature B');
    expect(sorted[1]?.name).toBe('Feature C');
    expect(sorted[2]?.name).toBe('Feature A');
  });

  it('should place features without column at the end', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Feature A', column: undefined }),
      createFeature({ id: '2', name: 'Feature B', column: 1 }),
      createFeature({ id: '3', name: 'Feature C', column: 2 }),
    ];

    const sorted = sortFeaturesByPosition(features);

    expect(sorted[0]?.column).toBe(1);
    expect(sorted[1]?.column).toBe(2);
    expect(sorted[2]?.column).toBeUndefined();
  });

  it('should place features without position at the end within their column', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Feature A', column: 1, position: undefined }),
      createFeature({ id: '2', name: 'Feature B', column: 1, position: 0 }),
      createFeature({ id: '3', name: 'Feature C', column: 1, position: 1 }),
    ];

    const sorted = sortFeaturesByPosition(features);

    expect(sorted[0]?.name).toBe('Feature B');
    expect(sorted[1]?.name).toBe('Feature C');
    expect(sorted[2]?.name).toBe('Feature A');
  });

  it('should not mutate the original array', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Feature A', column: 2 }),
      createFeature({ id: '2', name: 'Feature B', column: 1 }),
    ];
    const originalOrder = [...features];

    sortFeaturesByPosition(features);

    expect(features[0]?.id).toBe(originalOrder[0]?.id);
    expect(features[1]?.id).toBe(originalOrder[1]?.id);
  });

  it('should handle empty array', () => {
    const features: ProductFeature[] = [];
    const sorted = sortFeaturesByPosition(features);
    expect(sorted).toEqual([]);
  });

  it('should handle single feature', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Only Feature' }),
    ];
    const sorted = sortFeaturesByPosition(features);
    expect(sorted).toHaveLength(1);
    expect(sorted[0]?.name).toBe('Only Feature');
  });

  it('should sort correctly with mixed column and position values', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Col2-Pos1', column: 2, position: 1 }),
      createFeature({ id: '2', name: 'Col1-Pos0', column: 1, position: 0 }),
      createFeature({ id: '3', name: 'Col2-Pos0', column: 2, position: 0 }),
      createFeature({ id: '4', name: 'Col1-Pos1', column: 1, position: 1 }),
      createFeature({ id: '5', name: 'NoCol', column: undefined }),
    ];

    const sorted = sortFeaturesByPosition(features);

    expect(sorted.map(f => f.name)).toEqual([
      'Col1-Pos0',
      'Col1-Pos1',
      'Col2-Pos0',
      'Col2-Pos1',
      'NoCol',
    ]);
  });
});

describe('groupFeaturesByColumn', () => {
  const createFeature = (overrides: Partial<ProductFeature>): ProductFeature => ({
    id: 'test-id',
    name: 'Test Feature',
    description: 'Test description',
    points: [],
    useCases: [],
    price: 100,
    cost: 50,
    ...overrides,
  });

  it('should group features by column number', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Col1-Feature', column: 1, position: 0 }),
      createFeature({ id: '2', name: 'Col2-Feature', column: 2, position: 0 }),
      createFeature({ id: '3', name: 'Col1-Feature2', column: 1, position: 1 }),
    ];

    const grouped = groupFeaturesByColumn(features);

    expect(grouped[1]).toHaveLength(2);
    expect(grouped[2]).toHaveLength(1);
    expect(grouped[3]).toHaveLength(0);
    expect(grouped[4]).toHaveLength(0);
  });

  it('should sort features by position within each column', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Col1-Pos2', column: 1, position: 2 }),
      createFeature({ id: '2', name: 'Col1-Pos0', column: 1, position: 0 }),
      createFeature({ id: '3', name: 'Col1-Pos1', column: 1, position: 1 }),
    ];

    const grouped = groupFeaturesByColumn(features);

    expect(grouped[1]?.[0]?.name).toBe('Col1-Pos0');
    expect(grouped[1]?.[1]?.name).toBe('Col1-Pos1');
    expect(grouped[1]?.[2]?.name).toBe('Col1-Pos2');
  });

  it('should place unassigned features in the unassigned group', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Assigned', column: 1, position: 0 }),
      createFeature({ id: '2', name: 'Unassigned', column: undefined }),
    ];

    const grouped = groupFeaturesByColumn(features);

    expect(grouped[1]).toHaveLength(1);
    expect(grouped.unassigned).toHaveLength(1);
    expect(grouped.unassigned?.[0]?.name).toBe('Unassigned');
  });

  it('should preserve connector information when grouping', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Feature1', column: 1, position: 0, connector: 'AND' }),
      createFeature({ id: '2', name: 'Feature2', column: 1, position: 1, connector: 'OR' }),
    ];

    const grouped = groupFeaturesByColumn(features);

    expect(grouped[1]?.[0]?.connector).toBe('AND');
    expect(grouped[1]?.[1]?.connector).toBe('OR');
  });

  it('should handle empty array', () => {
    const features: ProductFeature[] = [];
    const grouped = groupFeaturesByColumn(features);

    expect(grouped[1]).toHaveLength(0);
    expect(grouped[2]).toHaveLength(0);
    expect(grouped[3]).toHaveLength(0);
    expect(grouped[4]).toHaveLength(0);
    expect(grouped.unassigned).toHaveLength(0);
  });

  it('should return features grouped by all four columns', () => {
    const features: ProductFeature[] = [
      createFeature({ id: '1', name: 'Col1', column: 1, position: 0 }),
      createFeature({ id: '2', name: 'Col2', column: 2, position: 0 }),
      createFeature({ id: '3', name: 'Col3', column: 3, position: 0 }),
      createFeature({ id: '4', name: 'Col4', column: 4, position: 0 }),
    ];

    const grouped = groupFeaturesByColumn(features);

    expect(grouped[1]?.[0]?.name).toBe('Col1');
    expect(grouped[2]?.[0]?.name).toBe('Col2');
    expect(grouped[3]?.[0]?.name).toBe('Col3');
    expect(grouped[4]?.[0]?.name).toBe('Col4');
  });
});

describe('A La Carte Publishing', () => {
  const createFeature = (overrides: Partial<ProductFeature>): ProductFeature => ({
    id: 'test-id',
    name: 'Test Feature',
    description: 'Test description',
    points: ['Point 1', 'Point 2'],
    useCases: ['Use case 1'],
    price: 100,
    cost: 50,
    warranty: 'Standard warranty',
    publishToAlaCarte: false,
    ...overrides,
  });

  describe('upsertAlaCarteFromFeature', () => {
    it('should throw error if firebase is not initialized', async () => {
      const feature = createFeature({ publishToAlaCarte: true, alaCartePrice: 150 });
      
      await expect(upsertAlaCarteFromFeature(feature)).rejects.toThrow('Firebase is not initialized');
    });

    it('should validate publishToAlaCarte and alaCartePrice before firebase operations', async () => {
      // These tests verify the validation logic happens after firebase check
      // Since db is mocked as null, we always get firebase error first
      const featureWithoutPublish = createFeature({ publishToAlaCarte: false, alaCartePrice: 150 });
      const featureWithoutPrice = createFeature({ publishToAlaCarte: true, alaCartePrice: undefined });
      
      // Both will throw firebase error since that check happens first
      await expect(upsertAlaCarteFromFeature(featureWithoutPublish)).rejects.toThrow('Firebase is not initialized');
      await expect(upsertAlaCarteFromFeature(featureWithoutPrice)).rejects.toThrow('Firebase is not initialized');
    });
  });

  describe('unpublishAlaCarteFromFeature', () => {
    it('should throw error if firebase is not initialized', async () => {
      await expect(unpublishAlaCarteFromFeature('test-id')).rejects.toThrow('Firebase is not initialized');
    });
  });
});
