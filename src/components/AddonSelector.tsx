import React from 'react';
import type { AlaCarteOption, ProductFeature } from '../types';
import { AddonItem } from './AddonItem';

interface AddonSelectorProps {
  items: AlaCarteOption[];
  selectedItems: AlaCarteOption[];
  onToggleItem: (item: AlaCarteOption) => void;
  onViewItem: (item: ProductFeature | AlaCarteOption) => void;
}

export const AddonSelector: React.FC<AddonSelectorProps> = ({ items, selectedItems, onToggleItem, onViewItem }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-2xl font-teko font-bold tracking-wider text-gray-200 mb-4 text-center">Popular Add-Ons</h3>
      <div className="space-y-3 flex-grow overflow-y-auto pr-2">
        {items.length === 0 ? (
          <div className="text-sm text-gray-400 space-y-1">
            <p>No featured add-ons configured yet.</p>
            <p>Publish in Product Hub, then mark Featured (Column 4) to show here.</p>
          </div>
        ) : (
          items.map((item) => (
            <AddonItem
              key={item.id}
              item={item}
              isSelected={selectedItems.some(selected => selected.id === item.id)}
              onToggle={() => onToggleItem(item)}
              onView={() => onViewItem(item)}
            />
          ))
        )}
      </div>
    </div>
  );
};
