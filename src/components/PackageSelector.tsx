import React, { useEffect, useMemo, useState } from "react";
import type { PackageTier, ProductFeature, AlaCarteOption } from "../types";
import { PackageCard } from "./PackageCard";

interface PackageSelectorProps {
  packages: PackageTier[];
  allFeaturesForDisplay: ProductFeature[];
  selectedPackage: PackageTier | null;
  onSelectPackage: (pkg: PackageTier) => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
  basePackagePricesById?: Record<string, number>;
  addonColumn?: React.ReactNode;
  gridClassName?: string;
  isIpadLandscape?: boolean;
  textSize?: "normal" | "large" | "xl";
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  packages,
  allFeaturesForDisplay,
  selectedPackage,
  onSelectPackage,
  onViewFeature,
  basePackagePricesById,
  addonColumn,
  gridClassName,
  isIpadLandscape = false,
  textSize = "normal",
}) => {
  const storageKey = "aftermarketMenu:addonDrawerOpen";
  const enableMagnify = Boolean(isIpadLandscape);
  const [magnifiedPackageId, setMagnifiedPackageId] = useState<string | null>(null);
  const [isAddonDrawerOpen, setIsAddonDrawerOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return !isIpadLandscape;
    // iPad/kiosk mode should always start with add-ons closed.
    // We intentionally do not persist this state across reloads.
    if (isIpadLandscape) return false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === "1") return true;
      if (raw === "0") return false;
    } catch {
      // Ignore storage failures (private browsing, permissions, etc)
    }
    return !isIpadLandscape;
  });

  useEffect(() => {
    // Customer-facing iPad/kiosk menu should start with add-ons closed.
    if (!addonColumn) return;

    if (isIpadLandscape) {
      setIsAddonDrawerOpen(false);
      return;
    }

    // If the user has already chosen open/closed, respect that.
    let hasStoredPreference = false;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(storageKey);
        hasStoredPreference = raw === "1" || raw === "0";
      } catch {
        hasStoredPreference = false;
      }
    }

    if (!hasStoredPreference) {
      setIsAddonDrawerOpen(!isIpadLandscape);
    }
  }, [addonColumn, isIpadLandscape]);

  useEffect(() => {
    if (!addonColumn) return;
    if (isIpadLandscape) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, isAddonDrawerOpen ? "1" : "0");
    } catch {
      // Ignore storage failures
    }
  }, [addonColumn, isAddonDrawerOpen, isIpadLandscape]);

  const magnifiedPackage = useMemo(() => {
    if (!magnifiedPackageId) return null;
    return packages.find((pkg) => pkg.id === magnifiedPackageId) ?? null;
  }, [magnifiedPackageId, packages]);

  useEffect(() => {
    if (!magnifiedPackage) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMagnifiedPackageId(null);
    };

    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [magnifiedPackage]);

  const baseGrid = isIpadLandscape
    ? addonColumn
      ? "grid grid-cols-4 gap-3 lg:gap-4"
      : "grid grid-cols-3 gap-3 lg:gap-4"
    : addonColumn
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8";
  const gridClasses = gridClassName
    ? `${baseGrid} stagger-children ${gridClassName}`
    : `${baseGrid} stagger-children`;

  if (isIpadLandscape && addonColumn) {
    const outerClasses = gridClassName ? `stagger-children ${gridClassName}` : "stagger-children";
    const packageGridClasses = `grid grid-cols-3 gap-2 lg:gap-3 ${outerClasses}`;

    return (
      <>
        <div className={`flex min-h-0 gap-2 lg:gap-3`} data-testid="package-grid">
        <div className="flex-1 min-w-0 min-h-0">
          <div className={`${packageGridClasses} min-h-0`}>
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                packageInfo={pkg}
                allFeaturesForDisplay={allFeaturesForDisplay}
                basePrice={basePackagePricesById?.[pkg.id]}
                isSelected={selectedPackage?.id === pkg.id}
                onSelect={() => onSelectPackage(pkg)}
                onViewFeature={onViewFeature}
                className="animate-card-entrance"
                isCompact={true}
                textSize={textSize}
                onMagnify={
                  enableMagnify
                    ? () => {
                        setMagnifiedPackageId(pkg.id);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        <aside
          className={`relative min-h-0 transition-[width] duration-300 ease-out ${
            isAddonDrawerOpen ? "w-[320px]" : "w-[44px]"
          }`}
          aria-label="Add-ons"
        >
          {/* Drawer contents */}
          <div
            className={`h-full min-h-0 ${
              isAddonDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none select-none"
            } transition-opacity duration-200`}
          >
            {addonColumn}
          </div>

          {/* Toggle */}
          {isAddonDrawerOpen ? (
            <button
              type="button"
              onClick={() => setIsAddonDrawerOpen(false)}
              className="absolute top-2 right-2 z-10 bg-slate-950/60 hover:bg-slate-950/80 text-white/80 hover:text-white rounded-md px-2 py-1 text-xs uppercase tracking-[0.2em]"
              aria-label="Close add-ons"
              title="Close add-ons"
            >
              Close
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddonDrawerOpen(true)}
              className="absolute inset-0 z-10 bg-gray-800/70 hover:bg-gray-800/85 border border-gray-700 rounded-lg text-gray-200 flex items-center justify-center"
              aria-label="Open add-ons"
              title="Open add-ons"
            >
              <span className="text-xs uppercase tracking-[0.35em] rotate-90">Add-Ons</span>
            </button>
          )}
        </aside>

        </div>

        {magnifiedPackage ? (
          <div
            className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Magnified ${magnifiedPackage.name} package`}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Dismiss magnified package"
              onClick={() => setMagnifiedPackageId(null)}
            />

            <div className="relative z-10 w-full max-w-[980px] max-h-[92vh]">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setMagnifiedPackageId(null)}
                  className="bg-slate-950/70 hover:bg-slate-950/90 text-white/90 rounded-md px-3 py-2 text-xs uppercase tracking-[0.2em]"
                  aria-label="Close magnified package"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[calc(92vh-48px)] overflow-auto rounded-2xl">
                <PackageCard
                  packageInfo={magnifiedPackage}
                  allFeaturesForDisplay={allFeaturesForDisplay}
                  basePrice={basePackagePricesById?.[magnifiedPackage.id]}
                  isSelected={selectedPackage?.id === magnifiedPackage.id}
                  onSelect={() => onSelectPackage(magnifiedPackage)}
                  onViewFeature={onViewFeature}
                  isCompact={false}
                  isMagnified={true}
                  textSize="xl"
                />
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className={`${gridClasses} min-h-0`} data-testid="package-grid">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          packageInfo={pkg}
          allFeaturesForDisplay={allFeaturesForDisplay}
          basePrice={basePackagePricesById?.[pkg.id]}
          isSelected={selectedPackage?.id === pkg.id}
          onSelect={() => onSelectPackage(pkg)}
          onViewFeature={onViewFeature}
          className="animate-card-entrance"
          isCompact={isIpadLandscape}
          textSize={textSize}
        />
      ))}
      {addonColumn}
    </div>
  );
};
