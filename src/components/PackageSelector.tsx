import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PackageTier, ProductFeature, AlaCarteOption } from "../types";
import { PackageCard } from "./PackageCard";
import { AddonSelector } from "./AddonSelector";
import { AddonDrawer } from "./AddonDrawer";

interface PackageSelectorProps {
  packages: PackageTier[];
  allFeaturesForDisplay: ProductFeature[];
  selectedPackage: PackageTier | null;
  onSelectPackage: (pkg: PackageTier) => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
  basePackagePricesById?: Record<string, number>;
  addonItems?: AlaCarteOption[];
  selectedAddons?: AlaCarteOption[];
  onToggleAddon?: (item: AlaCarteOption) => void;
  onViewAddon?: (item: ProductFeature | AlaCarteOption) => void;
  baseAddonPricesById?: Record<string, number>;
  pick2Summary?: string;
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
  addonItems,
  selectedAddons,
  onToggleAddon,
  onViewAddon,
  baseAddonPricesById,
  pick2Summary,
  gridClassName,
  isIpadLandscape = false,
  textSize = "normal",
}) => {
  const storageKey = "aftermarketMenu:addonDrawerOpen";
  const enableMagnify = Boolean(isIpadLandscape);
  const [magnifiedPackageId, setMagnifiedPackageId] = useState<string | null>(null);
  const prevIsIpadLandscapeRef = useRef<boolean>(isIpadLandscape);
  const didInitAddonDrawerRef = useRef<boolean>(false);
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

  const hasAddonColumn = Boolean(addonItems && onToggleAddon && onViewAddon && selectedAddons);

  useEffect(() => {
    if (!hasAddonColumn) return;

    const wasIpadLandscape = prevIsIpadLandscapeRef.current;
    prevIsIpadLandscapeRef.current = isIpadLandscape;

    // Only force-close when transitioning INTO iPad landscape.
    // Otherwise preserve the user's open state so adding items doesn't collapse the drawer.
    if (isIpadLandscape) {
      if (!wasIpadLandscape) setIsAddonDrawerOpen(false);
      didInitAddonDrawerRef.current = true;
      return;
    }

    // Non-iPad: only apply default behavior once (or when transitioning out of iPad).
    if (!didInitAddonDrawerRef.current || wasIpadLandscape) {
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
        setIsAddonDrawerOpen(true);
      }
    }

    didInitAddonDrawerRef.current = true;
  }, [hasAddonColumn, isIpadLandscape]);

  useEffect(() => {
    if (!hasAddonColumn) return;
    if (isIpadLandscape) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, isAddonDrawerOpen ? "1" : "0");
    } catch {
      // Ignore storage failures
    }
  }, [hasAddonColumn, isAddonDrawerOpen, isIpadLandscape]);

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
    ? "am-packages-grid-compact"
    : hasAddonColumn
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8";
  const gridClasses = `${baseGrid} stagger-children${gridClassName ? ` ${gridClassName}` : ""}`;

  if (isIpadLandscape && hasAddonColumn) {
    const outerClasses = gridClassName ? `stagger-children ${gridClassName}` : "stagger-children";
    const packageGridClasses = `am-packages-grid-compact ${outerClasses}`;
    const addonCount = selectedAddons?.length ?? 0;

    return (
      <>
        <div className="flex h-full min-h-0" data-testid="package-grid">
          <div className="flex-1 min-w-0 min-h-0 h-full">
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
                  pick2Summary={selectedPackage?.id === pkg.id ? pick2Summary : undefined}
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
        </div>

        <AddonDrawer
          isOpen={isAddonDrawerOpen}
          onOpen={() => setIsAddonDrawerOpen(true)}
          onClose={() => setIsAddonDrawerOpen(false)}
          selectedCount={addonCount}
        >
          {addonItems && selectedAddons && onToggleAddon && onViewAddon ? (
            <AddonSelector
              items={addonItems}
              selectedItems={selectedAddons}
              onToggleItem={onToggleAddon}
              onViewItem={onViewAddon}
              basePricesById={baseAddonPricesById}
              isCompact={true}
              textSize={textSize}
              showHeader={false}
              variant="drawer"
              className="h-full min-h-0"
            />
          ) : null}
        </AddonDrawer>

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
          pick2Summary={selectedPackage?.id === pkg.id ? pick2Summary : undefined}
        />
      ))}
      {hasAddonColumn && addonItems && selectedAddons && onToggleAddon && onViewAddon ? (
        <AddonSelector
          items={addonItems}
          selectedItems={selectedAddons}
          onToggleItem={onToggleAddon}
          onViewItem={onViewAddon}
          basePricesById={baseAddonPricesById}
          isCompact={isIpadLandscape}
          textSize={textSize}
          className="h-full min-h-0"
        />
      ) : null}
    </div>
  );
};
