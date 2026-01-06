import React from 'react';
import type { AlaCarteOption } from '../types';

interface AlaCarteItemProps {
  item: AlaCarteOption;
  onViewItem: () => void;
  onDragStart: (e: React.DragEvent) => void;
  disableDrag?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
}

export const AlaCarteItem: React.FC<AlaCarteItemProps> = ({ item, onViewItem, onDragStart, disableDrag = false, isSelected = false, onToggle }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };
  
  return (
    <div 
      draggable={!disableDrag}
      onDragStart={disableDrag ? undefined : onDragStart}
      className={`lux-card p-6 flex flex-col relative transition-all duration-200 ${disableDrag ? '' : 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5'}`}
    >
      {item.isNew && (
        <div className="absolute top-0 right-0 -mt-3 -mr-3 lux-chip-gold">New</div>
      )}
      <div className="flex-grow">
        <button
          onClick={onViewItem}
          className="text-xl font-bold font-teko tracking-wider text-left text-lux-textStrong hover:text-lux-blue transition-colors w-full"
          aria-label={`Learn more about ${item.name}`}
        >
          {item.name}
        </button>
        {item.warranty && <p className="text-sm font-bold text-lux-gold mb-2">{item.warranty}</p>}
        <div className="lux-price-plaque mt-2">
          <span className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Price</span>
          <span className="text-2xl font-teko text-lux-textStrong">{formatPrice(item.price)}</span>
        </div>
        <p className="text-sm text-lux-textMuted mt-3 mb-4">{item.description}</p>
        {item.points.length > 0 && (
          <ul className="text-sm text-lux-text space-y-1 list-disc list-inside">
            {item.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="text-xs text-lux-textMuted font-semibold uppercase tracking-wider">
          {disableDrag ? 'Tap to add' : 'Drag to add'}
        </div>
        {onToggle && disableDrag && (
          <button
            onClick={() => {
              if (isSelected) return;
              onToggle();
            }}
            disabled={isSelected}
            className={`w-full sm:w-auto min-h-[44px] px-4 py-3 text-sm font-semibold rounded-md transition-colors ${
              isSelected
                ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                : 'btn-lux-primary'
            }`}
            aria-pressed={isSelected}
          >
            {isSelected ? 'ADDED' : 'ADD'}
          </button>
        )}
      </div>
    </div>
  );
};
