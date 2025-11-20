import React from 'react';
import type { PackageTier, ProductFeature, AlaCarteOption } from '../types';

interface PackageCardProps {
  packageInfo: PackageTier;
  allFeaturesForDisplay: ProductFeature[];
  isSelected: boolean;
  onSelect: () => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
}

const Divider: React.FC<{text: string}> = ({ text }) => (
    <div className="flex items-center justify-center my-3">
        <div className="h-px bg-gray-600 flex-grow"></div>
        <span className={`font-bold px-2 text-xs uppercase ${text === 'OR' ? 'text-yellow-400' : 'text-green-400'}`}>{text}</span>
        <div className="h-px bg-gray-600 flex-grow"></div>
    </div>
);


export const PackageCard: React.FC<PackageCardProps> = ({ packageInfo, allFeaturesForDisplay, isSelected, onSelect, onViewFeature }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };
  
  // Create a list of only the features included in this package, maintaining the display order
  const includedPackageFeatures = allFeaturesForDisplay.filter(feature => 
    packageInfo.features.some(pkgFeature => pkgFeature.id === feature.id)
  );

  return (
    <div className={`
      bg-gray-800 rounded-xl shadow-2xl grid grid-rows-[auto_1fr_auto] transition-all duration-300 h-full
      ${isSelected ? 'transform scale-105 ring-4 ring-offset-4 ring-offset-gray-900 ring-blue-500' : 'hover:scale-102'}
      ${packageInfo.is_recommended ? 'border-4 border-blue-500' : `border-2 border-${packageInfo.tier_color} border-opacity-70`}
    `}>
      {packageInfo.is_recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">Most Popular</div>
      )}
      <div className="p-6 pb-2">
        <h3 className={`font-teko text-3xl sm:text-4xl font-bold uppercase tracking-wider text-center text-${packageInfo.tier_color}`}>{packageInfo.name}</h3>
      </div>

      <div className="p-6 pt-2">
        {includedPackageFeatures.map((feature, index) => {
          let divider = null;
          // Add a divider before every feature except the first one
          if (index > 0) {
            const isGold = packageInfo.name.toLowerCase() === 'gold';
            // The special "OR" case for the Gold package's third item
            const isInteriorFeatureForGold = feature.name.toLowerCase().includes('interior');
            divider = <Divider text={isGold && isInteriorFeatureForGold ? 'OR' : 'AND'} />;
          }

          return (
            <div key={feature.id}>
              {divider}
              <div className="text-center mt-2">
                  <button
                    onClick={() => onViewFeature(feature)}
                    className="font-semibold text-lg hover:text-blue-400 transition-colors text-shadow text-gray-200 underline"
                    aria-label={`Learn more about ${feature.name}`}
                  >
                    {feature.name}
                  </button>
                  <ul className="text-sm mt-1 text-shadow text-gray-400">
                      {feature.points.map(p => <li key={p}>*{p}</li>)}
                  </ul>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 space-y-3">
        {/* Show retail value if enabled */}
        {packageInfo.showRetailValue && (
          <div className="text-center mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Retail Value</p>
            <p className="text-2xl font-bold font-teko text-gray-400 line-through">
              {formatPrice(packageInfo.features.reduce((sum, f) => sum + (f.salePrice ?? f.price), 0))}
            </p>
          </div>
        )}

        <div className={`py-2 rounded-lg text-center bg-red-700`}>
            {packageInfo.showRetailValue && (
              <p className="text-xs text-gray-200 uppercase tracking-wider mb-1">You Pay</p>
            )}
            {packageInfo.salePrice ? (
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-teko text-gray-300 line-through text-shadow">
                  {formatPrice(packageInfo.price)}
                </p>
                <p className="text-4xl sm:text-5xl font-bold font-teko text-white text-shadow">
                  {formatPrice(packageInfo.salePrice)}
                </p>
                <p className="text-xs text-green-300 font-semibold mt-1">
                  Save {formatPrice(packageInfo.price - packageInfo.salePrice)}!
                </p>
              </div>
            ) : (
              <p className="text-4xl sm:text-5xl font-bold font-teko text-white text-shadow">
                {formatPrice(packageInfo.price)}
              </p>
            )}
        </div>
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