import React, { useState, useEffect, useCallback } from 'react';
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
    fetchFeatures(); // Refetch the list of features
    onDataUpdate(); // Trigger a full app data refresh
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
            <FeatureForm onSaveSuccess={handleSaveSuccess} />
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
                  <div key={feature.id} className="bg-gray-900/50 p-3 rounded-md flex justify-between items-center">
                    <span className="font-semibold text-gray-200">{feature.name}</span>
                    <span className="text-gray-400 font-mono">{formatPrice(feature.price)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
};