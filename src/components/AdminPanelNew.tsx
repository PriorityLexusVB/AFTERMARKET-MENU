import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore/lite';
import { db } from '../firebase';
import type { ProductFeature, PackageTier, AlaCarteOption } from '../types';
import { AdminTabs, type AdminTab } from './AdminTabs';
import { AdminDashboard } from './AdminDashboard';
import { FeatureForm } from './FeatureForm';
import { PackageForm } from './PackageForm';
import { AlaCarteForm } from './AlaCarteForm';
import { ConfirmDialog } from './ConfirmDialog';
import { deleteFeature, deletePackage, deleteAlaCarteOption, updateAlaCarteOption } from '../data';
import { validateDataArray, ProductFeatureSchema, AlaCarteOptionSchema } from '../schemas';

interface AdminPanelNewProps {
  onDataUpdate: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

export const AdminPanelNew: React.FC<AdminPanelNewProps> = ({ onDataUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isPackageFormVisible, setIsPackageFormVisible] = useState(false);
  const [isAlaCarteFormVisible, setIsAlaCarteFormVisible] = useState(false);

  // Data state
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [alaCarteOptions, setAlaCarteOptions] = useState<AlaCarteOption[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/Delete states - Features
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<ProductFeature | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit/Delete states - Packages
  const [editingPackage, setEditingPackage] = useState<PackageTier | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<PackageTier | null>(null);
  const [isDeletingPackage, setIsDeletingPackage] = useState(false);

  // Edit/Delete states - À La Carte
  const [editingAlaCarteOption, setEditingAlaCarteOption] = useState<AlaCarteOption | null>(null);
  const [alaCarteOptionToDelete, setAlaCarteOptionToDelete] = useState<AlaCarteOption | null>(null);
  const [isDeletingAlaCarteOption, setIsDeletingAlaCarteOption] = useState(false);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!db) {
      setError('Firebase is not connected.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [featuresSnapshot, alaCarteSnapshot, packagesSnapshot] = await Promise.all([
        getDocs(collection(db, 'features')),
        getDocs(collection(db, 'ala_carte_options')),
        getDocs(collection(db, 'packages')),
      ]);

      // Fetch and validate features
      const rawFeatures = featuresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const validatedFeatures = validateDataArray(ProductFeatureSchema, rawFeatures, 'features');
      setFeatures(validatedFeatures);

      // Fetch and validate à la carte options
      const rawAlaCarteOptions = alaCarteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const validatedAlaCarteOptions = validateDataArray(AlaCarteOptionSchema, rawAlaCarteOptions, 'ala_carte_options');
      setAlaCarteOptions(validatedAlaCarteOptions);

      // Fetch packages
      const featuresMap = new Map(validatedFeatures.map(f => [f.id, f]));
      const packagesData: PackageTier[] = packagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          price: data.price,
          salePrice: data.salePrice,
          cost: data.cost,
          is_recommended: data.is_recommended,
          tier_color: data.tier_color,
          showRetailValue: data.showRetailValue,
          displayOrder: data.displayOrder,
          features: (data.featureIds || [])
            .map((id: string) => featuresMap.get(id))
            .filter((f): f is ProductFeature => !!f),
        };
      });
      setPackages(packagesData);

    } catch (err) {
      console.error('Error fetching data from Firestore:', err);
      setError('Failed to fetch data. Please check your connection and Firestore rules.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Event handlers
  const handleSaveSuccess = () => {
    setIsFormVisible(false);
    setEditingFeature(null);
    fetchAllData();
    onDataUpdate();
  };

  const handleEdit = (feature: ProductFeature) => {
    setEditingFeature(feature);
    setIsFormVisible(true);
    setActiveTab('features'); // Switch to features tab
  };

  const handleCancelEdit = () => {
    setEditingFeature(null);
    setIsFormVisible(false);
  };

  const handleDeleteClick = (feature: ProductFeature) => {
    setFeatureToDelete(feature);
  };

  const handleConfirmDelete = async () => {
    if (!featureToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteFeature(featureToDelete.id);
      setFeatureToDelete(null);
      fetchAllData();
      onDataUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to delete feature');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setFeatureToDelete(null);
  };

  // Package handlers
  const handlePackageSaveSuccess = () => {
    setIsPackageFormVisible(false);
    setEditingPackage(null);
    fetchAllData();
    onDataUpdate();
  };

  const handleEditPackage = (pkg: PackageTier) => {
    setEditingPackage(pkg);
    setIsPackageFormVisible(true);
    setActiveTab('packages'); // Switch to packages tab
  };

  const handleCancelPackageEdit = () => {
    setEditingPackage(null);
    setIsPackageFormVisible(false);
  };

  const handleDeletePackageClick = (pkg: PackageTier) => {
    setPackageToDelete(pkg);
  };

  const handleConfirmPackageDelete = async () => {
    if (!packageToDelete) return;

    setIsDeletingPackage(true);
    setError(null);

    try {
      await deletePackage(packageToDelete.id);
      setPackageToDelete(null);
      fetchAllData();
      onDataUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to delete package');
    } finally {
      setIsDeletingPackage(false);
    }
  };

  const handleCancelPackageDelete = () => {
    setPackageToDelete(null);
  };

  // À La Carte handlers
  const handleAlaCarteSaveSuccess = () => {
    setIsAlaCarteFormVisible(false);
    setEditingAlaCarteOption(null);
    fetchAllData();
    onDataUpdate();
  };

  const handleEditAlaCarteOption = (option: AlaCarteOption) => {
    setEditingAlaCarteOption(option);
    setIsAlaCarteFormVisible(true);
    setActiveTab('alacarte');
  };

  const handleCancelAlaCarteEdit = () => {
    setEditingAlaCarteOption(null);
    setIsAlaCarteFormVisible(false);
  };

  const handleDeleteAlaCarteOptionClick = (option: AlaCarteOption) => {
    setAlaCarteOptionToDelete(option);
  };

  const handleConfirmAlaCarteOptionDelete = async () => {
    if (!alaCarteOptionToDelete) return;

    setIsDeletingAlaCarteOption(true);
    setError(null);

    try {
      await deleteAlaCarteOption(alaCarteOptionToDelete.id);
      setAlaCarteOptionToDelete(null);
      fetchAllData();
      onDataUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to delete à la carte option');
    } finally {
      setIsDeletingAlaCarteOption(false);
    }
  };

  const handleCancelAlaCarteOptionDelete = () => {
    setAlaCarteOptionToDelete(null);
  };

  // Move option up in display order
  const handleMoveOptionUp = async (option: AlaCarteOption, currentIndex: number) => {
    if (currentIndex === 0) return; // Already at top

    const sortedOptions = [...alaCarteOptions].sort((a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    const newIndex = currentIndex - 1;
    const temp = sortedOptions[currentIndex];
    sortedOptions[currentIndex] = sortedOptions[newIndex];
    sortedOptions[newIndex] = temp;

    // Update display orders in Firestore
    try {
      await Promise.all(
        sortedOptions.map((opt, idx) =>
          updateAlaCarteOption(opt.id, { displayOrder: idx })
        )
      );
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to reorder options');
    }
  };

  // Move option down in display order
  const handleMoveOptionDown = async (option: AlaCarteOption, currentIndex: number) => {
    const sortedOptions = [...alaCarteOptions].sort((a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    if (currentIndex === sortedOptions.length - 1) return; // Already at bottom

    const newIndex = currentIndex + 1;
    const temp = sortedOptions[currentIndex];
    sortedOptions[currentIndex] = sortedOptions[newIndex];
    sortedOptions[newIndex] = temp;

    // Update display orders in Firestore
    try {
      await Promise.all(
        sortedOptions.map((opt, idx) =>
          updateAlaCarteOption(opt.id, { displayOrder: idx })
        )
      );
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to reorder options');
    }
  };

  // Render tab content
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
          <p className="text-red-400">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <AdminDashboard
            features={features}
            packages={packages}
            alaCarteOptions={alaCarteOptions}
          />
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-teko tracking-wider text-white">
                Manage Features
              </h3>
              <button
                onClick={() => {
                  setEditingFeature(null);
                  setIsFormVisible((prev) => !prev);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                {isFormVisible ? 'Cancel' : 'Add New Feature'}
              </button>
            </div>

            {isFormVisible && (
              <FeatureForm
                onSaveSuccess={handleSaveSuccess}
                editingFeature={editingFeature}
                onCancelEdit={handleCancelEdit}
              />
            )}

            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-xl font-teko tracking-wider text-gray-300 mb-4">
                Existing Features ({features.length})
              </h4>
              {features.length === 0 ? (
                <p className="text-gray-500">
                  No features found. Click "Add New Feature" to create one.
                </p>
              ) : (
                <div className="space-y-2">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className="bg-gray-900/50 p-4 rounded-md flex justify-between items-start hover:bg-gray-900/70 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="font-semibold text-gray-200 text-lg">
                            {feature.name}
                          </span>
                          {feature.category && (
                            <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                              {feature.category}
                            </span>
                          )}
                          {feature.columnAssignment && feature.columnAssignment !== 'none' && (
                            <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                              {feature.columnAssignment} column
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {feature.description.substring(0, 120)}
                          {feature.description.length > 120 ? '...' : ''}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>
                            Retail: <span className="font-mono">{formatPrice(feature.price)}</span>
                          </span>
                          {feature.salePrice && (
                            <span className="text-green-400">
                              Sale: <span className="font-mono font-bold">{formatPrice(feature.salePrice)}</span>
                            </span>
                          )}
                          <span>
                            Cost: <span className="font-mono">{formatPrice(feature.cost)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(feature)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-md transition-colors"
                          title="Edit feature"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(feature)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
                          title="Delete feature"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'packages':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-teko tracking-wider text-white">
                Manage Packages
              </h3>
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setIsPackageFormVisible((prev) => !prev);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                {isPackageFormVisible ? 'Cancel' : 'Create New Package'}
              </button>
            </div>

            {isPackageFormVisible && (
              <PackageForm
                onSaveSuccess={handlePackageSaveSuccess}
                editingPackage={editingPackage}
                onCancelEdit={handleCancelPackageEdit}
                availableFeatures={features}
              />
            )}

            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-xl font-teko tracking-wider text-gray-300 mb-4">
                Existing Packages ({packages.length})
              </h4>
              {packages.length === 0 ? (
                <p className="text-gray-500">
                  No packages found. Click "Create New Package" to create one.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {packages.map((pkg) => {
                    const effectivePrice = pkg.salePrice ?? pkg.price;
                    const totalCost = pkg.features.reduce((sum, f) => sum + f.cost, 0);
                    const profit = effectivePrice - totalCost;
                    const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;

                    return (
                      <div
                        key={pkg.id}
                        className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-900/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-lg font-bold text-white">{pkg.name}</h5>
                              {pkg.is_recommended && (
                                <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                                  ⭐ Recommended
                                </span>
                              )}
                            </div>
                            <div className={`w-16 h-1 rounded bg-${pkg.tier_color}`}></div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPackage(pkg)}
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-md transition-colors"
                              title="Edit package"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePackageClick(pkg)}
                              className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
                              title="Delete package"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Features:</span>
                            <span className="text-white font-semibold">{pkg.features.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Package Price:</span>
                            <div className="text-right">
                              {pkg.salePrice ? (
                                <>
                                  <span className="text-gray-500 line-through mr-2">{formatPrice(pkg.price)}</span>
                                  <span className="text-green-400 font-bold">{formatPrice(pkg.salePrice)}</span>
                                </>
                              ) : (
                                <span className="text-white font-semibold">{formatPrice(pkg.price)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Cost:</span>
                            <span className="text-orange-400 font-mono">{formatPrice(totalCost)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-700">
                            <span className="text-gray-400">Profit:</span>
                            <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPrice(profit)} ({margin.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {pkg.showRetailValue && (
                          <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                            💰 Showing "Retail value vs You pay" to customers
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'alacarte':
        const sortedAlaCarteOptions = [...alaCarteOptions].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        );

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-teko tracking-wider text-white">
                  Manage À La Carte Options
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Standalone options customers can add individually
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAlaCarteOption(null);
                  setIsAlaCarteFormVisible((prev) => !prev);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                {isAlaCarteFormVisible ? 'Cancel' : 'Add New Option'}
              </button>
            </div>

            {isAlaCarteFormVisible && (
              <AlaCarteForm
                onSaveSuccess={handleAlaCarteSaveSuccess}
                editingOption={editingAlaCarteOption}
                onCancelEdit={handleCancelAlaCarteEdit}
              />
            )}

            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-xl font-teko tracking-wider text-gray-300 mb-4">
                Existing Options ({alaCarteOptions.length})
              </h4>
              {sortedAlaCarteOptions.length === 0 ? (
                <p className="text-gray-500">
                  No à la carte options found. Click "Add New Option" to create one.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedAlaCarteOptions.map((option, index) => {
                    const effectivePrice = option.salePrice ?? option.price;
                    const profit = effectivePrice - option.cost;
                    const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;

                    return (
                      <div
                        key={option.id}
                        className="bg-gray-900/50 border border-gray-700 rounded-md p-4 hover:bg-gray-900/70 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Drag/Reorder Controls */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveOptionUp(option, index)}
                              disabled={index === 0}
                              className="p-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move up"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleMoveOptionDown(option, index)}
                              disabled={index === sortedAlaCarteOptions.length - 1}
                              className="p-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move down"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.53 13.53a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 1 1 1.06-1.06L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Option Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-2">
                              <span className="font-semibold text-gray-200 text-lg">
                                {option.name}
                              </span>
                              {option.isNew && (
                                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                                  ✨ New
                                </span>
                              )}
                              {option.category && (
                                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                                  {option.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {option.description.substring(0, 100)}
                              {option.description.length > 100 ? '...' : ''}
                            </p>
                            <div className="flex gap-4 text-xs">
                              <span className="text-gray-400">
                                Retail: <span className="font-mono">{formatPrice(option.price)}</span>
                              </span>
                              {option.salePrice && (
                                <span className="text-green-400">
                                  Sale: <span className="font-mono font-bold">{formatPrice(option.salePrice)}</span>
                                </span>
                              )}
                              <span className="text-gray-400">
                                Cost: <span className="font-mono">{formatPrice(option.cost)}</span>
                              </span>
                              <span className={profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                Profit: <span className="font-mono font-bold">{formatPrice(profit)}</span> ({margin.toFixed(1)}%)
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAlaCarteOption(option)}
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-md transition-colors"
                              title="Edit option"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAlaCarteOptionClick(option)}
                              className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
                              title="Delete option"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">⚙️</span>
            <h3 className="text-2xl font-teko text-gray-300 mb-2">
              Settings & Categories
            </h3>
            <p className="text-gray-500">Coming soon...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-teko tracking-wider uppercase text-gray-100">
          Admin Control Panel
        </h2>
        <p className="text-gray-400 mt-1">
          Manage your aftermarket packages, features, and pricing
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 md:p-8 flex-grow flex flex-col">
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-grow">{renderTabContent()}</div>
      </div>

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!featureToDelete}
        title="Delete Feature"
        message={`Are you sure you want to delete "${featureToDelete?.name}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!packageToDelete}
        title="Delete Package"
        message={`Are you sure you want to delete "${packageToDelete?.name}"? This will not delete the features themselves, only the package configuration.`}
        confirmLabel={isDeletingPackage ? 'Deleting...' : 'Delete Package'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmPackageDelete}
        onCancel={handleCancelPackageDelete}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!alaCarteOptionToDelete}
        title="Delete À La Carte Option"
        message={`Are you sure you want to delete "${alaCarteOptionToDelete?.name}"? This action cannot be undone.`}
        confirmLabel={isDeletingAlaCarteOption ? 'Deleting...' : 'Delete Option'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmAlaCarteOptionDelete}
        onCancel={handleCancelAlaCarteOptionDelete}
        variant="danger"
      />
    </main>
  );
};
