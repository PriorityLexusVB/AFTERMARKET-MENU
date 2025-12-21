import { describe, expect, it } from 'vitest';
import { columnOrderValue, isCuratedOption } from './alaCarte';
import type { AlaCarteOption } from '../types';

const baseOption: AlaCarteOption = {
  id: 'opt-1',
  name: 'Test',
  description: 'Desc',
  points: [],
  price: 100,
  cost: 50,
};

describe('alaCarte utils', () => {
  describe('columnOrderValue', () => {
    it('prioritizes column 4 then 1,2,3', () => {
      expect(columnOrderValue(4)).toBe(0);
      expect(columnOrderValue(1)).toBe(1);
      expect(columnOrderValue(2)).toBe(2);
      expect(columnOrderValue(3)).toBe(3);
    });

    it('puts invalid or missing columns at the end', () => {
      expect(columnOrderValue(undefined)).toBe(999);
      expect(columnOrderValue(9)).toBe(999);
    });
  });

  describe('isCuratedOption', () => {
    it('accepts published items with valid columns', () => {
      expect(isCuratedOption({ ...baseOption, isPublished: true, column: 1 })).toBe(true);
      expect(isCuratedOption({ ...baseOption, isPublished: true, column: 4 })).toBe(true);
    });

    it('rejects unpublished or missing columns', () => {
      expect(isCuratedOption({ ...baseOption, isPublished: false, column: 1 })).toBe(false);
      expect(isCuratedOption({ ...baseOption, isPublished: true, column: undefined })).toBe(false);
      expect(isCuratedOption({ ...baseOption, isPublished: true, column: 9 })).toBe(false);
    });

    it('rejects legacy items with undefined isPublished (customer-facing strict filter)', () => {
      // Legacy items (undefined isPublished) should NOT be shown to customers
      expect(isCuratedOption({ ...baseOption, isPublished: undefined, column: 1 })).toBe(false);
      expect(isCuratedOption({ ...baseOption, column: 1 })).toBe(false);
    });
  });
});
