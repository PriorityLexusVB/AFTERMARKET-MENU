import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore/lite';
import { db } from '../firebase';
import type { AlaCarteOption, ProductFeature } from '../types';
import { updateFeature, upsertAlaCarteFromFeature, unpublishAlaCarteFromFeature } from '../data';
import { FeatureForm } from './FeatureForm';

interface ProductHubProps {
  onDataUpdate: () => void;
  onAlaCarteChange?: () => void;
}

// Column mapping: 1 = Gold Package, 2 = Elite Package, 3 = Platinum Package (matches ladder elsewhere).
const columnLabels: Record<1 | 2 | 3, string> = {
  1: 'Gold Package',
  2: 'Elite Package',
  3: 'Platinum Package',
};

const getPlacementDisplay = (column?: number) => {
  if (column === 4) return 'Featured (Popular Add-ons)';
  if (column === 1) return 'Gold';
  if (column === 2) return 'Elite';
  if (column === 3) return 'Platinum';
  return 'Unplaced';
};

export const ProductHub: React.FC<ProductHubProps> = ({ onDataUpdate, onAlaCarteChange }) => {
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [alaCarteOptions, setAlaCarteOptions] = useState<AlaCarteOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [packageLaneFilter, setPackageLaneFilter] = useState<'all' | '1' | '2' | '3' | 'none'>('all');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not-featured'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | '1' | '2' | '3' | 'unplaced'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [positionInputs, setPositionInputs] = useState<Record<string, string>>({});

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
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(features.map((f) => f.id));
      return new Set([...prev].filter((id) => validIds.has(id)));
    });
  }, [features]);

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

      const categoryValue = isFeatured ? '4' : option?.column ? String(option.column) : 'unplaced';
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'unplaced' && categoryValue !== 'unplaced') return false;
        if (categoryFilter !== 'unplaced' && categoryFilter !== categoryValue) return false;
      }

      return true;
    });
  }, [alaCarteMap, categoryFilter, features, featuredFilter, packageLaneFilter, publishFilter, searchTerm]);

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

  const handlePackagePlacement = async (feature: ProductFeature, column: 1 | 2 | 3 | undefined) => {
    if (feature.column === column) return;
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
    try {
      await updateFeature(feature.id, payload);
      onDataUpdate();
    } catch (err) {
      console.error('Failed to update package placement', err);
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
    if (Number.isNaN(parsed)) {
      return;
    }
    if (parsed < 0) {
      return;
    }
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
    } catch (err) {
      console.error('Failed to update A La Carte price', err);
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
      await updateFeature(feature.id, { alaCarteIsNew: checked });
      if (option) {
        await upsertAlaCarteFromFeature(
          { ...feature, alaCarteIsNew: checked, publishToAlaCarte: feature.publishToAlaCarte ?? option.isPublished ?? false },
          { isPublished: option.isPublished, isNew: checked }
        );
        upsertOptionState(feature, { isNew: checked });
      }
    } catch (err) {
      console.error('Failed to update NEW flag', err);
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
      onAlaCarteChange?.();
    } catch (err) {
      console.error('Failed to update placement', err);
    }
  };

  const handlePublishToggle = async (feature: ProductFeature, publish: boolean) => {
    const option = alaCarteMap.get(feature.id);
    const price = option?.price ?? feature.alaCartePrice;
    if (publish && price === undefined) {
      console.error('Please enter an A La Carte price before publishing.');
      return;
    }

    try {
      if (!publish) {
        updateFeatureState(feature.id, { publishToAlaCarte: false });
        await updateFeature(feature.id, { publishToAlaCarte: false });
        await unpublishAlaCarteFromFeature(feature.id);
        upsertOptionState(feature, { isPublished: false });
      } else {
        const featurePayload = { ...feature, publishToAlaCarte: true, alaCartePrice: price };
        updateFeatureState(feature.id, { publishToAlaCarte: true, alaCartePrice: price });
        await updateFeature(feature.id, { publishToAlaCarte: true, alaCartePrice: price });
        await upsertAlaCarteFromFeature(featurePayload, {
          isPublished: true,
          column: option?.column,
          position: option?.position,
          price,
          isNew: option?.isNew ?? feature.alaCarteIsNew,
          warranty: option?.warranty ?? feature.alaCarteWarranty ?? feature.warranty,
        });
        upsertOptionState(feature, { isPublished: true });
      }
      onAlaCarteChange?.();
      onDataUpdate();
    } catch (err) {
      console.error('Failed to update publish status', err);
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

  const handleEditDetails = (feature: ProductFeature) => {
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

  const runBulkAction = async (action: (feature: ProductFeature) => Promise<void> | void) => {
    if (selectedFeatures.length === 0) return;
    setIsBulkWorking(true);
    try {
      await Promise.all(selectedFeatures.map((feature) => action(feature)));
    } finally {
      setIsBulkWorking(false);
    }
  };

  const bulkPublishToggle = (publish: boolean) =>
    runBulkAction((feature) => handlePublishToggle(feature, publish));

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

  const renderPlacementControls = (feature: ProductFeature, option: AlaCarteOption | undefined) => {
    const column = option?.column;
    const featured = column === 4;
    const category = !featured && column ? String(column) : '';
    const positionValue = positionInputs[feature.id] ?? (option?.position ?? '');
    const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
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
        <p className="text-xs text-gray-500">Current: {getPlacementDisplay(option?.column)}</p>
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
          <span className="text-gray-400">Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="1">Gold</option>
            <option value="2">Elite</option>
            <option value="3">Platinum</option>
            <option value="unplaced">Not placed</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm bg-gray-900/60 border border-gray-800 rounded px-3 py-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedIds.size > 0 && filteredFeatures.every((f) => selectedIds.has(f.id))}
            onChange={(e) => handleSelectAll(e.target.checked)}
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
        >
          Publish
        </button>
        <button
          className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
          onClick={() => bulkPublishToggle(false)}
          disabled={isBulkWorking || selectedFeatures.length === 0}
        >
          Unpublish
        </button>
        <button
          className="px-2 py-1 rounded bg-blue-700 text-white disabled:opacity-50"
          onClick={() => bulkSetFeatured(true)}
          disabled={isBulkWorking || selectedFeatures.length === 0}
        >
          Set Featured
        </button>
        <button
          className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
          onClick={() => bulkSetFeatured(false)}
          disabled={isBulkWorking || selectedFeatures.length === 0}
        >
          Remove Featured
        </button>
        <label className="flex items-center gap-2 text-gray-300">
          Category:
          <select
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
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
                  checked={selectedIds.size > 0 && filteredFeatures.every((f) => selectedIds.has(f.id))}
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
              const laneLabel = feature.column ? columnLabels[feature.column as 1 | 2 | 3] ?? 'Not in packages' : 'Not in packages';
              const categoryLabel =
                isFeatured && option
                  ? 'Featured'
                  : option?.column
                    ? columnLabels[option.column as 1 | 2 | 3] ?? 'Placed'
                    : 'Not placed';
              const positionLabel =
                option?.position !== undefined ? `Position ${option.position}` : 'Position —';
              return (
                <tr key={feature.id} className="text-sm text-gray-200 align-top">
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
                      {(Object.entries(columnLabels) as [string, string][]).map(([col, label]) => {
                        const colNum = Number(col) as 1 | 2 | 3;
                        return (
                          <label key={col} className="flex items-center gap-2">
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
                          checked={feature.column === undefined}
                          onChange={() => handlePackagePlacement(feature, undefined)}
                        />
                        <span>Not in Packages</span>
                      </label>
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
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleEditDetails(feature)}
                      className="text-blue-400 hover:text-blue-200 text-sm underline"
                    >
                      Edit details
                    </button>
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
