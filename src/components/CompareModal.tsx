import React, { useEffect } from 'react';
import type { PackageTier, ProductFeature } from '../types';

// Icons
const CheckIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto text-green-400">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto text-red-500 opacity-60">
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: PackageTier[];
  allFeatures: ProductFeature[];
  onSelectPackage: (pkg: PackageTier) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, packages, allFeatures, onSelectPackage }) => {
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

  if (!isOpen) return null;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };
  
  // Create a stable sort order for packages: Elite → Platinum → Gold
  const tierRank = (name: string) => {
    const n = name.trim().toLowerCase();
    if (/\belite\b/.test(n)) return 1;
    if (/\bplatinum\b/.test(n)) return 2;
    if (/\bgold\b/.test(n)) return 3;
    return 99;
  };
  const sortedPackages = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl border border-gray-600 animate-slide-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 id="compare-modal-title" className="text-3xl sm:text-4xl font-bold font-teko text-white tracking-wider">Compare Protection Packages</h2>
            <p className="text-gray-400 mt-1">See what's included in each of our expertly curated plans.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close comparison"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="overflow-x-auto overflow-y-auto p-4 sm:p-6">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-800">
              <tr>
                <th className="text-left font-bold font-teko text-xl tracking-wider text-gray-200 p-4 w-1/3">Feature</th>
                {sortedPackages.map(pkg => (
                  <th key={pkg.id} className={`p-4 border-l border-gray-700 ${(pkg.isRecommended ?? pkg.is_recommended) ? 'bg-blue-500/10' : ''}`}>
                    <h3 className={`font-teko text-2xl sm:text-3xl font-bold uppercase tracking-wider text-${pkg.tier_color}`}>{pkg.name}</h3>
                    {(pkg.isRecommended ?? pkg.is_recommended) && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">Recommended</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((feature, index) => (
                <tr key={feature.id} className={`border-t border-gray-700 ${index % 2 === 0 ? 'bg-gray-900/30' : ''}`}>
                  <td className="p-4 font-semibold text-gray-300">{feature.name}</td>
                  {sortedPackages.map(pkg => {
                    const hasFeature = pkg.features.some(f => f.id === feature.id);
                    const isRecommended = pkg.isRecommended ?? pkg.is_recommended;
                    return (
                      <td key={`${pkg.id}-${feature.id}`} className={`p-4 border-l border-gray-700 text-center ${isRecommended ? 'bg-blue-500/10' : ''}`}>
                        {hasFeature ? <CheckIcon /> : <XIcon />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-800">
                <tr className="border-t-2 border-gray-600">
                    <td className="p-4 text-right font-bold font-teko text-2xl tracking-wider">Total Price</td>
                     {sortedPackages.map(pkg => (
                        <td key={pkg.id} className={`p-4 border-l border-gray-700 text-center ${(pkg.isRecommended ?? pkg.is_recommended) ? 'bg-blue-500/10' : ''}`}>
                             <p className={`text-3xl sm:text-4xl font-bold font-teko text-white text-shadow`}>{formatPrice(pkg.price)}</p>
                        </td>
                    ))}
                </tr>
                 <tr className="bg-gray-900/50">
                    <td></td>
                     {sortedPackages.map(pkg => (
                        <td key={pkg.id} className={`p-4 border-l border-gray-700 text-center ${(pkg.isRecommended ?? pkg.is_recommended) ? 'bg-blue-500/10' : ''}`}>
                            <button
                                onClick={() => onSelectPackage(pkg)}
                                className="w-full py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 transform active:scale-95 bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white"
                            >
                                Select Plan
                            </button>
                        </td>
                    ))}
                </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
};
