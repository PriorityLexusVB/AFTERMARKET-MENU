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
  totalCost: number;
  customerInfo: CustomerInfo;
}

export const Summary: React.FC<SummaryProps> = ({ selectedPackage, customPackageItems, totalCost, customerInfo }) => {
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
          <div className="text-center md:text-right">
             <p className="text-gray-300 text-sm font-teko tracking-wider">Total Purchase Price</p>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-teko text-white">{formatPrice(totalCost)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col md:flex-row gap-4 items-center text-sm text-gray-500">
            <div className="w-full md:flex-1 flex items-baseline gap-2">
                <span className="flex-shrink-0">Customer Name:</span>
                <span className="w-full border-b border-gray-600 font-sans text-base text-gray-200 pl-2">{customerInfo.name}</span>
            </div>
            <div className="w-full md:flex-1 flex items-baseline gap-2">
                <span className="flex-shrink-0">Customer Signature:</span>
                <span className="w-full border-b border-gray-600"></span>
            </div>
            <div className="w-full md:w-auto flex items-baseline gap-2">
                <span className="flex-shrink-0">Date:</span>
                <span className="w-full md:w-32 border-b border-gray-600"></span>
            </div>
        </div>
      </div>
    </footer>
  );
};