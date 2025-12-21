import React from 'react';
import type { PackageTier, ProductFeature, AlaCarteOption } from '../types';

interface PackageCardProps {
  packageInfo: PackageTier;
  allFeaturesForDisplay: ProductFeature[];
  isSelected: boolean;
  onSelect: () => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
  className?: string;
  style?: React.CSSProperties;
}

const Divider: React.FC<{text: string}> = ({ text }) => (
    <div className="flex items-center justify-center my-4">
        <div className="h-px bg-white/20 flex-grow"></div>
        <span className={`font-bold px-3 text-xs sm:text-sm uppercase tracking-wider ${text === 'OR' ? 'text-yellow-400' : 'text-green-400'}`}>{text}</span>
        <div className="h-px bg-white/20 flex-grow"></div>
    </div>
);


export const PackageCard: React.FC<PackageCardProps> = ({ packageInfo, isSelected, onSelect, onViewFeature, className = '', style }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };
  
  // Use packageInfo.features directly - it's already derived by deriveTierFeatures with correct ladder ordering and OR→AND conversion
  const includedPackageFeatures = packageInfo.features ?? [];

  return (
    <div 
      data-testid="package-card"
      className={`
      bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl shadow-luxury-xl grid grid-rows-[auto_1fr_auto] transition-all duration-500 ease-luxury h-full relative
      ${isSelected ? 'transform scale-105 ring-4 ring-offset-4 ring-offset-gray-900 ring-blue-500 shadow-glow-blue' : 'hover:scale-102 hover:shadow-luxury-2xl'}
      ${packageInfo.is_recommended ? 'border-4 border-blue-500' : `border-2 border-white/10 hover:border-white/20`}
      ${className}
    `}
      style={style}
    >
      {packageInfo.is_recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-luxury-lg uppercase tracking-wider animate-glow-pulse">Most Popular</div>
      )}
      <div className="p-6 lg:p-8 pb-4">
        <h3 className={`font-teko text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wider text-center text-${packageInfo.tier_color} text-shadow-lg`}>{packageInfo.name}</h3>
      </div>

      <div className="p-6 lg:p-8 pt-4">
        {includedPackageFeatures.map((feature, index) => {
          let divider = null;
          // Add a divider before every feature except the first one
          if (index > 0) {
            // Use the connector from the current feature (it indicates how this feature connects to the previous one)
            // Default to 'AND' if not specified
            const connector = feature.connector || 'AND';
            divider = <Divider text={connector} />;
          }

          return (
            <div key={feature.id}>
              {divider}
              <div className="text-center mt-3">
                  <button
                    onClick={() => onViewFeature(feature)}
                    className="min-h-[44px] font-semibold text-lg sm:text-xl hover:text-blue-400 transition-all duration-300 text-shadow text-gray-200 underline decoration-2 underline-offset-4 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    aria-label={`Learn more about ${feature.name}`}
                    data-testid="package-feature"
                  >
                    {feature.name}
                  </button>
                  <ul className="text-sm sm:text-base mt-2 text-shadow text-gray-400 space-y-1">
                      {feature.points.map(p => <li key={p}>*{p}</li>)}
                  </ul>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 lg:p-6 space-y-4">
        <div className={`py-3 lg:py-4 rounded-2xl text-center bg-gradient-to-br from-red-600 to-red-700 shadow-luxury-lg`}>
            <p className="text-4xl sm:text-5xl lg:text-6xl font-bold font-teko text-white text-shadow-lg">{formatPrice(packageInfo.price)}</p>
        </div>
        <button
          onClick={onSelect}
          className={`w-full min-h-[44px] py-3 lg:py-4 px-6 rounded-2xl text-base lg:text-lg font-bold uppercase tracking-wider transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
            ${isSelected ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-luxury-lg ring-2 ring-white/20' : 'bg-white/10 text-gray-300 hover:bg-blue-500 hover:text-white border-2 border-white/20'}
          `}
        >
          {isSelected ? '✓ Selected' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
};