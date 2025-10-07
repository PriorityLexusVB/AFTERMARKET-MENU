import React from 'react';
import type { PackageTier, ProductFeature, AlaCarteOption } from '../types';

interface PackageCardProps {
  packageInfo: PackageTier;
  allFeaturesForDisplay: ProductFeature[];
  isSelected: boolean;
  onSelect: () => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
}

const CheckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);

const DashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" />
    </svg>
);


export const PackageCard: React.FC<PackageCardProps> = ({ packageInfo, allFeaturesForDisplay, isSelected, onSelect, onViewFeature }) => {
  const isGold = packageInfo.name.toLowerCase() === 'gold';
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };
  
  return (
    <div className={`
      bg-gray-800 rounded-xl shadow-2xl flex flex-col transition-all duration-300 h-full
      ${isSelected ? 'transform scale-105 ring-4 ring-offset-4 ring-offset-gray-900 ring-blue-500' : 'hover:scale-102'}
      ${packageInfo.is_recommended ? 'border-4 border-blue-500' : `border-2 ${packageInfo.tier_color} border-opacity-70`}
    `}>
      {packageInfo.is_recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">Most Popular</div>
      )}
      <div className="p-4">
        <h3 className={`font-teko text-2xl sm:text-3xl font-bold uppercase tracking-wider ${packageInfo.tier_color.replace('border-', 'text-')}`}>{packageInfo.name}</h3>
        <p className="text-2xl sm:text-3xl font-bold font-teko">{formatPrice(packageInfo.price)}</p>
        <p className="text-xs text-gray-400 text-shadow">5 Year Coverage on all products + Lifetime on RustGuard Pro</p>
      </div>

      <div className="flex-grow p-4 pt-0 space-y-2">
        {allFeaturesForDisplay.map((feature) => {
          const isIncluded = packageInfo.features.some(pkgFeature => pkgFeature.id === feature.id);

          return (
            <React.Fragment key={feature.id}>
              {isGold && feature.name.toLowerCase().includes('interior') && (
                  <div className="flex items-center justify-center">
                      <div className="h-px bg-gray-600 flex-grow"></div>
                      <span className="font-bold text-yellow-500 px-2 text-[10px]">OR</span>
                      <div className="h-px bg-gray-600 flex-grow"></div>
                  </div>
              )}
              <div className="flex items-start space-x-2">
                  {isIncluded ? (
                    <CheckIcon className="flex-shrink-0 w-4 h-4 mt-0.5 text-green-400"/>
                  ) : (
                    <DashIcon className="flex-shrink-0 w-4 h-4 mt-0.5 text-gray-500" />
                  )}
                  <div>
                      <button
                        onClick={() => onViewFeature(feature)}
                        className={`font-semibold text-sm text-left hover:text-blue-400 transition-colors text-shadow ${isIncluded ? 'text-gray-200' : 'text-gray-200 opacity-60'}`}
                        aria-label={`Learn more about ${feature.name}`}
                      >
                        {feature.name}
                      </button>
                      <ul className={`list-disc list-inside text-xs mt-0.5 text-shadow ${isIncluded ? 'text-gray-400' : 'text-gray-400 opacity-60'}`}>
                          {feature.points.map(p => <li key={p}>{p}</li>)}
                      </ul>
                  </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="p-4 mt-auto">
        <button
          onClick={onSelect}
          className={`w-full py-2 px-6 rounded-lg text-base font-bold uppercase tracking-wider transition-all duration-300 transform active:scale-95
            ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white'}
          `}
        >
          {isSelected ? 'Selected' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
};