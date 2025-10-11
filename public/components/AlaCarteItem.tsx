import React from 'react';
import type { AlaCarteOption } from '../types';

interface AlaCarteItemProps {
  item: AlaCarteOption;
  onViewItem: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export const AlaCarteItem: React.FC<AlaCarteItemProps> = ({ item, onViewItem, onDragStart }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };
  
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 flex flex-col relative cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-102 hover:shadow-lg hover:shadow-blue-500/10"
    >
      {item.isNew && (
        <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-red-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-lg">New</div>
      )}
      <div className="flex-grow">
        <button
          onClick={onViewItem}
          className="text-xl font-bold font-teko tracking-wider text-left text-gray-100 hover:text-blue-400 transition-colors w-full"
          aria-label={`Learn more about ${item.name}`}
        >
          {item.name}
        </button>
        {item.warranty && <p className="text-sm font-bold text-yellow-400 mb-2">{item.warranty}</p>}
        <p className="text-3xl font-bold text-gray-200 font-teko">{formatPrice(item.price)}</p>
        <p className="text-sm text-gray-400 mt-2 mb-4">{item.description}</p>
        {item.points.length > 0 && (
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            {item.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        )}
      </div>
      <div className="mt-6 text-center text-xs text-gray-500 font-semibold uppercase tracking-wider">
        Drag to Add
      </div>
    </div>
  );
};