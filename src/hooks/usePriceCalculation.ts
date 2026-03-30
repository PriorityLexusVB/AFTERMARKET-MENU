import { useMemo } from "react";
import type { PackageTier, AlaCarteOption, PriceOverrides } from "../types";
import { isCuratedOption } from "../utils/alaCarte";
import { sortPackagesForDisplay } from "../utils/packageOrder";

export interface UsePriceCalculationOptions {
  packages: PackageTier[];
  allAlaCarteOptions: AlaCarteOption[];
  priceOverrides: PriceOverrides;
  customPackageItems: AlaCarteOption[];
}

export interface UsePriceCalculationReturn {
  hasPricingOverrides: boolean;
  basePackagePricesById: Record<string, number>;
  basePackageCostsById: Record<string, number>;
  baseAddonPricesById: Record<string, number>;
  baseAddonCostsById: Record<string, number>;
  displayPackages: PackageTier[];
  displayAllAlaCarteOptions: AlaCarteOption[];
  displayAlaCarteById: Map<string, AlaCarteOption>;
  curatedSelectedItems: AlaCarteOption[];
  displayCustomPackageItems: AlaCarteOption[];
}

function applyOverrides<T extends { id: string; price: number; cost: number }>(
  items: T[],
  overrides: PriceOverrides
): T[] {
  return items.map((item) => {
    const override = overrides[item.id];
    if (!override) return item;
    return {
      ...item,
      price: override.price ?? item.price,
      cost: override.cost ?? item.cost,
    };
  });
}

export function usePriceCalculation({
  packages,
  allAlaCarteOptions,
  priceOverrides,
  customPackageItems,
}: UsePriceCalculationOptions): UsePriceCalculationReturn {
  const hasPricingOverrides = useMemo(() => {
    return Object.values(priceOverrides).some(
      (override) =>
        Boolean(override) &&
        (typeof override.price === "number" || typeof override.cost === "number")
    );
  }, [priceOverrides]);

  const basePackagePricesById = useMemo(() => {
    const record: Record<string, number> = {};
    packages.forEach((pkg) => {
      record[pkg.id] = pkg.price;
    });
    return record;
  }, [packages]);

  const basePackageCostsById = useMemo(() => {
    const record: Record<string, number> = {};
    packages.forEach((pkg) => {
      record[pkg.id] = pkg.cost;
    });
    return record;
  }, [packages]);

  const baseAddonPricesById = useMemo(() => {
    const record: Record<string, number> = {};
    allAlaCarteOptions.forEach((opt) => {
      record[opt.id] = opt.price;
    });
    return record;
  }, [allAlaCarteOptions]);

  const baseAddonCostsById = useMemo(() => {
    const record: Record<string, number> = {};
    allAlaCarteOptions.forEach((opt) => {
      record[opt.id] = opt.cost;
    });
    return record;
  }, [allAlaCarteOptions]);

  const displayPackages = useMemo(() => {
    // Deterministic customer-facing order: Elite  Platinum  Gold (matches requested layout).
    const sorted = sortPackagesForDisplay(packages);
    return applyOverrides(sorted, priceOverrides);
  }, [packages, priceOverrides]);

  const displayAllAlaCarteOptions = useMemo(
    () => applyOverrides(allAlaCarteOptions, priceOverrides),
    [allAlaCarteOptions, priceOverrides]
  );

  const displayAlaCarteById = useMemo(() => {
    const map = new Map<string, AlaCarteOption>();
    displayAllAlaCarteOptions.forEach((opt) => map.set(opt.id, opt));
    return map;
  }, [displayAllAlaCarteOptions]);

  const curatedSelectedItems = useMemo(
    () => customPackageItems.filter(isCuratedOption),
    [customPackageItems]
  );

  const displayCustomPackageItems = useMemo(
    () => applyOverrides(curatedSelectedItems, priceOverrides),
    [curatedSelectedItems, priceOverrides]
  );

  return {
    hasPricingOverrides,
    basePackagePricesById,
    basePackageCostsById,
    baseAddonPricesById,
    baseAddonCostsById,
    displayPackages,
    displayAllAlaCarteOptions,
    displayAlaCarteById,
    curatedSelectedItems,
    displayCustomPackageItems,
  };
}
