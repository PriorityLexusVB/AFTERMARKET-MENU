import React from 'react';
import type { PackageTier, AlaCarteOption } from '../types';

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface SummaryProps {
  selectedPackage: PackageTier | null;
  customPackageItems: AlaCarteOption[];
  totalPrice: number;
  customerInfo: CustomerInfo;
  onShowAgreement: () => void;
}

export const Summary: React.FC<SummaryProps> = ({ selectedPackage, customPackageItems, totalPrice, customerInfo, onShowAgreement }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);
  };

  const hasSelection = selectedPackage || customPackageItems.length > 0;
  
  const hasCustomerInfo = customerInfo && customerInfo.name;
  const vehicleString = [customerInfo.year, customerInfo.make, customerInfo.model].filter(Boolean).join(' ');

  return (
    <footer className={`sticky bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-md border-t border-gray-700 transition-transform duration-500 ease-in-out ${hasSelection ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="container mx-auto px-4 sm:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center md:text-left">
            {hasCustomerInfo ? (
              <>
                <p className="text-sm text-gray-400">Custom quote prepared for:</p>
                <h4 className="text-xl font-bold font-teko tracking-wider text-white -mt-1">{customerInfo.name}</h4>
                {vehicleString && <p className="text-sm font-semibold text-blue-300 mb-1">{vehicleString}</p>}
              </>
            ) : (
              <h4 className="text-xl font-bold font-teko tracking-wider text-gray-200">Your Custom Quote</h4>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1 justify-center md:justify-start">
              {selectedPackage && (
                <span key={selectedPackage.id} className="font-semibold text-white bg-blue-600 px-2 py-1 rounded animate-summary-item-in">{selectedPackage.name} Package</span>
              )}
              {customPackageItems.map(item => (
                <span key={item.id} className="bg-gray-700 px-2 py-1 rounded animate-summary-item-in">{item.name}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center md:text-right">
              <p className="text-gray-300 text-sm font-teko tracking-wider">Total Purchase Price</p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-teko text-white">{formatPrice(totalPrice)}</p>
            </div>
             <button
                onClick={onShowAgreement}
                className="bg-green-600 text-white px-4 py-3 sm:px-5 sm:py-4 rounded-lg font-bold uppercase tracking-wider text-base hover:bg-green-700 transition-colors transform active:scale-95 self-center flex items-center gap-2"
                aria-label="Finalize and Print"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 2.25 2.25 4.5-4.5m4.5 2.25-2.25 2.25-4.5-4.5m-4.5 4.5L6.75 12m12.75 3H3.25" />
                </svg>
                <span className="hidden sm:inline">Finalize Agreement</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};