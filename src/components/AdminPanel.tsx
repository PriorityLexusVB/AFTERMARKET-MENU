import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore/lite';
import { db } from '../firebase';
import type { ProductFeature } from '../types';
import { FeatureForm } from './FeatureForm';
import { ConfirmDialog } from './ConfirmDialog';
import { deleteFeature } from '../data';

interface AdminPanelProps {
  onDataUpdate: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onDataUpdate }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<ProductFeature | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  const handleEdit = (feature: ProductFeature) => {
    setEditingFeature(feature);
    setIsFormVisible(true);
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
      fetchFeatures();
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

  return (
    <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-teko tracking-wider uppercase text-gray-100">Admin Control Panel</h2>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 md:p-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-teko tracking-wider text-white">Manage Features</h3>
          <button
            onClick={() => setIsFormVisible(prev => !prev)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 transform active:scale-95"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            {isFormVisible ? 'Cancel' : 'Add New Feature'}
          </button>
        </div>

        {isFormVisible && (
          <div className="mb-8">
            <FeatureForm
              onSaveSuccess={handleSaveSuccess}
              editingFeature={editingFeature}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        )}

        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-xl font-teko tracking-wider text-gray-300 mb-4">Existing Features</h4>
          {isLoading && <p className="text-gray-400">Loading features...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!isLoading && !error && (
            <div className="space-y-2">
              {features.length === 0 ? (
                <p className="text-gray-500">No features found. Click "Add New Feature" to create one.</p>
              ) : (
                features.map(feature => (
                  <div key={feature.id} className="bg-gray-900/50 p-3 rounded-md flex justify-between items-center hover:bg-gray-900/70 transition-colors">
                    <div className="flex-1">
                      <span className="font-semibold text-gray-200 block">{feature.name}</span>
                      <span className="text-xs text-gray-500">{feature.description.substring(0, 80)}{feature.description.length > 80 ? '...' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono">{formatPrice(feature.price)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(feature)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-md transition-colors"
                          title="Edit feature"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(feature)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
                          title="Delete feature"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

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