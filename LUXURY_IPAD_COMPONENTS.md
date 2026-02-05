# Luxury iPad Optimized Components

## Code Examples for Implementation

This document provides complete, production-ready component code optimized for luxury iPad experience.

---

## Table of Contents

1. [Header Component](#header-component)
2. [Package Card Component](#package-card-component)
3. [Navigation Buttons](#navigation-buttons)
4. [Summary Footer Component](#summary-footer-component)
5. [Feature Modal Component](#feature-modal-component)
6. [Loading Spinner Component](#loading-spinner-component)
7. [Button Components](#button-components)

---

## Header Component

**File:** `src/components/Header.luxury-ipad.tsx`

```tsx
import React from "react";
import { User } from "firebase/auth";

const SettingsIcon: React.FC<{ className?: string }> = ({
  className = "w-7 h-7",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.905c-.008.379.137.752.43.992l1.004.827a1.125 1.125 0 0 1 .26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.905c.008-.379-.137-.752-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

interface HeaderProps {
  user: User | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user: _user,
  onOpenSettings,
  onLogout,
  onToggleAdminView,
  isAdminView,
}) => {
  return (
    <header
      className="
      bg-luxury-black/90 backdrop-blur-xl
      py-6 ipad-p:py-8
      border-b border-white/10
      sticky top-0 z-header
      shadow-luxury-xl
    "
    >
      <div className="container-ipad flex flex-col ipad-p:flex-row justify-between items-center gap-6">
        {/* Logo Section - Larger, more prominent */}
        <div className="text-center ipad-p:text-left">
          <h1
            className="
            text-4xl ipad-p:text-5xl ipad-l:text-6xl
            font-bold tracking-luxury-widest font-display text-white
            text-shadow-lg
          "
          >
            PRIORITY <span className="text-luxury-silver/70">LEXUS</span>
          </h1>
          <p
            className="
            text-sm ipad-p:text-base
            text-luxury-silver/60 tracking-luxury-widest mt-1
          "
          >
            VIRGINIA BEACH
          </p>
        </div>

        {/* Actions Section - Larger touch targets */}
        <div className="flex items-center gap-4 ipad-p:gap-6">
          {/* Admin Panel Toggle */}
          <button
            onClick={onToggleAdminView}
            className="
              min-h-touch px-6 py-3
              text-base ipad-p:text-lg font-semibold
              text-luxury-silver hover:text-white
              transition-all duration-300
              bg-white/5 hover:bg-white/10
              rounded-luxury-xl border border-white/10
              active:scale-95
              focus-visible-luxury
            "
            aria-label={isAdminView ? "View Menu" : "Open Admin Panel"}
          >
            {isAdminView ? "View Menu" : "Admin Panel"}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="
              min-h-touch px-6 py-3
              text-base ipad-p:text-lg font-semibold
              text-luxury-silver hover:text-white
              transition-all duration-300
              active:scale-95
              focus-visible-luxury
            "
            aria-label="Logout"
          >
            Logout
          </button>

          {/* Divider - Hidden on small screens */}
          <div className="h-12 w-px bg-white/20 hidden ipad-p:block"></div>

          {/* Tagline - Hidden on smaller iPads */}
          <p
            className="
            text-xl ipad-l:text-2xl
            text-luxury-silver/80 font-light
            tracking-luxury-wider
            hidden ipad-l:block
          "
          >
            PRIORITIES FOR LIFE
          </p>

          {/* Settings Icon - Larger touch target */}
          <button
            onClick={onOpenSettings}
            className="
              min-w-touch min-h-touch
              flex items-center justify-center
              text-luxury-silver/70 hover:text-white
              hover:rotate-90
              transition-all duration-500 ease-luxury
              bg-white/5 hover:bg-white/10
              rounded-luxury-xl
              active:scale-95
              focus-visible-luxury
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

## Package Card Component

**File:** `src/components/PackageCard.luxury-ipad.tsx`

```tsx
import React from "react";
import type { PackageTier, ProductFeature, AlaCarteOption } from "../types";
import { sortFeatures } from "../utils/featureOrdering";

interface PackageCardProps {
  packageInfo: PackageTier;
  allFeaturesForDisplay: ProductFeature[];
  isSelected: boolean;
  onSelect: () => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
}

const Divider: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center my-4">
    <div className="h-px bg-white/20 flex-grow"></div>
    <span
      className={`
      font-bold px-4
      text-xs ipad-p:text-sm
      uppercase tracking-luxury-widest
      ${text === "OR" ? "text-yellow-400" : "text-green-400"}
    `}
    >
      {text}
    </span>
    <div className="h-px bg-white/20 flex-grow"></div>
  </div>
);

export const PackageCard: React.FC<PackageCardProps> = ({
  packageInfo,
  allFeaturesForDisplay,
  isSelected,
  onSelect,
  onViewFeature,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const includedPackageFeatures = sortFeatures(
    allFeaturesForDisplay.filter((feature) =>
      packageInfo.features.some((pkgFeature) => pkgFeature.id === feature.id)
    )
  );

  return (
    <div
      data-testid="package-card"
      className={`
        luxury-bg-card rounded-luxury-2xl shadow-luxury-2xl
        grid grid-rows-[auto_1fr_auto]
        transition-all duration-600 ease-luxury
        h-full
        border-2
        ${
          isSelected
            ? "scale-105 ring-4 ring-offset-4 ring-offset-luxury-black ring-lexus-blue-500 border-lexus-blue-500"
            : "border-white/10 hover:border-white/20 hover:shadow-luxury-xl"
        }
        ${packageInfo.is_recommended ? "ring-2 ring-lexus-blue-400/50" : ""}
      `}
    >
      {/* Recommended Badge - Larger, more elegant */}
      {packageInfo.is_recommended && (
        <div
          className="
          absolute -top-4 left-1/2 -translate-x-1/2
          bg-gradient-to-r from-lexus-blue-600 to-lexus-blue-500
          text-white px-6 py-2 rounded-full
          text-sm ipad-p:text-base font-bold shadow-luxury-lg
          uppercase tracking-luxury-widest
        "
        >
          Most Popular
        </div>
      )}

      {/* Header - More spacious */}
      <div className="p-6 ipad-p:p-8 pb-4">
        <h3
          className={`
          font-display
          text-4xl ipad-p:text-5xl ipad-l:text-6xl
          font-bold uppercase tracking-wider text-center
          text-${packageInfo.tier_color}
          text-shadow-lg
        `}
        >
          {packageInfo.name}
        </h3>
      </div>

      {/* Features Section - Better readability */}
      <div className="px-6 ipad-p:px-8 py-4 space-y-6">
        {includedPackageFeatures.map((feature, index) => {
          let divider = null;
          if (index > 0) {
            const connector = feature.connector || "AND";
            divider = <Divider text={connector} />;
          }

          return (
            <div key={feature.id}>
              {divider}
              <div className="text-center">
                {/* Feature Name - Larger touch target */}
                <button
                  onClick={() => onViewFeature(feature)}
                  className="
                    min-h-touch w-full
                    font-semibold
                    text-xl ipad-p:text-2xl
                    text-luxury-silver hover:text-lexus-blue-400
                    transition-colors duration-300
                    underline decoration-2 underline-offset-4
                    active:scale-95
                    focus-visible-luxury
                  "
                  aria-label={`Learn more about ${feature.name}`}
                  data-testid="package-feature"
                >
                  {feature.name}
                </button>

                {/* Feature Points - Better spacing */}
                <ul
                  className="
                  text-base ipad-p:text-lg
                  mt-3
                  text-luxury-silver/80
                  space-y-1
                  leading-relaxed
                "
                >
                  {feature.points.map((p) => (
                    <li key={p}>*{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - Prominent pricing and CTA */}
      <div className="p-6 ipad-p:p-8 space-y-4">
        {/* Price Display - Much larger */}
        <div
          className="
          py-4 ipad-p:py-6
          rounded-luxury-2xl text-center
          bg-gradient-to-br from-luxury-red-600 to-luxury-red-500
          shadow-luxury-xl
        "
        >
          <p
            className="
            text-5xl ipad-p:text-6xl ipad-l:text-7xl
            font-bold font-display text-white
            text-shadow-lg
          "
          >
            {formatPrice(packageInfo.price)}
          </p>
        </div>

        {/* Select Button - Larger touch target */}
        <button
          onClick={onSelect}
          className={`
            w-full min-h-touch
            py-4 ipad-p:py-5 px-8
            rounded-luxury-2xl
            text-lg ipad-p:text-xl
            font-bold uppercase tracking-wider
            transition-all duration-300 ease-luxury
            active:scale-95
            focus-visible-luxury
            ${
              isSelected
                ? "bg-gradient-to-r from-lexus-blue-600 to-lexus-blue-500 text-white shadow-luxury-xl ring-2 ring-white/20"
                : "bg-white/10 text-luxury-silver hover:bg-lexus-blue-500 hover:text-white border-2 border-white/20"
            }
          `}
          aria-label={isSelected ? "Package selected" : "Select package"}
        >
          {isSelected ? " Selected" : "Select Plan"}
        </button>
      </div>
    </div>
  );
};
```

---

## Navigation Buttons

**File:** `src/App.tsx` (excerpt)

```tsx
// Enhanced navigation button component for iPad
const NavButton: React.FC<{ page: Page; label: string }> = ({
  page,
  label,
}) => (
  <button
    onClick={() => setCurrentPage(page)}
    className={`
      w-full ipad-p:w-auto
      min-h-touch
      px-10 ipad-p:px-12
      py-4 ipad-p:py-5
      rounded-luxury-2xl
      text-xl ipad-p:text-2xl
      font-display tracking-wider
      transition-all duration-300 ease-luxury
      active:scale-95
      focus-visible-luxury
      ${
        currentPage === page
          ? "bg-gradient-to-r from-lexus-blue-600 to-lexus-blue-500 text-white shadow-luxury-xl ring-2 ring-white/20"
          : "bg-white/5 text-luxury-silver hover:bg-white/10 hover:text-white border-2 border-white/10"
      }
    `}
    aria-label={`Navigate to ${label}`}
    aria-current={currentPage === page ? "page" : undefined}
  >
    {label}
  </button>
);

// Usage in render
<div className="flex flex-col ipad-p:flex-row justify-center items-center gap-4 ipad-p:gap-6 mb-6 ipad-p:mb-8">
  <NavButton page="packages" label="Protection Packages" />
  <NavButton page="alacarte" label="A La Carte Options" />
</div>;
```

---

## Summary Footer Component

**File:** `src/components/Summary.luxury-ipad.tsx`

```tsx
import React from "react";
import type { PackageTier, AlaCarteOption } from "../types";

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface SummaryProps {
  selectedPackage: PackageTier | null;
  customPackageItems: AlaCarteOption[];
  totalPrice: number;
  customerInfo: CustomerInfo;
  onShowAgreement: () => void;
}

const CheckmarkIcon: React.FC<{ className?: string }> = ({
  className = "w-7 h-7",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 12.75 6 6 9-13.5"
    />
  </svg>
);

export const Summary: React.FC<SummaryProps> = ({
  selectedPackage,
  customPackageItems,
  totalPrice,
  customerInfo,
  onShowAgreement,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const hasSelection = selectedPackage || customPackageItems.length > 0;
  const hasCustomerInfo = customerInfo && customerInfo.name;
  const vehicleString = [
    customerInfo.year,
    customerInfo.make,
    customerInfo.model,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer
      className={`
      sticky bottom-0 left-0 right-0
      bg-luxury-black/95 backdrop-blur-2xl
      border-t border-white/10
      transition-transform duration-500 ease-luxury
      shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
      ${hasSelection ? "translate-y-0" : "translate-y-full"}
    `}
    >
      <div className="container-ipad py-6 ipad-p:py-8">
        <div
          className="
          flex flex-col ipad-l:flex-row
          items-center justify-between
          gap-6 ipad-p:gap-8
        "
        >
          {/* Customer Info Section */}
          <div className="flex-1 text-center ipad-l:text-left">
            {hasCustomerInfo ? (
              <>
                <p
                  className="
                  text-base ipad-p:text-lg
                  text-luxury-silver/70 tracking-wide
                "
                >
                  Custom quote prepared for:
                </p>
                <h4
                  className="
                  text-2xl ipad-p:text-3xl ipad-l:text-4xl
                  font-bold font-display tracking-wider
                  text-white mt-1
                  text-shadow-lg
                "
                >
                  {customerInfo.name}
                </h4>
                {vehicleString && (
                  <p
                    className="
                    text-lg ipad-p:text-xl
                    font-semibold text-lexus-blue-400 mt-2
                  "
                  >
                    {vehicleString}
                  </p>
                )}
              </>
            ) : (
              <h4
                className="
                text-2xl ipad-p:text-3xl
                font-bold font-display tracking-wider
                text-luxury-silver
                text-shadow
              "
              >
                Your Custom Quote
              </h4>
            )}

            {/* Selected Items Chips */}
            <div
              className="
              flex flex-wrap
              gap-3 ipad-p:gap-4
              text-base ipad-p:text-lg
              mt-4
              justify-center ipad-l:justify-start
            "
            >
              {selectedPackage && (
                <span
                  className="
                  font-semibold text-white
                  bg-gradient-to-r from-lexus-blue-600 to-lexus-blue-500
                  px-4 py-2 ipad-p:px-5 ipad-p:py-3
                  rounded-luxury-xl shadow-luxury-lg
                  animate-summary-item-in
                "
                >
                  {selectedPackage.name} Package
                </span>
              )}
              {customPackageItems.map((item) => (
                <span
                  key={item.id}
                  className="
                    bg-white/10 text-luxury-silver
                    px-4 py-2 ipad-p:px-5 ipad-p:py-3
                    rounded-luxury-xl border border-white/20
                    animate-summary-item-in
                  "
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>

          {/* Price & CTA Section */}
          <div className="flex items-center gap-6 ipad-p:gap-8">
            {/* Total Price Display */}
            <div className="text-center ipad-l:text-right">
              <p
                className="
                text-base ipad-p:text-lg
                text-luxury-silver/70
                font-display tracking-luxury-widest uppercase
              "
              >
                Total Purchase Price
              </p>
              <p
                className="
                text-5xl ipad-p:text-6xl ipad-l:text-7xl
                font-bold font-display text-white mt-1
                text-shadow-lg
              "
              >
                {formatPrice(totalPrice)}
              </p>
            </div>

            {/* Finalize Button */}
            <button
              onClick={onShowAgreement}
              className="
                bg-gradient-to-r from-luxury-green-600 to-luxury-green-500
                text-white
                min-w-touch min-h-touch
                px-8 py-5 ipad-p:px-10 ipad-p:py-6
                rounded-luxury-2xl
                font-bold uppercase tracking-wider
                text-lg ipad-p:text-xl
                hover:from-luxury-green-500 hover:to-luxury-green-600
                transition-all duration-300 ease-luxury
                active:scale-95
                shadow-luxury-xl
                flex items-center gap-3
                focus-visible-luxury
              "
              aria-label="Finalize and print agreement"
            >
              <CheckmarkIcon className="w-7 h-7 ipad-p:w-8 ipad-p:h-8" />
              <span className="hidden ipad-p:inline">Finalize Agreement</span>
              <span className="ipad-p:hidden">Finalize</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
```

---

## Feature Modal Component

**File:** `src/components/FeatureModal.luxury-ipad.tsx`

```tsx
import React, { useEffect } from "react";
import type { ProductFeature, AlaCarteOption } from "../types";

interface FeatureModalProps {
  feature: ProductFeature | AlaCarteOption;
  onClose: () => void;
}

const CheckIcon: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
      clipRule="evenodd"
    />
  </svg>
);

const LightbulbIcon: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({
  className = "h-8 w-8",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const FeatureModal: React.FC<FeatureModalProps> = ({
  feature,
  onClose,
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      className="
        fixed inset-0
        bg-black/80 backdrop-blur-sm
        z-modal
        flex justify-center items-center
        p-6 ipad-p:p-8
        animate-modal-backdrop
      "
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-modal-title"
    >
      <div
        className="
          luxury-bg-glass-dark
          rounded-luxury-2xl shadow-luxury-2xl
          w-full max-w-3xl ipad-l:max-w-4xl
          border-2 border-white/10
          animate-modal-content
          max-h-[85vh] overflow-y-auto
          scrollbar-luxury
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="
          p-8 ipad-p:p-10 ipad-l:p-12
          border-b border-white/10
          flex justify-between items-start gap-6
        "
        >
          <div className="flex-1">
            <h2
              id="feature-modal-title"
              className="
                text-4xl ipad-p:text-5xl ipad-l:text-6xl
                font-bold font-display text-white tracking-wider
                text-shadow-lg
              "
            >
              {feature.name}
            </h2>
            <p
              className="
              text-lg ipad-p:text-xl
              text-luxury-silver/80 mt-4
              leading-luxury-relaxed
            "
            >
              {feature.description}
            </p>
            {"warranty" in feature && feature.warranty && (
              <p
                className="
                mt-4
                text-base ipad-p:text-lg font-bold
                bg-yellow-400/10 text-yellow-300
                px-4 py-3
                rounded-luxury-xl
                inline-block
                border border-yellow-400/30
              "
              >
                {feature.warranty}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="
              min-w-touch min-h-touch
              flex items-center justify-center
              text-luxury-silver/70 hover:text-white
              transition-all duration-300
              bg-white/5 hover:bg-white/10
              rounded-luxury-xl
              active:scale-95
              focus-visible-luxury
            "
            aria-label="Close feature details"
          >
            <CloseIcon className="h-8 w-8 ipad-p:h-9 ipad-p:w-9" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 ipad-p:p-10 ipad-l:p-12 space-y-10">
          {/* Key Features */}
          {feature.points && feature.points.length > 0 && (
            <div>
              <h3
                className="
                text-2xl ipad-p:text-3xl
                font-bold font-display tracking-wider
                text-lexus-blue-400 mb-6
              "
              >
                Key Features
              </h3>
              <ul className="space-y-4">
                {feature.points.map((point, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <CheckIcon
                      className="
                      text-green-400
                      w-6 h-6 ipad-p:w-7 ipad-p:h-7
                      flex-shrink-0 mt-1
                    "
                    />
                    <span
                      className="
                      text-lg ipad-p:text-xl
                      text-luxury-silver
                      leading-luxury-relaxed
                    "
                    >
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use Cases */}
          {feature.useCases && feature.useCases.length > 0 && (
            <div>
              <h3
                className="
                text-2xl ipad-p:text-3xl
                font-bold font-display tracking-wider
                text-yellow-400 mb-6
              "
              >
                Real-World Scenarios
              </h3>
              <ul className="space-y-4">
                {feature.useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <LightbulbIcon
                      className="
                      text-yellow-400
                      w-6 h-6 ipad-p:w-7 ipad-p:h-7
                      flex-shrink-0 mt-1
                    "
                    />
                    <span
                      className="
                      text-lg ipad-p:text-xl
                      text-luxury-silver
                      leading-luxury-relaxed
                    "
                    >
                      {useCase}
                    </span>
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

## Loading Spinner Component

**File:** `src/components/LoadingSpinner.luxury-ipad.tsx`

```tsx
import React from "react";

export const LoadingSpinner: React.FC = () => (
  <div className="flex-grow flex items-center justify-center">
    <div className="flex flex-col items-center gap-6 ipad-p:gap-8">
      {/* Spinner */}
      <svg
        className="animate-spin h-16 w-16 ipad-p:h-20 ipad-p:w-20 text-lexus-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      {/* Loading Text */}
      <p
        className="
        text-2xl ipad-p:text-3xl
        font-display tracking-wider
        text-luxury-silver
        text-shadow
      "
      >
        Loading Protection Plans...
      </p>
    </div>
  </div>
);
```

---

## Button Components

**File:** `src/components/Buttons.luxury-ipad.tsx`

```tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const LuxuryButton: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const baseClasses = `
    font-bold uppercase tracking-wider
    rounded-luxury-2xl
    transition-all duration-300 ease-luxury
    active:scale-95
    focus-visible-luxury
    flex items-center justify-center gap-3
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-lexus-blue-600 to-lexus-blue-500
      text-white shadow-luxury-lg
      hover:from-lexus-blue-500 hover:to-lexus-blue-600
    `,
    secondary: `
      bg-white/10 text-luxury-silver
      border-2 border-white/20
      hover:bg-white/20 hover:border-white/30
    `,
    success: `
      bg-gradient-to-r from-luxury-green-600 to-luxury-green-500
      text-white shadow-luxury-lg
      hover:from-luxury-green-500 hover:to-luxury-green-600
    `,
    ghost: `
      bg-transparent text-luxury-silver
      hover:bg-white/5
    `,
  };

  const sizeClasses = {
    sm: "min-h-touch px-6 py-3 text-base ipad-p:text-lg",
    md: "min-h-touch px-8 py-4 text-lg ipad-p:text-xl",
    lg: "min-h-touch-lg px-10 py-5 text-xl ipad-p:text-2xl",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// Icon Button Component
interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

export const LuxuryIconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`
        min-w-touch min-h-touch
        flex items-center justify-center
        text-luxury-silver/70 hover:text-white
        transition-all duration-300
        bg-white/5 hover:bg-white/10
        rounded-luxury-xl
        active:scale-95
        focus-visible-luxury
        ${className}
      `}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
};
```

---

## Implementation Notes

### 1. File Structure

Create these files in your project:

```
src/
 components/
    Header.luxury-ipad.tsx (copy from above)
    PackageCard.luxury-ipad.tsx (copy from above)
    Summary.luxury-ipad.tsx (copy from above)
    FeatureModal.luxury-ipad.tsx (copy from above)
    LoadingSpinner.luxury-ipad.tsx (copy from above)
    Buttons.luxury-ipad.tsx (copy from above)
 index.luxury-ipad.css (created earlier)
 ...
```

### 2. Gradual Migration Strategy

**Phase 1:** Test one component

- Start with `Header.luxury-ipad.tsx`
- Import and use alongside existing Header
- Compare on physical iPad
- Iterate based on feedback

**Phase 2:** Roll out incrementally

- Replace components one at a time
- Test each thoroughly
- Monitor performance
- Gather user feedback

**Phase 3:** Full migration

- Replace all components
- Update tailwind.config.js
- Update index.css
- Final testing and polish

### 3. Testing Checklist

For each component:

- [ ] Test on iPad 10.2" (portrait & landscape)
- [ ] Test on iPad Pro 12.9" (portrait & landscape)
- [ ] Verify touch targets (minimum 44px)
- [ ] Check text readability
- [ ] Test animations (smooth 60fps)
- [ ] Verify color contrast
- [ ] Test with VoiceOver (accessibility)
- [ ] Check loading states
- [ ] Test error states

### 4. Performance Optimization

```tsx
// Use React.memo for expensive components
export const PackageCard = React.memo<PackageCardProps>(({ ... }) => {
  // Component code
});

// Use useCallback for event handlers
const handleSelect = useCallback(() => {
  // Handler code
}, [dependencies]);

// Lazy load modals
const FeatureModal = lazy(() => import('./components/FeatureModal.luxury-ipad'));
```

### 5. CSS Custom Properties

Add to your CSS for easy theming:

```css
:root {
  --color-brand-primary: #0066ff;
  --color-brand-secondary: #00b67a;
  --spacing-touch-min: 44px;
  --font-size-ipad-base: 1.125rem;
  --transition-luxury: 600ms cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

---

## Quick Reference

### Common Class Combinations

```tsx
// Primary CTA Button
className="
  bg-gradient-to-r from-lexus-blue-600 to-lexus-blue-500
  text-white font-bold uppercase tracking-wider
  min-h-touch px-8 py-4
  rounded-luxury-2xl shadow-luxury-lg
  active:scale-95 transition-all duration-300
"

// Card Container
className="
  luxury-bg-card rounded-luxury-2xl
  border-2 border-white/10
  p-8 ipad-p:p-10
  shadow-luxury-xl
"

// Section Heading
className="
  text-4xl ipad-p:text-5xl ipad-l:text-6xl
  font-bold font-display tracking-wider
  text-white text-shadow-lg
"

// Body Text
className="
  text-lg ipad-p:text-xl
  text-luxury-silver leading-luxury-relaxed
"
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-02
**Companion to:** LUXURY_IPAD_OPTIMIZATION.md
