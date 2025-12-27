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
import { SelectionDrawer } from './components/SelectionDrawer';
import { AgreementView } from './components/AgreementView';
import { AIAssistant } from './components/AIAssistant';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { CompareModal } from './components/CompareModal';
import { MAIN_PAGE_ADDON_IDS } from './constants';
import { fetchAllData } from './data';
import { auth, firebaseInitializationError } from './firebase';
import type { PackageTier, AlaCarteOption, ProductFeature, PriceOverrides } from './types';
import { columnOrderValue, isCuratedOption } from './utils/alaCarte';
import {
  initializeAnalytics,
  trackPackageSelect,
  trackAlaCarteAdd,
  trackAlaCarteRemove,
  trackFeatureView,
  trackQuoteFinalize,
  trackSettingsOpen,
  trackAdminPanelAccess,
  trackUserLogout,
} from './analytics';

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
  const guestMode = !user;

  useEffect(() => {
    // Initialize Firebase Analytics
    initializeAnalytics();

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
    setAllAlaCarteOptions(alaCarteOptions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Load data for a logged-in user OR if in demo mode
    if (user || isDemoMode) {
      loadData();
    }
  }, [user, isDemoMode, loadData]);

  useEffect(() => {
    if (guestMode && isAdminView) {
      setIsAdminView(false);
    }
  }, [guestMode, isAdminView]);
  
  const handleLogout = useCallback(async () => {
    if (isDemoMode) {
      alert("Logout is disabled in demo mode.");
      return;
    }
    if (!auth) return;
    try {
      await signOut(auth);
      trackUserLogout();
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
    setIsAdminView(prev => {
      const newValue = !prev;
      if (newValue) {
        trackAdminPanelAccess();
      }
      return newValue;
    });
  }, [isDemoMode]);

  const handleOpenSettings = useCallback(() => {
    trackSettingsOpen();
    setIsSettingsOpen(true);
  }, []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleSaveSettings = useCallback((data: { customerInfo: CustomerInfo; priceOverrides: PriceOverrides }) => {
    setCustomerInfo(data.customerInfo);
    setPriceOverrides(data.priceOverrides);
    setIsSettingsOpen(false);
  }, []);

  // Price calculations and display data (must be before handleShowAgreement)
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

  const displayPackages = useMemo(() => {
    // Deterministic customer-facing order: Gold → Elite → Platinum (matches column mapping).
    const tierRank = (name: string) => {
      const n = name.trim().toLowerCase();
      if (/\bgold\b/.test(n)) return 1;
      if (/\belite\b/.test(n)) return 2;
      if (/\bplatinum\b/.test(n)) return 3;
      return 99;
    };
    const sorted = [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));
    return applyOverrides(sorted, priceOverrides);
  }, [packages, priceOverrides]);
  const displayAllAlaCarteOptions = useMemo(() => applyOverrides(allAlaCarteOptions, priceOverrides), [allAlaCarteOptions, priceOverrides]);
  const curatedSelectedItems = useMemo(
    () => customPackageItems.filter(isCuratedOption),
    [customPackageItems]
  );

  const displayCustomPackageItems = useMemo(
    () => applyOverrides(curatedSelectedItems, priceOverrides),
    [curatedSelectedItems, priceOverrides]
  );

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

  const curatedAlaCarteOptions = useMemo(() => {
    return [...displayAllAlaCarteOptions]
      .filter(isCuratedOption)
      .sort((a, b) => {
        const columnDiff = columnOrderValue(a.column) - columnOrderValue(b.column);
        if (columnDiff !== 0) return columnDiff;
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
  }, [displayAllAlaCarteOptions]);

  const mainPageAddons = useMemo(() => {
    const byColumn = curatedAlaCarteOptions
      .filter(option => option.column === 4)
      .sort(
        (a, b) =>
          (a.position ?? Number.MAX_SAFE_INTEGER) -
          (b.position ?? Number.MAX_SAFE_INTEGER)
      );

    if (byColumn.length > 0) return byColumn;

    return curatedAlaCarteOptions.filter(option => MAIN_PAGE_ADDON_IDS.includes(option.id));
  }, [curatedAlaCarteOptions]);

  const availableAlaCarteItems = useMemo(() => {
    return curatedAlaCarteOptions.filter(option => !curatedSelectedItems.some(item => item.id === option.id));
  }, [curatedSelectedItems, curatedAlaCarteOptions]);

  const handleShowAgreement = useCallback(() => {
    // Track quote finalization
    const vehicleString = [customerInfo.year, customerInfo.make, customerInfo.model].filter(Boolean).join(' ');
    trackQuoteFinalize({
      selectedPackage,
      customItems: customPackageItems,
      totalPrice,
      customerName: customerInfo.name,
      vehicleInfo: vehicleString,
    });
    setCurrentView('agreement');
  }, [selectedPackage, customPackageItems, totalPrice, customerInfo]);
  const handleShowMenu = useCallback(() => setCurrentView('menu'), []);

  const handleSelectPackage = useCallback((pkg: PackageTier) => {
    setSelectedPackage(prev => {
      const isSelecting = prev?.id !== pkg.id;
      if (isSelecting) {
        trackPackageSelect(pkg);
      }
      return prev?.id === pkg.id ? null : pkg;
    });
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
        trackAlaCarteRemove(item);
        return prev.filter(i => i.id !== item.id);
      } else {
        trackAlaCarteAdd(item);
        return [...prev, item];
      }
    });
  }, []);

  const handleDropAlaCarte = useCallback((item: AlaCarteOption) => {
    setCustomPackageItems(prev => {
      if (prev.find(i => i.id === item.id)) {
        return prev;
      }
      trackAlaCarteAdd(item);
      return [...prev, item];
    });
  }, []);

  const handleRemoveAlaCarte = useCallback((itemId: string) => {
    setCustomPackageItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item) {
        trackAlaCarteRemove(item);
      }
      return prev.filter(i => i.id !== itemId);
    });
  }, []);

  const handleViewDetail = useCallback((item: ProductFeature | AlaCarteOption) => {
    // Determine if it's a package feature or a la carte option
    const isAlaCarteOption = allAlaCarteOptions.some(opt => opt.id === item.id);
    trackFeatureView(item.name, isAlaCarteOption ? 'alacarte' : 'package');
    setViewingDetailItem(item);
  }, [allAlaCarteOptions]);

  const handleCloseModal = useCallback(() => {
    setViewingDetailItem(null);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const NavButton: React.FC<{page: Page, label: string}> = ({ page, label }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`
        w-full sm:w-auto px-6 py-3 rounded-xl text-lg font-teko tracking-wider transition-all duration-300 transform active:scale-98 border min-h-[48px]
        ${currentPage === page 
          ? 'bg-lux-blue text-lux-textStrong border-lux-blue/70 shadow-luxury-lg' 
          : 'bg-lux-bg2 text-lux-text border-lux-border/60 hover:border-lux-gold/60'}
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

  const renderMenuContent = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="lux-title text-4xl md:text-5xl">Vehicle Protection Menu</h2>
          <p className="lux-subtitle mt-1 max-w-3xl mx-auto">
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
               <h3 className="lux-title mb-4">Available Options</h3>
              <AlaCarteSelector
                items={availableAlaCarteItems}
                onViewItem={handleViewDetail}
                disableDrag={guestMode}
                onToggleItem={handleToggleAlaCarteItem}
                selectedIds={customPackageItems.map(item => item.id)}
              />
            </div>
            <div className="xl:w-2/5 flex flex-col">
               <h3 className="lux-title mb-4">Your Custom Package</h3>
              <CustomPackageBuilder
                items={displayCustomPackageItems}
                onDropItem={handleDropAlaCarte}
                onRemoveItem={handleRemoveAlaCarte}
                enableDrop={!guestMode}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // If not authenticated and not in demo mode, show the Login screen.
  // This also handles the initial authentication loading state.
  if (!user && !isDemoMode) {
    return <Login isAuthLoading={isAuthLoading} firebaseError={firebaseInitializationError} />;
  }

  return (
    <div className="lux-app antialiased flex flex-col">
      <Header
        user={user}
        guestMode={guestMode}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        onToggleAdminView={handleToggleAdminView}
        isAdminView={isAdminView}
        onPrint={handlePrint}
      />
      
      {isAdminView && !isDemoMode && !guestMode ? (
        <AdminPanel onDataUpdate={loadData} />
      ) : (
        <>
          <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 max-w-screen-2xl flex-grow flex flex-col">
            {isLoading ? (
              <LoadingSpinner />
            ) : currentView === 'agreement' ? (
              <AgreementView
                onBack={handleShowMenu}
                selectedPackage={selectedPackage ? displayPackages.find(p => p.id === selectedPackage.id) || null : null}
                customPackageItems={displayCustomPackageItems}
                totalPrice={totalPrice}
                totalCost={totalCost}
                customerInfo={customerInfo}
              />
            ) : (
              <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                <div className="lux-no-select space-y-4">
                  {renderMenuContent()}
                </div>
                <SelectionDrawer
                  selectedPackage={selectedPackage ? displayPackages.find(p => p.id === selectedPackage.id) || null : null}
                  customItems={displayCustomPackageItems}
                  totalPrice={totalPrice}
                  onRemoveItem={handleRemoveAlaCarte}
                  onPrint={handlePrint}
                  onDeselectPackage={selectedPackage ? () => handleSelectPackage(selectedPackage) : undefined}
                />
              </div>
            )}
          </main>
          {currentView === 'menu' && !isLoading && (
            <>
              <Summary
                selectedPackage={selectedPackage ? displayPackages.find(p => p.id === selectedPackage.id) || null : null}
                customPackageItems={displayCustomPackageItems}
                totalPrice={totalPrice}
                customerInfo={customerInfo}
                onShowAgreement={handleShowAgreement}
              />
              <AIAssistant
                packages={displayPackages}
                alaCarteOptions={curatedAlaCarteOptions}
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
        currentPriceOverrides={priceOverrides}
      />
    </div>
  );
};

export default App;
