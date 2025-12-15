import { describe, it, expect } from 'vitest';
import { MOCK_ALA_CARTE_OPTIONS } from './mock';

describe('MOCK_ALA_CARTE_OPTIONS', () => {
  it('includes historical package options as a la carte entries', () => {
    const optionIds = new Set(MOCK_ALA_CARTE_OPTIONS.map(option => option.id));
    const expectedIds = [
      'diamond-shield',
      'rustguard-pro-alacarte',
      'toughguard-premium-alacarte',
      'interior-protection-alacarte',
      'elite-ceramic-coating',
      'elite-paint-correction',
      'elite-interior-detail',
      'platinum-ppf-full',
      'platinum-graphene-coating',
      'platinum-wheel-coating',
    ];

    expectedIds.forEach(id => expect(optionIds.has(id)).toBe(true));

    const columnFourOnly = expectedIds.every(id => {
      const option = MOCK_ALA_CARTE_OPTIONS.find(item => item.id === id);
      return option?.column === 4;
    });

    expect(columnFourOnly).toBe(true);
  });
});
