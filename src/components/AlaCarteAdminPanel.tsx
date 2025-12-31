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
import { batchUpdateAlaCartePositions, updateAlaCarteOption } from '../data';
import { sortOrderableItems } from '../utils/featureOrdering';

interface AlaCarteAdminPanelProps {
  onDataUpdate: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
};

const FEATURED_COLUMN = { num: 4, label: 'Featured Add-ons' } as const;

// Sortable A La Carte Item Component
interface SortableAlaCarteItemProps {
  option: AlaCarteOption;
  onEdit?: (option: AlaCarteOption) => void;
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
          {onEdit && (
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
          )}
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
  columnId: 'featured' | 'published';
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ columnId, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `lane-${columnId}`,
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
  const [options, setOptions] = useState<AlaCarteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showUnpublished, setShowUnpublished] = useState(false);
  
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

  // Organize options by column and sort by position using centralized utility
  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      if (!showUnpublished && option.isPublished !== true) return false;
      return true;
    });
  }, [options, showUnpublished]);

  const { featuredOptions, publishedOptions } = useMemo(() => {
    const base = filteredOptions;
    const featured = base.filter((option) => option.column === FEATURED_COLUMN.num);
    const published = base.filter((option) => option.column !== FEATURED_COLUMN.num);
    return {
      featuredOptions: sortOrderableItems(featured),
      publishedOptions: sortOrderableItems(published),
    };
  }, [filteredOptions]);

  // Get the active option being dragged
  const activeOption = useMemo(() => {
    if (!activeId) return null;
    return options.find(o => o.id === activeId) || null;
  }, [activeId, options]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Store backup for potential rollback
    setOptionsBackup([...options]);
  };

  // Handle drag over - for visual feedback during cross-column drag
  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by the DroppableColumn component
  };

  // Handle drag end - supports both lane reorder and cross-lane move
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const activeInFeatured = featuredOptions.some((o) => o.id === activeIdStr);
    const activeInPublished = publishedOptions.some((o) => o.id === activeIdStr);
    if (!activeInFeatured && !activeInPublished) {
      return;
    }
    const activeLane = activeInFeatured ? 'featured' : 'published';

    const overLane =
      overIdStr === 'lane-featured'
        ? 'featured'
        : overIdStr === 'lane-published'
          ? 'published'
          : (() => {
              const overInFeatured = featuredOptions.some((o) => o.id === overIdStr);
              const overInPublished = publishedOptions.some((o) => o.id === overIdStr);
              if (!overInFeatured && !overInPublished) return null;
              return overInFeatured ? 'featured' : 'published';
            })();
    if (!overLane) return;

    const sourceList = activeLane === 'featured' ? featuredOptions : publishedOptions;
    const targetList = overLane === 'featured' ? featuredOptions : publishedOptions;

    const oldIndex = sourceList.findIndex((o) => o.id === activeIdStr);
    const newIndex = targetList.findIndex((o) => o.id === overIdStr);
    if (oldIndex === -1) return;

    let nextFeatured = featuredOptions;
    let nextPublished = publishedOptions;

    if (activeLane === overLane) {
      const reordered = arrayMove(sourceList, oldIndex, newIndex === -1 ? sourceList.length - 1 : newIndex);
      if (activeLane === 'featured') {
        nextFeatured = reordered;
      } else {
        nextPublished = reordered;
      }
    } else {
      const moving = sourceList[oldIndex];
      if (!moving) return;
    const updatedMoving =
      overLane === 'featured'
        ? { ...moving, column: FEATURED_COLUMN.num }
        : { ...moving, column: undefined };

      const prunedSource = sourceList.filter((o) => o.id !== activeIdStr);
      const insertIndex = newIndex === -1 ? targetList.length : newIndex;
      const targetWithInsert = [
        ...targetList.slice(0, insertIndex),
        updatedMoving,
        ...targetList.slice(insertIndex),
      ];

      nextFeatured = overLane === 'featured' ? targetWithInsert : prunedSource;
      nextPublished = overLane === 'published' ? targetWithInsert : prunedSource;
    }

    await applyLaneUpdates(
      nextFeatured.map((option, index) => ({ ...option, position: index })),
      nextPublished.map((option, index) => ({ ...option, position: index }))
    );
  };

  // Handle keyboard reorder (up/down buttons)
  const handleKeyboardReorder = async (optionId: string, direction: 'up' | 'down') => {
    const inFeatured = featuredOptions.some((o) => o.id === optionId);
    const laneItems = inFeatured ? featuredOptions : publishedOptions;
    const currentIndex = laneItems.findIndex((o) => o.id === optionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= laneItems.length) return;

    const reordered = arrayMove(laneItems, currentIndex, newIndex);
    setOptionsBackup([...options]);
    if (inFeatured) {
      await applyLaneUpdates(
        reordered.map((option, index) => ({ ...option, position: index, column: FEATURED_COLUMN.num })),
        publishedOptions
      );
    } else {
      await applyLaneUpdates(
        featuredOptions,
        reordered.map((option, index) => ({
          ...option,
          position: index,
          column: undefined,
        }))
      );
    }
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

  const applyLaneUpdates = async (nextFeatured: AlaCarteOption[], nextPublished: AlaCarteOption[]) => {
    const normalizedFeatured = nextFeatured.map((option, index) => ({
      ...option,
      column: FEATURED_COLUMN.num,
      position: index,
    }));
    const normalizedPublished = nextPublished.map((option, index) => ({
      ...option,
      column: undefined,
      position: index,
    }));

    const updatedOptions = options.map((option) => {
      const updated =
        normalizedFeatured.find((o) => o.id === option.id) ||
        normalizedPublished.find((o) => o.id === option.id);
      return updated || option;
    });

    setIsSaving(true);
    try {
      setOptions(updatedOptions);
      await batchUpdateAlaCartePositions([
        ...normalizedFeatured.map((option) => ({
          id: option.id,
          position: option.position ?? 0,
          column: FEATURED_COLUMN.num,
          connector: option.connector,
        })),
        ...normalizedPublished.map((option) => ({
          id: option.id,
          position: option.position ?? 0,
          column: option.column,
          connector: option.connector,
        })),
      ]);
      onDataUpdate();
    } catch (err) {
      console.error("Error saving position changes:", err);
      setOptions(optionsBackup);
      setError("Failed to save position changes. Changes have been rolled back.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render a column's sortable list with droppable zone
  const renderColumnOptions = (columnOptions: AlaCarteOption[], columnId: 'featured' | 'published') => {
    return (
      <DroppableColumn columnId={columnId}>
        {columnOptions.length === 0 ? (
          <p className="text-gray-500 text-sm italic p-2">Drop items here to add to this lane</p>
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
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-teko tracking-wider text-white">Manage A La Carte Options</h3>
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
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm rounded-md px-3 py-2">
          A La Carte items are created/edited in Product Hub. This screen is for ordering/placement only.
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showUnpublished}
              onChange={(e) => setShowUnpublished(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-800"
            aria-label="Show legacy/unpublished"
          />
            Show legacy/unpublished
          </label>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-teko tracking-wider text-gray-300">A La Carte Options</h4>
          <p className="text-sm text-gray-500">Drag to reorder or move between lanes • Click AND/OR to toggle</p>
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
                <p className="text-gray-500">No published A La Carte options yet. Publish items from the Features hub.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700" data-testid="column-featured">
                      <h5 className="text-lg font-semibold text-blue-400 mb-3 font-teko tracking-wider">
                        Featured Add-Ons (Column 4)
                      </h5>
                      {renderColumnOptions(featuredOptions as AlaCarteOption[], 'featured')}
                    </div>
                    <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700" data-testid="column-published">
                      <h5 className="text-lg font-semibold text-gray-300 mb-3 font-teko tracking-wider">
                        Published (Not featured)
                      </h5>
                      {renderColumnOptions(publishedOptions as AlaCarteOption[], 'published')}
                    </div>
                  </div>
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
