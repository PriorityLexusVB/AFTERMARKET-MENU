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


export const PackageCard: React.FC<PackageCardProps> = ({ packageInfo, allFeaturesForDisplay: _allFeaturesForDisplay, isSelected, onSelect, onViewFeature, className = '', style }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };
  
  // Use packageInfo.features directly - it's already derived by deriveTierFeatures for the tier mapping
  const includedPackageFeatures = packageInfo.features ?? [];

  return (
    <div 
      data-testid="package-card"
      className={`
      lux-card grid grid-rows-[auto_1fr_auto] h-full relative overflow-hidden
      ${isSelected ? 'lux-card-selected' : ''}
      ${packageInfo.is_recommended ? 'lux-card-recommended' : ''}
      ${className}
    `}
      style={style}
    >
      <div className="p-6 lg:p-7 pb-4 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted text-left">Plan</p>
          <h3 className="font-teko text-3xl sm:text-4xl font-bold uppercase tracking-wider text-lux-textStrong">
            {packageInfo.name}
          </h3>
        </div>
        {packageInfo.is_recommended && (
          <span className="lux-chip-gold shadow-glow-gold">Platinum Recommended</span>
        )}
      </div>

      {/* Features section with scroll affordance */}
      <div className="relative">
        <div className="p-6 lg:p-7 pt-2 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
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
                      className="min-h-[44px] font-semibold text-lg sm:text-xl text-lux-textStrong hover:text-lux-blue transition-colors underline decoration-2 decoration-lux-border underline-offset-4 active:scale-98 focus:outline-none focus:ring-2 focus:ring-lux-blue/60 focus:ring-offset-2 focus:ring-offset-lux-bg1"
                      aria-label={`Learn more about ${feature.name}`}
                      data-testid="package-feature"
                    >
                      {feature.name}
                    </button>
                    <ul className="text-sm sm:text-base mt-2 text-lux-textMuted space-y-1">
                        {feature.points.map(p => <li key={p}>*{p}</li>)}
                    </ul>
                </div>
              </div>
            );
          })}
        </div>
        {/* Gradient fade indicator for scrollable content */}
        {includedPackageFeatures.length > 3 && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-lux-bg1 to-transparent pointer-events-none" />
        )}
      </div>
      
      <div className="p-5 lg:p-6 space-y-3">
        <div className="lux-price-plaque">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Investment</p>
            <p className="text-4xl sm:text-5xl font-teko text-lux-textStrong">{formatPrice(packageInfo.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lux-textMuted">Includes listed coverage</p>
          </div>
        </div>
        <button
          onClick={onSelect}
          className={`w-full text-base lg:text-lg font-semibold uppercase tracking-wider transition-all duration-300 transform active:scale-98 focus:outline-none focus:ring-2 focus:ring-lux-blue/70 focus:ring-offset-2 focus:ring-offset-lux-bg1 rounded-xl min-h-[48px]
            ${isSelected ? 'bg-lux-blue text-lux-textStrong shadow-luxury-lg' : 'bg-lux-bg2 text-lux-text border border-lux-border/70 hover:border-lux-gold/60'}
          `}
        >
          {isSelected ? '✓ Selected' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
};
