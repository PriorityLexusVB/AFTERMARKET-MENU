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
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  packages,
  allFeaturesForDisplay,
  selectedPackage,
  onSelectPackage,
  onViewFeature,
  addonColumn,
  gridClassName,
}) => {
  const baseGrid = addonColumn
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';
  const gridClasses = `${baseGrid} stagger-children ${gridClassName ?? ''}`.trim();

  return (
    <div className={gridClasses}>
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
