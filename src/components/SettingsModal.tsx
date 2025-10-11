import React, { useState, useEffect } from 'react';
import type { PackageTier, AlaCarteOption, PriceOverrides } from '../types';


interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { customerInfo: CustomerInfo; priceOverrides: PriceOverrides }) => void;
  currentInfo: CustomerInfo;
  packages: PackageTier[];
  allAlaCarteOptions: AlaCarteOption[];
  currentPriceOverrides: PriceOverrides;
  totalCost: number;
}

type ModalView = 'customer' | 'manager';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentInfo,
  packages,
  allAlaCarteOptions,
  currentPriceOverrides,
  totalCost
}) => {
  const [info, setInfo] = useState<CustomerInfo>(currentInfo);
  const [overrides, setOverrides] = useState<PriceOverrides>(currentPriceOverrides);
  const [view, setView] = useState<ModalView>('customer');

  useEffect(() => {
    if (isOpen) {
      setInfo(currentInfo);
      setOverrides(currentPriceOverrides);
      setView('customer'); // Reset to default view every time it opens
    }
  }, [currentInfo, currentPriceOverrides, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleOverrideChange = (itemId: string, field: 'price' | 'cost', value: string) => {
    const numericValue = parseFloat(value);
    setOverrides(prev => {
      const newOverrides = { ...prev };
      const currentItemOverrides = { ...(newOverrides[itemId] || {}) };
      
      if (isNaN(numericValue) || value.trim() === '') {
        delete currentItemOverrides[field];
      } else {
        currentItemOverrides[field] = numericValue;
      }

      if (Object.keys(currentItemOverrides).length === 0) {
         delete newOverrides[itemId];
      } else {
        newOverrides[itemId] = currentItemOverrides;
      }
      
      return newOverrides;
    });
  };

  const handleSave = () => {
    onSave({ customerInfo: info, priceOverrides: overrides });
  };
  
  if (!isOpen) return null;

  const renderPriceListItem = (item: {id: string, name: string, price: number, cost: number }) => (
    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center py-2 border-b border-gray-700/50">
      <span className="text-gray-300 truncate col-span-1 sm:col-span-1" title={item.name}>{item.name}</span>
      <span className="text-gray-500 text-sm hidden sm:block text-center">{formatPrice(item.price)}</span>
      <span className="text-gray-500 text-sm hidden sm:block text-center">{formatPrice(item.cost)}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        <input 
          type="number" 
          value={overrides[item.id]?.price ?? ''}
          placeholder={item.price.toString()}
          onChange={(e) => handleOverrideChange(item.id, 'price', e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded-md py-1.5 pl-6 text-white focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        <input 
          type="number" 
          value={overrides[item.id]?.cost ?? ''}
          placeholder={item.cost.toString()}
          onChange={(e) => handleOverrideChange(item.id, 'cost', e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded-md py-1.5 pl-6 text-white focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-600 animate-slide-up my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-xl z-10">
          <div>
            <h2 id="settings-modal-title" className="text-2xl font-bold font-teko text-white tracking-wider">Settings & Adjustments</h2>
            <p className="text-gray-400 text-sm -mt-1">{view === 'customer' ? 'Customer & Vehicle Information' : 'Manager Pricing Adjustments'}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-8 max-h-[calc(100vh-220px)] overflow-y-auto">
          {view === 'customer' && (
            <section>
              <h3 className="text-xl font-bold font-teko text-gray-100 tracking-wider mb-3">Customer & Vehicle Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Customer Name</label>
                  <input type="text" name="name" id="name" value={info.name} onChange={handleInfoChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">Vehicle Year</label>
                    <input type="text" name="year" id="year" value={info.year} onChange={handleInfoChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">Make</label>
                    <input type="text" name="make" id="make" value={info.make} onChange={handleInfoChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                    <input type="text" name="model" id="model" value={info.model} onChange={handleInfoChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === 'manager' && (
            <section>
              <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-bold font-teko text-gray-200 tracking-wider">Current Selection Summary</h4>
                  <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Total Internal Cost:</span>
                      <span className="text-2xl font-bold font-teko text-green-400">{formatPrice(totalCost)}</span>
                  </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">Override default prices and costs for the current session. Changes will reset when the app is reloaded.</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <h4 className="font-bold text-blue-400 mb-3">Protection Packages</h4>
                  <div className="space-y-1">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <span className="col-span-1">Package</span>
                      <span className="hidden sm:block text-center">Retail</span>
                      <span className="hidden sm:block text-center">Cost</span>
                      <span className="col-span-1 text-center">Ovr. Retail</span>
                      <span className="col-span-1 text-center">Ovr. Cost</span>
                    </div>
                    {packages.map(renderPriceListItem)}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-yellow-400 mb-3">A La Carte & Add-Ons</h4>
                  <div className="space-y-1">
                     <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <span className="col-span-1">Item</span>
                      <span className="hidden sm:block text-center">Retail</span>
                      <span className="hidden sm:block text-center">Cost</span>
                      <span className="col-span-1 text-center">Ovr. Retail</span>
                      <span className="col-span-1 text-center">Ovr. Cost</span>
                    </div>
                    {allAlaCarteOptions.map(renderPriceListItem)}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
        
        <div className="p-6 bg-gray-900/50 border-t border-gray-700 flex justify-between items-center rounded-b-xl sticky bottom-0 z-10">
            <div>
              {view === 'customer' ? (
                <button onClick={() => setView('manager')} className="text-sm text-gray-400 hover:text-white transition-colors">Manager Pricing &raquo;</button>
              ) : (
                <button onClick={() => setView('customer')} className="text-sm text-gray-400 hover:text-white transition-colors">&laquo; Back to Customer Info</button>
              )}
            </div>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold uppercase tracking-wider text-sm hover:bg-blue-700 transition-colors transform active:scale-95"
            >
              Save & Close
            </button>
        </div>
      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from { transform: translateY(20px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
          }
        `}</style>
    </div>
  );
};