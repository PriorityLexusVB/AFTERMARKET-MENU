import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore/lite';
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
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db } from '../firebase';
import type { ProductFeature, FeatureConnector, PackageTier } from '../types';
import { AlaCarteAdminPanel } from './AlaCarteAdminPanel';
import { batchUpdateFeaturesPositions, FeaturePositionUpdate, updateFeature, setRecommendedPackage } from '../data';
import { groupFeaturesByColumn, normalizePositions, sortFeatures } from '../utils/featureOrdering';
import { ProductHub } from './ProductHub';

interface AdminPanelProps {
  onDataUpdate: () => void;
}

type AdminTab = 'features' | 'alacarte' | 'product-hub';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
};

// Column configuration - strict 1:1 mapping (Gold=Column 1, Elite=Column 2, Platinum=Column 3)
// Note: Admin panel display order shown here. Customer-facing order is Elite → Platinum → Gold.
const COLUMNS = [
  { num: 2, label: 'Elite Package (Column 2)' },
  { num: 3, label: 'Platinum Package (Column 3)' },
  { num: 1, label: 'Gold Package (Column 1)' },
  { num: 4, label: 'Popular Add-ons (Column 4)' },
] as const;


// Sortable Feature Item Component
interface SortableFeatureItemProps {
  feature: ProductFeature;
  onEdit?: (feature: ProductFeature) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleConnector: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SortableFeatureItem: React.FC<SortableFeatureItemProps> = ({ 
  feature, 
  onEdit, 
  onMoveUp, 
  onMoveDown,
  onToggleConnector,
  isFirst,
  isLast,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const connector = feature.connector || 'AND';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800 p-3 rounded-md border ${isDragging ? 'border-blue-500' : 'border-transparent'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Position indicator badge - more prominent */}
          {feature.position !== undefined && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-900 bg-blue-400 rounded-full flex-shrink-0">
              {feature.position + 1}
            </span>
          )}
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-1"
            title="Drag to reorder or move between columns"
            aria-label={`Drag ${feature.name} to reorder or move between columns`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="font-semibold text-gray-200 text-sm">{feature.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Keyboard accessible reorder controls */}
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed p-1"
            title="Move up"
            aria-label={`Move ${feature.name} up`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed p-1"
            title="Move down"
            aria-label={`Move ${feature.name} down`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(feature)}
              className="text-blue-400 hover:text-blue-300 transition-colors p-1"
              title="Edit feature"
              aria-label={`Edit ${feature.name}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-mono text-xs">{formatPrice(feature.price)}</span>
        {/* Inline AND/OR Toggle Button */}
        {!isLast ? (
          <button
            onClick={onToggleConnector}
            className={`text-xs font-semibold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              connector === 'OR' 
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
            title={`Click to toggle connector (currently ${connector})`}
            aria-label={`Toggle connector for ${feature.name}, currently ${connector}`}
          >
            {connector}
          </button>
        ) : (
          <span className="text-[11px] text-gray-500 italic">End of column</span>
        )}
      </div>
    </div>
  );
};

// Drag overlay item (shown while dragging)
const DragOverlayItem: React.FC<{ feature: ProductFeature }> = ({ feature }) => (
  <div className="bg-gray-800 p-3 rounded-md border border-blue-500 shadow-lg">
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
        <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
      </svg>
      <span className="font-semibold text-gray-200 text-sm">{feature.name}</span>
    </div>
  </div>
);

// Droppable column component for cross-column drag support
interface DroppableColumnProps {
  columnId: number | 'unassigned';
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ columnId, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${columnId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] transition-colors rounded-lg ${
        isOver ? 'bg-blue-500/10 ring-2 ring-blue-500/50' : ''
      }`}
    >
      {children}
    </div>
  );
};

// Helper functions for localStorage
const STORAGE_KEY_TAB = 'adminPanel_lastTab';
const STORAGE_KEY_BANNER_DISMISSED = 'adminPanel_alaCarteBannerDismissed';

const getStoredTab = (): AdminTab | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TAB);
    return stored === 'features' || stored === 'alacarte' || stored === 'product-hub' ? stored as AdminTab : null;
  } catch {
    return null;
  }
};

const setStoredTab = (tab: AdminTab): void => {
  try {
    localStorage.setItem(STORAGE_KEY_TAB, tab);
  } catch {
    // Silently fail if localStorage is not available
  }
};

const isBannerDismissed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY_BANNER_DISMISSED) === 'true';
  } catch {
    return false;
  }
};

const dismissBanner = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY_BANNER_DISMISSED, 'true');
  } catch {
    // Silently fail if localStorage is not available
  }
};

// Helper to get initial tab from query string or localStorage
const getInitialTab = (): AdminTab => {
  // Check query string first
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam === 'alacarte' || tabParam === 'features' || tabParam === 'product-hub') {
    return tabParam as AdminTab;
  }
  
  // Fall back to localStorage
  const storedTab = getStoredTab();
  if (storedTab) {
    return storedTab;
  }
  
  // Default to features
  return 'features';
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onDataUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab());
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [alaCarteCounts, setAlaCarteCounts] = useState<{ total: number; published: number }>({ total: 0, published: 0 });
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [showBanner, setShowBanner] = useState(!isBannerDismissed());
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [recommendedSelection, setRecommendedSelection] = useState<string>('none');
  const [isSavingRecommended, setIsSavingRecommended] = useState(false);
  const [recommendedMessage, setRecommendedMessage] = useState<string | null>(null);
  const [recommendedError, setRecommendedError] = useState<string | null>(null);
  
  // Backup state for rollback on error
  const [featuresBackup, setFeaturesBackup] = useState<ProductFeature[]>([]);
  
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

  const fetchPackages = useCallback(async () => {
    if (!db) {
      setPackages([]);
      setRecommendedSelection('none');
      return;
    }

    try {
      const packagesSnapshot = await getDocs(collection(db, 'packages'));
      const packageData: PackageTier[] = packagesSnapshot.docs.map(pkgDoc => {
        const data = pkgDoc.data() as Partial<PackageTier>;
        const isRecommended = data.isRecommended ?? data.is_recommended ?? false;
        return {
          id: pkgDoc.id,
          name: data.name ?? '',
          price: data.price ?? 0,
          cost: data.cost ?? 0,
          features: data.features ?? [],
          tier_color: data.tier_color ?? '',
          isRecommended,
          is_recommended: data.is_recommended,
        };
      });
      setPackages(packageData);
      setRecommendedSelection(packageData.find(pkg => pkg.isRecommended ?? pkg.is_recommended)?.id ?? 'none');
      setRecommendedError(null);
    } catch (err) {
      console.error("Error fetching packages:", err);
      setPackages([]);
      setRecommendedSelection('none');
      setRecommendedError("Failed to load packages.");
    }
  }, []);

  const fetchAlaCarteCount = useCallback(async () => {
    if (!db) {
      setIsLoadingCount(false);
      return;
    }
    setIsLoadingCount(true);
    try {
      const alaCarteQuery = collection(db, 'ala_carte_options');
      const querySnapshot = await getDocs(alaCarteQuery);
      const docs = querySnapshot.docs;
      const total = querySnapshot.size;
      const published = docs.reduce((count: number, doc: any) => {
        const data = typeof doc.data === 'function' ? (doc.data() as { isPublished?: boolean }) : undefined;
        return data && data.isPublished === true ? count + 1 : count;
      }, 0);
      setAlaCarteCounts({ total, published });
    } catch (err) {
      console.error("Error fetching A La Carte count:", err);
      // Silently fail - count is not critical
      setAlaCarteCounts({ total: 0, published: 0 });
    } finally {
      setIsLoadingCount(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
    fetchAlaCarteCount();
    fetchPackages();
  }, [fetchFeatures, fetchAlaCarteCount, fetchPackages]);

  useEffect(() => {
    if (!recommendedMessage) return;
    const timeoutId = window.setTimeout(() => setRecommendedMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [recommendedMessage]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setStoredTab(tab);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    dismissBanner();
  };

  const handleAlaCarteDataUpdate = useCallback(() => {
    fetchAlaCarteCount();
    onDataUpdate();
  }, [fetchAlaCarteCount, onDataUpdate]);

  const handleRecommendedChange = useCallback(async (packageId: string | 'none') => {
    const previousSelection = recommendedSelection;
    if (packageId === 'none') {
      setRecommendedSelection('none');
    } else {
      setRecommendedSelection(packageId);
    }
    setRecommendedMessage(null);
    setRecommendedError(null);
    setIsSavingRecommended(true);
    try {
      await setRecommendedPackage(packageId === 'none' ? null : packageId);
      setRecommendedMessage('Saved');
      await fetchPackages();
      onDataUpdate();
    } catch (err) {
      console.error("Error updating recommended package:", err);
      const message = err instanceof Error ? err.message : 'Failed to update recommended package.';
      setRecommendedError(message);
      setRecommendedSelection(previousSelection);
      await fetchPackages();
    } finally {
      setIsSavingRecommended(false);
    }
  }, [fetchPackages, onDataUpdate, recommendedSelection]);

  // Organize features by column and sort by position using centralized utility
  const featuresByColumn = useMemo(() => {
    return groupFeaturesByColumn(features);
  }, [features]);

  // Count unassigned features for the tab badge
  const unassignedCount = useMemo(() => {
    return featuresByColumn.unassigned.length;
  }, [featuresByColumn]);

  const elitePackageId = useMemo(
    () => packages.find(pkg => pkg.name.toLowerCase().includes('elite'))?.id,
    [packages]
  );
  const platinumPackageId = useMemo(
    () => packages.find(pkg => pkg.name.toLowerCase().includes('platinum'))?.id,
    [packages]
  );
  const goldPackageId = useMemo(
    () => packages.find(pkg => pkg.name.toLowerCase().includes('gold'))?.id,
    [packages]
  );

  // Get the active feature being dragged
  const activeFeature = useMemo(() => {
    if (!activeId) return null;
    return features.find(f => f.id === activeId) || null;
  }, [activeId, features]);

  // Find which column a feature belongs to
  const findColumnForFeature = useCallback((featureId: string): number | 'unassigned' | null => {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return null;
    return feature.column || 'unassigned';
  }, [features]);

  // Persist position changes to Firestore with normalization
  const persistPositionChanges = useCallback(async (updatedFeatures: ProductFeature[], column: number | 'unassigned') => {
    // Filter features in the affected column and sort by position
    const columnFeatures = sortFeatures(
      updatedFeatures.filter(f => column === 'unassigned' ? !f.column : f.column === column)
    );
    
    // Normalize positions (0..n-1) to ensure deterministic ordering
    const normalizedFeatures = normalizePositions(columnFeatures);
    
    // Build position updates with normalized positions
    const updates: FeaturePositionUpdate[] = normalizedFeatures.map((feature) => ({
      id: feature.id,
      position: feature.position!, // position is guaranteed by normalizePositions
      column: column === 'unassigned' ? undefined : column,
      connector: feature.connector,
    }));
    
    if (updates.length === 0) return;
    
    setIsSaving(true);
    try {
      await batchUpdateFeaturesPositions(updates);
      onDataUpdate(); // Trigger app-wide refresh
    } catch (err) {
      console.error("Error saving position changes:", err);
      // Rollback to backup
      setFeatures(featuresBackup);
      setError("Failed to save position changes. Changes have been rolled back.");
    } finally {
      setIsSaving(false);
    }
  }, [featuresBackup, onDataUpdate]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Store backup for potential rollback
    setFeaturesBackup([...features]);
  };

  // Helper to parse column ID from droppable zone
  const parseColumnFromDroppableId = (id: string): number | 'unassigned' | null => {
    const allowedColumns = [1, 2, 3, 4];
    if (typeof id === 'string' && id.startsWith('column-')) {
      const columnPart = id.replace('column-', '');
      if (columnPart === 'unassigned') return 'unassigned';
      const num = parseInt(columnPart, 10);
      if (!isNaN(num) && allowedColumns.includes(num)) return num;
    }
    return null;
  };

  // Handle drag over - for visual feedback during cross-column drag
  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by the DroppableColumn component
  };

  // Handle drag end - supports both same-column reorder and cross-column move
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) {
      return;
    }

    const activeColumn = findColumnForFeature(active.id as string);
    if (activeColumn === null) return;

    // Check if dropped on a column zone
    const targetColumn = parseColumnFromDroppableId(over.id as string);
    
    if (targetColumn !== null) {
      if (targetColumn !== activeColumn) {
        // Cross-column move
        const movedFeature = features.find(f => f.id === active.id);
        if (!movedFeature) return;
        
        // Get features in the target column to determine position
        const targetColumnFeatures = targetColumn === 'unassigned' 
          ? featuresByColumn.unassigned 
          : featuresByColumn[targetColumn as 1 | 2 | 3 | 4];
        
        // Add at the end of the target column
        // If the target column is empty, targetColumnFeatures.length will be 0,
        // so the new feature will be placed at position 0 (the expected behavior).
        const newPosition = targetColumnFeatures.length;
        
        // Update the feature's column and position
        const updatedFeature = {
          ...movedFeature,
          column: targetColumn === 'unassigned' ? undefined : targetColumn,
          position: newPosition,
        };
        
        // Also need to update positions in the old column (fill the gap)
        const oldColumnFeatures = activeColumn === 'unassigned' 
          ? featuresByColumn.unassigned.filter(f => f.id !== active.id)
          : featuresByColumn[activeColumn as 1 | 2 | 3 | 4].filter(f => f.id !== active.id);
        
        const updatedOldColumnFeatures = oldColumnFeatures.map((f, idx) => ({
          ...f,
          position: idx,
        }));
        
        // Store backup immediately before optimistic update for consistent rollback state
        setFeaturesBackup([...features]);
        
        // Optimistic UI update
        const updatedFeatures = features.map(f => {
          if (f.id === active.id) return updatedFeature;
          const updated = updatedOldColumnFeatures.find(uf => uf.id === f.id);
          return updated || f;
        });
        
        setFeatures(updatedFeatures);
        
        // Persist changes to both columns
        setIsSaving(true);
        try {
          // Build updates for both columns
          const allUpdates: FeaturePositionUpdate[] = [
            // The moved feature
            {
              id: updatedFeature.id,
              position: updatedFeature.position!,
              column: updatedFeature.column,
              connector: updatedFeature.connector,
            },
            // Updated positions in old column
            ...updatedOldColumnFeatures.map(f => ({
              id: f.id,
              position: f.position!,
              column: f.column,
              connector: f.connector,
            })),
          ];
          
          await batchUpdateFeaturesPositions(allUpdates);
          onDataUpdate();
        } catch (err) {
          console.error("Error saving cross-column move:", err);
          setFeatures(featuresBackup);
          setError("Failed to move feature to new column. Changes have been rolled back.");
        } finally {
          setIsSaving(false);
        }
        return;
      }

      // Same-column drop on column zone: move to end (or no-op if already last)
      const columnFeatures = [...(activeColumn === 'unassigned' 
        ? featuresByColumn.unassigned 
        : featuresByColumn[activeColumn as 1 | 2 | 3 | 4])];

      const oldIndex = columnFeatures.findIndex(f => f.id === active.id);
      if (oldIndex === -1) return;

      const newIndex = columnFeatures.length - 1;
      if (newIndex === oldIndex) return;

      const reorderedColumnFeatures = arrayMove(columnFeatures, oldIndex, newIndex);
      
      const updatedColumnFeatures = reorderedColumnFeatures.map((feature, index) => ({
        ...feature,
        position: index,
      }));
      
      const updatedFeatures = features.map(f => {
        const updated = updatedColumnFeatures.find(uf => uf.id === f.id);
        return updated || f;
      });
      
      setFeatures(updatedFeatures);
      await persistPositionChanges(updatedFeatures, activeColumn);
      return;
    }
    
    // Same-column reorder: dropped on another feature
    const overColumn = findColumnForFeature(over.id as string);
    
    if (active.id === over.id) {
      return;
    }
    
    // Only allow reordering within the same column when dropping on a feature
    if (activeColumn !== overColumn || activeColumn === null) {
      return;
    }
    
    // Get features in the column
    const columnFeatures = [...(activeColumn === 'unassigned' 
      ? featuresByColumn.unassigned 
      : featuresByColumn[activeColumn as 1 | 2 | 3 | 4])];
    
    const oldIndex = columnFeatures.findIndex(f => f.id === active.id);
    const newIndex = columnFeatures.findIndex(f => f.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    // Reorder the column features
    const reorderedColumnFeatures = arrayMove(columnFeatures, oldIndex, newIndex);
    
    // Update positions in the reordered array
    const updatedColumnFeatures = reorderedColumnFeatures.map((feature, index) => ({
      ...feature,
      position: index,
    }));
    
    // Optimistic UI update
    const updatedFeatures = features.map(f => {
      const updated = updatedColumnFeatures.find(uf => uf.id === f.id);
      return updated || f;
    });
    
    setFeatures(updatedFeatures);
    
    // Persist to Firestore
    await persistPositionChanges(updatedFeatures, activeColumn);
  };

  // Handle keyboard reorder (up/down buttons)
  const handleKeyboardReorder = async (featureId: string, direction: 'up' | 'down') => {
    const column = findColumnForFeature(featureId);
    if (column === null) return;
    
    const columnFeatures = [...(column === 'unassigned' 
      ? featuresByColumn.unassigned 
      : featuresByColumn[column as 1 | 2 | 3 | 4])];
    
    const currentIndex = columnFeatures.findIndex(f => f.id === featureId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= columnFeatures.length) return;
    
    // Store backup for rollback
    setFeaturesBackup([...features]);
    
    // Reorder
    const reorderedColumnFeatures = arrayMove(columnFeatures, currentIndex, newIndex);
    const updatedColumnFeatures = reorderedColumnFeatures.map((feature, index) => ({
      ...feature,
      position: index,
    }));
    
    // Optimistic UI update
    const updatedFeatures = features.map(f => {
      const updated = updatedColumnFeatures.find(uf => uf.id === f.id);
      return updated || f;
    });
    
    setFeatures(updatedFeatures);
    
    // Persist to Firestore
    await persistPositionChanges(updatedFeatures, column);
  };

  // Handle inline connector toggle (AND/OR)
  const handleToggleConnector = async (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;
    
    const currentConnector = feature.connector || 'AND';
    const newConnector: FeatureConnector = currentConnector === 'AND' ? 'OR' : 'AND';
    
    // Store backup for rollback
    setFeaturesBackup([...features]);
    
    // Optimistic UI update
    const updatedFeatures = features.map(f => 
      f.id === featureId ? { ...f, connector: newConnector } : f
    );
    setFeatures(updatedFeatures);
    
    // Persist to Firestore
    setIsSaving(true);
    try {
      await updateFeature(featureId, { connector: newConnector });
      onDataUpdate();
    } catch (err) {
      console.error("Error toggling connector:", err);
      setFeatures(featuresBackup);
      setError("Failed to toggle connector. Changes have been rolled back.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render a column's sortable list with droppable zone
  const renderColumnFeatures = (columnFeatures: ProductFeature[], columnId: number | 'unassigned') => {
    // Get a helpful empty state message for each column
    const getEmptyMessage = (): string => {
      if (columnId === 2) return 'No Elite features yet - drag items here from unassigned or other columns';
      if (columnId === 3) return 'No Platinum features yet - drag items here from unassigned or other columns';
      if (columnId === 1) return 'No Gold features yet - drag items here from unassigned or other columns';
      if (columnId === 4) return 'No Popular Add-ons yet - drag featured items here';
      return 'Drop items here to assign them';
    };

    if (columnFeatures.length === 0) {
      return (
        <DroppableColumn columnId={columnId}>
          <p className="text-gray-500 text-sm italic p-2">{getEmptyMessage()}</p>
        </DroppableColumn>
      );
    }

    return (
      <>
        <SortableContext
          items={columnFeatures.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {columnFeatures.map((feature, index) => (
              <SortableFeatureItem
                key={feature.id}
                feature={feature}
                onMoveUp={() => handleKeyboardReorder(feature.id, 'up')}
                onMoveDown={() => handleKeyboardReorder(feature.id, 'down')}
                onToggleConnector={() => handleToggleConnector(feature.id)}
                isFirst={index === 0}
                isLast={index === columnFeatures.length - 1}
              />
            ))}
          </div>
        </SortableContext>
        {/* Lightweight drop target for whitespace/bottom-of-column drops without wrapping items */}
        <DroppableColumn columnId={columnId}>
          <div className="h-3 pointer-events-none" aria-hidden="true" />
        </DroppableColumn>
      </>
    );
  };

  return (
    <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-teko tracking-wider uppercase text-gray-100">Admin Control Panel</h2>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 md:p-8 flex-grow">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-1">
            <button
              onClick={() => handleTabChange('features')}
              className={`px-6 py-3 font-semibold font-teko text-lg tracking-wider transition-colors ${
                activeTab === 'features'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Package Features
              {!isLoading && features.length > 0 && (
                <span className={`ml-2 text-sm ${activeTab === 'features' ? 'text-blue-300' : 'text-gray-500'}`}>
                  ({features.length}{unassignedCount > 0 ? `, ${unassignedCount} unassigned` : ''})
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('alacarte')}
              className={`px-6 py-3 font-semibold font-teko text-lg tracking-wider transition-colors ${
                activeTab === 'alacarte'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              A La Carte Options
              {!isLoadingCount && (
                <span className={`ml-2 text-sm ${activeTab === 'alacarte' ? 'text-blue-300' : 'text-gray-500'}`}>
                  ({alaCarteCounts.published}/{alaCarteCounts.total})
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('product-hub')}
              className={`px-6 py-3 font-semibold font-teko text-lg tracking-wider transition-colors ${
                activeTab === 'product-hub'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Product Hub
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'alacarte' ? (
          <AlaCarteAdminPanel onDataUpdate={handleAlaCarteDataUpdate} />
        ) : activeTab === 'product-hub' ? (
          <ProductHub onDataUpdate={onDataUpdate} onAlaCarteChange={fetchAlaCarteCount} />
        ) : (
          <>
            {/* Informational Banner for A La Carte Options */}
            {showBanner && alaCarteCounts.total > 0 && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-blue-300 text-sm">
                    <strong>Looking for A La Carte options?</strong> They are managed separately in the{' '}
                    <button
                      onClick={() => handleTabChange('alacarte')}
                      className="underline hover:text-blue-200 font-semibold"
                    >
                      A La Carte Options
                    </button>{' '}
                    tab. You currently have <strong>{alaCarteCounts.total}</strong> A La Carte option{alaCarteCounts.total !== 1 ? 's' : ''}.
                  </p>
                </div>
                <button
                  onClick={handleDismissBanner}
                  className="text-gray-400 hover:text-gray-300 flex-shrink-0"
                  aria-label="Dismiss banner"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-teko tracking-wider text-white">Manage Package Features</h3>
              <div className="flex items-center gap-3">
                {isSaving && (
                  <span className="text-blue-400 text-sm flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              This view is for column ordering by tier. Create or edit products in the{' '}
              <button
                onClick={() => handleTabChange('product-hub')}
                className="underline text-blue-300 hover:text-blue-200 font-semibold"
              >
                Product Hub
              </button>.
            </p>

            <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm text-gray-300 font-semibold">Recommended package</p>
                  <p className="text-xs text-gray-500">Choose which package shows the recommended badge to customers.</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {isSavingRecommended && <span className="text-blue-400 flex items-center gap-1">Saving...</span>}
                  {recommendedMessage && !isSavingRecommended && <span className="text-green-400 flex items-center gap-1">Saved</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3" role="radiogroup" aria-label="Recommended package">
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="radio"
                    name="recommended-package"
                    checked={recommendedSelection === elitePackageId}
                    disabled={!elitePackageId || isSavingRecommended}
                    onChange={() => elitePackageId && handleRecommendedChange(elitePackageId)}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  Elite
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="radio"
                    name="recommended-package"
                    checked={recommendedSelection === platinumPackageId}
                    disabled={!platinumPackageId || isSavingRecommended}
                    onChange={() => platinumPackageId && handleRecommendedChange(platinumPackageId)}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  Platinum
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="radio"
                    name="recommended-package"
                    checked={recommendedSelection === goldPackageId}
                    disabled={!goldPackageId || isSavingRecommended}
                    onChange={() => goldPackageId && handleRecommendedChange(goldPackageId)}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  Gold
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="radio"
                    name="recommended-package"
                    checked={recommendedSelection === 'none'}
                    disabled={isSavingRecommended}
                    onChange={() => handleRecommendedChange('none')}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  None
                </label>
              </div>
              {recommendedError && <p className="text-red-400 text-sm mt-2">{recommendedError}</p>}
            </div>

        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-teko tracking-wider text-gray-300">Features by Column</h4>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 text-sm cursor-pointer bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:bg-gray-900 transition-colors">
                <input
                  type="checkbox"
                  checked={showUnassigned}
                  onChange={(e) => setShowUnassigned(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-600 bg-gray-800"
                  aria-label="Show unassigned features"
                />
                <span className="font-medium text-gray-300">
                  Show unassigned
                  {unassignedCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-yellow-900 bg-yellow-400 rounded-full">
                      {unassignedCount}
                    </span>
                  )}
                </span>
              </label>
              <p className="text-sm text-gray-500">Drag using the ≡ handle to reorder or move between columns • AND/OR controls the connector to the NEXT item below (hidden on the last item)</p>
            </div>
          </div>
          {isLoading && <p className="text-gray-400">Loading features...</p>}
          {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{error}</p>}
          {!isLoading && !error && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {features.length === 0 ? (
                  <p className="text-gray-500">No features found. Click "Add New Feature" to create one.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {COLUMNS.map(({ num, label }) => (
                        <div 
                          key={num} 
                          className={`p-4 rounded-lg border ${
                            num === 4 
                              ? 'bg-purple-900/10 border-purple-700/50' 
                              : 'bg-gray-900/30 border-gray-700'
                          }`}
                          data-testid={`column-${num}`}
                        >
                          <h5 className={`text-lg font-semibold mb-1 font-teko tracking-wider ${
                            num === 4 ? 'text-purple-400' : 'text-blue-400'
                          }`}>
                            {label}
                          </h5>
                          <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted mb-2">Package column {num}</p>
                          {renderColumnFeatures(featuresByColumn[num], num)}
                        </div>
                      ))}
                    </div>
                    
                    {showUnassigned && featuresByColumn.unassigned.length > 0 && (
                      <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700" data-testid="column-unassigned">
                        <h5 className="text-lg font-semibold text-yellow-400 mb-3 font-teko tracking-wider">
                          Unassigned Features
                        </h5>
                        {renderColumnFeatures(featuresByColumn.unassigned, 'unassigned')}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <DragOverlay>
                {activeFeature ? <DragOverlayItem feature={activeFeature} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
          </>
        )}
      </div>
    </main>
  );
};
