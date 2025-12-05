import React from 'react';
import type { PackageTier, ProductFeature, AlaCarteOption } from '../types';
import { PackageCard } from './PackageCard';

interface PackageSelectorProps {
  packages: PackageTier[];
  allFeaturesForDisplay: ProductFeature[];
  selectedPackage: PackageTier | null;
  onSelectPackage: (pkg: PackageTier) => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({ packages, allFeaturesForDisplay, selectedPackage, onSelectPackage, onViewFeature }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          packageInfo={pkg}
          allFeaturesForDisplay={allFeaturesForDisplay}
          isSelected={selectedPackage?.id === pkg.id}
          onSelect={() => onSelectPackage(pkg)}
          onViewFeature={onViewFeature}
        />
      ))}
    </div>
  );
};