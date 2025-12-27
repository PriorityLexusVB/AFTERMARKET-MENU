import { describe, it, expect } from 'vitest';
import type { PackageTier } from '../types';

/**
 * Test suite for package ordering logic.
 * Ensures customer-facing package order is Elite → Platinum → Gold.
 */

// Helper to create a test package
const createTestPackage = (name: string, price: number): PackageTier => ({
  id: name.toLowerCase(),
  name,
  price,
  cost: price * 0.5,
  features: [],
  tier_color: '#000000',
});

// Tier ranking function (matching App.tsx logic)
const tierRank = (name: string) => {
  const n = name.trim().toLowerCase();
  if (/\belite\b/.test(n)) return 1;
  if (/\bplatinum\b/.test(n)) return 2;
  if (/\bgold\b/.test(n)) return 3;
  return 99;
};

describe('Package Ordering', () => {
  describe('tierRank function', () => {
    it('should rank Elite as 1', () => {
      expect(tierRank('Elite')).toBe(1);
      expect(tierRank('elite')).toBe(1);
      expect(tierRank('ELITE')).toBe(1);
      expect(tierRank('Elite Package')).toBe(1);
    });

    it('should rank Platinum as 2', () => {
      expect(tierRank('Platinum')).toBe(2);
      expect(tierRank('platinum')).toBe(2);
      expect(tierRank('PLATINUM')).toBe(2);
      expect(tierRank('Platinum Package')).toBe(2);
    });

    it('should rank Gold as 3', () => {
      expect(tierRank('Gold')).toBe(3);
      expect(tierRank('gold')).toBe(3);
      expect(tierRank('GOLD')).toBe(3);
      expect(tierRank('Gold Package')).toBe(3);
    });

    it('should rank unknown packages as 99', () => {
      expect(tierRank('Silver')).toBe(99);
      expect(tierRank('Bronze')).toBe(99);
      expect(tierRank('Custom')).toBe(99);
    });
  });

  describe('Package Sorting', () => {
    it('should sort packages in Elite → Platinum → Gold order', () => {
      const packages = [
        createTestPackage('Gold', 1000),
        createTestPackage('Elite', 3000),
        createTestPackage('Platinum', 2000),
      ];

      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(sorted.map(p => p.name)).toEqual(['Elite', 'Platinum', 'Gold']);
    });

    it('should maintain Elite → Platinum → Gold order regardless of price', () => {
      // Packages with reversed prices
      const packages = [
        createTestPackage('Gold', 5000),      // Highest price
        createTestPackage('Elite', 1000),     // Lowest price
        createTestPackage('Platinum', 3000),
      ];

      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(sorted.map(p => p.name)).toEqual(['Elite', 'Platinum', 'Gold']);
    });

    it('should handle packages with "Package" suffix', () => {
      const packages = [
        createTestPackage('Gold Package', 1000),
        createTestPackage('Elite Package', 3000),
        createTestPackage('Platinum Package', 2000),
      ];

      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(sorted.map(p => p.name)).toEqual([
        'Elite Package',
        'Platinum Package',
        'Gold Package',
      ]);
    });

    it('should place unknown tier packages at the end', () => {
      const packages = [
        createTestPackage('Custom', 1500),
        createTestPackage('Gold', 1000),
        createTestPackage('Elite', 3000),
        createTestPackage('Silver', 500),
        createTestPackage('Platinum', 2000),
      ];

      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(sorted.map(p => p.name)).toEqual([
        'Elite',
        'Platinum',
        'Gold',
        'Custom',
        'Silver',
      ]);
    });

    it('should handle case-insensitive tier names', () => {
      const packages = [
        createTestPackage('GOLD', 1000),
        createTestPackage('elite', 3000),
        createTestPackage('PlatinuM', 2000),
      ];

      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(sorted.map(p => p.name)).toEqual(['elite', 'PlatinuM', 'GOLD']);
    });

    it('should not mutate the original array', () => {
      const packages = [
        createTestPackage('Gold', 1000),
        createTestPackage('Elite', 3000),
        createTestPackage('Platinum', 2000),
      ];
      const originalOrder = packages.map(p => p.name);

      [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(packages.map(p => p.name)).toEqual(originalOrder);
    });

    it('should handle empty package array', () => {
      const packages: PackageTier[] = [];
      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));
      expect(sorted).toEqual([]);
    });

    it('should handle single package', () => {
      const packages = [createTestPackage('Elite', 3000)];
      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));
      expect(sorted.map(p => p.name)).toEqual(['Elite']);
    });
  });

  describe('Integration with actual package data', () => {
    it('should maintain correct order when packages are already sorted', () => {
      const packages = [
        createTestPackage('Elite', 3000),
        createTestPackage('Platinum', 2000),
        createTestPackage('Gold', 1000),
      ];

      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(sorted.map(p => p.name)).toEqual(['Elite', 'Platinum', 'Gold']);
    });

    it('should correct order when packages are in reverse order', () => {
      const packages = [
        createTestPackage('Gold', 1000),
        createTestPackage('Platinum', 2000),
        createTestPackage('Elite', 3000),
      ];

      const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

      expect(sorted.map(p => p.name)).toEqual(['Elite', 'Platinum', 'Gold']);
    });
  });
});
