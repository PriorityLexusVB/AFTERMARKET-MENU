import React, { useCallback, useMemo } from "react";
import type { AlaCarteOption } from "../types";
import { MAIN_PAGE_ADDON_IDS } from "../constants";
import { columnOrderValue, isCuratedOption } from "../utils/alaCarte";
import {
  trackAlaCarteAdd,
  trackAlaCarteRemove,
} from "../analytics";

export interface UseAlaCarteSelectionOptions {
  displayAllAlaCarteOptions: AlaCarteOption[];
  curatedSelectedItems: AlaCarteOption[];
  setCustomPackageItems: React.Dispatch<React.SetStateAction<AlaCarteOption[]>>;
  setPick2SelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface UseAlaCarteSelectionReturn {
  curatedAlaCarteOptions: AlaCarteOption[];
  mainPageAddons: AlaCarteOption[];
  availableAlaCarteItems: AlaCarteOption[];
  handleToggleAlaCarteItem: (item: AlaCarteOption) => void;
  handleDropAlaCarte: (item: AlaCarteOption) => void;
  handleRemoveAlaCarte: (itemId: string) => void;
}

export function useAlaCarteSelection({
  displayAllAlaCarteOptions,
  curatedSelectedItems,
  setCustomPackageItems,
  setPick2SelectedIds,
}: UseAlaCarteSelectionOptions): UseAlaCarteSelectionReturn {
  const curatedAlaCarteOptions = useMemo(() => {
    return [...displayAllAlaCarteOptions].filter(isCuratedOption).sort((a, b) => {
      const columnDiff = columnOrderValue(a.column) - columnOrderValue(b.column);
      if (columnDiff !== 0) return columnDiff;
      const posA = a.position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.position ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
  }, [displayAllAlaCarteOptions]);

  const mainPageAddons = useMemo(() => {
    // The Packages page "Add Ons" column prefers a tight, explicit whitelist
    // (matching the printed menu). If the whitelist doesn't match the current DB
    // (e.g., different dealer dataset), fall back to Column 4 "Featured" items.
    const byId = new Map(curatedAlaCarteOptions.map((option) => [option.id, option]));
    const explicit = MAIN_PAGE_ADDON_IDS.map((id) => byId.get(id)).filter(
      (option): option is AlaCarteOption => Boolean(option)
    );
    if (explicit.length > 0) return explicit;

    return curatedAlaCarteOptions
      .filter((option) => option.column === 4)
      .sort((a, b) => {
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
  }, [curatedAlaCarteOptions]);

  const availableAlaCarteItems = useMemo(() => {
    return curatedAlaCarteOptions.filter(
      (option) => !curatedSelectedItems.some((item) => item.id === option.id)
    );
  }, [curatedSelectedItems, curatedAlaCarteOptions]);

  const handleToggleAlaCarteItem = useCallback((item: AlaCarteOption) => {
    setCustomPackageItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);
      if (isSelected) {
        trackAlaCarteRemove(item);
        return prev.filter((i) => i.id !== item.id);
      } else {
        setPick2SelectedIds((prevPick2) => prevPick2.filter((id) => id !== item.id));
        trackAlaCarteAdd(item);
        return [...prev, item];
      }
    });
  }, [setCustomPackageItems, setPick2SelectedIds]);

  const handleDropAlaCarte = useCallback((item: AlaCarteOption) => {
    setCustomPackageItems((prev) => {
      if (prev.find((i) => i.id === item.id)) {
        return prev;
      }
      setPick2SelectedIds((prevPick2) => prevPick2.filter((id) => id !== item.id));
      trackAlaCarteAdd(item);
      return [...prev, item];
    });
  }, [setCustomPackageItems, setPick2SelectedIds]);

  const handleRemoveAlaCarte = useCallback((itemId: string) => {
    setCustomPackageItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item) {
        trackAlaCarteRemove(item);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  }, [setCustomPackageItems]);

  return {
    curatedAlaCarteOptions,
    mainPageAddons,
    availableAlaCarteItems,
    handleToggleAlaCarteItem,
    handleDropAlaCarte,
    handleRemoveAlaCarte,
  };
}
