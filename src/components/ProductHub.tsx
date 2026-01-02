import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore/lite';
import { db } from '../firebase';
import type { AlaCarteOption, ProductFeature } from '../types';
import { updateFeature, upsertAlaCarteFromFeature, unpublishAlaCarteFromFeature, updateAlaCarteOption } from '../data';
import { FeatureForm } from './FeatureForm';

interface ProductHubProps {
  onDataUpdate: () => void;
  onAlaCarteChange?: () => void;
  initialFeatures?: ProductFeature[];
  initialAlaCarteOptions?: AlaCarteOption[];
  scrollTargetId?: string | null;
  onScrollHandled?: () => void;
}

const packageLaneOptions: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 2, label: 'Elite Package (Column 2)' },
  { value: 3, label: 'Platinum Package (Column 3)' },
  { value: 1, label: 'Gold Package (Column 1)' },
];
const columnLabels: Record<1 | 2 | 3, string> = {
  1: 'Gold Package (Column 1)',
  2: 'Elite Package (Column 2)',
  3: 'Platinum Package (Column 3)',
};
const packageOrder: (1 | 2 | 3)[] = packageLaneOptions.map((opt) => opt.value);

const getPlacementDisplay = (column?: number) => {
  if (column === 4) return 'Featured (Popular Add-ons)';
  if (column === 2) return 'Elite';
  if (column === 3) return 'Platinum';
  if (column === 1) return 'Gold';
  return 'Unplaced';
};

export const ProductHub: React.FC<ProductHubProps> = ({
  onDataUpdate,
  onAlaCarteChange,
  initialFeatures,
  initialAlaCarteOptions,
  scrollTargetId,
  onScrollHandled,
}) => {
  const [features, setFeatures] = useState<ProductFeature[]>(initialFeatures ?? []);
  const [alaCarteOptions, setAlaCarteOptions] = useState<AlaCarteOption[]>(initialAlaCarteOptions ?? []);
  const [searchTerm, setSearchTerm] = useState('');
  const [packageLaneFilter, setPackageLaneFilter] = useState<'all' | '1' | '2' | '3' | 'none'>('all');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not-featured'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | '1' | '2' | '3' | 'unplaced' | 'featured'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [isLoading, setIsLoading] = useState(initialFeatures ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [positionInputs, setPositionInputs] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const bulkSelectRef = useRef<HTMLInputElement>(null);
  const headerSelectRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const isMounted = useRef(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
      setError('Firebase is not connected.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [featuresSnap, alaCarteSnap] = await Promise.all([
        getDocs(query(collection(db, 'features'), orderBy('name'))),
        getDocs(query(collection(db, 'ala_carte_options'), orderBy('name'))),
      ]);

      setFeatures(featuresSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProductFeature)));
      setAlaCarteOptions(alaCarteSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AlaCarteOption)));
    } catch (err) {
      console.error('Error loading Product Hub data:', err);
      setError('Failed to load Product Hub data. Please check your Firestore rules and connection.');
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
    setSearchTerm('');
    setPackageLaneFilter('all');
    setPublishFilter('all');
    setFeaturedFilter('all');
    setCategoryFilter('all');
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

      const lane = feature.column ? String(feature.column) : 'none';
      if (packageLaneFilter !== 'all' && packageLaneFilter !== lane) return false;

      const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
      if (publishFilter === 'published' && !isPublished) return false;
      if (publishFilter === 'unpublished' && isPublished) return false;

      const isFeatured = option?.column === 4;
      if (featuredFilter === 'featured' && !isFeatured) return false;
      if (featuredFilter === 'not-featured' && isFeatured) return false;

      const categoryValue = isFeatured ? 'featured' : option?.column ? String(option.column) : 'unplaced';
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'unplaced' && categoryValue !== 'unplaced') return false;
        if (categoryFilter === 'featured' && categoryValue !== 'featured') return false;
        if (!['unplaced', 'featured'].includes(categoryFilter) && categoryFilter !== categoryValue) return false;
      }

      return true;
    });
  }, [alaCarteMap, categoryFilter, features, featuredFilter, packageLaneFilter, publishFilter, searchTerm]);

  useEffect(() => {
    if (!scrollTargetId || isLoading) return;
    const attemptScroll = () => {
      const row = rowRefs.current[scrollTargetId];
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      console.error('Failed to update package placement', err);
      setRowErrorMessage(feature.id, 'Failed to update package lane.');
      updateFeatureState(feature.id, { column: prevColumn, position: prevPosition });
      clearSaved(feature.id);
    }
  };

  const handlePriceBlur = async (feature: ProductFeature) => {
    const rawValue = priceInputs[feature.id] ?? (feature.alaCartePrice !== undefined ? feature.alaCartePrice.toString() : '');
    if (rawValue === '') return;
    const parsed = Number(rawValue);
    setPriceInputs((prev) => {
      const { [feature.id]: _removed, ...rest } = prev;
      return rest;
    });
    if (Number.isNaN(parsed) || parsed < 0) {
      setRowErrorMessage(feature.id, 'Enter a valid A La Carte price to save.');
      return;
    }
    clearRowError(feature.id);
    updateFeatureState(feature.id, { alaCartePrice: parsed });
    try {
      await updateFeature(feature.id, { alaCartePrice: parsed });
      const option = alaCarteMap.get(feature.id);
      if (option?.isPublished) {
        await upsertAlaCarteFromFeature(
          { ...feature, alaCartePrice: parsed, publishToAlaCarte: feature.publishToAlaCarte ?? true },
          { isPublished: true, price: parsed }
        );
        upsertOptionState(feature, { price: parsed });
      }
      markSaved(feature.id);
    } catch (err) {
      console.error('Failed to update A La Carte price', err);
      setRowErrorMessage(feature.id, 'Failed to save price.');
    }
  };

  const handleWarrantyBlur = async (feature: ProductFeature, value: string) => {
    updateFeatureState(feature.id, { alaCarteWarranty: value });
    try {
      await updateFeature(feature.id, { alaCarteWarranty: value });
    } catch (err) {
      console.error('Failed to update warranty override', err);
    }
  };

  const handleIsNewToggle = async (feature: ProductFeature, checked: boolean) => {
    updateFeatureState(feature.id, { alaCarteIsNew: checked });
    const option = alaCarteMap.get(feature.id);
    try {
      clearRowError(feature.id);
      await updateFeature(feature.id, { alaCarteIsNew: checked });
      if (option) {
        await upsertAlaCarteFromFeature(
          { ...feature, alaCarteIsNew: checked, publishToAlaCarte: feature.publishToAlaCarte ?? option.isPublished ?? false },
          { isPublished: option.isPublished, isNew: checked }
        );
        upsertOptionState(feature, { isNew: checked });
      }
      markSaved(feature.id);
    } catch (err) {
      console.error('Failed to update NEW flag', err);
      setRowErrorMessage(feature.id, 'Failed to update NEW flag.');
    }
  };

  const handlePlacementUpdate = async (feature: ProductFeature, column: number | null, position?: number) => {
    const option = alaCarteMap.get(feature.id);
    const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
    const price = option?.price ?? feature.alaCartePrice;
    const isNew = option?.isNew ?? feature.alaCarteIsNew ?? false;
    const warranty = option?.warranty ?? feature.alaCarteWarranty ?? feature.warranty;
    const desiredColumn = column === null ? undefined : column;
    const desiredPosition = desiredColumn === undefined ? undefined : (position ?? option?.position);

    try {
      clearRowError(feature.id);
      if (desiredColumn === undefined) {
        await updateAlaCarteOption(feature.id, { column: undefined, position: undefined });
        upsertOptionState(feature, { column: undefined, position: undefined, isPublished });
      } else {
        await upsertAlaCarteFromFeature(
          { ...feature, publishToAlaCarte: feature.publishToAlaCarte ?? isPublished, alaCartePrice: price ?? feature.alaCartePrice },
          {
            isPublished,
            column: desiredColumn,
            position: desiredPosition,
            price,
            isNew,
            warranty,
          }
        );
        upsertOptionState(feature, { column: desiredColumn, position: desiredPosition, isPublished });
      }
      onAlaCarteChange?.();
      markSaved(feature.id);
    } catch (err) {
      console.error('Failed to update placement', err);
      setRowErrorMessage(feature.id, 'Failed to update placement.');
    }
  };

  const handlePublishToggle = async (feature: ProductFeature, publish: boolean) => {
    clearRowError(feature.id);
    const option = alaCarteMap.get(feature.id);
    const inputValue = priceInputs[feature.id];
    const parsedInputPrice = inputValue !== undefined && inputValue !== '' ? Number(inputValue) : undefined;
    const price = option?.price ?? feature.alaCartePrice ?? parsedInputPrice;
    if (publish && (price === undefined || Number.isNaN(price) || price <= 0)) {
      setRowErrorMessage(feature.id, 'Enter an A La Carte price before publishing.');
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
        const featurePayload = { ...feature, publishToAlaCarte: true, alaCartePrice: resolvedPrice };
        await updateFeature(feature.id, { publishToAlaCarte: true, alaCartePrice: resolvedPrice });
        await upsertAlaCarteFromFeature(featurePayload, {
          isPublished: true,
          column: option?.column,
          position: option?.position,
          price: resolvedPrice,
          isNew: option?.isNew ?? feature.alaCarteIsNew,
          warranty: option?.warranty ?? feature.alaCarteWarranty ?? feature.warranty,
        });
        updateFeatureState(feature.id, { publishToAlaCarte: true, alaCartePrice: resolvedPrice });
        upsertOptionState(feature, { isPublished: true, price: resolvedPrice, column: option?.column, position: option?.position });
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
      console.error('Failed to update publish status', err);
      setRowErrorMessage(feature.id, message);
      updateFeatureState(feature.id, { publishToAlaCarte: previousPublished, alaCartePrice: previousPrice });
      upsertOptionState(feature, {
        isPublished: previousPublished,
        price: previousPrice,
        column: option?.column,
        position: option?.position,
      });
      clearSaved(feature.id);
    }
  };

  const handleRemoveFromPackages = (feature: ProductFeature) => {
    return handlePackagePlacement(feature, undefined);
  };

  const handleUnpublishOnly = (feature: ProductFeature) => {
    return handlePublishToggle(feature, false);
  };

  const handleDuplicateToLane = async (feature: ProductFeature, targetColumn: 1 | 2 | 3) => {
    if (!db) {
      setRowErrorMessage(feature.id, 'Firebase is not connected.');
      return;
    }

    clearRowError(feature.id);

    try {
      const nextPosition = getNextPosition(targetColumn);
      const { id: _id, publishToAlaCarte: _publish, alaCartePrice: _price, alaCarteWarranty: _warranty, alaCarteIsNew: _isNew, ...rest } = feature;

      const payload: Omit<ProductFeature, 'id'> = {
        ...rest,
        column: targetColumn,
        position: nextPosition,
      };

      const docRef = await addDoc(collection(db, 'features'), payload);
      setFeatures((prev) => [...prev, { ...payload, id: docRef.id }]);
      onDataUpdate();
      markSaved(docRef.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to duplicate feature to lane', err);
      setRowErrorMessage(feature.id, `Failed to duplicate: ${message}`);
      clearSaved(feature.id);
    }
  };

  const handlePositionBlur = (feature: ProductFeature) => {
    const option = alaCarteMap.get(feature.id);
    const raw = positionInputs[feature.id];
    const parsed = raw === '' || raw === undefined ? undefined : Number(raw);
    setPositionInputs((prev) => {
      const { [feature.id]: _removed, ...rest } = prev;
      return rest;
    });
    if (option || feature.publishToAlaCarte) {
      handlePlacementUpdate(feature, option?.column ?? null, parsed);
    }
  };

  const handleConnectorChange = async (feature: ProductFeature, connector: 'AND' | 'OR') => {
    const previousConnector = feature.connector || 'AND';
    if (previousConnector === connector) return;
    updateFeatureState(feature.id, { connector });
    clearRowError(feature.id);
    try {
      await updateFeature(feature.id, { connector });
      markSaved(feature.id);
    } catch (err) {
      console.error('Failed to update connector', err);
      setRowErrorMessage(feature.id, 'Failed to update connector.');
      updateFeatureState(feature.id, { connector: previousConnector });
      clearSaved(feature.id);
    }
  };

  const handleEditDetails = (feature: ProductFeature) => {
    const rowEl = rowRefs.current[feature.id];
    const scheduleFrame =
      typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: FrameRequestCallback) => setTimeout(cb, 0);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const handleSelectFeature = (featureId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(featureId);
      } else {
        next.delete(featureId);
      }
      return next;
    });
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
            console.error('Bulk action failed for feature', feature.id, err);
            failures.push(feature.name);
          }
        })
      );
      if (failures.length > 0) {
        setError(`Some items failed to update: ${failures.join(', ')}`);
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
      setError('Selected items need an A La Carte price before publishing.');
      return;
    }
    if (missingPrice.length > 0) {
      setError('Some selected items are missing A La Carte prices and were skipped.');
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

  const getCategoryLabel = (option?: AlaCarteOption) => {
    if (!option) return 'Not placed';
    if (option.column === 4) return 'Featured';
    if (option.column) return columnLabels[option.column as 1 | 2 | 3] ?? 'Placed';
    return 'Not placed';
  };

  const renderPlacementControls = (feature: ProductFeature, option: AlaCarteOption | undefined) => {
    const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
    const column = isPublished ? option?.column : undefined;
    const featured = isPublished && column === 4;
    const category = !featured && column ? String(column) : '';
    const positionValue = isPublished ? positionInputs[feature.id] ?? (option?.position ?? '') : '';
    const disabled = !isPublished;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`featured-${feature.id}`}
            checked={featured}
            disabled={disabled}
            onChange={(e) => handlePlacementUpdate(feature, e.target.checked ? 4 : null, undefined)}
          />
          <label htmlFor={`featured-${feature.id}`} className="text-sm text-gray-200">
            Featured (Popular Add-Ons)
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Category (columns 1-3)</label>
          <select
            value={category}
            disabled={disabled || featured}
            onChange={(e) => {
              const value = e.target.value;
              const newColumn = value ? Number(value) : null;
              const newPosition = newColumn === null ? undefined : option?.position;
              handlePlacementUpdate(feature, newColumn, newPosition);
            }}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">Not placed</option>
            <option value="1">Gold</option>
            <option value="2">Elite</option>
            <option value="3">Platinum</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Position</label>
          <input
            type="number"
            min="0"
            disabled={disabled}
            value={positionValue}
            onChange={(e) => setPositionInputs((prev) => ({ ...prev, [feature.id]: e.target.value }))}
            onBlur={() => handlePositionBlur(feature)}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          />
        </div>
        {!isPublished && (
          <p className="text-xs text-amber-400">Publish to A La Carte to enable placement + Featured.</p>
        )}
        <p className="text-xs text-gray-500">Current: {getPlacementDisplay(isPublished ? option?.column : undefined)}</p>
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
          <h3 className="text-2xl font-teko tracking-wider text-white">Product Hub</h3>
          <p className="text-sm text-gray-400">Manage package placement and A La Carte visibility from one place.</p>
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
            onChange={(e) => setPackageLaneFilter(e.target.value as typeof packageLaneFilter)}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="2">Elite</option>
            <option value="3">Platinum</option>
            <option value="1">Gold</option>
            <option value="none">Not in packages</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-gray-400">Published</span>
          <select
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value as typeof publishFilter)}
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
            onChange={(e) => setFeaturedFilter(e.target.value as typeof featuredFilter)}
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
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
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
          <span className="text-gray-300">
            {selectedIds.size} selected
          </span>
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
              if (val === 'none') {
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

      {error && <p className="text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded">{error}</p>}

      {showForm && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <FeatureForm onSaveSuccess={handleFormSaved} editingFeature={editingFeature ?? undefined} onCancelEdit={() => setShowForm(false)} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="px-3 py-2 font-semibold w-10">
                <input
                  type="checkbox"
                  aria-label="Select all filtered"
                  ref={headerSelectRef}
                  checked={allFilteredSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-3 py-2 font-semibold">Product</th>
              <th className="px-3 py-2 font-semibold">Packages</th>
              <th className="px-3 py-2 font-semibold">A La Carte</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredFeatures.map((feature) => {
              const option = alaCarteMap.get(feature.id);
              const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
              const priceValue = priceInputs[feature.id] ?? (feature.alaCartePrice ?? '').toString();
              const warrantyValue = feature.alaCarteWarranty ?? '';
              const isNew = feature.alaCarteIsNew ?? option?.isNew ?? false;
              const isFeatured = option?.column === 4;
              const currentConnector = feature.connector || 'AND';
              const laneLabel = feature.column ? columnLabels[feature.column as 1 | 2 | 3] ?? 'Not in packages' : 'Not in packages';
              const categoryLabel = getCategoryLabel(option);
              const positionLabel =
                option?.position !== undefined ? `Position ${option.position}` : 'Position —';
              return (
                <tr
                  key={feature.id}
                  className="text-sm text-gray-200 align-top"
                  ref={(el) => {
                    rowRefs.current[feature.id] = el;
                  }}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${feature.name}`}
                      checked={selectedIds.has(feature.id)}
                      onChange={(e) => handleSelectFeature(feature.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold">{feature.name}</div>
                    <div className="text-xs text-gray-500">{feature.description}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-200 border border-gray-700">
                        Lane: {laneLabel}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          isPublished ? 'bg-green-500/10 text-green-300 border-green-500/40' : 'bg-gray-700 text-gray-300 border-gray-600'
                        }`}
                      >
                        {isPublished ? 'Published' : 'Unpublished'}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          isFeatured ? 'bg-blue-500/10 text-blue-300 border-blue-500/40' : 'bg-gray-700 text-gray-300 border-gray-600'
                        }`}
                      >
                        {isFeatured ? 'Featured' : 'Not featured'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-200 border border-gray-700">
                        Category: {categoryLabel}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-200 border border-gray-700">
                        {positionLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1 text-xs text-gray-200">
                      <span className="text-[11px] uppercase text-gray-400">Package placement (choose one lane)</span>
                      {packageLaneOptions.map(({ value: colNum, label }) => {
                        return (
                          <label key={colNum} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`pkg-${feature.id}`}
                              checked={feature.column === colNum}
                              onChange={() => handlePackagePlacement(feature, colNum)}
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`pkg-${feature.id}`}
                          checked={feature.column == null}
                          onChange={() => handlePackagePlacement(feature, undefined)}
                        />
                        <span>Not in Packages</span>
                      </label>
                      {feature.column !== undefined && packageOrder.includes(feature.column as 1 | 2 | 3) && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] uppercase text-gray-400">Connector:</span>
                          <div className="flex gap-2">
                            {(['AND', 'OR'] as const).map((optionConnector) => (
                              <button
                                key={optionConnector}
                                type="button"
                                onClick={() => handleConnectorChange(feature, optionConnector)}
                                aria-label={`Set connector to ${optionConnector}`}
                                aria-pressed={currentConnector === optionConnector}
                                className={`px-2 py-1 rounded text-xs border ${
                                  currentConnector === optionConnector
                                    ? optionConnector === 'OR'
                                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/60'
                                      : 'bg-green-500/20 text-green-300 border-green-400/60'
                                    : 'bg-gray-800 text-gray-200 border-gray-700'
                                }`}
                              >
                                {optionConnector}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={isPublished}
                          onChange={(e) => handlePublishToggle(feature, e.target.checked)}
                        />
                        <span>Publish to A La Carte</span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">A La Carte Price (customer price)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={priceValue}
                            onChange={(e) => setPriceInputs((prev) => ({ ...prev, [feature.id]: e.target.value }))}
                            onBlur={() => handlePriceBlur(feature)}
                            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">Warranty override</label>
                          <input
                            type="text"
                            value={warrantyValue}
                            onChange={(e) => updateFeatureState(feature.id, { alaCarteWarranty: e.target.value })}
                            onBlur={(e) => handleWarrantyBlur(feature, e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={isNew}
                          onChange={(e) => handleIsNewToggle(feature, e.target.checked)}
                          disabled={!isPublished}
                        />
                        <span>Mark as NEW</span>
                      </label>
                      {renderPlacementControls(feature, option)}
                      {rowErrors[feature.id] && <p className="text-xs text-red-400">{rowErrors[feature.id]}</p>}
                      {savedIds.has(feature.id) && <p className="text-xs text-green-400">Saved</p>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                     <div className="flex flex-col gap-2">
                       <button
                         onClick={() => handleEditDetails(feature)}
                         className="text-blue-400 hover:text-blue-200 text-sm underline text-left"
                       >
                         Edit details
                       </button>
                       <button
                         onClick={() => handleRemoveFromPackages(feature)}
                         className="text-sm text-red-300 hover:text-red-200 underline text-left disabled:opacity-50"
                         disabled={feature.column === undefined}
                       >
                         Remove from Packages
                       </button>
                       <button
                         onClick={() => handleUnpublishOnly(feature)}
                         className="text-sm text-yellow-300 hover:text-yellow-200 underline text-left disabled:opacity-50"
                         disabled={!isPublished}
                       >
                         Unpublish A La Carte
                       </button>
                       <div className="mt-1 space-y-1">
                         <p className="text-xs text-gray-400 font-semibold">Duplicate to Gold/Elite/Platinum</p>
                         <div className="flex flex-wrap gap-2">
                           <button
                             type="button"
                             className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-100 disabled:opacity-40"
                             disabled={feature.column === 1}
                             onClick={() => handleDuplicateToLane(feature, 1)}
                           >
                             Gold
                           </button>
                           <button
                             type="button"
                             className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-100 disabled:opacity-40"
                             disabled={feature.column === 2}
                             onClick={() => handleDuplicateToLane(feature, 2)}
                           >
                             Elite
                           </button>
                           <button
                             type="button"
                             className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-100 disabled:opacity-40"
                             disabled={feature.column === 3}
                             onClick={() => handleDuplicateToLane(feature, 3)}
                           >
                             Platinum
                           </button>
                         </div>
                       </div>
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
