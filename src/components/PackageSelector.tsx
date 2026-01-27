import React, { useEffect, useMemo, useRef, useState } from "react";
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

  const [magnifiedPackageId, setMagnifiedPackageId] = useState<string | null>(null);
  const magnifiedPackage = magnifiedPackageId
    ? packages.find((p) => p.id === magnifiedPackageId) || null
    : null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!isIpadLandscape || !addonColumn) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      setContainerWidth(Number.isFinite(w) ? w : 0);
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isIpadLandscape, addonColumn]);

  const drawerWidths = useMemo(() => {
    // Targets match the desired iPad look, but we clamp based on available width so
    // the 3 package columns remain visible in PWA (no URL bar) or Safari (URL bar).
    const closedTarget = 260;
    const openTarget = 320;
    const minClosed = 220;
    const minOpen = 280;

    // Conservative minimum for 3 package columns + internal gaps.
    const minPackageCol = 240;
    const packageGridGaps = 2 * 12; // two gaps between 3 columns
    const interPaneGap = 12; // gap between packages area and add-ons pane
    const safety = 16;
    const minPackagesTotal = minPackageCol * 3 + packageGridGaps + interPaneGap + safety;

    const w = containerWidth || 0;
    const maxDrawer = w > 0 ? Math.max(0, w - minPackagesTotal) : openTarget;

    const closed = Math.max(0, Math.min(closedTarget, maxDrawer > 0 ? maxDrawer : closedTarget));
    const open = Math.max(0, Math.min(openTarget, maxDrawer > 0 ? maxDrawer : openTarget));

    // Enforce minimums when possible; fall back if the container is too tight.
    const closedFinal = maxDrawer >= minClosed ? Math.max(minClosed, closed) : Math.max(0, closed);
    const openFinal = maxDrawer >= minOpen ? Math.max(minOpen, open) : Math.max(closedFinal, open);

    return {
      closed: Math.round(closedFinal),
      open: Math.round(Math.max(openFinal, closedFinal)),
    };
  }, [containerWidth]);

  useEffect(() => {
    if (!isIpadLandscape || !addonColumn) return;
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty("--am-addon-w-closed", `${drawerWidths.closed}px`);
    el.style.setProperty("--am-addon-w-open", `${drawerWidths.open}px`);
  }, [drawerWidths, isIpadLandscape, addonColumn]);

  const closeMagnifier = () => setMagnifiedPackageId(null);

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
      <div ref={containerRef} className={`flex min-h-0 gap-2 lg:gap-3`} data-testid="package-grid">
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
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
                onMagnify={() => setMagnifiedPackageId(pkg.id)}
                className="animate-card-entrance"
                isCompact={true}
                textSize={textSize}
              />
            ))}
          </div>
        </div>

        <aside
          className={`relative min-h-0 transition-[width] duration-300 ease-out ${
            isAddonDrawerOpen
              ? "w-[var(--am-addon-w-open,320px)]"
              : "w-[var(--am-addon-w-closed,260px)]"
          }`}
          aria-label="Add-ons"
        >
          {/* Column content stays visible (paper-like). When "closed", lock interactions. */}
          <div
            className={`h-full min-h-0 transition-opacity duration-200 ${
              isAddonDrawerOpen ? "opacity-100" : "opacity-95 pointer-events-none select-none"
            }`}
          >
            {addonColumn}
          </div>

          {/* Closed overlay (visible column, but locked) */}
          {!isAddonDrawerOpen ? (
            <div className="absolute inset-0 z-10 rounded-lg bg-black/10 border border-white/5">
              <button
                type="button"
                onClick={() => setIsAddonDrawerOpen(true)}
                className="absolute top-2 right-2 z-20 bg-slate-950/75 hover:bg-slate-950/90 text-white/90 hover:text-white border border-white/10 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
                aria-label="Open add-ons"
                title="Open add-ons"
              >
                Open
              </button>
              <div className="absolute top-2 left-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Add-Ons
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddonDrawerOpen(false)}
              className="absolute top-2 right-2 z-20 bg-slate-950/70 hover:bg-slate-950/90 text-white/90 hover:text-white border border-white/10 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
              aria-label="Close add-ons"
              title="Close add-ons"
            >
              Close
            </button>
          )}
        </aside>

        {magnifiedPackage && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Magnified package"
          >
            <button
              type="button"
              className="absolute inset-0"
              onClick={closeMagnifier}
              aria-label="Close magnified view (backdrop)"
            />
            <div className="relative w-[min(900px,96vw)] max-h-[92vh] overflow-y-auto">
              <button
                type="button"
                onClick={closeMagnifier}
                className="absolute -top-2 -right-2 z-10 bg-slate-950/90 hover:bg-slate-950 text-white border border-white/10 rounded-full w-10 h-10 flex items-center justify-center"
                aria-label="Close magnified view"
                title="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>

              <PackageCard
                packageInfo={magnifiedPackage}
                allFeaturesForDisplay={allFeaturesForDisplay}
                basePrice={basePackagePricesById?.[magnifiedPackage.id]}
                isSelected={selectedPackage?.id === magnifiedPackage.id}
                onSelect={() => {
                  onSelectPackage(magnifiedPackage);
                  closeMagnifier();
                }}
                onViewFeature={(f) => {
                  onViewFeature(f);
                }}
                className="animate-card-entrance"
                isCompact={false}
                isMagnified={true}
                textSize={textSize}
              />
            </div>
          </div>
        )}
      </div>
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
          onMagnify={() => setMagnifiedPackageId(pkg.id)}
          className="animate-card-entrance"
          isCompact={isIpadLandscape}
          textSize={textSize}
        />
      ))}
      {addonColumn}

      {magnifiedPackage && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Magnified package"
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={closeMagnifier}
            aria-label="Close magnified view (backdrop)"
          />
          <div className="relative w-[min(900px,96vw)] max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeMagnifier}
              className="absolute -top-2 -right-2 z-10 bg-slate-950/90 hover:bg-slate-950 text-white border border-white/10 rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Close magnified view"
              title="Close"
            >
              <span className="text-xl leading-none">×</span>
            </button>

            <PackageCard
              packageInfo={magnifiedPackage}
              allFeaturesForDisplay={allFeaturesForDisplay}
              basePrice={basePackagePricesById?.[magnifiedPackage.id]}
              isSelected={selectedPackage?.id === magnifiedPackage.id}
              onSelect={() => {
                onSelectPackage(magnifiedPackage);
                closeMagnifier();
              }}
              onViewFeature={(f) => {
                onViewFeature(f);
              }}
              className="animate-card-entrance"
              isCompact={false}
              isMagnified={true}
              textSize={textSize}
            />
          </div>
        </div>
      )}
    </div>
  );
};
