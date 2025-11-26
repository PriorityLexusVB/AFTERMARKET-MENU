import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sortFeaturesByPosition } from './data';
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
