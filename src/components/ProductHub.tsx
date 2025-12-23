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

// Column mapping: 1 = Gold Base, 2 = Elite Adds, 3 = Platinum Adds (matches ladder elsewhere).
const columnLabels: Record<1 | 2 | 3, string> = {
  1: 'Gold Base',
  2: 'Elite Adds',
  3: 'Platinum Adds',
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

  const alaCarteMap = useMemo(() => {
    return new Map(alaCarteOptions.map((opt) => [opt.id, opt]));
  }, [alaCarteOptions]);

  const filteredFeatures = useMemo(() => {
    if (!searchTerm.trim()) return features;
    const queryText = searchTerm.toLowerCase();
    return features.filter((feature) => feature.name.toLowerCase().includes(queryText));
  }, [features, searchTerm]);

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
              return (
                <tr key={feature.id} className="text-sm text-gray-200 align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{feature.name}</div>
                    <div className="text-xs text-gray-500">{feature.description}</div>
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
