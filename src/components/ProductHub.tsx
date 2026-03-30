import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore/lite";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { db } from "../firebase";
import type { AlaCarteOption, Pick2Config, ProductFeature, PackageTier } from "../types";
import {
  updateFeature,
  upsertAlaCarteFromFeature,
  unpublishAlaCarteFromFeature,
  updateAlaCarteOption,
  fetchPick2Config,
  updatePick2Config,
  batchUpdateFeaturesPositions,
} from "../data";
import { FeatureForm } from "./FeatureForm";
import { sortOrderableItems } from "../utils/featureOrdering";
import {
  SortableProductCard,
  DragOverlayItem,
  DroppableColumn,
  DuplicatesPanel,
  RecommendedPackagePanel,
  FilterBar,
  BulkActionsBar,
} from "./product-hub";
import type { DuplicateGroup } from "./product-hub";

interface ProductHubProps {
  onDataUpdate: () => void;
  onAlaCarteChange?: () => void;
  initialFeatures?: ProductFeature[];
  initialAlaCarteOptions?: AlaCarteOption[];
  scrollTargetId?: string | null;
  onScrollHandled?: () => void;

  // Optional: allow AdminPanel to surface Recommended package controls here too.
  packages?: PackageTier[];
  recommendedSelection?: string;
  isSavingRecommended?: boolean;
  recommendedMessage?: string | null;
  recommendedError?: string | null;
  onRecommendedChange?: (packageId: string | "none") => void;
}

// Default package column when moving items to packages section
const DEFAULT_PACKAGE_COLUMN: 1 | 2 | 3 = 2; // Elite Package

export const ProductHub: React.FC<ProductHubProps> = ({
  onDataUpdate,
  onAlaCarteChange,
  initialFeatures,
  initialAlaCarteOptions,
  scrollTargetId,
  onScrollHandled,
  packages,
  recommendedSelection,
  isSavingRecommended,
  recommendedMessage,
  recommendedError,
  onRecommendedChange,
}) => {
  const [features, setFeatures] = useState<ProductFeature[]>(initialFeatures ?? []);
  const [alaCarteOptions, setAlaCarteOptions] = useState<AlaCarteOption[]>(
    initialAlaCarteOptions ?? []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [packageLaneFilter, setPackageLaneFilter] = useState<"all" | "1" | "2" | "3" | "none">(
    "all"
  );
  const [publishFilter, setPublishFilter] = useState<"all" | "published" | "unpublished">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not-featured">("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "1" | "2" | "3" | "unplaced" | "featured"
  >("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [isLoading, setIsLoading] = useState(initialFeatures ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [pick2Config, setPick2Config] = useState<Pick2Config | null>(null);
  const [pick2Enabled, setPick2Enabled] = useState(false);
  const [pick2PriceInput, setPick2PriceInput] = useState("");
  const [pick2TitleInput, setPick2TitleInput] = useState("");
  const [pick2SubtitleInput, setPick2SubtitleInput] = useState("");
  const [pick2FeaturedPresetLabel, setPick2FeaturedPresetLabel] = useState("");
  const [pick2ConfigError, setPick2ConfigError] = useState<string | null>(null);
  const [isSavingPick2Config, setIsSavingPick2Config] = useState(false);
  const maxRecommendedPairs = 4;
  const normalizeRecommendedPairs = (pairs?: Pick2Config["recommendedPairs"]) => {
    const normalized = (pairs ?? []).slice(0, maxRecommendedPairs).map((pair) => ({
      label: pair.label ?? "",
      optionIds: [pair.optionIds?.[0] ?? "", pair.optionIds?.[1] ?? ""] as [string, string],
    }));
    while (normalized.length < maxRecommendedPairs) {
      normalized.push({ label: "", optionIds: ["", ""] });
    }
    return normalized;
  };
  const [pick2RecommendedPairsDraft, setPick2RecommendedPairsDraft] = useState(
    normalizeRecommendedPairs(undefined)
  );

  // Drag-and-drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [featuresBackup, setFeaturesBackup] = useState<ProductFeature[]>([]);

  const bulkSelectRef = useRef<HTMLInputElement>(null);
  const headerSelectRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const isMounted = useRef(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const elitePackageId = useMemo(
    () => packages?.find((pkg) => pkg.name.toLowerCase().includes("elite"))?.id,
    [packages]
  );
  const platinumPackageId = useMemo(
    () => packages?.find((pkg) => pkg.name.toLowerCase().includes("platinum"))?.id,
    [packages]
  );
  const goldPackageId = useMemo(
    () => packages?.find((pkg) => pkg.name.toLowerCase().includes("gold"))?.id,
    [packages]
  );

  const clearRowError = (featureId: string) => {
    setRowErrors((prev) => {
      const { [featureId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const clearSaved = (featureId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(featureId);
      return next;
    });
    if (saveTimers.current[featureId]) {
      clearTimeout(saveTimers.current[featureId]);
      const { [featureId]: _timer, ...rest } = saveTimers.current;
      saveTimers.current = rest;
    }
  };

  const toggleRowExpanded = (featureId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  const setRowErrorMessage = (featureId: string, message: string) => {
    setRowErrors((prev) => ({ ...prev, [featureId]: message }));
  };

  const markSaved = (featureId: string) => {
    clearRowError(featureId);
    if (!isMounted.current) return;
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.add(featureId);
      return next;
    });
    if (saveTimers.current[featureId]) {
      clearTimeout(saveTimers.current[featureId]);
    }
    saveTimers.current[featureId] = setTimeout(() => {
      if (!isMounted.current) return;
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(featureId);
        return next;
      });
      const { [featureId]: _timer, ...rest } = saveTimers.current;
      saveTimers.current = rest;
    }, 1500);
  };

  const fetchData = useCallback(async () => {
    if (!db) {
      setError("Firebase is not connected.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [featuresSnap, alaCarteSnap] = await Promise.all([
        getDocs(query(collection(db, "features"), orderBy("name"))),
        getDocs(query(collection(db, "ala_carte_options"), orderBy("name"))),
      ]);

      setFeatures(
        featuresSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProductFeature)
      );
      setAlaCarteOptions(
        alaCarteSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AlaCarteOption)
      );
    } catch (err) {
      console.error("Error loading Product Hub data:", err);
      setError(
        "Failed to load Product Hub data. Please check your Firestore rules and connection."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFeatures) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, initialFeatures]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const config = await fetchPick2Config();
        if (cancelled) return;
        setPick2Config(config);
        setPick2Enabled(Boolean(config.enabled));
        setPick2PriceInput(String(config.price ?? ""));
        setPick2TitleInput(config.title ?? "");
        setPick2SubtitleInput(config.subtitle ?? "");
        setPick2ConfigError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load Pick2 config", err);
        setPick2Config(null);
        setPick2ConfigError("Failed to load Pick2 config.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPick2RecommendedPairsDraft(normalizeRecommendedPairs(pick2Config?.recommendedPairs));
  }, [pick2Config?.recommendedPairs]);

  useEffect(() => {
    setPick2FeaturedPresetLabel(pick2Config?.featuredPresetLabel ?? "");
  }, [pick2Config?.featuredPresetLabel]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(features.map((f) => f.id));
      return new Set([...prev].filter((id) => validIds.has(id)));
    });
  }, [features]);

  useEffect(
    () => () => {
      isMounted.current = false;
      Object.values(saveTimers.current).forEach((timer) => clearTimeout(timer));
    },
    []
  );

  const requestMenuRefresh = useCallback(() => {
    onAlaCarteChange?.();
    if (!onDataUpdate) return;
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = setTimeout(() => {
      onDataUpdate();
    }, 250);
  }, [onAlaCarteChange, onDataUpdate]);

  useEffect(
    () => () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    },
    []
  );

  const buildRecommendedPairsPayload = useCallback(
    (draft: Array<{ label: string; optionIds: [string, string] }>) => {
      return draft
        .map((pair) => ({
          label: pair.label.trim(),
          optionIds: [pair.optionIds[0].trim(), pair.optionIds[1].trim()] as [string, string],
        }))
        .filter(
          (pair) =>
            pair.label.length > 0 &&
            pair.optionIds[0].length > 0 &&
            pair.optionIds[1].length > 0 &&
            pair.optionIds[0] !== pair.optionIds[1]
        );
    },
    []
  );

  const buildPresetOrder = useCallback(
    (draft: Array<{ label: string; optionIds: [string, string] }>) => {
      const labels = draft.map((pair) => pair.label.trim()).filter(Boolean);
      const seen = new Set<string>();
      return labels.filter((label) => {
        const normalized = label.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
    },
    []
  );

  const saveRecommendedPairs = useCallback(
    async (draft: Array<{ label: string; optionIds: [string, string] }>) => {
      const nextPairs = buildRecommendedPairsPayload(draft);
      const nextOrder = buildPresetOrder(draft);
      const featuredTrimmed = pick2FeaturedPresetLabel.trim();
      const featuredNormalized = featuredTrimmed.toLowerCase();
      const nextFeatured = nextOrder.some((label) => label.toLowerCase() === featuredNormalized)
        ? featuredTrimmed
        : undefined;
      const prev = pick2Config?.recommendedPairs;
      const prevOrder = pick2Config?.presetOrder;
      const prevFeatured = pick2Config?.featuredPresetLabel;
      setPick2ConfigError(null);
      setIsSavingPick2Config(true);
      setPick2Config((cfg) =>
        cfg
          ? {
              ...cfg,
              recommendedPairs: nextPairs,
              presetOrder: nextOrder,
              featuredPresetLabel: nextFeatured,
            }
          : cfg
      );
      try {
        await updatePick2Config({
          recommendedPairs: nextPairs,
          presetOrder: nextOrder,
          featuredPresetLabel: nextFeatured,
        });
        if (nextFeatured !== pick2FeaturedPresetLabel) {
          setPick2FeaturedPresetLabel(nextFeatured ?? "");
        }
        requestMenuRefresh();
      } catch (err) {
        console.error("Failed to save Pick2 recommended pairs", err);
        setPick2Config((cfg) =>
          cfg
            ? {
                ...cfg,
                recommendedPairs: prev,
                presetOrder: prevOrder,
                featuredPresetLabel: prevFeatured,
              }
            : cfg
        );
        setPick2RecommendedPairsDraft(normalizeRecommendedPairs(prev));
        setPick2FeaturedPresetLabel(prevFeatured ?? "");
        setPick2ConfigError("Failed to save recommended pairs.");
      } finally {
        setIsSavingPick2Config(false);
      }
    },
    [
      buildRecommendedPairsPayload,
      buildPresetOrder,
      pick2Config?.featuredPresetLabel,
      pick2Config?.presetOrder,
      pick2Config?.recommendedPairs,
      pick2FeaturedPresetLabel,
      requestMenuRefresh,
    ]
  );

  useEffect(() => {
    if (!scrollTargetId) return;
    setSearchTerm("");
    setPackageLaneFilter("all");
    setPublishFilter("all");
    setFeaturedFilter("all");
    setCategoryFilter("all");
  }, [scrollTargetId]);

  const alaCarteMap = useMemo(() => {
    return new Map(alaCarteOptions.map((opt) => [opt.id, opt]));
  }, [alaCarteOptions]);

  const pick2EligibleOptions = useMemo(() => {
    return [...alaCarteOptions]
      .filter((opt) => opt.pick2Eligible)
      .sort((a, b) => {
        const sortA = a.pick2Sort ?? Number.MAX_SAFE_INTEGER;
        const sortB = b.pick2Sort ?? Number.MAX_SAFE_INTEGER;
        if (sortA !== sortB) return sortA - sortB;
        return a.name.localeCompare(b.name);
      });
  }, [alaCarteOptions]);

  const normalizeFeatureName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const possibleDuplicates: DuplicateGroup[] = useMemo(() => {
    const grouped = new Map<string, ProductFeature[]>();

    features.forEach((feature) => {
      const normalized = normalizeFeatureName(feature.name);
      if (!normalized) return;

      const existing = grouped.get(normalized);
      if (existing) {
        existing.push(feature);
      } else {
        grouped.set(normalized, [feature]);
      }
    });

    return Array.from(grouped.entries())
      .filter(([, group]) => group.length > 1)
      .map(([normalized, group]) => {
        const priceSet = new Set(group.map((item) => item.price));
        const costSet = new Set(group.map((item) => item.cost));
        const warrantySet = new Set(group.map((item) => (item.warranty ?? "").trim()));
        const descriptionLengthSet = new Set(
          group.map((item) => (item.description ?? "").trim().length)
        );

        const mismatches: string[] = [];
        if (priceSet.size > 1) mismatches.push("price");
        if (costSet.size > 1) mismatches.push("cost");
        if (warrantySet.size > 1) mismatches.push("warranty");
        if (descriptionLengthSet.size > 1) mismatches.push("description length");

        return {
          key: normalized,
          name: group[0]?.name ?? normalized,
          count: group.length,
          mismatches,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [features]);

  const filteredFeatures = useMemo(() => {
    const queryText = searchTerm.trim().toLowerCase();
    return features.filter((feature) => {
      const option = alaCarteMap.get(feature.id);
      const matchesSearch =
        !queryText ||
        feature.name.toLowerCase().includes(queryText) ||
        feature.description?.toLowerCase().includes(queryText);

      if (!matchesSearch) return false;

      const lane = feature.column ? String(feature.column) : "none";
      if (packageLaneFilter !== "all" && packageLaneFilter !== lane) return false;

      const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
      if (publishFilter === "published" && !isPublished) return false;
      if (publishFilter === "unpublished" && isPublished) return false;

      const isFeatured = option?.column === 4;
      if (featuredFilter === "featured" && !isFeatured) return false;
      if (featuredFilter === "not-featured" && isFeatured) return false;

      const categoryValue = isFeatured
        ? "featured"
        : option?.column
          ? String(option.column)
          : "unplaced";
      if (categoryFilter !== "all") {
        if (categoryFilter === "unplaced" && categoryValue !== "unplaced") return false;
        if (categoryFilter === "featured" && categoryValue !== "featured") return false;
        if (!["unplaced", "featured"].includes(categoryFilter) && categoryFilter !== categoryValue)
          return false;
      }

      return true;
    });
  }, [
    alaCarteMap,
    categoryFilter,
    features,
    featuredFilter,
    packageLaneFilter,
    publishFilter,
    searchTerm,
  ]);

  useEffect(() => {
    if (!scrollTargetId || isLoading) return;
    const attemptScroll = () => {
      const row = rowRefs.current[scrollTargetId];
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        onScrollHandled?.();
        return true;
      }
      return false;
    };
    if (attemptScroll()) return;
    const timer = window.setTimeout(() => {
      attemptScroll();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [filteredFeatures, isLoading, onScrollHandled, scrollTargetId]);

  const allFilteredSelected = useMemo(
    () => filteredFeatures.length > 0 && filteredFeatures.every((f) => selectedIds.has(f.id)),
    [filteredFeatures, selectedIds]
  );
  const someSelected = selectedIds.size > 0;

  useEffect(() => {
    const indeterminate = someSelected && !allFilteredSelected;
    if (bulkSelectRef.current) {
      bulkSelectRef.current.indeterminate = indeterminate;
    }
    if (headerSelectRef.current) {
      headerSelectRef.current.indeterminate = indeterminate;
    }
  }, [allFilteredSelected, someSelected]);

  const updateFeatureState = (featureId: string, updates: Partial<ProductFeature>) => {
    setFeatures((prev) => prev.map((f) => (f.id === featureId ? { ...f, ...updates } : f)));
  };

  const upsertOptionState = (feature: ProductFeature, updates: Partial<AlaCarteOption>) => {
    setAlaCarteOptions((prev) => {
      const existing = prev.find((o) => o.id === feature.id);
      if (existing) {
        return prev.map((o) => (o.id === feature.id ? { ...o, ...updates } : o));
      }
      const base: AlaCarteOption = {
        id: feature.id,
        name: feature.name,
        price: feature.alaCartePrice ?? feature.price,
        cost: feature.cost,
        description: feature.description,
        points: feature.points,
      };
      return [...prev, { ...base, ...updates }];
    });
  };

  const getNextPosition = (column: 1 | 2 | 3) => {
    const positions = features.filter((f) => f.column === column).map((f) => f.position ?? 0);
    if (positions.length === 0) return 0;
    return Math.max(...positions) + 1;
  };

  const handlePackagePlacement = async (feature: ProductFeature, column: 1 | 2 | 3 | undefined) => {
    if ((feature.column ?? null) === (column ?? null)) return;
    const prevColumn = feature.column;
    const prevPosition = feature.position;
    const newPosition =
      column === undefined
        ? undefined
        : (() => {
            const positions = features
              .filter((f) => f.id !== feature.id && f.column === column)
              .map((f) => f.position ?? 0);
            if (positions.length === 0) return 0;
            return Math.max(...positions) + 1;
          })();

    const payload: Partial<ProductFeature> = { column, position: newPosition };

    updateFeatureState(feature.id, payload);
    clearRowError(feature.id);
    try {
      await updateFeature(feature.id, payload);
      onDataUpdate();
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to update package placement", err);
      setRowErrorMessage(feature.id, "Failed to update package lane.");
      updateFeatureState(feature.id, {
        column: prevColumn,
        position: prevPosition,
      });
      clearSaved(feature.id);
    }
  };

  const handlePriceBlur = async (feature: ProductFeature) => {
    const rawValue =
      priceInputs[feature.id] ??
      (feature.alaCartePrice !== undefined ? feature.alaCartePrice.toString() : "");
    if (rawValue === "") return;
    const parsed = Number(rawValue);
    setPriceInputs((prev) => {
      const { [feature.id]: _removed, ...rest } = prev;
      return rest;
    });
    if (Number.isNaN(parsed) || parsed < 0) {
      setRowErrorMessage(feature.id, "Enter a valid A La Carte price to save.");
      return;
    }
    clearRowError(feature.id);
    updateFeatureState(feature.id, { alaCartePrice: parsed });
    try {
      await updateFeature(feature.id, { alaCartePrice: parsed });
      const option = alaCarteMap.get(feature.id);
      if (option) {
        await updateAlaCarteOption(feature.id, { price: parsed });
        upsertOptionState(feature, { price: parsed });
      }
      requestMenuRefresh();
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to update A La Carte price", err);
      setRowErrorMessage(feature.id, "Failed to save price.");
    }
  };

  const updateRecommendedPairDraft = useCallback(
    (index: number, updates: Partial<{ label: string; optionIds: [string, string] }>) => {
      setPick2RecommendedPairsDraft((prev) =>
        prev.map((pair, idx) =>
          idx === index
            ? {
                label: updates.label ?? pair.label,
                optionIds: updates.optionIds ?? pair.optionIds,
              }
            : pair
        )
      );
    },
    []
  );

    const moveRecommendedPair = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPick2RecommendedPairsDraft((prev) => {
        if (toIndex < 0 || toIndex >= prev.length) return prev;
        const next = [...prev];
        const moved = next[fromIndex];
        if (moved === undefined) return prev;
        next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        void saveRecommendedPairs(next);
        return next;
      });
    },
    [saveRecommendedPairs]
  );

  const pick2PresetLabels = useMemo(() => {
    const labels = pick2RecommendedPairsDraft.map((pair) => pair.label.trim()).filter(Boolean);
    const seen = new Set<string>();
    return labels.filter((label) => {
      const normalized = label.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [pick2RecommendedPairsDraft]);

  const handlePlacementUpdate = async (
    feature: ProductFeature,
    column: number | null,
    position?: number
  ) => {
    const option = alaCarteMap.get(feature.id);
    const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
    const price = option?.price ?? feature.alaCartePrice;
    const isNew = option?.isNew ?? feature.alaCarteIsNew ?? false;
    const warranty = option?.warranty ?? feature.alaCarteWarranty ?? feature.warranty;
    const desiredColumn = column === null ? undefined : column;
    const desiredPosition =
      desiredColumn === undefined ? undefined : (position ?? option?.position);

    try {
      clearRowError(feature.id);
      if (desiredColumn === undefined) {
        await updateAlaCarteOption(feature.id, {
          column: undefined,
          position: undefined,
          connector: undefined,
        });
        upsertOptionState(feature, {
          column: undefined,
          position: undefined,
          connector: undefined,
          isPublished,
        });
      } else {
        await upsertAlaCarteFromFeature(
          {
            ...feature,
            publishToAlaCarte: feature.publishToAlaCarte ?? isPublished,
            alaCartePrice: price ?? feature.alaCartePrice,
          },
          {
            isPublished,
            column: desiredColumn,
            position: desiredPosition,
            price,
            isNew,
            warranty,
          }
        );
        upsertOptionState(feature, {
          column: desiredColumn,
          position: desiredPosition,
          isPublished,
        });
      }
      onAlaCarteChange?.();
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to update placement", err);
      setRowErrorMessage(feature.id, "Failed to update placement.");
    }
  };

  const handlePublishToggle = async (feature: ProductFeature, publish: boolean) => {
    clearRowError(feature.id);
    const option = alaCarteMap.get(feature.id);
    const inputValue = priceInputs[feature.id];
    const parsedInputPrice =
      inputValue !== undefined && inputValue !== "" ? Number(inputValue) : undefined;
    const price = option?.price ?? feature.alaCartePrice ?? parsedInputPrice;
    if (publish && (price === undefined || Number.isNaN(price) || price <= 0)) {
      setRowErrorMessage(feature.id, "Enter an A La Carte price before publishing.");
      return;
    }

    const previousPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
    const previousPrice = option?.price ?? feature.alaCartePrice;

    try {
      if (!publish) {
        await updateFeature(feature.id, { publishToAlaCarte: false });
        await unpublishAlaCarteFromFeature(feature.id);
        updateFeatureState(feature.id, { publishToAlaCarte: false });
        upsertOptionState(feature, { isPublished: false });
        markSaved(feature.id);
        clearRowError(feature.id);
      } else {
        const resolvedPrice = Number(price);
        const featurePayload = {
          ...feature,
          publishToAlaCarte: true,
          alaCartePrice: resolvedPrice,
        };
        await updateFeature(feature.id, {
          publishToAlaCarte: true,
          alaCartePrice: resolvedPrice,
        });
        await upsertAlaCarteFromFeature(featurePayload, {
          isPublished: true,
          column: option?.column,
          position: option?.position,
          price: resolvedPrice,
          isNew: option?.isNew ?? feature.alaCarteIsNew,
          warranty: option?.warranty ?? feature.alaCarteWarranty ?? feature.warranty,
        });
        updateFeatureState(feature.id, {
          publishToAlaCarte: true,
          alaCartePrice: resolvedPrice,
        });
        upsertOptionState(feature, {
          isPublished: true,
          price: resolvedPrice,
          column: option?.column,
          position: option?.position,
        });
        setPriceInputs((prev) => {
          const { [feature.id]: _removed, ...rest } = prev;
          return rest;
        });
        markSaved(feature.id);
        clearRowError(feature.id);
      }
      onAlaCarteChange?.();
      onDataUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to update publish status", err);
      setRowErrorMessage(feature.id, message);
      updateFeatureState(feature.id, {
        publishToAlaCarte: previousPublished,
        alaCartePrice: previousPrice,
      });
      upsertOptionState(feature, {
        isPublished: previousPublished,
        price: previousPrice,
        column: option?.column,
        position: option?.position,
      });
      clearSaved(feature.id);
    }
  };

  const handleDuplicateToLane = async (feature: ProductFeature, targetColumn: 1 | 2 | 3) => {
    if (!db) {
      setRowErrorMessage(feature.id, "Firebase is not connected.");
      return;
    }

    clearRowError(feature.id);

    try {
      const nextPosition = getNextPosition(targetColumn);
      const {
        id: _id,
        publishToAlaCarte: _publish,
        alaCartePrice: _price,
        alaCarteWarranty: _warranty,
        alaCarteIsNew: _isNew,
        ...rest
      } = feature;

      const payload: Omit<ProductFeature, "id"> = {
        ...rest,
        column: targetColumn,
        position: nextPosition,
        sourceFeatureId: feature.sourceFeatureId ?? feature.id,
      };

      const docRef = await addDoc(collection(db, "features"), payload);
      setFeatures((prev) => [...prev, { ...payload, id: docRef.id }]);
      onDataUpdate();
      markSaved(docRef.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to duplicate feature to lane", err);
      setRowErrorMessage(feature.id, `Failed to duplicate: ${message}`);
      clearSaved(feature.id);
    }
  };

  const handleEditDetails = (feature: ProductFeature) => {
    const rowEl = rowRefs.current[feature.id];
    const scheduleFrame =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(cb, 0);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
      scheduleFrame(() => {
        setEditingFeature(feature);
        setShowForm(true);
      });
      return;
    }
    setEditingFeature(feature);
    setShowForm(true);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingFeature(null);
    fetchData();
    onAlaCarteChange?.();
    onDataUpdate();
  };

  const selectedFeatures = useMemo(
    () => features.filter((feature) => selectedIds.has(feature.id)),
    [features, selectedIds]
  );

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredFeatures.map((f) => f.id)));
  };

  const toggleSelection = (featureId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  const runBulkAction = async (
    action: (feature: ProductFeature) => Promise<void> | void,
    featuresToProcess: ProductFeature[] = selectedFeatures
  ) => {
    if (featuresToProcess.length === 0) return;
    setIsBulkWorking(true);
    const failures: string[] = [];
    try {
      await Promise.all(
        featuresToProcess.map(async (feature) => {
          try {
            await action(feature);
          } catch (err) {
            console.error("Bulk action failed for feature", feature.id, err);
            failures.push(feature.name);
          }
        })
      );
      if (failures.length > 0) {
        setError(`Some items failed to update: ${failures.join(", ")}`);
      } else {
        setError(null);
      }
    } finally {
      setIsBulkWorking(false);
    }
  };

  const bulkPublishToggle = (publish: boolean) => {
    if (!publish) {
      return runBulkAction((feature) => handlePublishToggle(feature, publish));
    }
    const priced = selectedFeatures.filter((feature) => {
      const option = alaCarteMap.get(feature.id);
      const price = option?.price ?? feature.alaCartePrice ?? feature.price;
      return price !== undefined;
    });
    const missingPrice = selectedFeatures.filter((f) => !priced.includes(f));
    if (priced.length === 0) {
      setError("Selected items need an A La Carte price before publishing.");
      return;
    }
    if (missingPrice.length > 0) {
      setError("Some selected items are missing A La Carte prices and were skipped.");
    } else {
      setError(null);
    }
    return runBulkAction((feature) => handlePublishToggle(feature, publish), priced);
  };

  const bulkSetFeatured = (featured: boolean) =>
    runBulkAction((feature) => {
      const option = alaCarteMap.get(feature.id);
      const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
      if (!isPublished) return;
      return handlePlacementUpdate(feature, featured ? 4 : null, undefined);
    });

  const bulkSetCategory = (column: 1 | 2 | 3 | null) =>
    runBulkAction((feature) => {
      const option = alaCarteMap.get(feature.id);
      const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
      if (!isPublished) return;
      return handlePlacementUpdate(feature, column, undefined);
    });

  // Separate features into three sections for drag-and-drop
  const { unassignedFeatures, packagesFeatures, alaCarteFeatures } = useMemo(() => {
    // Products in packages take priority - they won't appear in A La Carte even if published
    const packages = filteredFeatures.filter(
      (f) => f.column === 1 || f.column === 2 || f.column === 3
    );
    const packageIds = new Set(packages.map((f) => f.id));

    // Only show in A La Carte if NOT in a package
    const alaCarte = filteredFeatures.filter((f) => {
      if (packageIds.has(f.id)) return false; // Exclude products already in packages
      const option = alaCarteMap.get(f.id);
      return option?.isPublished || f.publishToAlaCarte;
    });
    const alaCarteIds = new Set(alaCarte.map((f) => f.id));

    // Unassigned products: not in packages and not published to A La Carte
    const unassigned = filteredFeatures.filter((f) => {
      if (packageIds.has(f.id)) return false; // Exclude products in packages
      if (alaCarteIds.has(f.id)) return false; // Exclude products in A La Carte
      return true;
    });

    return {
      unassignedFeatures: sortOrderableItems(unassigned),
      packagesFeatures: sortOrderableItems(packages),
      alaCarteFeatures: sortOrderableItems(alaCarte),
    };
  }, [filteredFeatures, alaCarteMap]);

  // Get active feature being dragged
  const activeFeature = useMemo(() => {
    if (!activeId) return null;
    return features.find((f) => f.id === activeId) || null;
  }, [activeId, features]);

  // Drag-and-drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setFeaturesBackup([...features]);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback handled by DroppableColumn component
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const activeInUnassigned = unassignedFeatures.some((f) => f.id === activeIdStr);
    const activeInPackages = packagesFeatures.some((f) => f.id === activeIdStr);
    const activeInAlaCarte = alaCarteFeatures.some((f) => f.id === activeIdStr);
    if (!activeInUnassigned && !activeInPackages && !activeInAlaCarte) return;

    const activeLane = activeInUnassigned
      ? "unassigned"
      : activeInPackages
        ? "packages"
        : "alacarte";

    const overLane =
      overIdStr === "lane-unassigned"
        ? "unassigned"
        : overIdStr === "lane-packages"
          ? "packages"
          : overIdStr === "lane-alacarte"
            ? "alacarte"
            : (() => {
                const overInUnassigned = unassignedFeatures.some((f) => f.id === overIdStr);
                const overInPackages = packagesFeatures.some((f) => f.id === overIdStr);
                const overInAlaCarte = alaCarteFeatures.some((f) => f.id === overIdStr);
                if (!overInUnassigned && !overInPackages && !overInAlaCarte) return null;
                return overInUnassigned ? "unassigned" : overInPackages ? "packages" : "alacarte";
              })();

    if (!overLane) return;

    const sourceList =
      activeLane === "unassigned"
        ? unassignedFeatures
        : activeLane === "packages"
          ? packagesFeatures
          : alaCarteFeatures;
    const targetList =
      overLane === "unassigned"
        ? unassignedFeatures
        : overLane === "packages"
          ? packagesFeatures
          : alaCarteFeatures;

    const oldIndex = sourceList.findIndex((f) => f.id === activeIdStr);
    const newIndex = targetList.findIndex((f) => f.id === overIdStr);
    if (oldIndex === -1) return;

    let nextUnassigned = unassignedFeatures;
    let nextPackages = packagesFeatures;
    let nextAlaCarte = alaCarteFeatures;

    if (activeLane === overLane) {
      // Reordering within same column
      const reordered = arrayMove(
        sourceList,
        oldIndex,
        newIndex === -1 ? sourceList.length - 1 : newIndex
      );
      if (activeLane === "unassigned") {
        nextUnassigned = reordered;
      } else if (activeLane === "packages") {
        nextPackages = reordered;
      } else {
        nextAlaCarte = reordered;
      }
    } else {
      // Moving between columns
      const moving = sourceList[oldIndex];
      if (!moving) return;

      // When moving to unassigned, remove column and unpublish
      // When moving to packages, assign default package column
      // When moving to alacarte, publish the product and remove column
      const updatedMoving =
        overLane === "unassigned"
          ? { ...moving, column: undefined, publishToAlaCarte: false }
          : overLane === "packages"
            ? { ...moving, column: DEFAULT_PACKAGE_COLUMN, publishToAlaCarte: false }
            : { ...moving, column: undefined, publishToAlaCarte: true };

      const prunedSource = sourceList.filter((f) => f.id !== activeIdStr);
      const insertIndex = newIndex === -1 ? targetList.length : newIndex;
      const targetWithInsert = [
        ...targetList.slice(0, insertIndex),
        updatedMoving,
        ...targetList.slice(insertIndex),
      ];

      nextUnassigned =
        overLane === "unassigned"
          ? targetWithInsert
          : activeLane === "unassigned"
            ? prunedSource
            : unassignedFeatures;
      nextPackages =
        overLane === "packages"
          ? targetWithInsert
          : activeLane === "packages"
            ? prunedSource
            : packagesFeatures;
      nextAlaCarte =
        overLane === "alacarte"
          ? targetWithInsert
          : activeLane === "alacarte"
            ? prunedSource
            : alaCarteFeatures;
    }

    await applyDragUpdates(
      nextUnassigned.map((f, index) => ({ ...f, position: index })),
      nextPackages.map((f, index) => ({ ...f, position: index })),
      nextAlaCarte.map((f, index) => ({ ...f, position: index }))
    );
  };

  const applyDragUpdates = async (
    nextUnassigned: ProductFeature[],
    nextPackages: ProductFeature[],
    nextAlaCarte: ProductFeature[]
  ) => {
    setIsSaving(true);
    try {
      // Update unassigned features - remove column and unpublish
      const unassignedUpdates = nextUnassigned.map((f, index) => ({
        id: f.id,
        position: index,
        column: undefined as number | undefined,
        connector: f.connector,
        publishToAlaCarte: false,
      }));

      // Update packages features with position and column
      const packagesUpdates = nextPackages.map((f, index) => ({
        id: f.id,
        position: index,
        column: f.column ?? DEFAULT_PACKAGE_COLUMN, // Use existing column or default
        connector: f.connector,
      }));

      // Update alacarte features - publish them
      const alaCarteUpdates = nextAlaCarte.map((f, index) => ({
        id: f.id,
        position: index,
        column: undefined as number | undefined,
        connector: f.connector,
      }));

      // Update features state optimistically with position normalization
      const updatedFeatures = features.map((f) => {
        const unassignedUpdate = unassignedUpdates.find((u) => u.id === f.id);
        const packageUpdate = packagesUpdates.find((u) => u.id === f.id);
        const alaCarteUpdate = alaCarteUpdates.find((u) => u.id === f.id);
        if (unassignedUpdate) {
          return {
            ...f,
            position: unassignedUpdate.position,
            column: undefined,
            publishToAlaCarte: false,
          };
        }
        if (packageUpdate) {
          return {
            ...f,
            position: packageUpdate.position,
            column: packageUpdate.column,
            publishToAlaCarte: false,
          };
        }
        if (alaCarteUpdate) {
          return {
            ...f,
            position: alaCarteUpdate.position,
            column: undefined,
            publishToAlaCarte: true,
          };
        }
        return f;
      });

      // Normalize positions: group features and ensure contiguous positions
      const normalizedFeatures: ProductFeature[] = (() => {
        const groups = new Map<string, ProductFeature[]>();

        for (const feature of updatedFeatures) {
          const groupKey =
            feature.publishToAlaCarte || feature.column === undefined
              ? "alacarte"
              : `package-${feature.column ?? DEFAULT_PACKAGE_COLUMN}`;

          const group = groups.get(groupKey);
          if (group) {
            group.push(feature);
          } else {
            groups.set(groupKey, [feature]);
          }
        }

        const result: ProductFeature[] = [];
        for (const group of groups.values()) {
          group.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          group.forEach((item, index) => {
            result.push({ ...item, position: index });
          });
        }

        return result;
      })();

      setFeatures(normalizedFeatures);

      // Persist to Firestore
      await batchUpdateFeaturesPositions([
        ...unassignedUpdates,
        ...packagesUpdates,
        ...alaCarteUpdates,
      ]);

      // For items moved to alacarte, publish them
      for (const f of nextAlaCarte) {
        const option = alaCarteMap.get(f.id);
        if (!option?.isPublished && f.publishToAlaCarte) {
          await upsertAlaCarteFromFeature(f, {
            isPublished: true,
            price: f.alaCartePrice ?? f.price,
          });
          upsertOptionState(f, { isPublished: true });
        }
      }

      // For items moved to unassigned, unpublish them
      for (const f of nextUnassigned) {
        const option = alaCarteMap.get(f.id);
        if (option?.isPublished) {
          await upsertAlaCarteFromFeature(f, {
            isPublished: false,
          });
          upsertOptionState(f, { isPublished: false });
        }
      }

      // For items moved to packages, unpublish them from A La Carte
      for (const f of nextPackages) {
        const option = alaCarteMap.get(f.id);
        if (option?.isPublished) {
          await unpublishAlaCarteFromFeature(f.id);
          upsertOptionState(f, { isPublished: false });
        }
      }

      onDataUpdate();
      onAlaCarteChange?.();
    } catch (err) {
      console.error("Error saving drag updates:", err);
      setFeatures(featuresBackup);
      setError("Failed to save changes. Changes have been rolled back.");
    } finally {
      setIsSaving(false);
    }
  };

  // Pick2 callbacks for SortableProductCard
  const handlePick2EligibleChange = useCallback(async (
    feature: ProductFeature,
    option: AlaCarteOption | undefined,
    next: boolean
  ) => {
    const previous = Boolean(option?.pick2Eligible);
    if (option || next) {
      upsertOptionState(feature, { pick2Eligible: next });
    }
    clearRowError(feature.id);
    try {
      if (!option) {
        if (next) {
          const resolvedPrice = feature.alaCartePrice ?? option?.price ?? feature.price;
          await upsertAlaCarteFromFeature(
            {
              ...feature,
              alaCartePrice: resolvedPrice,
              publishToAlaCarte: feature.publishToAlaCarte ?? false,
            },
            {
              isPublished: false,
              price: resolvedPrice,
              pick2Eligible: true,
            }
          );
          upsertOptionState(feature, { isPublished: false, price: resolvedPrice, pick2Eligible: true });
        }
        requestMenuRefresh();
        markSaved(feature.id);
        return;
      }
      await updateAlaCarteOption(feature.id, { pick2Eligible: next });
      requestMenuRefresh();
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to save pick2Eligible", err);
      if (option || next) {
        upsertOptionState(feature, { pick2Eligible: previous });
      }
      setRowErrorMessage(feature.id, "Failed to save Pick2 Eligible.");
    }
  }, [requestMenuRefresh]);

  const handlePick2SortBlur = useCallback(async (
    feature: ProductFeature,
    option: AlaCarteOption | undefined,
    raw: string
  ) => {
    if (!option && !(option?.pick2Eligible ?? false)) return;
    const trimmed = raw.trim();
    const previous = option?.pick2Sort;

    if (!trimmed) {
      if (option) {
        upsertOptionState(feature, { pick2Sort: undefined });
      }
      clearRowError(feature.id);
      try {
        if (!option) {
          const resolvedPrice = feature.alaCartePrice ?? feature.price;
          await upsertAlaCarteFromFeature(
            {
              ...feature,
              alaCartePrice: resolvedPrice,
              publishToAlaCarte: feature.publishToAlaCarte ?? false,
            },
            {
              isPublished: false,
              price: resolvedPrice,
              pick2Eligible: true,
              pick2Sort: undefined,
            }
          );
          upsertOptionState(feature, { isPublished: false, price: resolvedPrice, pick2Sort: undefined });
          requestMenuRefresh();
          markSaved(feature.id);
          return;
        }
        await updateAlaCarteOption(feature.id, { pick2Sort: undefined });
        requestMenuRefresh();
        markSaved(feature.id);
      } catch (err) {
        console.error("Failed to clear pick2Sort", err);
        if (option) {
          upsertOptionState(feature, { pick2Sort: previous });
        }
        setRowErrorMessage(feature.id, "Failed to save Pick2 Sort.");
      }
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setRowErrorMessage(feature.id, "Pick2 Sort must be a valid number (0 or greater).");
      return;
    }

    if (option) {
      upsertOptionState(feature, { pick2Sort: parsed });
    }
    clearRowError(feature.id);
    try {
      if (!option) {
        const resolvedPrice = feature.alaCartePrice ?? feature.price;
        await upsertAlaCarteFromFeature(
          {
            ...feature,
            alaCartePrice: resolvedPrice,
            publishToAlaCarte: feature.publishToAlaCarte ?? false,
          },
          {
            isPublished: false,
            price: resolvedPrice,
            pick2Eligible: true,
            pick2Sort: parsed,
          }
        );
        upsertOptionState(feature, { isPublished: false, price: resolvedPrice, pick2Sort: parsed });
        requestMenuRefresh();
        markSaved(feature.id);
        return;
      }
      await updateAlaCarteOption(feature.id, { pick2Sort: parsed });
      requestMenuRefresh();
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to save pick2Sort", err);
      if (option) {
        upsertOptionState(feature, { pick2Sort: previous });
      }
      setRowErrorMessage(feature.id, "Failed to save Pick2 Sort.");
    }
  }, [requestMenuRefresh]);

  const handlePick2ShortValueBlur = useCallback(async (
    feature: ProductFeature,
    option: AlaCarteOption | undefined,
    raw: string
  ) => {
    if (!option && !(option?.pick2Eligible ?? false)) return;
    const trimmed = raw.trim();
    const next = trimmed ? trimmed : undefined;
    const previous = option?.shortValue;

    if (option) {
      upsertOptionState(feature, { shortValue: next });
    }
    clearRowError(feature.id);
    try {
      if (!option) {
        const resolvedPrice = feature.alaCartePrice ?? feature.price;
        await upsertAlaCarteFromFeature(
          {
            ...feature,
            alaCartePrice: resolvedPrice,
            publishToAlaCarte: feature.publishToAlaCarte ?? false,
          },
          {
            isPublished: false,
            price: resolvedPrice,
            pick2Eligible: true,
            shortValue: next,
          }
        );
        upsertOptionState(feature, { isPublished: false, price: resolvedPrice, shortValue: next });
        requestMenuRefresh();
        markSaved(feature.id);
        return;
      }
      await updateAlaCarteOption(feature.id, { shortValue: next });
      requestMenuRefresh();
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to save shortValue", err);
      if (option) {
        upsertOptionState(feature, { shortValue: previous });
      }
      setRowErrorMessage(feature.id, "Failed to save Short Value.");
    }
  }, [requestMenuRefresh]);

  const handlePick2HighlightsBlur = useCallback(async (
    feature: ProductFeature,
    option: AlaCarteOption | undefined,
    line1: string,
    line2: string
  ) => {
    if (!option && !(option?.pick2Eligible ?? false)) return;

    const nextHighlights = [line1.trim(), line2.trim()].filter(Boolean).slice(0, 2);
    const next = nextHighlights.length > 0 ? nextHighlights : undefined;
    const previous = option?.highlights;

    if (option) {
      upsertOptionState(feature, { highlights: next });
    }
    clearRowError(feature.id);
    try {
      if (!option) {
        const resolvedPrice = feature.alaCartePrice ?? feature.price;
        await upsertAlaCarteFromFeature(
          {
            ...feature,
            alaCartePrice: resolvedPrice,
            publishToAlaCarte: feature.publishToAlaCarte ?? false,
          },
          {
            isPublished: false,
            price: resolvedPrice,
            pick2Eligible: true,
            highlights: nextHighlights,
          }
        );
        upsertOptionState(feature, { isPublished: false, price: resolvedPrice, highlights: next });
        requestMenuRefresh();
        markSaved(feature.id);
        return;
      }
      await updateAlaCarteOption(feature.id, { highlights: next });
      requestMenuRefresh();
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to save highlights", err);
      if (option) {
        upsertOptionState(feature, { highlights: previous });
      }
      setRowErrorMessage(feature.id, "Failed to save Highlights.");
    }
  }, [requestMenuRefresh]);

  const handlePriceInputChange = useCallback((featureId: string, value: string) => {
    setPriceInputs((prev) => ({
      ...prev,
      [featureId]: value,
    }));
  }, []);

  if (isLoading) {
    return <p className="text-gray-400">Loading Product Hub...</p>;
  }

  const renderProductCard = (feature: ProductFeature) => {
    const option = alaCarteMap.get(feature.id);
    return (
      <SortableProductCard
        key={feature.id}
        feature={feature}
        option={option}
        onEdit={handleEditDetails}
        onDuplicate={handleDuplicateToLane}
        isSelected={selectedIds.has(feature.id)}
        onToggleSelection={toggleSelection}
        isExpanded={expandedIds.has(feature.id)}
        onToggleExpanded={toggleRowExpanded}
        rowError={rowErrors[feature.id]}
        isSaved={savedIds.has(feature.id)}
        priceInputValue={priceInputs[feature.id]}
        onPackagePlacement={handlePackagePlacement}
        onPublishToggle={handlePublishToggle}
        onPriceInputChange={handlePriceInputChange}
        onPriceBlur={handlePriceBlur}
        onPick2EligibleChange={handlePick2EligibleChange}
        onPick2SortBlur={handlePick2SortBlur}
        onPick2ShortValueBlur={handlePick2ShortValueBlur}
        onPick2HighlightsBlur={handlePick2HighlightsBlur}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-2xl font-teko tracking-wider text-white">Product Hub</h3>
          <p className="text-sm text-gray-400">
            Manage package placement and A La Carte visibility from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingFeature(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            aria-label="Add new product"
          >
            + Add Product
          </button>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white w-full md:w-72"
          />
        </div>
      </div>

      {packages && onRecommendedChange && typeof recommendedSelection === "string" ? (
        <RecommendedPackagePanel
          packages={packages}
          recommendedSelection={recommendedSelection}
          isSavingRecommended={isSavingRecommended}
          recommendedMessage={recommendedMessage}
          recommendedError={recommendedError}
          onRecommendedChange={onRecommendedChange}
          elitePackageId={elitePackageId}
          platinumPackageId={platinumPackageId}
          goldPackageId={goldPackageId}
        />
      ) : null}

      <DuplicatesPanel possibleDuplicates={possibleDuplicates} />

      <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-300 font-semibold">You Pick 2 Config</p>
            <p className="text-xs text-gray-500">
              Stored at <span className="text-gray-400">app_config/pick2</span>.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {isSavingPick2Config ? <span className="text-blue-400">Saving...</span> : null}
          </div>
        </div>

        {pick2ConfigError ? <p className="text-red-400 text-sm mt-2">{pick2ConfigError}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={pick2Enabled}
                onChange={async (e) => {
                  const next = e.target.checked;
                  const prev = pick2Enabled;
                  setPick2Enabled(next);
                  setPick2Config((cfg) => (cfg ? { ...cfg, enabled: next } : cfg));
                  setPick2ConfigError(null);
                  setIsSavingPick2Config(true);
                  try {
                    await updatePick2Config({ enabled: next });
                    requestMenuRefresh();
                  } catch (err) {
                    console.error("Failed to save Pick2 enabled", err);
                    setPick2Enabled(prev);
                    setPick2Config((cfg) => (cfg ? { ...cfg, enabled: prev } : cfg));
                    setPick2ConfigError("Failed to save Pick2 enabled.");
                  } finally {
                    setIsSavingPick2Config(false);
                  }
                }}
              />
              <span>Enabled</span>
            </label>
          </div>

          <div>
            <label htmlFor="pick2-bundle-price" className="text-xs text-gray-400 block mb-1">
              Bundle Price
            </label>
            <input
              id="pick2-bundle-price"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={pick2PriceInput}
              onChange={(e) => setPick2PriceInput(e.target.value)}
              onBlur={async () => {
                const trimmed = pick2PriceInput.trim();
                if (!trimmed) {
                  setPick2ConfigError("Bundle price is required.");
                  setPick2PriceInput(pick2Config ? String(pick2Config.price) : "");
                  return;
                }

                const parsed = Number(trimmed);
                if (!Number.isFinite(parsed) || parsed < 0) {
                  setPick2ConfigError("Enter a valid bundle price (0 or greater). ");
                  setPick2PriceInput(pick2Config ? String(pick2Config.price) : "");
                  return;
                }

                setPick2ConfigError(null);
                setIsSavingPick2Config(true);
                const prev = pick2Config?.price;
                setPick2Config((cfg) => (cfg ? { ...cfg, price: parsed } : cfg));
                try {
                  await updatePick2Config({ price: parsed });
                  requestMenuRefresh();
                } catch (err) {
                  console.error("Failed to save Pick2 price", err);
                  if (prev !== undefined) {
                    setPick2Config((cfg) => (cfg ? { ...cfg, price: prev } : cfg));
                    setPick2PriceInput(String(prev));
                  }
                  setPick2ConfigError("Failed to save bundle price.");
                } finally {
                  setIsSavingPick2Config(false);
                }
              }}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
            />
          </div>

          <div>
            <label htmlFor="pick2-title" className="text-xs text-gray-400 block mb-1">
              Optional Title
            </label>
            <input
              id="pick2-title"
              type="text"
              value={pick2TitleInput}
              onChange={(e) => setPick2TitleInput(e.target.value)}
              onBlur={async () => {
                const trimmed = pick2TitleInput.trim();
                const next = trimmed ? trimmed : undefined;
                const prev = pick2Config?.title;

                setPick2ConfigError(null);
                setIsSavingPick2Config(true);
                setPick2Config((cfg) => (cfg ? { ...cfg, title: next } : cfg));
                try {
                  await updatePick2Config({ title: next });
                  requestMenuRefresh();
                } catch (err) {
                  console.error("Failed to save Pick2 title", err);
                  setPick2Config((cfg) => (cfg ? { ...cfg, title: prev } : cfg));
                  setPick2TitleInput(prev ?? "");
                  setPick2ConfigError("Failed to save Pick2 title.");
                } finally {
                  setIsSavingPick2Config(false);
                }
              }}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
              placeholder={pick2Config?.title ?? "(optional)"}
            />
          </div>

          <div>
            <label htmlFor="pick2-subtitle" className="text-xs text-gray-400 block mb-1">
              Optional Subtitle
            </label>
            <input
              id="pick2-subtitle"
              type="text"
              value={pick2SubtitleInput}
              onChange={(e) => setPick2SubtitleInput(e.target.value)}
              onBlur={async () => {
                const trimmed = pick2SubtitleInput.trim();
                const next = trimmed ? trimmed : undefined;
                const prev = pick2Config?.subtitle;

                setPick2ConfigError(null);
                setIsSavingPick2Config(true);
                setPick2Config((cfg) => (cfg ? { ...cfg, subtitle: next } : cfg));
                try {
                  await updatePick2Config({ subtitle: next });
                  requestMenuRefresh();
                } catch (err) {
                  console.error("Failed to save Pick2 subtitle", err);
                  setPick2Config((cfg) => (cfg ? { ...cfg, subtitle: prev } : cfg));
                  setPick2SubtitleInput(prev ?? "");
                  setPick2ConfigError("Failed to save Pick2 subtitle.");
                } finally {
                  setIsSavingPick2Config(false);
                }
              }}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
              placeholder={pick2Config?.subtitle ?? "(optional)"}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">
            Recommended pairs (up to {maxRecommendedPairs})
          </p>
          {pick2EligibleOptions.length === 0 ? (
            <p className="text-xs text-gray-500 mt-1">
              Pick2 eligible items are required to configure presets.
            </p>
          ) : (
            <>
              <div className="mt-2">
                <label htmlFor="pick2-featured-preset" className="text-xs text-gray-400 block mb-1">Featured preset</label>
                <select
                  id="pick2-featured-preset"
                  value={pick2FeaturedPresetLabel}
                  onChange={async (e) => {
                    const nextRaw = e.target.value;
                    const nextTrimmed = nextRaw.trim();
                    const nextValue = nextTrimmed.length > 0 ? nextTrimmed : undefined;
                    const prev = pick2Config?.featuredPresetLabel;

                    setPick2FeaturedPresetLabel(nextTrimmed);
                    setPick2ConfigError(null);
                    setIsSavingPick2Config(true);
                    setPick2Config((cfg) => (cfg ? { ...cfg, featuredPresetLabel: nextValue } : cfg));
                    try {
                      await updatePick2Config({ featuredPresetLabel: nextValue });
                      requestMenuRefresh();
                    } catch (err) {
                      console.error("Failed to save featured preset", err);
                      setPick2Config((cfg) =>
                        cfg ? { ...cfg, featuredPresetLabel: prev } : cfg
                      );
                      setPick2FeaturedPresetLabel(prev ?? "");
                      setPick2ConfigError("Failed to save featured preset.");
                    } finally {
                      setIsSavingPick2Config(false);
                    }
                  }}
                  disabled={pick2PresetLabels.length === 0}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
                >
                  <option value="">None</option>
                  {pick2PresetLabels.map((label) => (
                    <option key={`pick2-featured-${label}`} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 space-y-3">
                {pick2RecommendedPairsDraft.map((pair, index) => (
                  <div
                    key={`pick2-pair-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2"
                  >
                    <input
                      type="text"
                      value={pair.label}
                      onChange={(e) => updateRecommendedPairDraft(index, { label: e.target.value })}
                      onBlur={() => saveRecommendedPairs(pick2RecommendedPairsDraft)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                      placeholder={`Preset label ${index + 1}`}
                    />
                    <select
                      value={pair.optionIds[0]}
                      onChange={(e) =>
                        updateRecommendedPairDraft(index, {
                          optionIds: [e.target.value, pair.optionIds[1]],
                        })
                      }
                      onBlur={() => saveRecommendedPairs(pick2RecommendedPairsDraft)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="">Pick 1</option>
                      {pick2EligibleOptions.map((opt) => (
                        <option key={`pick2-pair-${index}-1-${opt.id}`} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={pair.optionIds[1]}
                      onChange={(e) =>
                        updateRecommendedPairDraft(index, {
                          optionIds: [pair.optionIds[0], e.target.value],
                        })
                      }
                      onBlur={() => saveRecommendedPairs(pick2RecommendedPairsDraft)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="">Pick 2</option>
                      {pick2EligibleOptions.map((opt) => (
                        <option key={`pick2-pair-${index}-2-${opt.id}`} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => moveRecommendedPair(index, index - 1)}
                        disabled={index === 0}
                        className="px-2 py-1 text-xs border border-gray-700 rounded text-gray-200 hover:border-lux-gold/60 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRecommendedPair(index, index + 1)}
                        disabled={index === pick2RecommendedPairsDraft.length - 1}
                        className="px-2 py-1 text-xs border border-gray-700 rounded text-gray-200 hover:border-lux-gold/60 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <FilterBar
        packageLaneFilter={packageLaneFilter}
        publishFilter={publishFilter}
        featuredFilter={featuredFilter}
        categoryFilter={categoryFilter}
        onPackageLaneFilterChange={setPackageLaneFilter}
        onPublishFilterChange={setPublishFilter}
        onFeaturedFilterChange={setFeaturedFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      <BulkActionsBar
        bulkSelectRef={bulkSelectRef}
        allFilteredSelected={allFilteredSelected}
        selectedCount={selectedIds.size}
        selectedFeatureCount={selectedFeatures.length}
        isBulkWorking={isBulkWorking}
        onSelectAll={handleSelectAll}
        onBulkPublish={bulkPublishToggle}
        onBulkSetFeatured={bulkSetFeatured}
        onBulkSetCategory={bulkSetCategory}
      />

      {error && (
        <p className="text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded">{error}</p>
      )}

      {showForm && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <FeatureForm
            onSaveSuccess={handleFormSaved}
            editingFeature={editingFeature ?? undefined}
            onCancelEdit={() => setShowForm(false)}
          />
        </div>
      )}

      {isSaving && (
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <svg
            className="animate-spin h-4 w-4"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Saving changes...
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Unassigned Products Section - shows when there are unassigned products */}
        {unassignedFeatures.length > 0 && (
          <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/30 space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-teko tracking-wider text-blue-400">
                  Unassigned Products
                </h4>
                <p className="text-xs text-blue-300/70 mt-1">
                  Products that haven't been assigned to Packages or published to A La Carte yet.
                  Drag them to the sections below to assign them.
                </p>
                <p className="text-[11px] text-blue-300/60 mt-1">
                  Ordering saves by lane position. Package lane assignment overrides A La Carte visibility.
                </p>
              </div>
              <span className="text-sm text-blue-400 font-semibold">
                {unassignedFeatures.length}{" "}
                {unassignedFeatures.length === 1 ? "product" : "products"}
              </span>
            </div>
            <DroppableColumn columnId="unassigned">
              <SortableContext
                items={unassignedFeatures.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {unassignedFeatures.map(renderProductCard)}
                </div>
              </SortableContext>
            </DroppableColumn>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Packages */}
          <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 space-y-4">
            <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm pb-3 border-b border-gray-700">
              <h4 className="text-xl font-teko tracking-wider text-gray-200">Packages Section</h4>
              <p className="text-xs text-gray-400 mt-1">
                Products in Gold, Elite, or Platinum packages (Columns 1, 2, 3)
              </p>
            </div>
            <DroppableColumn columnId="packages">
              {packagesFeatures.length === 0 ? (
                <p className="text-gray-500 text-sm italic p-4">
                  No products in packages. Drag items here to add to packages.
                </p>
              ) : (
                <SortableContext
                  items={packagesFeatures.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {packagesFeatures.map(renderProductCard)}
                  </div>
                </SortableContext>
              )}
            </DroppableColumn>
          </div>

          {/* Right Column: A La Carte */}
          <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 space-y-4">
            <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm pb-3 border-b border-gray-700">
              <h4 className="text-xl font-teko tracking-wider text-gray-200">A La Carte Section</h4>
              <p className="text-xs text-gray-400 mt-1">
                Published products available for a la carte selection
              </p>
            </div>
            <DroppableColumn columnId="alacarte">
              {alaCarteFeatures.length === 0 ? (
                <p className="text-gray-500 text-sm italic p-4">
                  No published a la carte products. Drag items here to publish.
                </p>
              ) : (
                <SortableContext
                  items={alaCarteFeatures.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {alaCarteFeatures.map(renderProductCard)}
                  </div>
                </SortableContext>
              )}
            </DroppableColumn>
          </div>
        </div>

        <DragOverlay>
          {activeFeature ? <DragOverlayItem feature={activeFeature} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
