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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 stagger-children">
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
    </div>
  );
};