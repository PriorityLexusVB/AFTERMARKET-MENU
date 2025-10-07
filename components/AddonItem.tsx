import React from 'react';
import type { AlaCarteOption } from '../types';

interface AddonItemProps {
  item: AlaCarteOption;
  isSelected: boolean;
  onToggle: () => void;
  onView: () => void;
}

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143z" clipRule="evenodd" />
  </svg>
);


export const AddonItem: React.FC<AddonItemProps> = ({ item, isSelected, onToggle, onView }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex flex-col transition-shadow hover:shadow-md">
      <div className="flex-grow">
        <button
          onClick={onView}
          className="font-semibold text-sm text-gray-200 text-left hover:text-blue-400 transition-colors w-full"
          aria-label={`Learn more about ${item.name}`}
        >
          {item.name}
        </button>
        <p className="text-xs text-gray-400">{formatPrice(item.price)}</p>
      </div>
      <div className="mt-3">
        <button
          onClick={onToggle}
          className={`w-full py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-1.5
            ${isSelected 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-600 text-gray-200 hover:bg-blue-500 hover:text-white'}
          `}
        >
          <span key={isSelected ? 'check' : 'plus'} className="inline-block animate-icon-pop-in">
            {isSelected ? <CheckIcon /> : <PlusIcon />}
          </span>
          {isSelected ? 'Added' : 'Add'}
        </button>
      </div>
    </div>
  );
};
