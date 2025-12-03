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
    <footer className={`sticky bottom-0 left-0 right-0 bg-black/85 backdrop-blur-2xl border-t border-white/10 transition-transform duration-500 ease-luxury shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${hasSelection ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="container mx-auto px-4 sm:px-8 py-5 lg:py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6">
          <div className="flex-1 text-center md:text-left">
            {hasCustomerInfo ? (
              <>
                <p className="text-sm lg:text-base text-gray-400 tracking-wide">Custom quote prepared for:</p>
                <h4 className="text-xl lg:text-2xl font-bold font-teko tracking-wider text-white -mt-1 text-shadow-lg">{customerInfo.name}</h4>
                {vehicleString && <p className="text-sm lg:text-base font-semibold text-blue-300 mb-1">{vehicleString}</p>}
              </>
            ) : (
              <h4 className="text-xl lg:text-2xl font-bold font-teko tracking-wider text-gray-200 text-shadow">Your Custom Quote</h4>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm lg:text-base text-gray-400 mt-2 justify-center md:justify-start">
              {selectedPackage && (
                <span key={selectedPackage.id} className="font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl shadow-luxury-lg animate-summary-item-in">{selectedPackage.name} Package</span>
              )}
              {customPackageItems.map(item => (
                <span key={item.id} className="bg-white/10 text-gray-300 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl border border-white/20 animate-summary-item-in">{item.name}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center md:text-right">
              <p className="text-gray-300 text-sm lg:text-base font-teko tracking-widest uppercase">Total Purchase Price</p>
              <p className="text-4xl sm:text-5xl lg:text-6xl font-bold font-teko text-white text-shadow-lg">{formatPrice(totalPrice)}</p>
            </div>
             <button
                onClick={onShowAgreement}
                className="min-h-[56px] bg-gradient-to-r from-green-600 to-green-500 text-white px-5 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-5 rounded-2xl font-bold uppercase tracking-wider text-base lg:text-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 transform active:scale-95 self-center flex items-center gap-3 shadow-luxury-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Finalize and Print"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 lg:w-7 lg:h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="hidden sm:inline">Finalize Agreement</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};