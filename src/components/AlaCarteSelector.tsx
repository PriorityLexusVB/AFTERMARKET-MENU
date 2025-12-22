import React from 'react';
import type { AlaCarteOption, ProductFeature } from '../types';
import { AlaCarteItem } from './AlaCarteItem';
import { columnOrderValue, isCuratedOption } from '../utils/alaCarte';

interface AlaCarteSelectorProps {
  items: AlaCarteOption[];
  onViewItem: (item: ProductFeature | AlaCarteOption) => void;
  disableDrag?: boolean;
  onToggleItem?: (item: AlaCarteOption) => void;
  selectedIds?: string[];
}

export const AlaCarteSelector: React.FC<AlaCarteSelectorProps> = ({ items, onViewItem, disableDrag = false, onToggleItem, selectedIds = [] }) => {
  const curatedItems = items.filter(isCuratedOption);

  const placedItems = curatedItems
    .filter((item) => typeof item.column === 'number')
    .sort((a, b) => {
      const columnDiff = columnOrderValue(a.column) - columnOrderValue(b.column);
      if (columnDiff !== 0) return columnDiff;
      const posA = a.position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.position ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });

  const unplacedItems = curatedItems
    .filter((item) => typeof item.column !== 'number')
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedSet = new Set(selectedIds);

  const handleDragStart = (e: React.DragEvent, item: AlaCarteOption) => {
    if (disableDrag) return;
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  };

  if (curatedItems.length === 0) {
    return (
        <div className="text-center py-10 px-6 lux-card border-dashed border-lux-border/60 col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-lux-gold">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h4 className="text-xl font-bold font-teko text-lux-textStrong tracking-wider">No add-ons configured</h4>
          <p className="lux-subtitle mt-1">Please check back for curated options.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {placedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:col-span-3 gap-6">
          {placedItems.map((item) => (
            <AlaCarteItem
              key={item.id}
              item={item}
              onViewItem={() => onViewItem(item)}
              onDragStart={(e) => handleDragStart(e, item)}
              disableDrag={disableDrag}
              isSelected={selectedSet.has(item.id)}
              onToggle={onToggleItem ? () => onToggleItem(item) : undefined}
            />
          ))}
        </div>
      )}

      {unplacedItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-lux-text">More Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:col-span-3 gap-6">
            {unplacedItems.map((item) => (
              <AlaCarteItem
                key={item.id}
                item={item}
                onViewItem={() => onViewItem(item)}
                onDragStart={(e) => handleDragStart(e, item)}
                disableDrag={disableDrag}
                isSelected={selectedSet.has(item.id)}
                onToggle={onToggleItem ? () => onToggleItem(item) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
