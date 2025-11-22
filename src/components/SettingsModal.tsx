import React, { useState, useEffect } from 'react';
import type { PackageTier, AlaCarteOption, PriceOverrides } from '../types';
import { CustomerInfoSchema } from '../schemas';


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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInfo(currentInfo);
      setOverrides(currentPriceOverrides);
      setView('customer'); // Reset to default view every time it opens
      setValidationErrors({});
      setSaveSuccess(false);
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
    setSaveSuccess(false); // Clear success message on edit
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    // Validate customer info
    const validation = CustomerInfoSchema.safeParse(info);
    
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      setView('customer'); // Switch to customer view to show errors
      return;
    }
    
    setValidationErrors({});
    setSaveSuccess(true);
    
    // Brief success message before closing
    setTimeout(() => {
      try {
        onSave({ customerInfo: info, priceOverrides: overrides });
      } catch (error) {
        setSaveSuccess(false);
        console.error("Error saving settings:", error);
        // Error will be handled by parent component if needed
      }
    }, 500);
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
          {saveSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              <span className="text-green-400 font-semibold">Settings saved successfully!</span>
            </div>
          )}
          
          {Object.keys(validationErrors).length > 0 && view === 'customer' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400 mt-0.5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-red-400 font-semibold mb-1">Please fix the following errors:</p>
                  <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {view === 'customer' && (
            <section>
              <h3 className="text-xl font-bold font-teko text-gray-100 tracking-wider mb-3">Customer & Vehicle Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Customer Name {validationErrors['name'] && <span className="text-red-400 text-xs">*</span>}
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    id="name" 
                    value={info.name} 
                    onChange={handleInfoChange} 
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors['name'] ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
                      Vehicle Year {validationErrors['year'] && <span className="text-red-400 text-xs">*</span>}
                    </label>
                    <input 
                      type="text" 
                      name="year" 
                      id="year" 
                      value={info.year} 
                      onChange={handleInfoChange} 
                      className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors['year'] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">
                      Make {validationErrors['make'] && <span className="text-red-400 text-xs">*</span>}
                    </label>
                    <input 
                      type="text" 
                      name="make" 
                      id="make" 
                      value={info.make} 
                      onChange={handleInfoChange} 
                      className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors['make'] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
                      Model {validationErrors['model'] && <span className="text-red-400 text-xs">*</span>}
                    </label>
                    <input 
                      type="text" 
                      name="model" 
                      id="model" 
                      value={info.model} 
                      onChange={handleInfoChange} 
                      className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors['model'] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
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
    </div>
  );
};
