import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { Header } from './components/Header';
import { PackageSelector } from './components/PackageSelector';
import { AlaCarteSelector } from './components/AlaCarteSelector';
import { Summary } from './components/Summary';
import { FeatureModal } from './components/FeatureModal';
import { CustomPackageBuilder } from './components/CustomPackageBuilder';
import { AddonSelector } from './components/AddonSelector';
import { SettingsModal } from './components/SettingsModal';
import { AgreementView } from './components/AgreementView';
import { AIAssistant } from './components/AIAssistant';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { CompareModal } from './components/CompareModal';
import { MAIN_PAGE_ADDON_IDS } from './constants';
import { fetchAllData } from './data';
import { auth, firebaseInitializationError } from './firebase';
import type { PackageTier, AlaCarteOption, ProductFeature, PriceOverrides } from './types';

type Page = 'packages' | 'alacarte';
type View = 'menu' | 'agreement';

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

const App: React.FC = () => {
  // Data state
  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [allFeatures, setAllFeatures] = useState<ProductFeature[]>([]);
  const [allAlaCarteOptions, setAllAlaCarteOptions] = useState<AlaCarteOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI State
  const [currentView, setCurrentView] = useState<View>('menu');
  const [selectedPackage, setSelectedPackage] = useState<PackageTier | null>(null);
  const [customPackageItems, setCustomPackageItems] = useState<AlaCarteOption[]>([]);
  const [viewingDetailItem, setViewingDetailItem] = useState<ProductFeature | AlaCarteOption | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('packages');
  const [priceOverrides, setPriceOverrides] = useState<PriceOverrides>({});
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    year: '',
    make: '',
    model: '',
  });

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (firebaseInitializationError || !auth) {
      setIsAuthLoading(false);
      setIsDemoMode(true); // Enter demo mode if Firebase isn't configured
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { packages, features, alaCarteOptions } = await fetchAllData();
    setPackages(packages);
    setAllFeatures(features);
    // Combine a la carte and features for detail viewing, preventing duplicates
    const combinedOptions = [...alaCarteOptions];
    const alaCarteIds = new Set(alaCarteOptions.map(o => o.id));
    features.forEach(f => {
      if (!alaCarteIds.has(f.id)) {
        combinedOptions.push(f);
      }
    });
    setAllAlaCarteOptions(combinedOptions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Load data for a logged-in user OR if in demo mode
    if (user || isDemoMode) {
      loadData();
    }
  }, [user, isDemoMode, loadData]);
  
  const handleLogout = useCallback(async () => {
    if (isDemoMode) {
      alert("Logout is disabled in demo mode.");
      return;
    }
    if (!auth) return;
    try {
      await signOut(auth);
      setIsAdminView(false); // Reset to menu view on logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [isDemoMode]);
  
  const handleToggleAdminView = useCallback(() => {
    if (isDemoMode) {
      alert("The Admin Panel is disabled in demo mode. Please configure a Firebase backend to use this feature.");
      return;
    }
    setIsAdminView(prev => !prev);
  }, [isDemoMode]);

  const handleOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleSaveSettings = useCallback((data: { customerInfo: CustomerInfo; priceOverrides: PriceOverrides }) => {
    setCustomerInfo(data.customerInfo);
    setPriceOverrides(data.priceOverrides);
    setIsSettingsOpen(false);
  }, []);
  
  const handleShowAgreement = useCallback(() => setCurrentView('agreement'), []);
  const handleShowMenu = useCallback(() => setCurrentView('menu'), []);

  const handleSelectPackage = useCallback((pkg: PackageTier) => {
    setSelectedPackage(prev => (prev?.id === pkg.id ? null : pkg));
  }, []);
  
  const handleOpenCompareModal = useCallback(() => setIsCompareModalOpen(true), []);
  const handleCloseCompareModal = useCallback(() => setIsCompareModalOpen(false), []);

  const handleSelectPackageFromCompare = useCallback((pkg: PackageTier) => {
    handleSelectPackage(pkg);
    handleCloseCompareModal();
  }, [handleSelectPackage, handleCloseCompareModal]);

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

  const applyOverrides = <T extends { id: string; price: number; cost: number }>(items: T[], overrides: PriceOverrides): T[] => {
    return items.map(item => {
      const override = overrides[item.id];
      if (!override) return item;
      return {
        ...item,
        price: override.price ?? item.price,
        cost: override.cost ?? item.cost,
      };
    });
  };

  const displayPackages = useMemo(() => applyOverrides(packages, priceOverrides), [packages, priceOverrides]);
  const displayAllAlaCarteOptions = useMemo(() => applyOverrides(allAlaCarteOptions, priceOverrides), [allAlaCarteOptions, priceOverrides]);
  const displayCustomPackageItems = useMemo(() => applyOverrides(customPackageItems, priceOverrides), [customPackageItems, priceOverrides]);
  
  const { totalPrice, totalCost } = useMemo(() => {
    let price = 0;
    let cost = 0;
    if (selectedPackage) {
      const currentPackage = displayPackages.find(p => p.id === selectedPackage.id);
      if (currentPackage) {
        price += currentPackage.price;
        cost += currentPackage.cost;
      }
    }
    displayCustomPackageItems.forEach(item => {
      price += item.price;
      cost += item.cost;
    });
    return { totalPrice: price, totalCost: cost };
  }, [selectedPackage, displayPackages, displayCustomPackageItems]);

  const mainPageAddons = useMemo(() => {
    return displayAllAlaCarteOptions.filter(option => MAIN_PAGE_ADDON_IDS.includes(option.id));
  }, [displayAllAlaCarteOptions]);

  const availableAlaCarteItems = useMemo(() => {
    return displayAllAlaCarteOptions.filter(option => !customPackageItems.some(item => item.id === option.id));
  }, [customPackageItems, displayAllAlaCarteOptions]);
  
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
  
  const LoadingSpinner: React.FC = () => (
    <div className="flex-grow flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-teko tracking-wider text-gray-300">Loading Protection Plans...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (currentView === 'agreement') {
      return (
        <AgreementView 
          onBack={handleShowMenu}
          selectedPackage={selectedPackage ? displayPackages.find(p => p.id === selectedPackage.id) : null}
          customPackageItems={displayCustomPackageItems}
          totalPrice={totalPrice}
          totalCost={totalCost}
          customerInfo={customerInfo}
        />
      );
    }
    
    return (
      <>
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-teko tracking-wider uppercase text-gray-100">Vehicle Protection Menu</h2>
          <p className="text-base text-gray-400 mt-1 max-w-3xl mx-auto">
            Select one of our expertly curated packages, or build a custom package from our a la carte options.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <NavButton page="packages" label="Protection Packages" />
          <NavButton page="alacarte" label="A La Carte Options" />
           {currentPage === 'packages' && (
            <button
              onClick={handleOpenCompareModal}
              className="text-sm font-semibold text-blue-300 hover:text-white transition-colors bg-gray-700/50 px-3 py-1.5 rounded-md flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
              Compare Packages
            </button>
          )}
        </div>
      
        {currentPage === 'packages' && (
          <div className="flex-grow flex flex-col lg:flex-row gap-8 items-stretch">
            <div className="w-full lg:w-3/4">
              <PackageSelector
                packages={displayPackages}
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
                items={displayCustomPackageItems}
                onDropItem={handleDropAlaCarte}
                onRemoveItem={handleRemoveAlaCarte}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // If not authenticated and not in demo mode, show the Login screen.
  // This also handles the initial authentication loading state.
  if (!user && !isDemoMode) {
    return <Login isAuthLoading={isAuthLoading} firebaseError={firebaseInitializationError} />;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen antialiased flex flex-col">
      <Header
        user={user}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        onToggleAdminView={handleToggleAdminView}
        isAdminView={isAdminView}
      />
      
      {isAdminView && !isDemoMode ? (
        <AdminPanel onDataUpdate={loadData} />
      ) : (
        <>
          <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="flex-grow flex flex-col">
                {renderContent()}
              </div>
            )}
          </main>
          {currentView === 'menu' && !isLoading && (
            <>
              <Summary 
                selectedPackage={selectedPackage ? displayPackages.find(p => p.id === selectedPackage.id) : null}
                customPackageItems={displayCustomPackageItems}
                totalPrice={totalPrice}
                customerInfo={customerInfo}
                onShowAgreement={handleShowAgreement}
              />
              <AIAssistant
                packages={displayPackages}
                alaCarteOptions={displayAllAlaCarteOptions}
              />
            </>
          )}
        </>
      )}

      {viewingDetailItem && <FeatureModal feature={viewingDetailItem} onClose={handleCloseModal} />}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={handleCloseCompareModal}
        packages={displayPackages}
        allFeatures={allFeatures}
        onSelectPackage={handleSelectPackageFromCompare}
      />
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        currentInfo={customerInfo}
        packages={packages}
        allAlaCarteOptions={allAlaCarteOptions}
        currentPriceOverrides={priceOverrides}
        totalCost={totalCost}
      />
    </div>
  );
};

export default App;
