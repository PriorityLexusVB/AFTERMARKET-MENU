import React, { useState, useEffect, useMemo } from 'react';
import { addPackage, updatePackage } from '../data';
import type { ProductFeature, PackageTier } from '../types';

interface PackageFormProps {
  onSaveSuccess: () => void;
  editingPackage?: PackageTier | null;
  onCancelEdit?: () => void;
  availableFeatures: ProductFeature[];
}

const initialFormState = {
  name: '',
  price: '',
  salePrice: '',
  tier_color: 'blue-400',
  is_recommended: false,
  showRetailValue: false,
  selectedFeatureIds: [] as string[],
};

const TIER_COLORS = [
  { name: 'Blue', value: 'blue-400' },
  { name: 'Gold', value: 'yellow-400' },
  { name: 'Silver', value: 'gray-300' },
  { name: 'Purple', value: 'purple-400' },
  { name: 'Green', value: 'green-400' },
  { name: 'Red', value: 'red-400' },
  { name: 'Pink', value: 'pink-400' },
  { name: 'Indigo', value: 'indigo-400' },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

export const PackageForm: React.FC<PackageFormProps> = ({
  onSaveSuccess,
  editingPackage,
  onCancelEdit,
  availableFeatures,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (editingPackage) {
      setFormData({
        name: editingPackage.name,
        price: editingPackage.price.toString(),
        salePrice: editingPackage.salePrice?.toString() || '',
        tier_color: editingPackage.tier_color,
        is_recommended: editingPackage.is_recommended || false,
        showRetailValue: editingPackage.showRetailValue || false,
        selectedFeatureIds: editingPackage.features.map((f) => f.id),
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingPackage]);

  // Calculate package statistics
  const packageStats = useMemo(() => {
    const selectedFeatures = availableFeatures.filter((f) =>
      formData.selectedFeatureIds.includes(f.id)
    );

    const totalCost = selectedFeatures.reduce((sum, f) => sum + f.cost, 0);
    const retailValue = selectedFeatures.reduce(
      (sum, f) => sum + (f.salePrice ?? f.price),
      0
    );

    const packagePrice = parseFloat(formData.price) || 0;
    const packageSalePrice = parseFloat(formData.salePrice) || null;
    const effectivePrice = packageSalePrice ?? packagePrice;

    const profit = effectivePrice - totalCost;
    const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;
    const savings = retailValue - effectivePrice;

    return {
      totalCost,
      retailValue,
      profit,
      margin,
      savings,
      effectivePrice,
      featureCount: selectedFeatures.length,
    };
  }, [formData.selectedFeatureIds, formData.price, formData.salePrice, availableFeatures]);

  const isFormValid = formData.name && formData.price && formData.selectedFeatureIds.length > 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedFeatureIds.includes(featureId);
      return {
        ...prev,
        selectedFeatureIds: isSelected
          ? prev.selectedFeatureIds.filter((id) => id !== featureId)
          : [...prev.selectedFeatureIds, featureId],
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please fill out all required fields and select at least one feature.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const packagePrice = parseFloat(formData.price);
      if (isNaN(packagePrice)) {
        throw new Error('Price must be a valid number.');
      }

      let salePrice: number | undefined = undefined;
      if (formData.salePrice && formData.salePrice.trim() !== '') {
        salePrice = parseFloat(formData.salePrice);
        if (isNaN(salePrice)) {
          throw new Error('Sale price must be a valid number.');
        }
        if (salePrice > packagePrice) {
          throw new Error('Sale price cannot be higher than regular price.');
        }
      }

      const packageData = {
        name: formData.name,
        price: packagePrice,
        ...(salePrice !== undefined && { salePrice }),
        cost: packageStats.totalCost,
        featureIds: formData.selectedFeatureIds,
        tier_color: formData.tier_color,
        is_recommended: formData.is_recommended,
        showRetailValue: formData.showRetailValue,
      };

      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
      } else {
        await addPackage(packageData);
      }

      setFormData(initialFormState);
      onSaveSuccess();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setError(null);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-fade-in">
      <h3 className="text-xl font-teko tracking-wider text-white mb-4">
        {editingPackage ? '✏️ Edit Package' : '➕ Create New Package'}
      </h3>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-lg font-teko text-gray-200 tracking-wider border-b border-gray-700 pb-2">
            Package Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-1">
                Package Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Gold Package"
                required
              />
            </div>

            <div>
              <label htmlFor="tier_color" className="block text-sm font-semibold text-gray-300 mb-1">
                Theme Color <span className="text-red-400">*</span>
              </label>
              <select
                id="tier_color"
                name="tier_color"
                value={formData.tier_color}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              >
                {TIER_COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Preview:</span>
                <div className={`w-16 h-6 rounded bg-${formData.tier_color} border border-gray-600`}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-300 mb-1">
                Package Price ($) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="2399"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="salePrice" className="block text-sm font-semibold text-gray-300 mb-1">
                Sale Price ($) <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="number"
                id="salePrice"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for regular price"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_recommended"
                checked={formData.is_recommended}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">⭐ Mark as Recommended</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showRetailValue"
                checked={formData.showRetailValue}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">💰 Show "Retail value $X, You pay $Y"</span>
            </label>
          </div>
        </div>

        {/* Feature Selection */}
        <div className="space-y-4">
          <h4 className="text-lg font-teko text-gray-200 tracking-wider border-b border-gray-700 pb-2">
            Select Features ({formData.selectedFeatureIds.length} selected)
          </h4>

          {availableFeatures.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No features available. Please add features first in the Features tab.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 bg-gray-900/30 rounded-md border border-gray-700">
              {availableFeatures.map((feature) => {
                const isSelected = formData.selectedFeatureIds.includes(feature.id);
                return (
                  <label
                    key={feature.id}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/50'
                        : 'bg-gray-900/50 border-gray-700 hover:bg-gray-900/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFeatureToggle(feature.id)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-gray-200 text-sm">{feature.name}</span>
                        <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
                          {formatPrice(feature.salePrice ?? feature.price)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{feature.description}</p>
                      <div className="flex gap-2 mt-1">
                        {feature.category && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                            {feature.category}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">Cost: {formatPrice(feature.cost)}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Package Statistics */}
        {formData.selectedFeatureIds.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
            <h4 className="text-lg font-teko text-gray-200 tracking-wider">Package Calculations</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Features</p>
                <p className="text-xl font-bold text-blue-400">{packageStats.featureCount}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="text-xl font-bold text-orange-400">{formatPrice(packageStats.totalCost)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Retail Value</p>
                <p className="text-xl font-bold text-purple-400">{formatPrice(packageStats.retailValue)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  {formData.salePrice ? 'Sale Price' : 'Package Price'}
                </p>
                <p className="text-xl font-bold text-green-400">{formatPrice(packageStats.effectivePrice)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-700">
              <div>
                <p className="text-xs text-gray-500">Your Profit</p>
                <p className={`text-2xl font-bold ${packageStats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPrice(packageStats.profit)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Profit Margin</p>
                <p className={`text-2xl font-bold ${packageStats.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {packageStats.margin.toFixed(1)}%
                </p>
              </div>
            </div>

            {packageStats.savings > 0 && (
              <div className="pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500">Customer Savings (vs buying separately)</p>
                <p className="text-2xl font-bold text-blue-400">{formatPrice(packageStats.savings)}</p>
              </div>
            )}

            {packageStats.profit < 0 && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-md p-3 flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-red-400 font-semibold text-sm">Negative Margin Warning</p>
                  <p className="text-red-200/80 text-xs mt-1">
                    You're selling this package below cost. Consider raising the price or reducing features.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-md p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          {editingPackage && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-md font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md font-bold text-sm hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
          </button>
        </div>
      </form>
    </div>
  );
};
