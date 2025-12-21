import React, { useState } from 'react';
import type { AlaCarteOption } from '../types';

interface CustomPackageBuilderProps {
  items: AlaCarteOption[];
  onDropItem: (item: AlaCarteOption) => void;
  onRemoveItem: (itemId: string) => void;
  enableDrop?: boolean;
}

export const CustomPackageBuilder: React.FC<CustomPackageBuilderProps> = ({ items, onDropItem, onRemoveItem, enableDrop = true }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    if (!enableDrop) return;
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    if (!enableDrop) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!enableDrop) return;
    e.preventDefault();
    setIsDragOver(false);
    try {
        const item = JSON.parse(e.dataTransfer.getData("application/json")) as AlaCarteOption;
        onDropItem(item);
        setHighlightedItemId(item.id);
        setTimeout(() => setHighlightedItemId(null), 1000);
    } catch (error) {
        console.error("Failed to parse dropped data:", error);
    }
  };
  
  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        lux-card ${enableDrop ? 'border-dashed' : 'border-solid'} p-4 min-h-[300px] h-full transition-colors
        ${isDragOver ? 'border-lux-blue bg-lux-blue/5' : 'border-lux-border/70'}
      `}
    >
      {items.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-full text-center text-gray-500 p-6">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.65 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.012-1.244h3.86M9 18a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 0-1.5h-4.5A.75.75 0 0 0 9 18Z" />
          </svg>
          <h4 className="font-semibold text-lg text-gray-400">Your Custom Package is Empty</h4>
          <p className="text-sm max-w-xs mt-1">Drag items from the 'Available Options' list and drop them here to build your personalized protection plan.</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
            <div className="flex-grow space-y-3 pr-2 overflow-y-auto">
                {items.map(item => (
                    <div 
                        key={item.id} 
                        className={`rounded-md p-3 flex justify-between items-center animate-fade-in transition-all duration-500 ease-out
                        ${highlightedItemId === item.id ? 'bg-blue-500/20 ring-1 ring-blue-500' : 'bg-gray-700'}`}
                    >
                        <div>
                            <p className="font-semibold text-gray-200">{item.name}</p>
                            <p className="text-sm text-gray-400">{formatPrice(item.price)}</p>
                        </div>
                        <button 
                            onClick={() => onRemoveItem(item.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                            aria-label={`Remove ${item.name}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-lg">
                    <p className="font-semibold text-gray-300">Subtotal:</p>
                    <p className="font-bold font-teko text-3xl text-white">{formatPrice(subtotal)}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
