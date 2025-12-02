# Luxury iPad Components Guide

> Production-ready component examples optimized for iPad displays at Priority Lexus

## Table of Contents

1. [Component Overview](#component-overview)
2. [LuxuryPackageCard](#luxurypackagecard)
3. [LuxuryHeader](#luxuryheader)
4. [LuxurySummary](#luxurysummary)
5. [LuxuryFeatureModal](#luxuryfeaturemodal)
6. [LuxuryButton](#luxurybutton)
7. [LuxuryAddonItem](#luxuryaddonitem)
8. [LuxuryPriceDisplay](#luxurypricedisplay)
9. [Animation Utilities](#animation-utilities)
10. [Usage Examples](#usage-examples)

---

## Component Overview

These component examples demonstrate luxury styling patterns for iPad optimization. They can be used as references or directly integrated into the existing codebase.

### Key Principles

- **Touch-first**: All interactive elements are optimized for touch with 44pt minimum targets
- **Visual hierarchy**: Clear distinction between primary and secondary elements
- **Smooth animations**: 60fps animations using GPU-accelerated properties
- **Premium aesthetics**: Glassmorphism, subtle gradients, and refined shadows

---

## LuxuryPackageCard

A premium package card with enhanced visual effects and smooth animations.

### Component Code

```tsx
import React from 'react';
import type { PackageTier, ProductFeature, AlaCarteOption } from '../types';
import { sortFeatures } from '../utils/featureOrdering';

interface LuxuryPackageCardProps {
  packageInfo: PackageTier;
  allFeaturesForDisplay: ProductFeature[];
  isSelected: boolean;
  onSelect: () => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
}

const Divider: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center my-4">
    <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-grow"></div>
    <span className={`
      font-bold px-3 py-1 text-xs uppercase tracking-wider rounded-full
      ${text === 'OR' 
        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}
    `}>
      {text}
    </span>
    <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-grow"></div>
  </div>
);

export const LuxuryPackageCard: React.FC<LuxuryPackageCardProps> = ({
  packageInfo,
  allFeaturesForDisplay,
  isSelected,
  onSelect,
  onViewFeature
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const includedPackageFeatures = sortFeatures(
    allFeaturesForDisplay.filter(feature =>
      packageInfo.features.some(pkgFeature => pkgFeature.id === feature.id)
    )
  );

  const tierColorClasses: Record<string, string> = {
    'amber-400': 'text-amber-400 border-amber-400/50',
    'purple-400': 'text-purple-400 border-purple-400/50',
    'blue-400': 'text-blue-400 border-blue-400/50',
  };

  const tierClass = tierColorClasses[packageInfo.tier_color] || 'text-gray-400 border-gray-400/50';

  return (
    <div
      data-testid="luxury-package-card"
      className={`
        relative
        bg-gradient-to-b from-gray-800/90 to-gray-900/90
        backdrop-blur-xl
        rounded-2xl
        shadow-xl
        grid grid-rows-[auto_1fr_auto]
        transition-all duration-300 ease-out
        h-full
        overflow-hidden
        ${isSelected 
          ? 'scale-105 ring-4 ring-blue-500 ring-offset-4 ring-offset-gray-900 shadow-2xl shadow-blue-500/20' 
          : 'hover:scale-[1.02] hover:shadow-2xl'}
        ${packageInfo.is_recommended 
          ? 'border-2 border-blue-500' 
          : `border border-gray-700/50 ${tierClass.split(' ')[1]}`}
      `}
    >
      {/* Recommended Badge */}
      {packageInfo.is_recommended && (
        <div className="
          absolute -top-1 left-1/2 -translate-x-1/2 z-10
          bg-gradient-to-r from-blue-600 to-blue-500
          text-white px-4 py-1.5
          rounded-full
          text-sm font-bold
          shadow-lg shadow-blue-500/30
          uppercase tracking-wider
          animate-pulse-subtle
        ">
          Most Popular
        </div>
      )}

      {/* Glass Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="p-6 pb-3 pt-8">
        <h3 className={`
          font-teko text-4xl lg:text-5xl font-bold
          uppercase tracking-wider text-center
          ${tierClass.split(' ')[0]}
          text-shadow-luxury
        `}>
          {packageInfo.name}
        </h3>
      </div>

      {/* Features List */}
      <div className="p-6 pt-3 relative z-10">
        {includedPackageFeatures.map((feature, index) => {
          const divider = index > 0 ? <Divider text={feature.connector || 'AND'} /> : null;

          return (
            <div key={feature.id}>
              {divider}
              <div className="text-center mt-3">
                <button
                  onClick={() => onViewFeature(feature)}
                  className="
                    font-semibold text-xl lg:text-2xl
                    text-gray-100
                    hover:text-blue-400
                    transition-colors duration-200
                    underline decoration-dotted underline-offset-4
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                    min-h-[44px] min-w-[44px]
                    px-2 py-1
                  "
                  aria-label={`Learn more about ${feature.name}`}
                  data-testid="package-feature"
                >
                  {feature.name}
                </button>
                <ul className="text-base lg:text-lg mt-2 text-gray-400 space-y-1">
                  {feature.points.map(p => (
                    <li key={p} className="flex items-center justify-center gap-2">
                      <span className="text-blue-400">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price & CTA */}
      <div className="p-5 space-y-4 bg-gradient-to-t from-gray-900/50 to-transparent">
        <div className="
          py-3 px-4 rounded-xl text-center
          bg-gradient-to-r from-red-700 to-red-600
          shadow-lg shadow-red-900/30
        ">
          <p className="
            text-5xl lg:text-6xl font-bold font-teko
            text-white
            text-shadow-luxury
          ">
            {formatPrice(packageInfo.price)}
          </p>
        </div>
        
        <button
          onClick={onSelect}
          className={`
            w-full py-4 px-6
            rounded-xl
            text-lg font-bold uppercase tracking-wider
            transition-all duration-300
            transform active:scale-95
            min-h-[56px]
            ${isSelected
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
              : 'bg-gray-700/80 text-gray-200 hover:bg-blue-600 hover:text-white hover:shadow-lg'}
          `}
        >
          {isSelected ? '✓ Selected' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
};
```

### CSS Classes Required

```css
/* Add to index.luxury-ipad.css */
.text-shadow-luxury {
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
```

---

## LuxuryHeader

A premium header with glassmorphism effect.

### Component Code

```tsx
import React from 'react';
import type { User } from 'firebase/auth';

const SettingsIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 .405c-.008.379.137.752.43.992l1.004.827a1.125 1.125 0 0 1 .26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-.405c.008-.379-.137-.752-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

interface LuxuryHeaderProps {
  user: User | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
}

export const LuxuryHeader: React.FC<LuxuryHeaderProps> = ({
  user: _user,
  onOpenSettings,
  onLogout,
  onToggleAdminView,
  isAdminView
}) => {
  return (
    <header className="
      bg-black/40 backdrop-blur-xl
      py-5 
      border-b border-white/10
      sticky top-0 z-30
      shadow-xl shadow-black/20
    ">
      <div className="container mx-auto px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Logo Section */}
        <div className="text-center sm:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-widest font-teko text-white">
            PRIORITY <span className="text-gray-400">LEXUS</span>
          </h1>
          <p className="text-sm lg:text-base text-gray-400 tracking-[0.3em] uppercase">
            Virginia Beach
          </p>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            onClick={onToggleAdminView}
            className="
              text-base font-semibold
              text-gray-300 hover:text-white
              transition-all duration-200
              bg-white/5 hover:bg-white/10
              backdrop-blur-sm
              px-4 py-2.5
              rounded-xl
              border border-white/10
              min-h-[44px] min-w-[44px]
            "
          >
            {isAdminView ? 'View Menu' : 'Admin Panel'}
          </button>
          
          <button
            onClick={onLogout}
            className="
              text-base font-semibold
              text-gray-400 hover:text-white
              transition-colors duration-200
              min-h-[44px] px-3
            "
          >
            Logout
          </button>
          
          <div className="h-8 w-px bg-white/20"></div>
          
          <p className="
            text-xl text-gray-300 font-light font-teko tracking-[0.2em]
            hidden lg:block
          ">
            PRIORITIES FOR LIFE
          </p>
          
          <button
            onClick={onOpenSettings}
            className="
              text-gray-400 hover:text-white
              hover:rotate-90
              transition-all duration-300
              p-2
              rounded-full
              hover:bg-white/10
              min-h-[44px] min-w-[44px]
              flex items-center justify-center
            "
            aria-label="Open Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
};
```

---

## LuxurySummary

A premium sticky footer with glassmorphism and smooth reveal animation.

### Component Code

```tsx
import React from 'react';
import type { PackageTier, AlaCarteOption } from '../types';

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface LuxurySummaryProps {
  selectedPackage: PackageTier | null;
  customPackageItems: AlaCarteOption[];
  totalPrice: number;
  customerInfo: CustomerInfo;
  onShowAgreement: () => void;
}

export const LuxurySummary: React.FC<LuxurySummaryProps> = ({
  selectedPackage,
  customPackageItems,
  totalPrice,
  customerInfo,
  onShowAgreement
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const hasSelection = selectedPackage || customPackageItems.length > 0;
  const hasCustomerInfo = customerInfo && customerInfo.name;
  const vehicleString = [customerInfo.year, customerInfo.make, customerInfo.model]
    .filter(Boolean)
    .join(' ');

  return (
    <footer className={`
      sticky bottom-0 left-0 right-0
      bg-black/85 backdrop-blur-2xl
      border-t border-white/10
      transition-all duration-500 ease-out
      ${hasSelection ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
    `}>
      <div className="container mx-auto px-6 lg:px-10 py-5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
          
          {/* Customer Info Section */}
          <div className="flex-1 text-center lg:text-left">
            {hasCustomerInfo ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Custom quote prepared for:</p>
                <h4 className="text-2xl font-bold font-teko tracking-wider text-white">
                  {customerInfo.name}
                </h4>
                {vehicleString && (
                  <p className="text-base font-semibold text-blue-300">
                    {vehicleString}
                  </p>
                )}
              </div>
            ) : (
              <h4 className="text-2xl font-bold font-teko tracking-wider text-gray-200">
                Your Custom Quote
              </h4>
            )}

            {/* Selected Items Pills */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center lg:justify-start">
              {selectedPackage && (
                <span className="
                  font-semibold text-white
                  bg-blue-600
                  px-3 py-1.5
                  rounded-full
                  text-sm
                  animate-fade-in-scale
                  shadow-lg shadow-blue-500/20
                ">
                  {selectedPackage.name} Package
                </span>
              )}
              {customPackageItems.map(item => (
                <span
                  key={item.id}
                  className="
                    bg-gray-700/80
                    px-3 py-1.5
                    rounded-full
                    text-sm text-gray-200
                    animate-fade-in-scale
                  "
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>

          {/* Price & CTA Section */}
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="text-center lg:text-right">
              <p className="text-gray-300 text-sm font-teko tracking-wider uppercase">
                Total Purchase Price
              </p>
              <p className="
                text-4xl lg:text-5xl xl:text-6xl
                font-bold font-teko
                text-white
                text-shadow-luxury
              ">
                {formatPrice(totalPrice)}
              </p>
            </div>
            
            <button
              onClick={onShowAgreement}
              className="
                bg-gradient-to-r from-green-600 to-emerald-600
                text-white
                px-6 py-4 lg:px-8 lg:py-5
                rounded-xl
                font-bold uppercase tracking-wider
                text-lg
                hover:from-green-500 hover:to-emerald-500
                transition-all duration-300
                transform active:scale-95
                flex items-center gap-3
                min-h-[56px]
                shadow-lg shadow-green-900/30
              "
              aria-label="Finalize and Print"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span className="hidden sm:inline">Finalize Agreement</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
```

---

## LuxuryFeatureModal

A premium full-screen modal optimized for iPad viewing.

### Component Code

```tsx
import React, { useEffect } from 'react';
import type { ProductFeature, AlaCarteOption } from '../types';

interface LuxuryFeatureModalProps {
  feature: ProductFeature | AlaCarteOption;
  onClose: () => void;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-6 h-6 ${className}`}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
  </svg>
);

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-6 h-6 ${className}`}>
    <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.75.75h2.5a.75.75 0 00.75-.75v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
  </svg>
);

export const LuxuryFeatureModal: React.FC<LuxuryFeatureModalProps> = ({ feature, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="
        fixed inset-0
        bg-black/80 backdrop-blur-md
        z-50
        flex justify-center items-center
        p-6
        animate-fade-in
      "
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-modal-title"
    >
      <div
        className="
          bg-gradient-to-b from-gray-800 to-gray-900
          rounded-3xl
          shadow-2xl
          w-full max-w-3xl
          border border-white/10
          animate-slide-up
          max-h-[85vh]
          overflow-hidden
          flex flex-col
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="
          p-6 lg:p-8
          border-b border-white/10
          flex justify-between items-start
          bg-gradient-to-r from-gray-800/50 to-gray-700/50
        ">
          <div className="flex-1">
            <h2
              id="feature-modal-title"
              className="text-4xl lg:text-5xl font-bold font-teko text-white tracking-wider"
            >
              {feature.name}
            </h2>
            <p className="text-gray-300 mt-2 text-lg">{feature.description}</p>
            {'warranty' in feature && feature.warranty && (
              <p className="
                mt-3
                text-base font-bold
                bg-amber-400/15 text-amber-300
                px-3 py-1.5
                rounded-lg
                inline-block
                border border-amber-400/20
              ">
                {feature.warranty}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="
              text-gray-400 hover:text-white
              transition-colors duration-200
              p-2
              rounded-full
              hover:bg-white/10
              min-h-[44px] min-w-[44px]
              flex items-center justify-center
              ml-4
            "
            aria-label="Close feature details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 lg:p-8 space-y-8 overflow-y-auto flex-1">
          {/* Key Features */}
          {feature.points && feature.points.length > 0 && (
            <div>
              <h3 className="
                text-2xl font-bold font-teko tracking-wider
                text-blue-400 mb-4
              ">
                Key Features
              </h3>
              <ul className="space-y-3">
                {feature.points.map((point, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <CheckIcon className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200 text-lg">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use Cases */}
          {feature.useCases && feature.useCases.length > 0 && (
            <div>
              <h3 className="
                text-2xl font-bold font-teko tracking-wider
                text-amber-400 mb-4
              ">
                Real-World Scenarios
              </h3>
              <ul className="space-y-3">
                {feature.useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <LightbulbIcon className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200 text-lg">{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## LuxuryButton

A reusable button component with multiple variants.

### Component Code

```tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface LuxuryButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-blue-600 text-white
    hover:bg-blue-500
    shadow-lg shadow-blue-600/20
    focus:ring-blue-500
  `,
  secondary: `
    bg-gray-700/80 text-gray-200
    hover:bg-gray-600 hover:text-white
    focus:ring-gray-500
  `,
  success: `
    bg-gradient-to-r from-green-600 to-emerald-600 text-white
    hover:from-green-500 hover:to-emerald-500
    shadow-lg shadow-green-600/20
    focus:ring-green-500
  `,
  ghost: `
    bg-transparent text-gray-300
    hover:bg-white/10 hover:text-white
    focus:ring-gray-500
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-4 py-3 text-base min-h-[44px]',
  lg: 'px-6 py-4 text-lg min-h-[56px]',
};

export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl
        font-semibold uppercase tracking-wider
        transition-all duration-200
        transform active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
```

---

## LuxuryAddonItem

A premium addon/a la carte item card with drag support.

### Component Code

```tsx
import React from 'react';
import type { AlaCarteOption } from '../types';

interface LuxuryAddonItemProps {
  item: AlaCarteOption;
  onViewItem: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export const LuxuryAddonItem: React.FC<LuxuryAddonItemProps> = ({
  item,
  onViewItem,
  onDragStart
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="
        bg-gradient-to-br from-gray-800/90 to-gray-900/90
        backdrop-blur-lg
        border border-gray-700/50
        rounded-2xl
        p-6
        flex flex-col
        relative
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:scale-[1.02]
        hover:shadow-xl hover:shadow-blue-500/10
        hover:border-blue-500/30
      "
    >
      {/* New Badge */}
      {item.isNew && (
        <div className="
          absolute -top-2 -right-2
          bg-red-500 text-white
          text-xs font-bold uppercase
          px-3 py-1
          rounded-full
          shadow-lg
          animate-pulse-subtle
        ">
          New
        </div>
      )}

      {/* Content */}
      <div className="flex-grow">
        <button
          onClick={onViewItem}
          className="
            text-2xl font-bold font-teko tracking-wider
            text-left text-gray-100
            hover:text-blue-400
            transition-colors duration-200
            w-full
            min-h-[44px]
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
            rounded
          "
          aria-label={`Learn more about ${item.name}`}
        >
          {item.name}
        </button>
        
        {item.warranty && (
          <p className="text-sm font-bold text-amber-400 mt-1">
            {item.warranty}
          </p>
        )}
        
        <p className="text-4xl font-bold text-gray-100 font-teko mt-2">
          {formatPrice(item.price)}
        </p>
        
        <p className="text-base text-gray-400 mt-3 leading-relaxed">
          {item.description}
        </p>
        
        {item.points.length > 0 && (
          <ul className="text-base text-gray-300 space-y-1.5 mt-4 list-disc list-inside">
            {item.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Drag Indicator */}
      <div className="
        mt-6 pt-4
        border-t border-gray-700/50
        text-center
        text-sm text-gray-500 font-semibold uppercase tracking-wider
        flex items-center justify-center gap-2
      ">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>
        Drag to Add
      </div>
    </div>
  );
};
```

---

## LuxuryPriceDisplay

A premium price display component with formatting and optional styling.

### Component Code

```tsx
import React from 'react';

interface LuxuryPriceDisplayProps {
  price: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'highlight' | 'muted';
  showDecimals?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

const variantClasses = {
  default: 'text-white',
  highlight: 'text-green-400',
  muted: 'text-gray-400',
};

export const LuxuryPriceDisplay: React.FC<LuxuryPriceDisplayProps> = ({
  price,
  size = 'md',
  variant = 'default',
  showDecimals = false,
  className = '',
}) => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(price);

  return (
    <span
      className={`
        font-bold font-teko
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {formattedPrice}
    </span>
  );
};
```

---

## Animation Utilities

### Utility Component for Animated Containers

```tsx
import React from 'react';

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'scale-in' | 'fade-in-scale';
  delay?: number;
  className?: string;
}

const animationClasses = {
  'fade-in': 'animate-fade-in',
  'slide-up': 'animate-slide-up',
  'scale-in': 'animate-scale-in',
  'fade-in-scale': 'animate-fade-in-scale',
};

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fade-in',
  delay = 0,
  className = '',
}) => {
  return (
    <div
      className={`${animationClasses[animation]} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
```

---

## Usage Examples

### Example 1: Using LuxuryPackageCard

```tsx
import { LuxuryPackageCard } from './components/LuxuryPackageCard';

// In your component
<LuxuryPackageCard
  packageInfo={package}
  allFeaturesForDisplay={features}
  isSelected={selectedPackage?.id === package.id}
  onSelect={() => handleSelectPackage(package)}
  onViewFeature={handleViewFeature}
/>
```

### Example 2: Using LuxuryButton

```tsx
import { LuxuryButton } from './components/LuxuryButton';

// Primary button
<LuxuryButton variant="primary" size="lg" onClick={handleSubmit}>
  Submit Order
</LuxuryButton>

// Success button with icon
<LuxuryButton 
  variant="success" 
  size="lg"
  icon={<CheckIcon />}
  onClick={handleFinalize}
>
  Finalize Agreement
</LuxuryButton>
```

### Example 3: Staggered Animation

```tsx
import { AnimatedContainer } from './components/AnimatedContainer';

// Staggered fade-in animation for a list
{items.map((item, index) => (
  <AnimatedContainer
    key={item.id}
    animation="fade-in-scale"
    delay={index * 100}
  >
    <ItemCard item={item} />
  </AnimatedContainer>
))}
```

---

## Integration with Existing Components

### Gradual Migration Strategy

1. **Keep existing components working** - Don't break the current implementation
2. **Create luxury variants** - New components with `Luxury` prefix
3. **Use feature flags** - Toggle between standard and luxury modes
4. **Test on iPad devices** - Verify touch interactions and performance
5. **Migrate incrementally** - Replace components one at a time

### Feature Flag Example

```tsx
// In your App.tsx or context
const useLuxuryMode = true; // Or from environment/config

// Conditional component rendering
{useLuxuryMode ? (
  <LuxuryPackageCard {...props} />
) : (
  <PackageCard {...props} />
)}
```

---

## Related Files

- [`LUXURY_IPAD_OPTIMIZATION.md`](./LUXURY_IPAD_OPTIMIZATION.md) - Comprehensive optimization guide
- [`tailwind.config.luxury-ipad.js`](./tailwind.config.luxury-ipad.js) - Enhanced Tailwind configuration
- [`src/index.luxury-ipad.css`](./src/index.luxury-ipad.css) - Luxury stylesheet with animations

---

*Last Updated: 2024*
*Version: 1.0.0*
