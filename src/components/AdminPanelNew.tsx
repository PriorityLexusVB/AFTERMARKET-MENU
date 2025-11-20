import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore/lite';
import { db } from '../firebase';
import type { ProductFeature, PackageTier, AlaCarteOption } from '../types';
import { AdminTabs, type AdminTab } from './AdminTabs';
import { AdminDashboard } from './AdminDashboard';
import { FeatureForm } from './FeatureForm';
import { ConfirmDialog } from './ConfirmDialog';
import { deleteFeature } from '../data';
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

  // Data state
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [alaCarteOptions, setAlaCarteOptions] = useState<AlaCarteOption[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/Delete states
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<ProductFeature | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📦</span>
            <h3 className="text-2xl font-teko text-gray-300 mb-2">
              Package Management
            </h3>
            <p className="text-gray-500">Coming soon...</p>
          </div>
        );

      case 'alacarte':
        return (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🛒</span>
            <h3 className="text-2xl font-teko text-gray-300 mb-2">
              À La Carte Management
            </h3>
            <p className="text-gray-500">Coming soon...</p>
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

      {/* Delete Confirmation Dialog */}
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
    </main>
  );
};
