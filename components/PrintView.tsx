import React from 'react';
import type { PackageTier, AlaCarteOption } from '../types';

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface PrintViewProps {
  selectedPackage: PackageTier | null;
  customPackageItems: AlaCarteOption[];
  totalPrice: number;
  totalCost: number;
  customerInfo: CustomerInfo;
  isManagerView: boolean;
}

const LexusLogo: React.FC = () => (
    <div className="font-teko tracking-widest text-black">
        <p className="text-3xl font-bold">PRIORITY <span className="font-light text-gray-700">LEXUS</span></p>
        <p className="text-sm tracking-widest text-gray-600 -mt-2">VIRGINIA BEACH</p>
    </div>
);

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const PrintView: React.FC<PrintViewProps> = ({
  selectedPackage,
  customPackageItems,
  totalPrice,
  totalCost,
  customerInfo,
  isManagerView
}) => {
  const allItems = [
    ...(selectedPackage ? [{ ...selectedPackage, name: `${selectedPackage.name} Package` }] : []),
    ...customPackageItems
  ];
  const vehicleString = [customerInfo.year, customerInfo.make, customerInfo.model].filter(Boolean).join(' ');
  const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const grossProfit = totalPrice - totalCost;

  return (
    <div className="bg-white text-black p-8 font-sans">
      <header className="flex justify-between items-start mb-8">
        <LexusLogo />
        <div className="text-right">
          <h1 className="text-3xl font-bold font-teko tracking-wider uppercase">
            {isManagerView ? 'Internal Finance Record' : 'Vehicle Protection Agreement'}
          </h1>
          <p className="font-semibold text-gray-700 -mt-1">
            {isManagerView ? 'Confidential - Manager Copy' : 'Customer Copy'}
          </p>
        </div>
      </header>
      
      <section className="mb-8 border-y-2 border-black py-4 grid grid-cols-3 gap-4 text-sm">
        <div><strong>Customer:</strong> {customerInfo.name || 'N/A'}</div>
        <div><strong>Vehicle:</strong> {vehicleString || 'N/A'}</div>
        <div><strong>Date:</strong> {todayDate}</div>
      </section>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left font-bold uppercase tracking-wider pb-2">Item Description</th>
            <th className="text-right font-bold uppercase tracking-wider pb-2">Retail Price</th>
            {isManagerView && <th className="text-right font-bold uppercase tracking-wider pb-2">Internal Cost</th>}
          </tr>
        </thead>
        <tbody>
          {allItems.map(item => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-3 pr-2">{item.name}</td>
              <td className="text-right font-mono pr-2">{formatCurrency(item.price)}</td>
              {isManagerView && <td className="text-right font-mono">{formatCurrency(item.cost)}</td>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td className={`text-right pt-4 ${isManagerView ? 'col-span-2' : ''}`}>Total Retail Price:</td>
            <td className="text-right pt-4 font-mono text-lg">{formatCurrency(totalPrice)}</td>
          </tr>
          {isManagerView && (
            <>
              <tr className="font-bold">
                <td className="text-right pt-2 col-span-2">Total Internal Cost:</td>
                <td className="text-right pt-2 font-mono text-lg">{formatCurrency(totalCost)}</td>
              </tr>
              <tr className="font-bold border-t-2 border-black">
                <td className="text-right pt-2 col-span-2">Gross Profit:</td>
                <td className="text-right pt-2 font-mono text-lg text-green-600">{formatCurrency(grossProfit)}</td>
              </tr>
            </>
          )}
        </tfoot>
      </table>

      <footer className="mt-24 pt-8 text-sm text-gray-600">
        {!isManagerView && (
            <p className="mb-8">I acknowledge that I have reviewed and agree to the purchase of the items listed above. All coverages, terms, and conditions are detailed in the respective product warranty documents provided to me.</p>
        )}
        <div className="grid grid-cols-2 gap-12">
            <div>
                <div className="border-b-2 border-black pt-12"></div>
                <p className="mt-2 font-bold">{isManagerView ? 'Manager Signature' : 'Customer Signature'}</p>
            </div>
            <div>
                <div className="border-b-2 border-black pt-12"></div>
                <p className="mt-2 font-bold">{isManagerView ? 'Date Processed' : 'Manager Signature'}</p>
            </div>
        </div>
      </footer>
    </div>
  );
};
