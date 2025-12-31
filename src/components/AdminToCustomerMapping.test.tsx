import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { PackageCard } from './PackageCard';
import { PackageSelector } from './PackageSelector';
import { createMockPackageTier, createMockFeature } from '../test/test-utils';
import { sortFeatures, compareFeatures, normalizePositions } from '../utils/featureOrdering';

/**
 * Test suite verifying that admin column/position assignments are correctly
 * rendered in the customer-facing menu.
 * 
 * Admin columns represent organizational groupings:
 * - Column 1: Elite Tier features (Elite package features)
 * - Column 2: Platinum Tier features (Platinum package features)
 * - Column 3: Gold Tier features (Gold package features)
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
        // packageInfo.features should be pre-sorted by deriveTierFeatures in production
        // These tests now pass correctly ordered features as deriveTierFeatures would
        features: [feature1, feature2, feature3],
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

      // Features should be in the order provided by packageInfo.features (already sorted by deriveTierFeatures)
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

      // packageInfo.features should be pre-sorted by deriveTierFeatures
      // In this case, positioned features come first
      const pkg = createMockPackageTier({
        name: 'Test Package',
        price: 1000,
        features: [featureWithPosition, featureWithoutPosition],
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

      // Features should be in the order provided by packageInfo.features
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
      // Column 1 (Elite package): RustGuard, ToughGuard, Interior
      // Column 2 (Platinum package): Diamond Shield
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

      // Price plaque should be present for luxury styling
      const priceBadge = container.querySelector('.lux-price-plaque');
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

  describe('Centralized Ordering Utility Integration', () => {
    it('should use sortFeatures utility to match admin panel ordering', () => {
      // Simulate features in a shuffled order as they might come from Firestore
      const shuffledFeatures = [
        createMockFeature({ id: 'f3', name: 'Column 2 Pos 0', column: 2, position: 0 }),
        createMockFeature({ id: 'f5', name: 'Unassigned', points: ['Point'] }),
        createMockFeature({ id: 'f1', name: 'Column 1 Pos 0', column: 1, position: 0 }),
        createMockFeature({ id: 'f4', name: 'Column 1 Pos 2', column: 1, position: 2 }),
        createMockFeature({ id: 'f2', name: 'Column 1 Pos 1', column: 1, position: 1 }),
      ];

      // Apply sortFeatures (same utility used by PackageCard)
      const sortedFeatures = sortFeatures(shuffledFeatures);

      // Verify the order matches what admin panel would display
      expect(sortedFeatures.map(f => f.name)).toEqual([
        'Column 1 Pos 0',
        'Column 1 Pos 1',
        'Column 1 Pos 2',
        'Column 2 Pos 0',
        'Unassigned',
      ]);
    });

    it('should use compareFeatures to determine feature order', () => {
      const featureA = createMockFeature({ id: 'a', column: 1, position: 0 });
      const featureB = createMockFeature({ id: 'b', column: 1, position: 1 });
      const featureC = createMockFeature({ id: 'c', column: 2, position: 0 });

      // A comes before B (same column, lower position)
      expect(compareFeatures(featureA, featureB)).toBeLessThan(0);
      // B comes before C (lower column)
      expect(compareFeatures(featureB, featureC)).toBeLessThan(0);
      // A comes before C (lower column)
      expect(compareFeatures(featureA, featureC)).toBeLessThan(0);
    });

    it('should normalize positions for deterministic ordering', () => {
      // Features with gaps in positions (e.g., after deletion)
      const featuresWithGaps = [
        createMockFeature({ id: 'f1', column: 1, position: 0, connector: 'AND' }),
        createMockFeature({ id: 'f2', column: 1, position: 5, connector: 'OR' }),
        createMockFeature({ id: 'f3', column: 1, position: 10, connector: 'AND' }),
      ];

      const normalized = normalizePositions(featuresWithGaps);

      // Positions should be sequential
      expect(normalized.map(f => f.position)).toEqual([0, 1, 2]);
      // Connector values should be preserved
      expect(normalized.map(f => f.connector)).toEqual(['AND', 'OR', 'AND']);
    });

    it('should render features in same order that sortFeatures produces', () => {
      // Create features deliberately out of order
      const features = [
        createMockFeature({
          id: 'f3',
          name: 'Third Feature',
          column: 2,
          position: 0,
          points: ['Point'],
        }),
        createMockFeature({
          id: 'f1',
          name: 'First Feature',
          column: 1,
          position: 0,
          points: ['Point'],
        }),
        createMockFeature({
          id: 'f2',
          name: 'Second Feature',
          column: 1,
          position: 1,
          points: ['Point'],
        }),
      ];

      // Sort with utility to match what deriveTierFeatures would produce
      const sortedByUtility = sortFeatures(features);

      // Create a package with features pre-sorted as deriveTierFeatures would
      const pkg = createMockPackageTier({
        name: 'Test Package',
        price: 1000,
        features: sortedByUtility,
      });

      // Render the package card
      const { container } = render(
        <PackageCard
          packageInfo={pkg}
          allFeaturesForDisplay={features}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // Get rendered order
      const featureButtons = container.querySelectorAll('button[aria-label^="Learn more about"]');
      const renderedOrder = Array.from(featureButtons).map(btn => btn.textContent);

      // Rendered order should match the order in packageInfo.features (which is sortedByUtility)
      const expectedOrder = sortedByUtility.map(f => f.name);
      expect(renderedOrder).toEqual(expectedOrder);
    });
  });

  describe('Empty Admin Columns', () => {
    it('should show empty package when admin column is empty', () => {
      // Simulate features only in Column 1 (Elite Tier)
      const eliteFeature = createMockFeature({
        id: 'elite-feature',
        name: 'Elite Feature',
        column: 1,
        position: 0,
        points: ['Point 1'],
      });

      // Platinum package with no features (column 2 is empty in admin)
      const platinumPackage = createMockPackageTier({
        name: 'Platinum',
        price: 3499,
        tier_color: 'gray-400',
        features: [], // Empty because Platinum column (2) has no features
      });

      const { container } = render(
        <PackageCard
          packageInfo={platinumPackage}
          allFeaturesForDisplay={[eliteFeature]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // Should not show Elite Feature in Platinum package
      const featureButtons = container.querySelectorAll('button[aria-label^="Learn more about"]');
      expect(featureButtons).toHaveLength(0);
    });

    it('should not auto-populate from other columns', () => {
      // Features in columns 1 and 4, but not in 2 or 3
      const eliteFeature = createMockFeature({
        id: 'elite-feature',
        name: 'Elite Feature',
        column: 1,
        position: 0,
        points: ['Point'],
      });
      const addonFeature = createMockFeature({
        id: 'addon-feature',
        name: 'Add-on Feature',
        column: 4,
        position: 0,
        points: ['Point'],
      });

      // Elite package should only have Column 1 features
      const elitePackage = createMockPackageTier({
        name: 'Elite',
        price: 2399,
        tier_color: 'yellow-400',
        features: [eliteFeature], // Only Elite column features
      });

      const { container } = render(
        <PackageCard
          packageInfo={elitePackage}
          allFeaturesForDisplay={[eliteFeature, addonFeature]}
          isSelected={false}
          onSelect={vi.fn()}
          onViewFeature={vi.fn()}
        />
      );

      // Should only show Elite Feature, not Add-on Feature
      const featureButtons = container.querySelectorAll('button[aria-label^="Learn more about"]');
      expect(featureButtons).toHaveLength(1);
      expect(featureButtons[0]?.textContent).toBe('Elite Feature');
    });
  });
});
