import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlaCarteOption, Pick2Config } from "../types";
import { columnOrderValue } from "../utils/alaCarte";
import { logPick2Event, setPick2TelemetryConfig } from "../utils/telemetry";

export interface UsePick2SelectionOptions {
  pick2Config: Pick2Config | null;
  displayAllAlaCarteOptions: AlaCarteOption[];
  displayAlaCarteById: Map<string, AlaCarteOption>;
  currentPage: string;
  setCurrentPage: (page: "packages" | "alacarte" | "pick2") => void;
  setCustomPackageItems: React.Dispatch<React.SetStateAction<AlaCarteOption[]>>;
}

export interface UsePick2SelectionReturn {
  pick2SelectedIds: string[];
  setPick2SelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  pick2MaxSelections: number;
  pick2Enabled: boolean;
  pick2BundlePrice: number;
  pick2SelectedItems: AlaCarteOption[];
  pick2SummaryText: string | undefined;
  pick2NeedsAttention: boolean;
  pick2BundleActive: boolean;
  pick2BundleCost: number;
  pick2Selection:
    | { price: number; items: AlaCarteOption[]; cost: number }
    | undefined;
  pick2EligibleItems: AlaCarteOption[];
  pick2EligibleIdSet: Set<string>;
  pick2RecommendedPairs: Array<{
    label: string;
    optionIds: [string, string];
  }>;
  showPick2Tab: boolean;
  handleTogglePick2Item: (item: AlaCarteOption) => void;
  handlePick2PresetSelect: (optionIds: string[], label?: string) => void;
  handlePick2Clear: () => void;
  handlePick2Done: () => void;
  handlePick2BlockedThird: () => void;
}

export function usePick2Selection({
  pick2Config,
  displayAllAlaCarteOptions,
  displayAlaCarteById,
  currentPage,
  setCurrentPage,
  setCustomPackageItems,
}: UsePick2SelectionOptions): UsePick2SelectionReturn {
  const [pick2SelectedIds, setPick2SelectedIds] = useState<string[]>([]);

  const pick2MaxSelections = pick2Config?.maxSelections ?? 2;
  const pick2Enabled = pick2Config?.enabled === true;
  const pick2BundlePrice = pick2Config?.price ?? 0;

  const pick2SelectedItems = useMemo(() => {
    return pick2SelectedIds
      .map((id) => displayAlaCarteById.get(id))
      .filter((item): item is AlaCarteOption => Boolean(item));
  }, [pick2SelectedIds, displayAlaCarteById]);

  const pick2SummaryText = useMemo(() => {
    if (!pick2Enabled) return undefined;
    if (pick2SelectedItems.length === 0) return `0/${pick2MaxSelections}`;
    if (pick2SelectedItems.length < pick2MaxSelections) {
      return `${pick2SelectedItems.length}/${pick2MaxSelections}`;
    }
    return pick2SelectedItems.map((item) => item.name).join(" + ");
  }, [pick2Enabled, pick2SelectedItems, pick2MaxSelections]);

  const pick2NeedsAttention =
    pick2Enabled && pick2SelectedItems.length > 0 && pick2SelectedItems.length < pick2MaxSelections;

  const pick2BundleActive = pick2Enabled && pick2SelectedItems.length === pick2MaxSelections;
  const pick2BundleCost = useMemo(() => {
    if (!pick2BundleActive) return 0;
    return pick2SelectedItems.reduce((sum, item) => sum + item.cost, 0);
  }, [pick2BundleActive, pick2SelectedItems]);

  const pick2Selection = useMemo(() => {
    if (!pick2BundleActive) return undefined;
    return {
      price: pick2BundlePrice,
      items: pick2SelectedItems,
      cost: pick2BundleCost,
    };
  }, [pick2BundleActive, pick2BundlePrice, pick2SelectedItems, pick2BundleCost]);

  const pick2EligibleItems = useMemo(() => {
    return [...displayAllAlaCarteOptions]
      .filter((option) => option.pick2Eligible)
      .sort((a, b) => {
        const sortA = a.pick2Sort ?? Number.MAX_SAFE_INTEGER;
        const sortB = b.pick2Sort ?? Number.MAX_SAFE_INTEGER;
        if (sortA !== sortB) return sortA - sortB;
        const columnDiff = columnOrderValue(a.column) - columnOrderValue(b.column);
        if (columnDiff !== 0) return columnDiff;
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
  }, [displayAllAlaCarteOptions]);

  const pick2EligibleIdSet = useMemo(
    () => new Set(pick2EligibleItems.map((item) => item.id)),
    [pick2EligibleItems]
  );

  const pick2HadCompleteRef = useRef(false);

  const normalizePick2Name = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\bpackage\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const pick2NameToId = useMemo(() => {
    const map = new Map<string, string>();
    pick2EligibleItems.forEach((item) => {
      const normalized = normalizePick2Name(item.name);
      if (normalized) {
        map.set(normalized, item.id);
      }
    });
    return map;
  }, [pick2EligibleItems, normalizePick2Name]);

  const findPick2IdByName = useCallback(
    (candidates: string[]) => {
      for (const candidate of candidates) {
        const normalized = normalizePick2Name(candidate);
        const match = pick2NameToId.get(normalized);
        if (match) return match;
      }
      return undefined;
    },
    [normalizePick2Name, pick2NameToId]
  );

  const fallbackPick2RecommendedPairs = useMemo(() => {
    const presets = [
      {
        label: "Best Protection",
        optionCandidates: [
          [
            "Suntek Pro Standard Package",
            "Suntek Protective Film (Standard Package)",
            "Suntek Pro Standard",
          ],
          ["Diamond Shield Windshield Protection"],
        ],
      },
      {
        label: "Resale Focus",
        optionCandidates: [
          ["EverNew Appearance Protection"],
          ["Interior Leather & Fabric Protection"],
        ],
      },
      {
        label: "Visibility + Daily Wear",
        optionCandidates: [["Headlights Protection"], ["Door Cups Only"]],
      },
      {
        label: "Coastal Defense",
        optionCandidates: [["RustGuard Pro"], ["ToughGuard Premium"]],
      },
    ];

    return presets
      .map((preset) => {
        const firstId = findPick2IdByName(preset.optionCandidates[0] ?? []);
        const secondId = findPick2IdByName(preset.optionCandidates[1] ?? []);
        if (!firstId || !secondId) return null;
        if (firstId === secondId) return null;
        return { label: preset.label, optionIds: [firstId, secondId] as [string, string] };
      })
      .filter((pair): pair is { label: string; optionIds: [string, string] } => Boolean(pair));
  }, [findPick2IdByName]);

  const pick2RecommendedPairs = useMemo(() => {
    const configured = pick2Config?.recommendedPairs ?? [];
    const validConfigured = configured.filter((pair) => {
      const [first, second] = pair.optionIds;
      return pick2EligibleIdSet.has(first) && pick2EligibleIdSet.has(second);
    });
    if (validConfigured.length > 0) {
      return validConfigured;
    }
    return fallbackPick2RecommendedPairs;
  }, [pick2Config?.recommendedPairs, pick2EligibleIdSet, fallbackPick2RecommendedPairs]);

  const showPick2Tab = pick2Enabled && pick2EligibleItems.length > 0;

  // Telemetry config sync
  useEffect(() => {
    setPick2TelemetryConfig({
      telemetryEnabled: pick2Config?.telemetryEnabled,
      telemetrySampleRate: pick2Config?.telemetrySampleRate,
    });
  }, [pick2Config?.telemetryEnabled, pick2Config?.telemetrySampleRate]);

  // Track completion
  useEffect(() => {
    if (pick2SelectedIds.length === pick2MaxSelections) {
      pick2HadCompleteRef.current = true;
    }
  }, [pick2SelectedIds.length, pick2MaxSelections]);

  // Track page open
  const previousPageRef = useRef<string>(currentPage);
  useEffect(() => {
    const previousPage = previousPageRef.current;
    if (currentPage === "pick2" && previousPage !== "pick2" && showPick2Tab) {
      void logPick2Event("pick2_opened", {
        countSelected: pick2SelectedIds.length,
        page: "pick2",
      });
    }
    previousPageRef.current = currentPage;
  }, [currentPage, pick2SelectedIds.length, showPick2Tab]);

  // Redirect away from pick2 if tab hidden
  useEffect(() => {
    if (currentPage === "pick2" && !showPick2Tab) {
      setCurrentPage("packages");
    }
  }, [currentPage, showPick2Tab, setCurrentPage]);

  const handleTogglePick2Item = useCallback(
    (item: AlaCarteOption) => {
      setPick2SelectedIds((prev) => {
        const isSelected = prev.includes(item.id);
        if (isSelected) {
          return prev.filter((id) => id !== item.id);
        }

        if (prev.length >= pick2MaxSelections) {
          return prev;
        }

        // Conflict rule: selecting via Pick2 removes the item from individually-priced add-ons.
        setCustomPackageItems((prevCustom) => prevCustom.filter((i) => i.id !== item.id));
        const nextIds = [...prev, item.id];
        void logPick2Event("pick2_selected", {
          itemId: item.id,
          countSelected: nextIds.length,
          page: "pick2",
        });
        if (pick2HadCompleteRef.current && prev.length === pick2MaxSelections - 1) {
          void logPick2Event("pick2_swap", {
            itemId: item.id,
            countSelected: nextIds.length,
            page: "pick2",
          });
        }
        return nextIds;
      });
    },
    [pick2MaxSelections, setCustomPackageItems]
  );

  const handlePick2PresetSelect = useCallback(
    (optionIds: string[], label?: string) => {
      const uniqueIds = Array.from(new Set(optionIds)).filter((id) => pick2EligibleIdSet.has(id));
      if (uniqueIds.length < pick2MaxSelections) return;
      const nextIds = uniqueIds.slice(0, pick2MaxSelections);
      void logPick2Event("pick2_preset_clicked", {
        presetLabel: label,
        countSelected: nextIds.length,
        page: "pick2",
      });
      setCustomPackageItems((prevCustom) =>
        prevCustom.filter((item) => !nextIds.includes(item.id))
      );
      setPick2SelectedIds(nextIds);
    },
    [pick2EligibleIdSet, pick2MaxSelections, setCustomPackageItems]
  );

  const handlePick2Clear = useCallback(() => {
    void logPick2Event("pick2_clear", {
      countSelected: pick2SelectedIds.length,
      page: "pick2",
    });
    setPick2SelectedIds([]);
  }, [pick2SelectedIds.length]);

  const handlePick2Done = useCallback(() => {
    void logPick2Event("pick2_done", {
      countSelected: pick2SelectedIds.length,
      page: "pick2",
    });
    setCurrentPage("packages");
  }, [pick2SelectedIds.length, setCurrentPage]);

  const handlePick2BlockedThird = useCallback(() => {
    void logPick2Event("pick2_blocked_third", {
      countSelected: pick2SelectedIds.length,
      page: "pick2",
    });
  }, [pick2SelectedIds.length]);

  return {
    pick2SelectedIds,
    setPick2SelectedIds,
    pick2MaxSelections,
    pick2Enabled,
    pick2BundlePrice,
    pick2SelectedItems,
    pick2SummaryText,
    pick2NeedsAttention,
    pick2BundleActive,
    pick2BundleCost,
    pick2Selection,
    pick2EligibleItems,
    pick2EligibleIdSet,
    pick2RecommendedPairs,
    showPick2Tab,
    handleTogglePick2Item,
    handlePick2PresetSelect,
    handlePick2Clear,
    handlePick2Done,
    handlePick2BlockedThird,
  };
}
