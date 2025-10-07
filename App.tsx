import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PackageSelector } from './components/PackageSelector';
import { AlaCarteSelector } from './components/AlaCarteSelector';
import { Summary } from './components/Summary';
import { FeatureModal } from './components/FeatureModal';
import { CustomPackageBuilder } from './components/CustomPackageBuilder';
import { AddonSelector } from './components/AddonSelector';
import { SettingsModal } from './components/SettingsModal';
import { MAIN_PAGE_ADDON_IDS } from './constants';
import { fetchAllData } from './data';
import type { PackageTier, AlaCarteOption, ProductFeature } from './types';

type Page = 'packages' | 'alacarte';

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

const App: React.FC = () => {
  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [allFeatures, setAllFeatures] = useState<ProductFeature[]>([]);
  const [allAlaCarteOptions, setAllAlaCarteOptions] = useState<AlaCarteOption[]>([]);

  // UI State
  const [selectedPackage, setSelectedPackage] = useState<PackageTier | null>(null);
  const [customPackageItems, setCustomPackageItems] = useState<AlaCarteOption[]>([]);
  const [viewingDetailItem, setViewingDetailItem] = useState<ProductFeature | AlaCarteOption | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('packages');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    year: '',
    make: '',
    model: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { packages, features, alaCarteOptions } = await fetchAllData();
        setPackages(packages);
        setAllFeatures(features);
        setAllAlaCarteOptions([...alaCarteOptions, ...features]);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to load product data: ${err.message}. Please check your Supabase configuration in the README.`);
        } else {
          setError('An unknown error occurred while loading data.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleSaveSettings = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
    setIsSettingsOpen(false);
  }, []);

  const handleSelectPackage = useCallback((pkg: PackageTier) => {
    setSelectedPackage(prev => (prev?.id === pkg.id ? null : pkg));
  }, []);

  const handleToggleAlaCarteItem = useCallback((item: AlaCarteOption) => {
    setCustomPackageItems(prev => {
      const isSelected = prev.some(i => i.id === item.id);
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const handleDropAlaCarte = useCallback((item: AlaCarteOption) => {
    setCustomPackageItems(prev => {
      if (prev.find(i => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveAlaCarte = useCallback((itemId: string) => {
    setCustomPackageItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const handleViewDetail = useCallback((item: ProductFeature | AlaCarteOption) => {
    setViewingDetailItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setViewingDetailItem(null);
  }, []);
  
  const totalCost = useMemo(() => {
    let total = 0;
    if (selectedPackage) {
      total += selectedPackage.price;
    }
    customPackageItems.forEach(item => {
      total += item.price;
    });
    return total;
  }, [selectedPackage, customPackageItems]);

  const mainPageAddons = useMemo(() => {
    return allAlaCarteOptions.filter(option => MAIN_PAGE_ADDON_IDS.includes(option.id));
  }, [allAlaCarteOptions]);

  const availableAlaCarteItems = useMemo(() => {
    return allAlaCarteOptions.filter(option => !customPackageItems.some(item => item.id === option.id));
  }, [customPackageItems, allAlaCarteOptions]);
  
  const NavButton: React.FC<{page: Page, label: string}> = ({ page, label }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`
        w-full sm:w-auto px-8 py-2 rounded-md text-xl font-teko tracking-wider transition-all duration-300 transform active:scale-95
        ${currentPage === page 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
      `}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-20">
          <p className="text-xl text-gray-400">Loading Protection Menu...</p>
        </div>
      );
    }
    if (error) {
      return (
         <div className="text-center py-20 px-6 bg-red-900/20 border border-red-500 rounded-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold font-teko text-red-400">Error Loading Data</h3>
            <p className="text-red-300 mt-2">{error}</p>
        </div>
      )
    }
    return (
      <>
        {currentPage === 'packages' && (
          <div className="flex-grow flex flex-col lg:flex-row gap-8 items-stretch">
            <div className="w-full lg:w-3/4">
              <PackageSelector
                packages={packages}
                allFeaturesForDisplay={allFeatures}
                selectedPackage={selectedPackage}
                onSelectPackage={handleSelectPackage}
                onViewFeature={handleViewDetail}
              />
            </div>
            <div className="w-full lg:w-1/4">
              <AddonSelector
                items={mainPageAddons}
                selectedItems={customPackageItems}
                onToggleItem={handleToggleAlaCarteItem}
                onViewItem={handleViewDetail}
              />
            </div>
          </div>
        )}

        {currentPage === 'alacarte' && (
           <div className="flex flex-col xl:flex-row gap-12">
            <div className="xl:w-3/5">
               <h3 className="text-4xl font-teko font-bold tracking-wider text-gray-300 mb-6">Available Options</h3>
              <AlaCarteSelector
                items={availableAlaCarteItems}
                onViewItem={handleViewDetail}
              />
            </div>
            <div className="xl:w-2/5 flex flex-col">
               <h3 className="text-4xl font-teko font-bold tracking-wider text-gray-300 mb-6">Your Custom Package</h3>
              <CustomPackageBuilder
                items={customPackageItems}
                onDropItem={handleDropAlaCarte}
                onRemoveItem={handleRemoveAlaCarte}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen antialiased flex flex-col">
      <Header onOpenSettings={handleOpenSettings} />
      <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-teko tracking-wider uppercase text-gray-100">Vehicle Protection Menu</h2>
          <p className="text-base text-gray-400 mt-1 max-w-3xl mx-auto">
            Select one of our expertly curated packages, or build a custom package from our a la carte options.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <NavButton page="packages" label="Protection Packages" />
          <NavButton page="alacarte" label="A La Carte Options" />
        </div>

        <div className="flex-grow flex flex-col">
          {renderContent()}
        </div>
      </main>
      <Summary 
        selectedPackage={selectedPackage}
        customPackageItems={customPackageItems}
        totalCost={totalCost}
        customerInfo={customerInfo}
      />
      {viewingDetailItem && <FeatureModal feature={viewingDetailItem} onClose={handleCloseModal} />}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        currentInfo={customerInfo}
      />
    </div>
  );
};

export default App;