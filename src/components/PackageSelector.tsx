import React from 'react';
import type { PackageTier, ProductFeature, AlaCarteOption } from '../types';
import { PackageCard } from './PackageCard';

interface PackageSelectorProps {
  packages: PackageTier[];
  allFeaturesForDisplay: ProductFeature[];
  selectedPackage: PackageTier | null;
  onSelectPackage: (pkg: PackageTier) => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
  addonColumn?: React.ReactNode;
  gridClassName?: string;
  isIpadLandscape?: boolean;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  packages,
  allFeaturesForDisplay,
  selectedPackage,
  onSelectPackage,
  onViewFeature,
  addonColumn,
  gridClassName,
  isIpadLandscape = false,
}) => {
  const baseGrid = isIpadLandscape
    ? 'grid gap-4 lg:gap-6'
    : addonColumn
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';
  const gridClasses = gridClassName
    ? `${baseGrid} stagger-children ${gridClassName}`
    : `${baseGrid} stagger-children`;
  const gridStyle = isIpadLandscape
    ? {
        gridTemplateColumns: addonColumn ? 'repeat(4, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
        height: '100%',
      }
    : undefined;

  return (
    <div className={`${gridClasses} min-h-0`} data-testid="package-grid" style={gridStyle}>
      {packages.map((pkg, index) => (
        <PackageCard
          key={pkg.id}
          packageInfo={pkg}
          allFeaturesForDisplay={allFeaturesForDisplay}
          isSelected={selectedPackage?.id === pkg.id}
          onSelect={() => onSelectPackage(pkg)}
          onViewFeature={onViewFeature}
          className="animate-card-entrance"
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
      {addonColumn}
    </div>
  );
};
