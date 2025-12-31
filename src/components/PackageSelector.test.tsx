import { describe, expect, it } from 'vitest';
import { PackageSelector } from './PackageSelector';
import { createMockFeature, createMockPackageTier, render, screen } from '../test/test-utils';

describe('PackageSelector layout', () => {
  it('renders responsive 4-column grid with addon lane without crashing', () => {
    const packages = [
      createMockPackageTier({ id: 'elite', name: 'Elite', features: [createMockFeature({ id: 'f1' })] }),
      createMockPackageTier({ id: 'platinum', name: 'Platinum', features: [createMockFeature({ id: 'f2' })] }),
      createMockPackageTier({ id: 'gold', name: 'Gold', features: [createMockFeature({ id: 'f3' })] }),
    ];

    render(
      <PackageSelector
        packages={packages}
        allFeaturesForDisplay={[]}
        selectedPackage={null}
        onSelectPackage={() => {}}
        onViewFeature={() => {}}
        addonColumn={<div data-testid="addon-column">Addons</div>}
      />
    );

    const grid = screen.getByTestId('package-grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-4');
    expect(screen.getByTestId('addon-column')).toBeInTheDocument();
  });
});
