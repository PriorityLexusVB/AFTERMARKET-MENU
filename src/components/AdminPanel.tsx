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
import type { ProductFeature } from '../types';
import { FeatureForm } from './FeatureForm';
import { batchUpdateFeaturesPositions, FeaturePositionUpdate } from '../data';

interface AdminPanelProps {
  onDataUpdate: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
};

// Column configuration
const COLUMNS = [
  { num: 1, label: 'Gold Tier' },
  { num: 2, label: 'Elite Tier' },
  { num: 3, label: 'Platinum Tier' },
  { num: 4, label: 'Popular Add-ons' },
] as const;

// Sortable Feature Item Component
interface SortableFeatureItemProps {
  feature: ProductFeature;
  onEdit: (feature: ProductFeature) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SortableFeatureItem: React.FC<SortableFeatureItemProps> = ({ 
  feature, 
  onEdit, 
  onMoveUp, 
  onMoveDown,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800 p-3 rounded-md border ${isDragging ? 'border-blue-500' : 'border-transparent'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-1 -ml-1"
            title="Drag to reorder"
            aria-label={`Drag ${feature.name} to reorder`}
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
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-mono text-xs">{formatPrice(feature.price)}</span>
        {feature.connector && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            feature.connector === 'OR' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {feature.connector}
          </span>
        )}
        {feature.position !== undefined && (
          <span className="text-xs text-gray-500">#{feature.position + 1}</span>
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

export const AdminPanel: React.FC<AdminPanelProps> = ({ onDataUpdate }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
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

  // Organize features by column and sort by position
  const featuresByColumn = useMemo(() => {
    const sortByPosition = (a: ProductFeature, b: ProductFeature) => {
      const posA = a.position ?? 999;
      const posB = b.position ?? 999;
      return posA - posB;
    };
    
    return {
      1: features.filter(f => f.column === 1).sort(sortByPosition),
      2: features.filter(f => f.column === 2).sort(sortByPosition),
      3: features.filter(f => f.column === 3).sort(sortByPosition),
      4: features.filter(f => f.column === 4).sort(sortByPosition),
      unassigned: features.filter(f => !f.column).sort(sortByPosition),
    };
  }, [features]);

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

  // Persist position changes to Firestore
  const persistPositionChanges = useCallback(async (updatedFeatures: ProductFeature[], column: number | 'unassigned') => {
    // Filter features in the affected column
    const columnFeatures = updatedFeatures.filter(f => 
      column === 'unassigned' ? !f.column : f.column === column
    );
    
    // Build position updates
    const updates: FeaturePositionUpdate[] = columnFeatures.map((feature, index) => ({
      id: feature.id,
      position: index,
      column: column === 'unassigned' ? undefined : column,
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

  // Handle drag over (for moving between columns - future enhancement)
  const handleDragOver = (_event: DragOverEvent) => {
    // Currently supporting same-column reordering only
    // Cross-column drag could be implemented here
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const activeColumn = findColumnForFeature(active.id as string);
    const overColumn = findColumnForFeature(over.id as string);
    
    // Only allow reordering within the same column for now
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

  // Render a column's sortable list
  const renderColumnFeatures = (columnFeatures: ProductFeature[], _columnId: number | 'unassigned') => {
    if (columnFeatures.length === 0) {
      return <p className="text-gray-500 text-sm italic">No items</p>;
    }
    
    return (
      <SortableContext
        items={columnFeatures.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {columnFeatures.map((feature, index) => (
            <SortableFeatureItem
              key={feature.id}
              feature={feature}
              onEdit={handleEditFeature}
              onMoveUp={() => handleKeyboardReorder(feature.id, 'up')}
              onMoveDown={() => handleKeyboardReorder(feature.id, 'down')}
              isFirst={index === 0}
              isLast={index === columnFeatures.length - 1}
            />
          ))}
        </div>
      </SortableContext>
    );
  };

  return (
    <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-teko tracking-wider uppercase text-gray-100">Admin Control Panel</h2>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 md:p-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-teko tracking-wider text-white">Manage Features</h3>
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
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-teko tracking-wider text-gray-300">Features by Column</h4>
            <p className="text-sm text-gray-500">Drag to reorder or use arrow buttons</p>
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
                        <div key={num} className="bg-gray-900/30 p-4 rounded-lg border border-gray-700" data-testid={`column-${num}`}>
                          <h5 className="text-lg font-semibold text-blue-400 mb-3 font-teko tracking-wider">
                            Column {num}: {label}
                          </h5>
                          {renderColumnFeatures(featuresByColumn[num], num)}
                        </div>
                      ))}
                    </div>
                    
                    {featuresByColumn.unassigned.length > 0 && (
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

      </div>
    </main>
  );
};