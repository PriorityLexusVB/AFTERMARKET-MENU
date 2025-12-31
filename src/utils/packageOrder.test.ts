import { describe, expect, it } from 'vitest';
import type { PackageTier } from '../types';
import { sortPackagesForDisplay } from './packageOrder';

describe('sortPackagesForDisplay', () => {
  const pkg = (name: string): PackageTier => ({
    id: name.toLowerCase(),
    name,
    price: 0,
    cost: 0,
    features: [],
    tier_color: 'gray-500',
  });

  it('orders packages as Elite → Platinum → Gold regardless of input order', () => {
    const input = [pkg('Gold'), pkg('Platinum'), pkg('Elite')];
    const sorted = sortPackagesForDisplay(input);
    expect(sorted.map(p => p.name)).toEqual(['Elite', 'Platinum', 'Gold']);
  });

  it('handles mixed casing in names when sorting', () => {
    const input = [pkg('gold plan'), pkg('ELITE'), pkg('plAtinum offer')];
    const sorted = sortPackagesForDisplay(input);
    expect(sorted.map(p => p.name)).toEqual(['ELITE', 'plAtinum offer', 'gold plan']);
  });
});
