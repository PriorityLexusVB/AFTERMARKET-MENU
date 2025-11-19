import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type { ProductFeature, AlaCarteOption, PackageTier } from '../types';

// Custom render function (can be extended with providers later)
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockFeature = (overrides?: Partial<ProductFeature>): ProductFeature => ({
  id: 'test-feature-1',
  name: 'Test Feature',
  description: 'Test feature description',
  points: ['Feature point 1', 'Feature point 2'],
  useCases: ['Use case 1', 'Use case 2'],
  price: 1000,
  cost: 500,
  warranty: '5 years',
  ...overrides,
});

export const createMockAlaCarteOption = (overrides?: Partial<AlaCarteOption>): AlaCarteOption => ({
  id: 'test-option-1',
  name: 'Test Option',
  price: 500,
  cost: 250,
  description: 'Test option description',
  points: ['Option point 1', 'Option point 2'],
  isNew: false,
  ...overrides,
});

export const createMockPackageTier = (overrides?: Partial<PackageTier>): PackageTier => ({
  id: 'test-package-1',
  name: 'Test Package',
  price: 2000,
  cost: 1000,
  features: [createMockFeature()],
  is_recommended: false,
  tier_color: 'blue-400',
  ...overrides,
});

// Helper to format price like the app does
export const formatTestPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};
