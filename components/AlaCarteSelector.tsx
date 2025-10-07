import React from 'react';
import type { AlaCarteOption, ProductFeature } from '../types';
import { AlaCarteItem } from './AlaCarteItem';

interface AlaCarteSelectorProps {
  items: AlaCarteOption[];
  onViewItem: (item: ProductFeature | AlaCarteOption) => void;
}

export const AlaCarteSelector: React.FC<AlaCarteSelectorProps> = ({ items, onViewItem }) => {
  const handleDragStart = (e: React.DragEvent, item: AlaCarteOption) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  };

  if (items.length === 0) {
    return (
        <div className="text-center py-10 px-6 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <h4 className="text-xl font-bold font-teko text-gray-200 tracking-wider">All Options Selected!</h4>
            <p className="text-gray-400 mt-1">You've added all available a la carte items to your custom package.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => (
        <AlaCarteItem
          key={item.id}
          item={item}
          onViewItem={() => onViewItem(item)}
          onDragStart={(e) => handleDragStart(e, item)}
        />
      ))}
    </div>
  );
};