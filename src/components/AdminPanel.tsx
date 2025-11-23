import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore/lite';
import { db } from '../firebase';
import type { ProductFeature } from '../types';
import { FeatureForm } from './FeatureForm';

interface AdminPanelProps {
  onDataUpdate: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onDataUpdate }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchFeatures = useCallback(async () => {
    if (!db) {
      setError("Firebase is not connected.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const featuresQuery = query(collection(db, 'features'), orderBy('name'));
      const querySnapshot = await getDocs(featuresQuery);
      const featuresData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductFeature));
      setFeatures(featuresData);
    } catch (err) {
      console.error("Error fetching features:", err);
      setError("Failed to fetch product features. Please check your Firestore rules and connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleSaveSuccess = () => {
    setIsFormVisible(false);
    setEditingFeature(null);
    fetchFeatures(); // Refetch the list of features
    onDataUpdate(); // Trigger a full app data refresh
  };

  const handleEditFeature = (feature: ProductFeature) => {
    setEditingFeature(feature);
    setIsFormVisible(true);
  };

  const handleCancelEdit = () => {
    setEditingFeature(null);
    setIsFormVisible(false);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    setIsFormVisible(true);
  };

  // Organize features by column
  const featuresByColumn = useMemo(() => ({
    1: features.filter(f => f.column === 1),
    2: features.filter(f => f.column === 2),
    3: features.filter(f => f.column === 3),
    4: features.filter(f => f.column === 4),
    unassigned: features.filter(f => !f.column),
  }), [features]);

  return (
    <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-teko tracking-wider uppercase text-gray-100">Admin Control Panel</h2>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 md:p-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-teko tracking-wider text-white">Manage Features</h3>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 transform active:scale-95"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add New Feature
          </button>
        </div>

        {isFormVisible && (
          <div className="mb-8">
            <h4 className="text-xl font-teko tracking-wider text-blue-400 mb-3">
              {editingFeature ? 'Edit Feature' : 'Add New Feature'}
            </h4>
            <FeatureForm 
              onSaveSuccess={handleSaveSuccess} 
              editingFeature={editingFeature}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        )}

        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-xl font-teko tracking-wider text-gray-300 mb-4">Features by Column</h4>
          {isLoading && <p className="text-gray-400">Loading features...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!isLoading && !error && (
            <div className="space-y-6">
              {features.length === 0 ? (
                <p className="text-gray-500">No features found. Click "Add New Feature" to create one.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { num: 1, label: 'Gold Tier' },
                      { num: 2, label: 'Elite Tier' },
                      { num: 3, label: 'Platinum Tier' },
                      { num: 4, label: 'Popular Add-ons' }
                    ].map(({ num, label }) => (
                      <div key={num} className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
                        <h5 className="text-lg font-semibold text-blue-400 mb-3 font-teko tracking-wider">
                          Column {num}: {label}
                        </h5>
                        <div className="space-y-2">
                          {featuresByColumn[num as 1 | 2 | 3 | 4].length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No items</p>
                          ) : (
                            featuresByColumn[num as 1 | 2 | 3 | 4].map(feature => (
                              <div key={feature.id} className="bg-gray-800 p-3 rounded-md">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-semibold text-gray-200 text-sm">{feature.name}</span>
                                  <button
                                    onClick={() => handleEditFeature(feature)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Edit feature"
                                    aria-label={`Edit ${feature.name}`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                    </svg>
                                  </button>
                                </div>
                                <span className="text-gray-400 font-mono text-xs">{formatPrice(feature.price)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {featuresByColumn.unassigned.length > 0 && (
                    <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
                      <h5 className="text-lg font-semibold text-yellow-400 mb-3 font-teko tracking-wider">
                        Unassigned Features
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {featuresByColumn.unassigned.map(feature => (
                          <div key={feature.id} className="bg-gray-800 p-3 rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-gray-200 text-sm">{feature.name}</span>
                              <button
                                onClick={() => handleEditFeature(feature)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit feature"
                                aria-label={`Edit ${feature.name}`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                </svg>
                              </button>
                            </div>
                            <span className="text-gray-400 font-mono text-xs">{formatPrice(feature.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
};