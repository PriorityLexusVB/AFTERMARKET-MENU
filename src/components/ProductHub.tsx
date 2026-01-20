import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore/lite";
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
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db } from "../firebase";
import type { AlaCarteOption, ProductFeature } from "../types";
import {
  updateFeature,
  upsertAlaCarteFromFeature,
  unpublishAlaCarteFromFeature,
  updateAlaCarteOption,
  batchUpdateFeaturesPositions,
} from "../data";
import { FeatureForm } from "./FeatureForm";
import { sortOrderableItems } from "../utils/featureOrdering";

interface ProductHubProps {
  onDataUpdate: () => void;
  onAlaCarteChange?: () => void;
  initialFeatures?: ProductFeature[];
  initialAlaCarteOptions?: AlaCarteOption[];
  scrollTargetId?: string | null;
  onScrollHandled?: () => void;
}

// Default package column when moving items to packages section
const DEFAULT_PACKAGE_COLUMN: 1 | 2 | 3 = 2; // Elite Package

const columnLabels: Record<1 | 2 | 3, string> = {
  1: "Gold Package (Column 1)",
  2: "Elite Package (Column 2)",
  3: "Platinum Package (Column 3)",
};

export const ProductHub: React.FC<ProductHubProps> = ({
  onDataUpdate,
  onAlaCarteChange,
  initialFeatures,
  initialAlaCarteOptions,
  scrollTargetId,
  onScrollHandled,
}) => {
  const [features, setFeatures] = useState<ProductFeature[]>(
    initialFeatures ?? []
  );
  const [alaCarteOptions, setAlaCarteOptions] = useState<AlaCarteOption[]>(
    initialAlaCarteOptions ?? []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [packageLaneFilter, setPackageLaneFilter] = useState<
    "all" | "1" | "2" | "3" | "none"
  >("all");
  const [publishFilter, setPublishFilter] = useState<
    "all" | "published" | "unpublished"
  >("all");
  const [featuredFilter, setFeaturedFilter] = useState<
    "all" | "featured" | "not-featured"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "1" | "2" | "3" | "unplaced" | "featured"
  >("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [isLoading, setIsLoading] = useState(initialFeatures ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Drag-and-drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [featuresBackup, setFeaturesBackup] = useState<ProductFeature[]>([]);
  
  const bulkSelectRef = useRef<HTMLInputElement>(null);
  const headerSelectRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const isMounted = useRef(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
        featuresSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ProductFeature)
        )
      );
      setAlaCarteOptions(
        alaCarteSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as AlaCarteOption)
        )
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
      if (packageLaneFilter !== "all" && packageLaneFilter !== lane)
        return false;

      const isPublished =
        option?.isPublished ?? feature.publishToAlaCarte ?? false;
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
        if (categoryFilter === "unplaced" && categoryValue !== "unplaced")
          return false;
        if (categoryFilter === "featured" && categoryValue !== "featured")
          return false;
        if (
          !["unplaced", "featured"].includes(categoryFilter) &&
          categoryFilter !== categoryValue
        )
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
    () =>
      filteredFeatures.length > 0 &&
      filteredFeatures.every((f) => selectedIds.has(f.id)),
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

  const updateFeatureState = (
    featureId: string,
    updates: Partial<ProductFeature>
  ) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, ...updates } : f))
    );
  };

  const upsertOptionState = (
    feature: ProductFeature,
    updates: Partial<AlaCarteOption>
  ) => {
    setAlaCarteOptions((prev) => {
      const existing = prev.find((o) => o.id === feature.id);
      if (existing) {
        return prev.map((o) =>
          o.id === feature.id ? { ...o, ...updates } : o
        );
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
    const positions = features
      .filter((f) => f.column === column)
      .map((f) => f.position ?? 0);
    if (positions.length === 0) return 0;
    return Math.max(...positions) + 1;
  };

  const handlePackagePlacement = async (
    feature: ProductFeature,
    column: 1 | 2 | 3 | undefined
  ) => {
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
      (feature.alaCartePrice !== undefined
        ? feature.alaCartePrice.toString()
        : "");
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
      if (option?.isPublished) {
        await upsertAlaCarteFromFeature(
          {
            ...feature,
            alaCartePrice: parsed,
            publishToAlaCarte: feature.publishToAlaCarte ?? true,
          },
          { isPublished: true, price: parsed }
        );
        upsertOptionState(feature, { price: parsed });
      }
      markSaved(feature.id);
    } catch (err) {
      console.error("Failed to update A La Carte price", err);
      setRowErrorMessage(feature.id, "Failed to save price.");
    }
  };

  const handlePlacementUpdate = async (
    feature: ProductFeature,
    column: number | null,
    position?: number
  ) => {
    const option = alaCarteMap.get(feature.id);
    const isPublished =
      option?.isPublished ?? feature.publishToAlaCarte ?? false;
    const price = option?.price ?? feature.alaCartePrice;
    const isNew = option?.isNew ?? feature.alaCarteIsNew ?? false;
    const warranty =
      option?.warranty ?? feature.alaCarteWarranty ?? feature.warranty;
    const desiredColumn = column === null ? undefined : column;
    const desiredPosition =
      desiredColumn === undefined ? undefined : position ?? option?.position;

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

  const handlePublishToggle = async (
    feature: ProductFeature,
    publish: boolean
  ) => {
    clearRowError(feature.id);
    const option = alaCarteMap.get(feature.id);
    const inputValue = priceInputs[feature.id];
    const parsedInputPrice =
      inputValue !== undefined && inputValue !== ""
        ? Number(inputValue)
        : undefined;
    const price = option?.price ?? feature.alaCartePrice ?? parsedInputPrice;
    if (publish && (price === undefined || Number.isNaN(price) || price <= 0)) {
      setRowErrorMessage(
        feature.id,
        "Enter an A La Carte price before publishing."
      );
      return;
    }

    const previousPublished =
      option?.isPublished ?? feature.publishToAlaCarte ?? false;
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
          warranty:
            option?.warranty ?? feature.alaCarteWarranty ?? feature.warranty,
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

  const handleDuplicateToLane = async (
    feature: ProductFeature,
    targetColumn: 1 | 2 | 3
  ) => {
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
      setError(
        "Some selected items are missing A La Carte prices and were skipped."
      );
    } else {
      setError(null);
    }
    return runBulkAction(
      (feature) => handlePublishToggle(feature, publish),
      priced
    );
  };

  const bulkSetFeatured = (featured: boolean) =>
    runBulkAction((feature) => {
      const option = alaCarteMap.get(feature.id);
      const isPublished =
        option?.isPublished ?? feature.publishToAlaCarte ?? false;
      if (!isPublished) return;
      return handlePlacementUpdate(feature, featured ? 4 : null, undefined);
    });

  const bulkSetCategory = (column: 1 | 2 | 3 | null) =>
    runBulkAction((feature) => {
      const option = alaCarteMap.get(feature.id);
      const isPublished =
        option?.isPublished ?? feature.publishToAlaCarte ?? false;
      if (!isPublished) return;
      return handlePlacementUpdate(feature, column, undefined);
    });

  // Separate features into two columns for drag-and-drop
  const { packagesFeatures, alaCarteFeatures } = useMemo(() => {
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
    return {
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

    const activeInPackages = packagesFeatures.some((f) => f.id === activeIdStr);
    const activeInAlaCarte = alaCarteFeatures.some((f) => f.id === activeIdStr);
    if (!activeInPackages && !activeInAlaCarte) return;

    const activeLane = activeInPackages ? "packages" : "alacarte";

    const overLane =
      overIdStr === "lane-packages"
        ? "packages"
        : overIdStr === "lane-alacarte"
          ? "alacarte"
          : (() => {
              const overInPackages = packagesFeatures.some((f) => f.id === overIdStr);
              const overInAlaCarte = alaCarteFeatures.some((f) => f.id === overIdStr);
              if (!overInPackages && !overInAlaCarte) return null;
              return overInPackages ? "packages" : "alacarte";
            })();

    if (!overLane) return;

    const sourceList = activeLane === "packages" ? packagesFeatures : alaCarteFeatures;
    const targetList = overLane === "packages" ? packagesFeatures : alaCarteFeatures;

    const oldIndex = sourceList.findIndex((f) => f.id === activeIdStr);
    const newIndex = targetList.findIndex((f) => f.id === overIdStr);
    if (oldIndex === -1) return;

    let nextPackages = packagesFeatures;
    let nextAlaCarte = alaCarteFeatures;

    if (activeLane === overLane) {
      // Reordering within same column
      const reordered = arrayMove(
        sourceList,
        oldIndex,
        newIndex === -1 ? sourceList.length - 1 : newIndex
      );
      if (activeLane === "packages") {
        nextPackages = reordered;
      } else {
        nextAlaCarte = reordered;
      }
    } else {
      // Moving between columns
      const moving = sourceList[oldIndex];
      if (!moving) return;

      // When moving to packages, assign default package column
      // When moving to alacarte, publish the product and remove column
      const updatedMoving =
        overLane === "packages"
          ? { ...moving, column: DEFAULT_PACKAGE_COLUMN, publishToAlaCarte: false }
          : { ...moving, column: undefined, publishToAlaCarte: true };

      const prunedSource = sourceList.filter((f) => f.id !== activeIdStr);
      const insertIndex = newIndex === -1 ? targetList.length : newIndex;
      const targetWithInsert = [
        ...targetList.slice(0, insertIndex),
        updatedMoving,
        ...targetList.slice(insertIndex),
      ];

      nextPackages = overLane === "packages" ? targetWithInsert : prunedSource;
      nextAlaCarte = overLane === "alacarte" ? targetWithInsert : prunedSource;
    }

    await applyDragUpdates(
      nextPackages.map((f, index) => ({ ...f, position: index })),
      nextAlaCarte.map((f, index) => ({ ...f, position: index }))
    );
  };

  const applyDragUpdates = async (
    nextPackages: ProductFeature[],
    nextAlaCarte: ProductFeature[]
  ) => {
    setIsSaving(true);
    try {
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

      // Update features state optimistically
      const updatedFeatures = features.map((f) => {
        const packageUpdate = packagesUpdates.find((u) => u.id === f.id);
        const alaCarteUpdate = alaCarteUpdates.find((u) => u.id === f.id);
        if (packageUpdate) {
          return { ...f, position: packageUpdate.position, column: packageUpdate.column, publishToAlaCarte: false };
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
      setFeatures(updatedFeatures);

      // Persist to Firestore
      await batchUpdateFeaturesPositions([...packagesUpdates, ...alaCarteUpdates]);

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

  const getCategoryLabel = (option?: AlaCarteOption) => {
    if (!option) return "Not placed";
    if (option.column === 4) return "Featured";
    if (option.column)
      return columnLabels[option.column as 1 | 2 | 3] ?? "Placed";
    return "Not placed";
  };


  // Sortable Product Card Component
  interface SortableProductCardProps {
    feature: ProductFeature;
    option?: AlaCarteOption;
    onEdit: (feature: ProductFeature) => void;
    onDuplicate: (feature: ProductFeature, column: 1 | 2 | 3) => void;
    isSelected: boolean;
    onToggleSelection: (featureId: string) => void;
  }

  const SortableProductCard: React.FC<SortableProductCardProps> = ({
    feature,
    option,
    onEdit,
    onDuplicate,
    isSelected,
    onToggleSelection,
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: feature.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
    const isFeatured = option?.column === 4;
    const laneLabel = feature.column
      ? columnLabels[feature.column as 1 | 2 | 3] ?? "Not in packages"
      : "Not in packages";
    const categoryLabel = getCategoryLabel(option);
    // Display position as 1-based (position + 1) for user clarity, consistent with position badge
    const positionLabel =
      feature.position !== undefined ? `Position ${feature.position + 1}` : "Position —";

    const [showDuplicateMenu, setShowDuplicateMenu] = useState(false);
    const isExpanded = expandedIds.has(feature.id);
    const duplicateMenuRef = useRef<HTMLDivElement>(null);

    // Click-outside handler to close duplicate menu
    useEffect(() => {
      if (!showDuplicateMenu) return;
      
      const handleClickOutside = (event: MouseEvent) => {
        if (duplicateMenuRef.current && !duplicateMenuRef.current.contains(event.target as Node)) {
          setShowDuplicateMenu(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showDuplicateMenu]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-gray-800 p-4 rounded-md border ${
          isDragging ? "border-blue-500" : "border-gray-700"
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 flex-1">
            {/* Selection checkbox for bulk operations */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(feature.id)}
              className="mt-1 flex-shrink-0"
              aria-label={`Select ${feature.name}`}
              onClick={(e) => e.stopPropagation()} // Prevent drag when clicking checkbox
            />
            {/* Position badge - Display 1-based index (position + 1) for user clarity */}
            {feature.position !== undefined && (
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-900 bg-blue-400 rounded-full flex-shrink-0">
                {feature.position + 1}
              </span>
            )}
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
              title="Drag to reorder or move between columns"
              aria-label={`Drag ${feature.name} to reorder or move between columns`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-base text-white">{feature.name}</div>
                {rowErrors[feature.id] && (
                  <p className="text-xs text-red-400">{rowErrors[feature.id]}</p>
                )}
                {savedIds.has(feature.id) && <p className="text-xs text-green-400">Saved</p>}
              </div>
              <div className="text-xs text-gray-400 clamp-2">{feature.description}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 border border-gray-600">
                  {laneLabel}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    isPublished
                      ? "bg-green-500/10 text-green-300 border-green-500/40"
                      : "bg-gray-700 text-gray-300 border-gray-600"
                  }`}
                >
                  {isPublished ? "Published" : "Unpublished"}
                </span>
                {isFeatured && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/40">
                    Featured
                  </span>
                )}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 border border-gray-600">
                  {categoryLabel}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 border border-gray-600">
                  {positionLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => toggleRowExpanded(feature.id)}
              className="px-3 py-1.5 rounded bg-gray-700 text-gray-100 border border-gray-600 hover:border-blue-400 transition-colors text-xs whitespace-nowrap"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
            <button
              onClick={() => onEdit(feature)}
              className="px-3 py-1.5 rounded bg-blue-600/80 text-white hover:bg-blue-500 text-xs transition-colors whitespace-nowrap"
            >
              Edit details
            </button>
            <div className="relative" ref={duplicateMenuRef}>
              <button
                onClick={() => setShowDuplicateMenu(!showDuplicateMenu)}
                className="px-3 py-1.5 rounded bg-gray-700 text-gray-100 border border-gray-600 hover:border-green-400 transition-colors text-xs whitespace-nowrap w-full"
              >
                Duplicate
              </button>
              {showDuplicateMenu && (
                <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 p-2 space-y-1">
                  <button
                    onClick={() => {
                      onDuplicate(feature, 1);
                      setShowDuplicateMenu(false);
                    }}
                    disabled={feature.column === 1}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    → Gold
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate(feature, 2);
                      setShowDuplicateMenu(false);
                    }}
                    disabled={feature.column === 2}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    → Elite
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate(feature, 3);
                      setShowDuplicateMenu(false);
                    }}
                    disabled={feature.column === 3}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    → Platinum
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Package Lane</label>
                <select
                  value={feature.column ?? ""}
                  onChange={(e) =>
                    handlePackagePlacement(
                      feature,
                      e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : undefined
                    )
                  }
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
                >
                  <option value="">Not in Packages</option>
                  <option value="1">Gold Package (Column 1)</option>
                  <option value="2">Elite Package (Column 2)</option>
                  <option value="3">Platinum Package (Column 3)</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => handlePublishToggle(feature, e.target.checked)}
                  />
                  <span>Publish to A La Carte</span>
                </label>
                {isPublished && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-400 block mb-1">A La Carte Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        priceInputs[feature.id] ?? (feature.alaCartePrice ?? "").toString()
                      }
                      onChange={(e) =>
                        setPriceInputs((prev) => ({
                          ...prev,
                          [feature.id]: e.target.value,
                        }))
                      }
                      onBlur={() => handlePriceBlur(feature)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Drag overlay component
  const DragOverlayItem: React.FC<{ feature: ProductFeature }> = ({ feature }) => (
    <div className="bg-gray-800 p-4 rounded-md border border-blue-500 shadow-lg">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-gray-500"
        >
          <path
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-semibold text-gray-200 text-sm">{feature.name}</span>
      </div>
    </div>
  );

  // Droppable column component
  interface DroppableColumnProps {
    columnId: "packages" | "alacarte";
    children: React.ReactNode;
  }

  const DroppableColumn: React.FC<DroppableColumnProps> = ({ columnId, children }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: `lane-${columnId}`,
    });

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[200px] transition-colors rounded-lg ${
          isOver ? "bg-blue-500/10 ring-2 ring-blue-500/50" : ""
        }`}
      >
        {children}
      </div>
    );
  };

  if (isLoading) {
    return <p className="text-gray-400">Loading Product Hub...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-2xl font-teko tracking-wider text-white">
            Product Hub
          </h3>
          <p className="text-sm text-gray-400">
            Manage package placement and A La Carte visibility from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white w-full md:w-72"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
        <label className="flex items-center gap-2">
          <span className="text-gray-400">Package lane</span>
          <select
            value={packageLaneFilter}
            onChange={(e) =>
              setPackageLaneFilter(e.target.value as typeof packageLaneFilter)
            }
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="1">Gold</option>
            <option value="2">Elite</option>
            <option value="3">Platinum</option>
            <option value="none">Not in packages</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-gray-400">Published</span>
          <select
            value={publishFilter}
            onChange={(e) =>
              setPublishFilter(e.target.value as typeof publishFilter)
            }
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-gray-400">Featured</span>
          <select
            value={featuredFilter}
            onChange={(e) =>
              setFeaturedFilter(e.target.value as typeof featuredFilter)
            }
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="featured">Featured</option>
            <option value="not-featured">Not featured</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-gray-400">A La Carte Category</span>
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as typeof categoryFilter)
            }
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="featured">Featured</option>
            <option value="1">Column 1 (Gold)</option>
            <option value="2">Column 2 (Elite)</option>
            <option value="3">Column 3 (Platinum)</option>
            <option value="unplaced">Not placed</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm bg-gray-900/60 border border-gray-800 rounded px-3 py-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            ref={bulkSelectRef}
            checked={allFilteredSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            aria-label="Select all filtered products"
          />
          <span className="text-gray-300">{selectedIds.size} selected</span>
        </label>
        <span className="text-gray-600">|</span>
        <button
          className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50"
          onClick={() => bulkPublishToggle(true)}
          disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-label="Publish selected items"
        >
          Publish
        </button>
        <button
          className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
          onClick={() => bulkPublishToggle(false)}
          disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-label="Unpublish selected items"
        >
          Unpublish
        </button>
        <button
          className="px-2 py-1 rounded bg-blue-700 text-white disabled:opacity-50"
          onClick={() => bulkSetFeatured(true)}
          disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-label="Mark selected items as featured"
        >
          Set Featured
        </button>
        <button
          className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
          onClick={() => bulkSetFeatured(false)}
          disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-disabled={isBulkWorking || selectedFeatures.length === 0}
          aria-label="Remove featured from selected items"
        >
          Remove Featured
        </button>
        <label className="flex items-center gap-2 text-gray-300">
          Category:
          <select
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            aria-label="Set A La Carte category for selected items"
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              if (val === "none") {
                bulkSetCategory(null);
              } else {
                bulkSetCategory(Number(val) as 1 | 2 | 3);
              }
            }}
            defaultValue=""
            disabled={isBulkWorking || selectedFeatures.length === 0}
          >
            <option value="" disabled>
              Set category...
            </option>
            <option value="1">Gold</option>
            <option value="2">Elite</option>
            <option value="3">Platinum</option>
            <option value="none">Not placed</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded">
          {error}
        </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Packages */}
          <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 space-y-4">
            <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm pb-3 border-b border-gray-700">
              <h4 className="text-xl font-teko tracking-wider text-gray-200">
                Packages Section
              </h4>
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
                    {packagesFeatures.map((feature) => {
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
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              )}
            </DroppableColumn>
          </div>

          {/* Right Column: A La Carte */}
          <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 space-y-4">
            <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm pb-3 border-b border-gray-700">
              <h4 className="text-xl font-teko tracking-wider text-gray-200">
                A La Carte Section
              </h4>
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
                    {alaCarteFeatures.map((feature) => {
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
                        />
                      );
                    })}
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
