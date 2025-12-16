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
import type { AlaCarteOption, FeatureConnector } from '../types';
import { AlaCarteForm } from './AlaCarteForm';
import { batchUpdateAlaCartePositions, AlaCartePositionUpdate, updateAlaCarteOption } from '../data';
import { groupFeaturesByColumn, normalizePositions, sortFeatures } from '../utils/featureOrdering';

interface AlaCarteAdminPanelProps {
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

// Sortable A La Carte Item Component
interface SortableAlaCarteItemProps {
  option: AlaCarteOption;
  onEdit: (option: AlaCarteOption) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleConnector: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SortableAlaCarteItem: React.FC<SortableAlaCarteItemProps> = ({ 
  option, 
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
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const connector = option.connector || 'AND';

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
            title="Drag to reorder or move between columns"
            aria-label={`Drag ${option.name} to reorder or move between columns`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="font-semibold text-gray-200 text-sm">{option.name}</span>
          {option.isNew && (
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-1.5 py-0.5 rounded">NEW</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Keyboard accessible reorder controls */}
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed p-1"
            title="Move up"
            aria-label={`Move ${option.name} up`}
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
            aria-label={`Move ${option.name} down`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(option)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
            title="Edit option"
            aria-label={`Edit ${option.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-mono text-xs">{formatPrice(option.price)}</span>
        {/* Inline AND/OR Toggle Button */}
        <button
          onClick={onToggleConnector}
          className={`text-xs font-semibold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
            connector === 'OR' 
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
          title={`Click to toggle connector (currently ${connector})`}
          aria-label={`Toggle connector for ${option.name}, currently ${connector}`}
        >
          {connector}
        </button>
        {option.position !== undefined && (
          <span className="text-xs text-gray-500">#{option.position + 1}</span>
        )}
      </div>
    </div>
  );
};

// Drag overlay item (shown while dragging)
const DragOverlayItem: React.FC<{ option: AlaCarteOption }> = ({ option }) => (
  <div className="bg-gray-800 p-3 rounded-md border border-blue-500 shadow-lg">
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
        <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
      </svg>
      <span className="font-semibold text-gray-200 text-sm">{option.name}</span>
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

export const AlaCarteAdminPanel: React.FC<AlaCarteAdminPanelProps> = ({ onDataUpdate }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [options, setOptions] = useState<AlaCarteOption[]>([]);
  const [editingOption, setEditingOption] = useState<AlaCarteOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Backup state for rollback on error
  const [optionsBackup, setOptionsBackup] = useState<AlaCarteOption[]>([]);
  
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
  
  const fetchOptions = useCallback(async () => {
    if (!db) {
      setError("Firebase is not connected.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const optionsQuery = query(collection(db, 'ala_carte_options'), orderBy('name'));
      const querySnapshot = await getDocs(optionsQuery);
      const optionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlaCarteOption));
      setOptions(optionsData);
    } catch (err) {
      console.error("Error fetching A La Carte options:", err);
      setError("Failed to fetch A La Carte options. Please check your Firestore rules and connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleSaveSuccess = () => {
    setIsFormVisible(false);
    setEditingOption(null);
    fetchOptions(); // Refetch the list of options
    onDataUpdate(); // Trigger a full app data refresh
  };

  const handleEditOption = (option: AlaCarteOption) => {
    setEditingOption(option);
    setIsFormVisible(true);
  };

  const handleCancelEdit = () => {
    setEditingOption(null);
    setIsFormVisible(false);
  };

  const handleAddNew = () => {
    setEditingOption(null);
    setIsFormVisible(true);
  };

  // Organize options by column and sort by position using centralized utility
  // Cast AlaCarteOption[] to ProductFeature[] for compatibility with utility functions
  const optionsByColumn = useMemo(() => {
    return groupFeaturesByColumn(options as any);
  }, [options]);

  // Get the active option being dragged
  const activeOption = useMemo(() => {
    if (!activeId) return null;
    return options.find(o => o.id === activeId) || null;
  }, [activeId, options]);

  // Find which column an option belongs to
  const findColumnForOption = useCallback((optionId: string): number | 'unassigned' | null => {
    const option = options.find(o => o.id === optionId);
    if (!option) return null;
    return option.column || 'unassigned';
  }, [options]);

  // Persist position changes to Firestore with normalization
  const persistPositionChanges = useCallback(async (updatedOptions: AlaCarteOption[], column: number | 'unassigned') => {
    // Filter options in the affected column and sort by position
    const columnOptions = sortFeatures(
      updatedOptions.filter(o => column === 'unassigned' ? !o.column : o.column === column) as any
    ) as AlaCarteOption[];
    
    // Normalize positions (0..n-1) to ensure deterministic ordering
    const normalizedOptions = normalizePositions(columnOptions as any) as AlaCarteOption[];
    
    // Build position updates with normalized positions
    const updates: AlaCartePositionUpdate[] = normalizedOptions.map((option) => ({
      id: option.id,
      position: option.position!, // position is guaranteed by normalizePositions
      column: column === 'unassigned' ? undefined : column,
      connector: option.connector,
    }));
    
    if (updates.length === 0) return;
    
    setIsSaving(true);
    try {
      await batchUpdateAlaCartePositions(updates);
      onDataUpdate(); // Trigger app-wide refresh
    } catch (err) {
      console.error("Error saving position changes:", err);
      // Rollback to backup
      setOptions(optionsBackup);
      setError("Failed to save position changes. Changes have been rolled back.");
    } finally {
      setIsSaving(false);
    }
  }, [optionsBackup, onDataUpdate]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Store backup for potential rollback
    setOptionsBackup([...options]);
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

    const activeColumn = findColumnForOption(active.id as string);
    if (activeColumn === null) return;

    // Check if dropped on a column zone (cross-column move)
    const targetColumn = parseColumnFromDroppableId(over.id as string);
    
    // If dropped on a column zone and it's a different column, perform cross-column move
    if (targetColumn !== null && targetColumn !== activeColumn) {
      // Move option to the new column
      const movedOption = options.find(o => o.id === active.id);
      if (!movedOption) return;
      
      // Get options in the target column to determine position
      const targetColumnOptions = targetColumn === 'unassigned' 
        ? optionsByColumn.unassigned 
        : optionsByColumn[targetColumn as 1 | 2 | 3 | 4];
      
      // Add at the end of the target column
      const newPosition = targetColumnOptions.length;
      
      // Update the option's column and position
      const updatedOption = {
        ...movedOption,
        column: targetColumn === 'unassigned' ? undefined : targetColumn,
        position: newPosition,
      };
      
      // Also need to update positions in the old column (fill the gap)
      const oldColumnOptions = activeColumn === 'unassigned' 
        ? optionsByColumn.unassigned.filter(o => o.id !== active.id)
        : optionsByColumn[activeColumn as 1 | 2 | 3 | 4].filter(o => o.id !== active.id);
      
      const updatedOldColumnOptions = oldColumnOptions.map((o, idx) => ({
        ...o,
        position: idx,
      })) as AlaCarteOption[];
      
      // Store backup immediately before optimistic update for consistent rollback state
      setOptionsBackup([...options]);
      
      // Optimistic UI update
      const updatedOptions = options.map(o => {
        if (o.id === active.id) return updatedOption;
        const updated = updatedOldColumnOptions.find(uo => uo.id === o.id);
        return updated || o;
      });
      
      setOptions(updatedOptions);
      
      // Persist changes to both columns
      setIsSaving(true);
      try {
        // Build updates for both columns
        const allUpdates: AlaCartePositionUpdate[] = [
          // The moved option
          {
            id: updatedOption.id,
            position: updatedOption.position!,
            column: updatedOption.column,
            connector: updatedOption.connector,
          },
          // Updated positions in old column
          ...updatedOldColumnOptions.map(o => ({
            id: o.id,
            position: o.position!,
            column: o.column,
            connector: o.connector,
          })),
        ];
        
        await batchUpdateAlaCartePositions(allUpdates);
        onDataUpdate();
      } catch (err) {
        console.error("Error saving cross-column move:", err);
        setOptions(optionsBackup);
        setError("Failed to move option to new column. Changes have been rolled back.");
      } finally {
        setIsSaving(false);
      }
      return;
    }
    
    // Same-column reorder: dropped on another option
    const overColumn = findColumnForOption(over.id as string);
    
    if (active.id === over.id) {
      return;
    }
    
    // Only allow reordering within the same column when dropping on an option
    if (activeColumn !== overColumn || activeColumn === null) {
      return;
    }
    
    // Get options in the column
    const columnOptions = [...(activeColumn === 'unassigned' 
      ? optionsByColumn.unassigned 
      : optionsByColumn[activeColumn as 1 | 2 | 3 | 4])];
    
    const oldIndex = columnOptions.findIndex(o => o.id === active.id);
    const newIndex = columnOptions.findIndex(o => o.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    // Reorder the column options
    const reorderedColumnOptions = arrayMove(columnOptions, oldIndex, newIndex);
    
    // Update positions in the reordered array
    const updatedColumnOptions = reorderedColumnOptions.map((option, index) => ({
      ...option,
      position: index,
    })) as AlaCarteOption[];
    
    // Optimistic UI update
    const updatedOptions = options.map(o => {
      const updated = updatedColumnOptions.find(uo => uo.id === o.id);
      return updated || o;
    });
    
    setOptions(updatedOptions);
    
    // Persist to Firestore
    await persistPositionChanges(updatedOptions, activeColumn);
  };

  // Handle keyboard reorder (up/down buttons)
  const handleKeyboardReorder = async (optionId: string, direction: 'up' | 'down') => {
    const column = findColumnForOption(optionId);
    if (column === null) return;
    
    const columnOptions = [...(column === 'unassigned' 
      ? optionsByColumn.unassigned 
      : optionsByColumn[column as 1 | 2 | 3 | 4])];
    
    const currentIndex = columnOptions.findIndex(o => o.id === optionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= columnOptions.length) return;
    
    // Store backup for rollback
    setOptionsBackup([...options]);
    
    // Reorder
    const reorderedColumnOptions = arrayMove(columnOptions, currentIndex, newIndex);
    const updatedColumnOptions = reorderedColumnOptions.map((option, index) => ({
      ...option,
      position: index,
    })) as AlaCarteOption[];
    
    // Optimistic UI update
    const updatedOptions = options.map(o => {
      const updated = updatedColumnOptions.find(uo => uo.id === o.id);
      return updated || o;
    });
    
    setOptions(updatedOptions);
    
    // Persist to Firestore
    await persistPositionChanges(updatedOptions, column);
  };

  // Handle inline connector toggle (AND/OR)
  const handleToggleConnector = async (optionId: string) => {
    const option = options.find(o => o.id === optionId);
    if (!option) return;
    
    const currentConnector = option.connector || 'AND';
    const newConnector: FeatureConnector = currentConnector === 'AND' ? 'OR' : 'AND';
    
    // Store backup for rollback
    setOptionsBackup([...options]);
    
    // Optimistic UI update
    const updatedOptions = options.map(o => 
      o.id === optionId ? { ...o, connector: newConnector } : o
    );
    setOptions(updatedOptions);
    
    // Persist to Firestore
    setIsSaving(true);
    try {
      await updateAlaCarteOption(optionId, { connector: newConnector });
      onDataUpdate();
    } catch (err) {
      console.error("Error toggling connector:", err);
      setOptions(optionsBackup);
      setError("Failed to toggle connector. Changes have been rolled back.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render a column's sortable list with droppable zone
  const renderColumnOptions = (columnOptions: AlaCarteOption[], columnId: number | 'unassigned') => {
    return (
      <DroppableColumn columnId={columnId}>
        {columnOptions.length === 0 ? (
          <p className="text-gray-500 text-sm italic p-2">Drop items here to add to this column</p>
        ) : (
          <SortableContext
            items={columnOptions.map(o => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {columnOptions.map((option, index) => (
                <SortableAlaCarteItem
                  key={option.id}
                  option={option}
                  onEdit={handleEditOption}
                  onMoveUp={() => handleKeyboardReorder(option.id, 'up')}
                  onMoveDown={() => handleKeyboardReorder(option.id, 'down')}
                  onToggleConnector={() => handleToggleConnector(option.id)}
                  isFirst={index === 0}
                  isLast={index === columnOptions.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </DroppableColumn>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-teko tracking-wider text-white">Manage A La Carte Options</h3>
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
            Add New Option
          </button>
        </div>
      </div>

      {isFormVisible && (
        <div className="mb-8">
          <h4 className="text-xl font-teko tracking-wider text-blue-400 mb-3">
            {editingOption ? 'Edit A La Carte Option' : 'Add New A La Carte Option'}
          </h4>
          <AlaCarteForm 
            onSaveSuccess={handleSaveSuccess} 
            editingOption={editingOption}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      )}

      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-teko tracking-wider text-gray-300">A La Carte Options by Column</h4>
          <p className="text-sm text-gray-500">Drag to reorder or move between columns • Click AND/OR to toggle</p>
        </div>
        {isLoading && <p className="text-gray-400">Loading A La Carte options...</p>}
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
              {options.length === 0 ? (
                <p className="text-gray-500">No A La Carte options found. Click "Add New Option" to create one.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {COLUMNS.map(({ num, label }) => (
                      <div key={num} className="bg-gray-900/30 p-4 rounded-lg border border-gray-700" data-testid={`column-${num}`}>
                        <h5 className="text-lg font-semibold text-blue-400 mb-3 font-teko tracking-wider">
                          Column {num}: {label}
                        </h5>
                        {renderColumnOptions(optionsByColumn[num] as AlaCarteOption[], num)}
                      </div>
                    ))}
                  </div>
                  
                  {optionsByColumn.unassigned.length > 0 && (
                    <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700" data-testid="column-unassigned">
                      <h5 className="text-lg font-semibold text-yellow-400 mb-3 font-teko tracking-wider">
                        Unassigned Options
                      </h5>
                      {renderColumnOptions(optionsByColumn.unassigned as AlaCarteOption[], 'unassigned')}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <DragOverlay>
              {activeOption ? <DragOverlayItem option={activeOption} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};
