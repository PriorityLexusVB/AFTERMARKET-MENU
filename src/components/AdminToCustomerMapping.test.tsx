import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { PackageCard } from './PackageCard';
import { PackageSelector } from './PackageSelector';
import { createMockPackageTier, createMockFeature } from '../test/test-utils';

/**
 * Test suite verifying that admin column/position assignments are correctly
 * rendered in the customer-facing menu.
 * 
 * Admin columns represent organizational groupings:
 * - Column 1: Gold Tier features (base features)
 * - Column 2: Elite Tier features (additional features)
 * - Column 3: Platinum Tier features (premium features)
 * - Column 4: Popular Add-ons
 * 
 * Features are sorted by column first, then by position within column.
 * The connector field (AND/OR) determines the divider displayed between features.
 */
describe('Admin to Customer Menu Mapping', () => {
  describe('Feature Position Ordering', () => {
    it('should render features sorted by column and position', () => {
      // Create features with specific column/position assignments
      const feature1 = createMockFeature({
        id: 'f1',
        name: 'Feature Column 1 Position 0',
        column: 1,
        position: 0,
        points: ['Point 1'],
      });
      const feature2 = createMockFeature({
        id: 'f2',
        name: 'Feature Column 1 Position 1',
        column: 1,
        position: 1,
        points: ['Point 2'],
      });
      const feature3 = createMockFeature({
        id: 'f3',
        name: 'Feature Column 2 Position 0',
        column: 2,
        position: 0,
        points: ['Point 3'],
      });

      const pkg = createMockPackageTier({
        name: 'Test Package',
        price: 1000,
        // Note: features array order doesn't matter - should be sorted by column/position
        features: [feature3, feature1, feature2],
      });

      const { container } = render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={[feature1, feature2, feature3]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // Get all feature buttons in order
      const featureButtons = container.querySelectorAll('button[aria-label^="Learn more about"]');
      const featureNames = Array.from(featureButtons).map(btn => btn.textContent);

      // Features should be sorted: col1-pos0, col1-pos1, col2-pos0
      expect(featureNames).toEqual([
        'Feature Column 1 Position 0',
        'Feature Column 1 Position 1',
        'Feature Column 2 Position 0',
      ]);
    });

    it('should place features without column/position at the end', () => {
      const featureWithPosition = createMockFeature({
        id: 'f1',
        name: 'Positioned Feature',
        column: 1,
        position: 0,
        points: ['Point 1'],
      });
      const featureWithoutPosition = createMockFeature({
        id: 'f2',
        name: 'Unpositioned Feature',
        // No column or position
        points: ['Point 2'],
      });

      const pkg = createMockPackageTier({
        name: 'Test Package',
        price: 1000,
        features: [featureWithoutPosition, featureWithPosition],
      });

      const { container } = render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={[featureWithPosition, featureWithoutPosition]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      const featureButtons = container.querySelectorAll('button[aria-label^="Learn more about"]');
      const featureNames = Array.from(featureButtons).map(btn => btn.textContent);

      // Positioned feature should come first
      expect(featureNames[0]).toBe('Positioned Feature');
      expect(featureNames[1]).toBe('Unpositioned Feature');
    });
  });

  describe('AND/OR Connector Rendering', () => {
    it('should render AND connector between features by default', () => {
      const feature1 = createMockFeature({
        id: 'f1',
        name: 'Feature 1',
        column: 1,
        position: 0,
        connector: 'AND',
        points: ['Point 1'],
      });
      const feature2 = createMockFeature({
        id: 'f2',
        name: 'Feature 2',
        column: 1,
        position: 1,
        connector: 'AND',
        points: ['Point 2'],
      });

      const pkg = createMockPackageTier({
        name: 'Test Package',
        price: 1000,
        features: [feature1, feature2],
      });

      render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={[feature1, feature2]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // AND divider should appear between features
      expect(screen.getByText('AND')).toBeInTheDocument();
    });

    it('should render OR connector when feature has OR connector type', () => {
      const feature1 = createMockFeature({
        id: 'f1',
        name: 'Feature 1',
        column: 1,
        position: 0,
        connector: 'AND',
        points: ['Point 1'],
      });
      const feature2 = createMockFeature({
        id: 'f2',
        name: 'Feature 2',
        column: 1,
        position: 1,
        connector: 'OR', // This feature shows OR connector
        points: ['Point 2'],
      });

      const pkg = createMockPackageTier({
        name: 'Test Package',
        price: 1000,
        features: [feature1, feature2],
      });

      render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={[feature1, feature2]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // OR divider should appear before feature2
      expect(screen.getByText('OR')).toBeInTheDocument();
    });

    it('should render mixed AND/OR connectors in correct positions', () => {
      const feature1 = createMockFeature({
        id: 'f1',
        name: 'RustGuard Pro',
        column: 1,
        position: 0,
        connector: 'AND',
        points: ['Point 1'],
      });
      const feature2 = createMockFeature({
        id: 'f2',
        name: 'ToughGuard Premium',
        column: 1,
        position: 1,
        connector: 'AND',
        points: ['Point 2'],
      });
      const feature3 = createMockFeature({
        id: 'f3',
        name: 'Interior Protection',
        column: 1,
        position: 2,
        connector: 'OR', // Shows OR before this feature
        points: ['Point 3'],
      });

      const pkg = createMockPackageTier({
        name: 'Gold',
        price: 2399,
        tier_color: 'yellow-400',
        features: [feature1, feature2, feature3],
      });

      render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={[feature1, feature2, feature3]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // Should have one AND and one OR
      expect(screen.getAllByText('AND')).toHaveLength(1);
      expect(screen.getAllByText('OR')).toHaveLength(1);
    });
  });

  describe('Multi-Column Feature Rendering', () => {
    it('should correctly sort features from multiple columns', () => {
      // Simulate features as they would be organized in admin:
      // Column 1 (Gold base): RustGuard, ToughGuard, Interior
      // Column 2 (Elite extra): Diamond Shield
      // Note: IDs follow the same kebab-case pattern as production mock data
      const rustGuard = createMockFeature({
        id: 'rustguard-pro',
        name: 'RustGuard Pro',
        column: 1,
        position: 0,
        connector: 'AND',
        points: ['Underbody protection'],
      });
      const toughGuard = createMockFeature({
        id: 'toughguard-premium',
        name: 'ToughGuard Premium',
        column: 1,
        position: 1,
        connector: 'AND',
        points: ['Paint sealant'],
      });
      const interiorProtection = createMockFeature({
        id: 'interior-protection',
        name: 'Interior Leather & Fabric Protection',
        column: 1,
        position: 2,
        connector: 'OR',
        points: ['Stain protection'],
      });
      const diamondShield = createMockFeature({
        id: 'diamond-shield',
        name: 'Diamond Shield Windshield Protection',
        column: 2,
        position: 0,
        connector: 'AND',
        points: ['Windshield protection'],
      });

      // Elite package includes all features from both columns
      const elitePackage = createMockPackageTier({
        name: 'Elite',
        price: 3499,
        tier_color: 'gray-400',
        features: [rustGuard, toughGuard, interiorProtection, diamondShield],
      });

      const { container } = render(
        <PackageCard
          packageInfo={elitePackage}
          allFeaturesForDisplay={[rustGuard, toughGuard, interiorProtection, diamondShield]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      const featureButtons = container.querySelectorAll('button[aria-label^="Learn more about"]');
      const featureNames = Array.from(featureButtons).map(btn => btn.textContent);

      // Features should be sorted by column first, then position
      expect(featureNames).toEqual([
        'RustGuard Pro',
        'ToughGuard Premium',
        'Interior Leather & Fabric Protection',
        'Diamond Shield Windshield Protection',
      ]);
    });
  });

  describe('Package Card Visual Structure', () => {
    it('should display price badge with correct styling', () => {
      const feature = createMockFeature({
        id: 'f1',
        name: 'Test Feature',
        points: ['Point 1'],
      });

      const pkg = createMockPackageTier({
        name: 'Gold',
        price: 2399,
        tier_color: 'yellow-400',
        features: [feature],
      });

      const { container } = render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={[feature]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // Price should be displayed
      expect(container.textContent).toContain('$2,399');

      // Price badge should have red background
      const priceBadge = container.querySelector('.bg-red-700');
      expect(priceBadge).toBeInTheDocument();
    });

    it('should display Select Plan button at bottom', () => {
      const feature = createMockFeature({
        id: 'f1',
        name: 'Test Feature',
        points: ['Point 1'],
      });

      const pkg = createMockPackageTier({
        name: 'Gold',
        price: 2399,
        tier_color: 'yellow-400',
        features: [feature],
      });

      render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={[feature]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      expect(screen.getByText('Select Plan')).toBeInTheDocument();
    });
  });

  describe('PackageSelector Integration', () => {
    it('should render multiple packages with correct feature ordering', () => {
      const rustGuard = createMockFeature({
        id: 'rustguard-pro',
        name: 'RustGuard Pro',
        column: 1,
        position: 0,
        points: ['Protection'],
      });
      const diamondShield = createMockFeature({
        id: 'diamond-shield',
        name: 'Diamond Shield',
        column: 2,
        position: 0,
        points: ['Windshield'],
      });

      const goldPackage = createMockPackageTier({
        id: 'gold',
        name: 'Gold',
        price: 2399,
        tier_color: 'yellow-400',
        features: [rustGuard],
      });
      const elitePackage = createMockPackageTier({
        id: 'elite',
        name: 'Elite',
        price: 3499,
        tier_color: 'gray-400',
        features: [rustGuard, diamondShield],
      });

      render(
        <PackageSelector
          packages={[goldPackage, elitePackage]}
          allFeaturesForDisplay={[rustGuard, diamondShield]}
          selectedPackage={null}
          onSelectPackage={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // Both packages should be rendered
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Elite')).toBeInTheDocument();

      // Features should appear in correct packages
      const rustGuardElements = screen.getAllByText('RustGuard Pro');
      expect(rustGuardElements).toHaveLength(2); // In both packages

      const diamondShieldElements = screen.getAllByText('Diamond Shield');
      expect(diamondShieldElements).toHaveLength(1); // Only in Elite
    });
  });
});
