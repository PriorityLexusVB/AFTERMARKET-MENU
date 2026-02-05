import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { Header } from "./components/Header";
import { PackageSelector } from "./components/PackageSelector";
import { AlaCarteSelector } from "./components/AlaCarteSelector";
import { FeatureModal } from "./components/FeatureModal";
import { CustomPackageBuilder } from "./components/CustomPackageBuilder";
import { Pick2Selector } from "./components/Pick2Selector";
import { SettingsModal } from "./components/SettingsModal";
import { SelectionDrawer } from "./components/SelectionDrawer";
import { AgreementView } from "./components/AgreementView";
import { Login } from "./components/Login";
import { AdminPanel } from "./components/AdminPanel";
import { SetupGuide } from "./components/SetupGuide";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ValuePresentation from "./components/ValuePresentation";
import { MAIN_PAGE_ADDON_IDS } from "./constants";
import { fetchAllData, fetchPick2Config } from "./data";
import { auth, firebaseInitializationError } from "./firebase";
import type {
  PackageTier,
  AlaCarteOption,
  ProductFeature,
  PriceOverrides,
  Pick2Config,
} from "./types";
import { columnOrderValue, isCuratedOption } from "./utils/alaCarte";
import { sortPackagesForDisplay } from "./utils/packageOrder";
import {
  initializeAnalytics,
  trackPackageSelect,
  trackAlaCarteAdd,
  trackAlaCarteRemove,
  trackFeatureView,
  trackQuoteFinalize,
  trackQuotePrint,
  trackSettingsOpen,
  trackAdminPanelAccess,
  trackUserLogout,
} from "./analytics";

type Page = "packages" | "alacarte" | "pick2";
type View = "menu" | "agreement" | "presentation";

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
  const [pick2Config, setPick2Config] = useState<Pick2Config | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI State
  const [currentView, setCurrentView] = useState<View>("menu");
  const hasShownPresentationRef = useRef(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const selectionBarRef = useRef<HTMLDivElement | null>(null);
  const [pendingPrint, setPendingPrint] = useState<null | {
    returnToMenu: boolean;
  }>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageTier | null>(null);
  const [customPackageItems, setCustomPackageItems] = useState<AlaCarteOption[]>([]);
  const [pick2SelectedIds, setPick2SelectedIds] = useState<string[]>([]);
  const [viewingDetailItem, setViewingDetailItem] = useState<
    ProductFeature | AlaCarteOption | null
  >(null);
  const [currentPage, setCurrentPage] = useState<Page>("packages");
  const [priceOverrides, setPriceOverrides] = useState<PriceOverrides>({});
  const [isAdminView, setIsAdminView] = useState(false);
  const ipadLandscapeQuery =
    // iPad “paper mode” should stay enabled on 12.9" iPads even if iPadOS
    // changes the effective width (e.g. Display Zoom / More Space / windowed).
    // Prefer a height bound over a tight max-width bound.
    "(min-width: 1024px) and (min-height: 740px) and (max-height: 1100px) and (orientation: landscape)";
  const desktopKioskQuery =
    // Desktop kiosk mode for larger landscape displays that should use no-scroll layout.
    "(min-width: 1280px) and (min-height: 800px) and (orientation: landscape)";
  const computeIsIpadLandscape = useCallback(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;

    // Local override to help validate iPad-only layout in desktop emulation.
    // Example: http://localhost:5174/?forceIpad=1
    const forceIpad = new URLSearchParams(window.location.search).get("forceIpad") === "1";
    if (forceIpad) {
      return true;
    }

    // Prefer layout-based detection over user agent parsing.
    // This keeps the iPad “paper mode” lock stable across iOS/Safari UA changes.
    const matchesLayout = window.matchMedia(ipadLandscapeQuery).matches;
    if (!matchesLayout) return false;

    // iPadOS commonly reports itself as "MacIntel" with touch points.
    // This is a strong signal that avoids false-positives on desktop Chromium (incl. Playwright).
    const platform = navigator.platform || "";
    const isIpadOS = platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (isIpadOS) return true;

    const ua = navigator.userAgent || "";
    return /\biPad\b/i.test(ua);
  }, [ipadLandscapeQuery]);
  const [isIpadLandscape, setIsIpadLandscape] = useState<boolean>(() => computeIsIpadLandscape());

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Lock guest UI to a single optimized size for consistency (no A/A+/A++ toggle).
  const guestTextSize = "large" as const;
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    year: "",
    make: "",
    model: "",
  });

  const [showBuildBadge, setShowBuildBadge] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "aftermarketMenu:debugBuild";
    const params = new URLSearchParams(window.location.search);

    const q = params.get("debugBuild");
    if (q === "1") {
      try {
        window.localStorage.setItem(key, "1");
      } catch {
        // ignore
      }
      setShowBuildBadge(true);
      return;
    }

    if (q === "0") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      setShowBuildBadge(false);
      return;
    }

    try {
      setShowBuildBadge(window.localStorage.getItem(key) === "1");
    } catch {
      setShowBuildBadge(false);
    }
  }, []);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const forcedDemoMode = (() => {
    if (typeof window === "undefined") return false;
    try {
      const fromSearch = new URLSearchParams(window.location.search).get("demo") === "1";
      if (fromSearch) return true;

      // Some deployments/test runners may use hash routing where the query string
      // ends up inside `location.hash` (e.g. `/#/path?demo=1`).
      const hash = window.location.hash || "";
      const qIndex = hash.indexOf("?");
      if (qIndex >= 0) {
        const fromHash = new URLSearchParams(hash.slice(qIndex)).get("demo") === "1";
        if (fromHash) return true;
      }

      return false;
    } catch {
      return false;
    }
  })();

  const [isAuthLoading, setIsAuthLoading] = useState(() => !forcedDemoMode);
  const [isDemoMode, setIsDemoMode] = useState(() => forcedDemoMode);
  const guestMode = !user;
  const isLoginView = !user && !isDemoMode;

  useEffect(() => {
    // Initialize Firebase Analytics
    initializeAnalytics();

    // Allow a deterministic guest/demo entry point for kiosk verification and automated tests.
    // This intentionally overrides auth-driven routing when present.
    if (typeof window !== "undefined") {
      try {
        const search = window.location.search || "";
        const hash = window.location.hash || "";
        const qIndex = hash.indexOf("?");
        const hashQuery = qIndex >= 0 ? hash.slice(qIndex) : "";
        const demo =
          new URLSearchParams(search).get("demo") || new URLSearchParams(hashQuery).get("demo");
        if (demo === "1") {
          setUser(null);
          setIsAdminView(false);
          setCurrentView("menu");
          setCurrentPage("packages");
          setIsAuthLoading(false);
          setIsDemoMode(true);
          return;
        }
      } catch {
        // ignore
      }
    }

    if (firebaseInitializationError || !auth) {
      setIsAuthLoading(false);
      setIsDemoMode(true); // Enter demo mode if Firebase isn't configured
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      // Navigation Flow:
      // Login -> Presentation -> Menu
      if (currentUser && !hasShownPresentationRef.current) {
        setCurrentView("presentation");
      }
      if (!currentUser) {
        hasShownPresentationRef.current = false;
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(ipadLandscapeQuery);
    const updateMatches = () => setIsIpadLandscape(computeIsIpadLandscape());
    mediaQuery.addEventListener("change", updateMatches);
    return () => {
      mediaQuery.removeEventListener("change", updateMatches);
    };
  }, [computeIsIpadLandscape, ipadLandscapeQuery]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const className = "ipad-landscape-lock";
    const shouldLock = isIpadLandscape && currentView === "menu" && !isAdminView && !isLoginView;
    if (shouldLock) {
      document.body.classList.add(className);
      document.documentElement.classList.add(className);
    } else {
      document.body.classList.remove(className);
      document.documentElement.classList.remove(className);
    }
    return () => {
      document.body.classList.remove(className);
      document.documentElement.classList.remove(className);
    };
  }, [isIpadLandscape, currentView, isAdminView, isLoginView]);

  useLayoutEffect(() => {
    if (isLoading || typeof document === "undefined" || typeof window === "undefined") return;
    const shouldLock = currentView === "menu" && !isAdminView && !isLoginView;
    if (!shouldLock) return;

    const root = document.documentElement;
    let resizeObserver: ResizeObserver | null = null;

    const updateHeights = () => {
      const headerEl = headerRef.current;
      const barEl = selectionBarRef.current;

      if (headerEl) {
        const height = headerEl.getBoundingClientRect().height;
        root.style.setProperty("--ipad-header-h", `${Math.round(height)}px`);
      }

      const barHeight = barEl ? barEl.getBoundingClientRect().height : 170;
      root.style.setProperty("--ipad-bottom-bar-h", `${Math.round(barHeight)}px`);
    };

    updateHeights();
    const rafId = window.requestAnimationFrame(updateHeights);

    const handleResize = () => {
      updateHeights();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateHeights();
      });
      if (headerRef.current) resizeObserver.observe(headerRef.current);
      if (selectionBarRef.current) resizeObserver.observe(selectionBarRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      root.style.removeProperty("--ipad-header-h");
      root.style.removeProperty("--ipad-bottom-bar-h");
    };
  }, [currentView, isAdminView, isLoading, isLoginView]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [{ packages, features, alaCarteOptions }, pick2Config] = await Promise.all([
      fetchAllData(),
      fetchPick2Config(),
    ]);
    setPackages(packages);
    setAllFeatures(features);
    setAllAlaCarteOptions(alaCarteOptions);
    setPick2Config(pick2Config);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Load data for a logged-in user OR if in demo mode
    if (user || isDemoMode) {
      loadData();
    }
  }, [user, isDemoMode, loadData]);

  useEffect(() => {
    if (guestMode && isAdminView && !isDemoMode) {
      setIsAdminView(false);
    }
  }, [guestMode, isAdminView, isDemoMode]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const root = document.documentElement;

    const setViewportVars = () => {
      const visualHeight = window.visualViewport?.height;
      const innerHeight = window.innerHeight;
      // iOS/iPadOS can briefly report incorrect visualViewport.height (including 0) during
      // orientation changes or initial paint. Using the larger of innerHeight/visualViewport
      // prevents the no-scroll layout from collapsing until the viewport settles.
      let height = Math.round(
        Math.max(innerHeight, typeof visualHeight === "number" ? visualHeight : 0)
      );

      // Absolute last-resort fallback.
      if (!Number.isFinite(height) || height < 300) {
        height = Math.round(innerHeight);
      }
      root.style.setProperty("--app-vh", `${height}px`);
      root.style.setProperty("--app-height", `${height}px`);
    };

    // iOS Safari can change the *visual* viewport height as the address bar
    // shows/hides. This doesn't always trigger a window resize, but it does
    // commonly trigger visualViewport scroll/resize.
    let rafId: number | null = null;
    let delayedId: number | null = null;

    const scheduleViewportVarsUpdate = () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setViewportVars();
      });

      // Follow-up update to catch late address-bar settling.
      if (delayedId != null) {
        window.clearTimeout(delayedId);
      }
      delayedId = window.setTimeout(() => {
        delayedId = null;
        setViewportVars();
      }, 200);
    };

    setViewportVars();
    scheduleViewportVarsUpdate();

    window.addEventListener("resize", scheduleViewportVarsUpdate);
    window.addEventListener("orientationchange", scheduleViewportVarsUpdate);
    window.addEventListener("scroll", scheduleViewportVarsUpdate, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleViewportVarsUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleViewportVarsUpdate);

    return () => {
      window.removeEventListener("resize", scheduleViewportVarsUpdate);
      window.removeEventListener("orientationchange", scheduleViewportVarsUpdate);
      window.removeEventListener("scroll", scheduleViewportVarsUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleViewportVarsUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleViewportVarsUpdate);
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
      }
      if (delayedId != null) {
        window.clearTimeout(delayedId);
      }
    };
  }, []);

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
      setCurrentView("menu");
      hasShownPresentationRef.current = false;
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [isDemoMode]);

  const handleToggleAdminView = useCallback(() => {
    setIsAdminView((prev) => {
      const newValue = !prev;
      if (newValue && !isDemoMode) {
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
  const handleSaveSettings = useCallback((nextOverrides: PriceOverrides) => {
    setPriceOverrides(nextOverrides);
    setIsSettingsOpen(false);
  }, []);

  const handleSaveCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
  }, []);

  const hasPricingOverrides = useMemo(() => {
    return Object.values(priceOverrides).some(
      (override) =>
        Boolean(override) &&
        (typeof override.price === "number" || typeof override.cost === "number")
    );
  }, [priceOverrides]);

  // Price calculations and display data (must be before handleShowAgreement)
  const applyOverrides = <T extends { id: string; price: number; cost: number }>(
    items: T[],
    overrides: PriceOverrides
  ): T[] => {
    return items.map((item) => {
      const override = overrides[item.id];
      if (!override) return item;
      return {
        ...item,
        price: override.price ?? item.price,
        cost: override.cost ?? item.cost,
      };
    });
  };

  const basePackagePricesById = useMemo(() => {
    const record: Record<string, number> = {};
    packages.forEach((pkg) => {
      record[pkg.id] = pkg.price;
    });
    return record;
  }, [packages]);

  const basePackageCostsById = useMemo(() => {
    const record: Record<string, number> = {};
    packages.forEach((pkg) => {
      record[pkg.id] = pkg.cost;
    });
    return record;
  }, [packages]);

  const baseAddonPricesById = useMemo(() => {
    const record: Record<string, number> = {};
    allAlaCarteOptions.forEach((opt) => {
      record[opt.id] = opt.price;
    });
    return record;
  }, [allAlaCarteOptions]);

  const baseAddonCostsById = useMemo(() => {
    const record: Record<string, number> = {};
    allAlaCarteOptions.forEach((opt) => {
      record[opt.id] = opt.cost;
    });
    return record;
  }, [allAlaCarteOptions]);

  const displayPackages = useMemo(() => {
    // Deterministic customer-facing order: Elite → Platinum → Gold (matches requested layout).
    const sorted = sortPackagesForDisplay(packages);
    return applyOverrides(sorted, priceOverrides);
  }, [packages, priceOverrides]);
  const displayAllAlaCarteOptions = useMemo(
    () => applyOverrides(allAlaCarteOptions, priceOverrides),
    [allAlaCarteOptions, priceOverrides]
  );

  const displayAlaCarteById = useMemo(() => {
    const map = new Map<string, AlaCarteOption>();
    displayAllAlaCarteOptions.forEach((opt) => map.set(opt.id, opt));
    return map;
  }, [displayAllAlaCarteOptions]);

  const pick2MaxSelections = pick2Config?.maxSelections ?? 2;
  const pick2Enabled = pick2Config?.enabled === true;
  const pick2BundlePrice = pick2Config?.price ?? 0;
  const pick2SelectedItems = useMemo(() => {
    return pick2SelectedIds
      .map((id) => displayAlaCarteById.get(id))
      .filter((item): item is AlaCarteOption => Boolean(item));
  }, [pick2SelectedIds, displayAlaCarteById]);

  const pick2SummaryText = useMemo(() => {
    if (!pick2Enabled) return undefined;
    if (pick2SelectedItems.length === 0) return `0/${pick2MaxSelections}`;
    if (pick2SelectedItems.length < pick2MaxSelections) {
      return `${pick2SelectedItems.length}/${pick2MaxSelections}`;
    }
    return pick2SelectedItems.map((item) => item.name).join(" + ");
  }, [pick2Enabled, pick2SelectedItems, pick2MaxSelections]);

  const pick2NeedsAttention =
    pick2Enabled && pick2SelectedItems.length > 0 && pick2SelectedItems.length < pick2MaxSelections;

  const pick2BundleActive = pick2Enabled && pick2SelectedItems.length === pick2MaxSelections;
  const pick2BundleCost = useMemo(() => {
    if (!pick2BundleActive) return 0;
    return pick2SelectedItems.reduce((sum, item) => sum + item.cost, 0);
  }, [pick2BundleActive, pick2SelectedItems]);

  const pick2Selection = useMemo(() => {
    if (!pick2BundleActive) return undefined;
    return {
      price: pick2BundlePrice,
      items: pick2SelectedItems,
      cost: pick2BundleCost,
    };
  }, [pick2BundleActive, pick2BundlePrice, pick2SelectedItems, pick2BundleCost]);
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
      const currentPackage = displayPackages.find((p) => p.id === selectedPackage.id);
      if (currentPackage) {
        price += currentPackage.price;
        cost += currentPackage.cost;
      }
    }
    displayCustomPackageItems.forEach((item) => {
      price += item.price;
      cost += item.cost;
    });
    if (pick2BundleActive) {
      price += pick2BundlePrice;
      cost += pick2BundleCost;
    }
    return { totalPrice: price, totalCost: cost };
  }, [
    selectedPackage,
    displayPackages,
    displayCustomPackageItems,
    pick2BundleActive,
    pick2BundlePrice,
    pick2BundleCost,
  ]);

  const baseTotalPrice = useMemo(() => {
    let price = 0;
    if (selectedPackage) {
      price += basePackagePricesById[selectedPackage.id] ?? selectedPackage.price;
    }
    customPackageItems.forEach((item) => {
      price += baseAddonPricesById[item.id] ?? item.price;
    });
    if (pick2BundleActive) {
      price += pick2BundlePrice;
    }
    return price;
  }, [
    selectedPackage,
    customPackageItems,
    basePackagePricesById,
    baseAddonPricesById,
    pick2BundleActive,
    pick2BundlePrice,
  ]);

  const baseCustomPackageSubtotal = useMemo(() => {
    let price = 0;
    curatedSelectedItems.forEach((item) => {
      price += baseAddonPricesById[item.id] ?? item.price;
    });
    return price;
  }, [curatedSelectedItems, baseAddonPricesById]);

  const curatedAlaCarteOptions = useMemo(() => {
    return [...displayAllAlaCarteOptions].filter(isCuratedOption).sort((a, b) => {
      const columnDiff = columnOrderValue(a.column) - columnOrderValue(b.column);
      if (columnDiff !== 0) return columnDiff;
      const posA = a.position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.position ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
  }, [displayAllAlaCarteOptions]);

  const pick2EligibleItems = useMemo(() => {
    return [...displayAllAlaCarteOptions]
      .filter((option) => option.pick2Eligible)
      .sort((a, b) => {
        const sortA = a.pick2Sort ?? Number.MAX_SAFE_INTEGER;
        const sortB = b.pick2Sort ?? Number.MAX_SAFE_INTEGER;
        if (sortA !== sortB) return sortA - sortB;
        const columnDiff = columnOrderValue(a.column) - columnOrderValue(b.column);
        if (columnDiff !== 0) return columnDiff;
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
  }, [displayAllAlaCarteOptions]);

  const showPick2Tab = pick2Enabled && pick2EligibleItems.length > 0;

  useEffect(() => {
    if (currentPage === "pick2" && !showPick2Tab) {
      setCurrentPage("packages");
    }
  }, [currentPage, showPick2Tab]);

  const mainPageAddons = useMemo(() => {
    // The Packages page "Add Ons" column prefers a tight, explicit whitelist
    // (matching the printed menu). If the whitelist doesn't match the current DB
    // (e.g., different dealer dataset), fall back to Column 4 "Featured" items.
    const byId = new Map(curatedAlaCarteOptions.map((option) => [option.id, option]));
    const explicit = MAIN_PAGE_ADDON_IDS.map((id) => byId.get(id)).filter(
      (option): option is AlaCarteOption => Boolean(option)
    );
    if (explicit.length > 0) return explicit;

    return curatedAlaCarteOptions
      .filter((option) => option.column === 4)
      .sort((a, b) => {
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
  }, [curatedAlaCarteOptions]);

  const availableAlaCarteItems = useMemo(() => {
    return curatedAlaCarteOptions.filter(
      (option) => !curatedSelectedItems.some((item) => item.id === option.id)
    );
  }, [curatedSelectedItems, curatedAlaCarteOptions]);

  const handleShowAgreement = useCallback(() => {
    // Track quote finalization
    const vehicleString = [customerInfo.year, customerInfo.make, customerInfo.model]
      .filter(Boolean)
      .join(" ");
    trackQuoteFinalize({
      selectedPackage,
      customItems: customPackageItems,
      totalPrice,
      customerName: customerInfo.name,
      vehicleInfo: vehicleString,
    });
    setCurrentView("agreement");
  }, [selectedPackage, customPackageItems, totalPrice, customerInfo]);
  const handleShowMenu = useCallback(() => setCurrentView("menu"), []);

  const handleSelectPackage = useCallback((pkg: PackageTier) => {
    setSelectedPackage((prev) => {
      const isSelecting = prev?.id !== pkg.id;
      if (isSelecting) {
        trackPackageSelect(pkg);
      }
      return prev?.id === pkg.id ? null : pkg;
    });
  }, []);

  const handleToggleAlaCarteItem = useCallback((item: AlaCarteOption) => {
    setCustomPackageItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);
      if (isSelected) {
        trackAlaCarteRemove(item);
        return prev.filter((i) => i.id !== item.id);
      } else {
        setPick2SelectedIds((prevPick2) => prevPick2.filter((id) => id !== item.id));
        trackAlaCarteAdd(item);
        return [...prev, item];
      }
    });
  }, []);

  const handleDropAlaCarte = useCallback((item: AlaCarteOption) => {
    setCustomPackageItems((prev) => {
      if (prev.find((i) => i.id === item.id)) {
        return prev;
      }
      setPick2SelectedIds((prevPick2) => prevPick2.filter((id) => id !== item.id));
      trackAlaCarteAdd(item);
      return [...prev, item];
    });
  }, []);

  const handleTogglePick2Item = useCallback(
    (item: AlaCarteOption) => {
      setPick2SelectedIds((prev) => {
        const isSelected = prev.includes(item.id);
        if (isSelected) {
          return prev.filter((id) => id !== item.id);
        }

        if (prev.length >= pick2MaxSelections) {
          return prev;
        }

        // Conflict rule: selecting via Pick2 removes the item from individually-priced add-ons.
        setCustomPackageItems((prevCustom) => prevCustom.filter((i) => i.id !== item.id));
        return [...prev, item.id];
      });
    },
    [pick2MaxSelections]
  );

  const handleRemoveAlaCarte = useCallback((itemId: string) => {
    setCustomPackageItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item) {
        trackAlaCarteRemove(item);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  }, []);

  const handleViewDetail = useCallback(
    (item: ProductFeature | AlaCarteOption) => {
      // Determine if it's a package feature or a la carte option
      const isAlaCarteOption = allAlaCarteOptions.some((opt) => opt.id === item.id);
      trackFeatureView(item.name, isAlaCarteOption ? "alacarte" : "package");
      setViewingDetailItem(item);
    },
    [allAlaCarteOptions]
  );

  const handleCloseModal = useCallback(() => {
    setViewingDetailItem(null);
  }, []);

  const handlePrint = useCallback(() => {
    // Printing is styled to only show `.print-mount`, which is rendered by AgreementView.
    // If the user prints from the menu, switch to AgreementView first so printing is not blank.
    trackQuotePrint(totalPrice);
    if (currentView === "menu") {
      setPendingPrint({ returnToMenu: true });
      setCurrentView("agreement");
      return;
    }
    window.print();
  }, [currentView, totalPrice]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pendingPrint) return;
    if (currentView !== "agreement") return;

    const handleAfterPrint = () => {
      if (pendingPrint.returnToMenu) {
        setCurrentView("menu");
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Let AgreementView mount `.print-mount` before printing.
    let raf2: number | null = null;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        try {
          window.print();
        } finally {
          setPendingPrint(null);
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2 != null) {
        window.cancelAnimationFrame(raf2);
      }
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [pendingPrint, currentView]);

  const NavButton: React.FC<{ page: Page; label: string }> = ({ page, label }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`am-menu-tab-btn ${
        currentPage === page
          ? "bg-lux-blue text-lux-textStrong border-lux-blue/70 shadow-luxury-lg"
          : "bg-lux-bg2 text-lux-text border-lux-border/60 hover:border-lux-gold/60"
      }`}
    >
      {label}
    </button>
  );

  const LoadingSpinner: React.FC = () => (
    <div className="flex-grow flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin h-12 w-12 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-xl font-teko tracking-wider text-gray-300">
          Loading Protection Plans...
        </p>
      </div>
    </div>
  );

  // Track whether we're in a "desktop kiosk" viewport using a dedicated media query.
  // This should stay in sync with the kiosk CSS/media-query definition.
  const [isDesktopKiosk, setIsDesktopKiosk] = useState(false);

  const enableIpadMenuLayout = isIpadLandscape && currentView === "menu" && !isAdminView;
  const enableIpadPackagesLayout = enableIpadMenuLayout && currentPage === "packages";
  const enableIpadAlaCarteLayout = enableIpadMenuLayout && currentPage === "alacarte";
  const enableIpadPick2Layout = enableIpadMenuLayout && currentPage === "pick2";
  const enableKioskAlaCarteLayout =
    isDesktopKiosk && currentView === "menu" && !isAdminView && currentPage === "alacarte";
  const enableKioskPick2Layout =
    isDesktopKiosk && currentView === "menu" && !isAdminView && currentPage === "pick2";
  const enableCompactAlaCarteLayout = enableIpadAlaCarteLayout || enableKioskAlaCarteLayout;
  const enableCompactPick2Layout = enableIpadPick2Layout || enableKioskPick2Layout;
  const disableAlaCarteDrag = enableCompactAlaCarteLayout || guestMode;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(desktopKioskQuery);

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktopKiosk(event.matches);
    };

    // Set initial value.
    handleChange(mediaQuery);

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleChange);
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    } else {
      // Fallback for older browsers that only support addListener/removeListener.
      // TypeScript needs explicit type assertion here since control flow narrowing
      // makes the else branch incompatible with MediaQueryList.
      const mql = mediaQuery as MediaQueryList;
      mql.addListener(handleChange);
      return () => {
        mql.removeListener(handleChange);
      };
    }
  }, []);

  // Enable no-scroll layout only for iPad landscape and explicit desktop kiosk viewports in menu view.
  const enableNoScrollLayout =
    (isIpadLandscape || isDesktopKiosk) && currentView === "menu" && !isAdminView;

  const renderMenuContent = () => {
    const wrapperClass = enableNoScrollLayout
      ? "flex flex-col h-full min-h-0 gap-1.5"
      : "space-y-4";
    // Use iPad-specific compact styling only for iPad, desktop gets slightly larger but still fits
    const heroTitleClass = enableIpadMenuLayout
      ? "lux-title text-lg leading-tight"
      : enableNoScrollLayout
        ? "lux-title text-2xl md:text-3xl"
        : "lux-title text-3xl md:text-4xl";
    const heroSubtitleClass = enableIpadMenuLayout
      ? "lux-subtitle mt-0 text-xs max-w-2xl mx-auto clamp-2"
      : enableNoScrollLayout
        ? "hidden"
        : "lux-subtitle mt-0.5 max-w-3xl mx-auto clamp-3";
    const tabsRowClass = `am-page-tabs-row am-menu-tabs-row flex flex-col sm:flex-row justify-center items-center shrink-0 ${
      enableIpadPackagesLayout ? "" : ""
    }`;
    const pageContent = (
      <>
        {currentPage === "packages" && (
          <div className="am-grid-top flex-1 min-h-0">
            <PackageSelector
              packages={displayPackages}
              allFeaturesForDisplay={allFeatures}
              selectedPackage={selectedPackage}
              onSelectPackage={handleSelectPackage}
              onViewFeature={handleViewDetail}
              basePackagePricesById={basePackagePricesById}
              addonItems={mainPageAddons}
              selectedAddons={customPackageItems}
              onToggleAddon={handleToggleAlaCarteItem}
              onViewAddon={handleViewDetail}
              baseAddonPricesById={baseAddonPricesById}
              pick2Summary={pick2SummaryText}
              textSize={guestTextSize}
              gridClassName={enableNoScrollLayout ? "items-stretch h-full" : "items-stretch"}
              isIpadLandscape={enableNoScrollLayout}
            />
          </div>
        )}

        {currentPage === "alacarte" && (
          <div
            className={
              enableCompactAlaCarteLayout
                ? "flex flex-1 min-h-0 gap-6 overflow-hidden"
                : "flex flex-col xl:flex-row gap-12"
            }
          >
            <div
              className={
                enableCompactAlaCarteLayout ? "flex-1 min-h-0 overflow-hidden" : "xl:w-3/5"
              }
            >
              <h3
                className={
                  enableCompactAlaCarteLayout
                    ? "font-teko font-semibold tracking-wider text-lux-textStrong text-2xl mb-2"
                    : "lux-title mb-4"
                }
              >
                Available Options
              </h3>
              <div className={enableCompactAlaCarteLayout ? "h-full min-h-0" : ""}>
                <AlaCarteSelector
                  items={availableAlaCarteItems}
                  onViewItem={handleViewDetail}
                  disableDrag={disableAlaCarteDrag}
                  onToggleItem={handleToggleAlaCarteItem}
                  selectedIds={customPackageItems.map((item) => item.id)}
                  isCompact={enableCompactAlaCarteLayout}
                  basePricesById={baseAddonPricesById}
                />
              </div>
            </div>
            <div
              className={
                enableCompactAlaCarteLayout
                  ? "w-[40%] min-w-[320px] flex flex-col min-h-0"
                  : "xl:w-2/5 flex flex-col min-h-0"
              }
            >
              <h3
                className={
                  enableCompactAlaCarteLayout
                    ? "font-teko font-semibold tracking-wider text-lux-textStrong text-2xl mb-2"
                    : "lux-title mb-4"
                }
              >
                Your Custom Package
              </h3>
              <div className="flex-1 min-h-0">
                <CustomPackageBuilder
                  items={displayCustomPackageItems}
                  onDropItem={handleDropAlaCarte}
                  onRemoveItem={handleRemoveAlaCarte}
                  enableDrop={!disableAlaCarteDrag}
                  isCompact={enableCompactAlaCarteLayout}
                  basePricesById={baseAddonPricesById}
                  baseSubtotal={baseCustomPackageSubtotal}
                />
              </div>
            </div>
          </div>
        )}

        {currentPage === "pick2" && showPick2Tab && (
          <div className={enableCompactPick2Layout ? "flex flex-1 min-h-0 overflow-hidden" : ""}>
            <div className={enableCompactPick2Layout ? "flex-1 min-h-0 overflow-hidden" : ""}>
              <Pick2Selector
                items={pick2EligibleItems}
                selectedIds={pick2SelectedIds}
                maxSelections={pick2MaxSelections}
                onToggle={handleTogglePick2Item}
                onView={handleViewDetail}
                bundlePrice={pick2BundlePrice}
                title={pick2Config?.title}
                subtitle={pick2Config?.subtitle}
                isCompact={enableCompactPick2Layout}
                textSize={guestTextSize}
                className={enableCompactPick2Layout ? "h-full min-h-0" : undefined}
              />
            </div>
          </div>
        )}
      </>
    );

    return (
      <div className={wrapperClass}>
        <div className="am-page-header shrink-0">
          <div className="am-page-header-stack text-center">
            <h2 className={heroTitleClass}>Vehicle Protection Menu</h2>
            <p className={heroSubtitleClass}>
              Select one of our expertly curated packages, or build a custom package from our a la
              carte options.
            </p>
          </div>
        </div>

        <div className={tabsRowClass}>
          <NavButton page="packages" label="Protection Packages" />
          <NavButton page="alacarte" label="A La Carte Options" />
          {showPick2Tab ? <NavButton page="pick2" label="You Pick 2" /> : null}
        </div>

        {enableNoScrollLayout ? (
          <div className="flex-1 min-h-0 overflow-hidden">{pageContent}</div>
        ) : (
          pageContent
        )}
      </div>
    );
  };

  const isMenuView = currentView === "menu";
  const mainLayoutClass =
    enableNoScrollLayout && isMenuView ? "am-main-no-scroll" : "am-main-default";
  // In no-scroll mode, make the main region reliably fill available space.
  const mainFlexClass = enableNoScrollLayout ? "flex-1" : "flex-grow";

  // If not authenticated and not in demo mode, show the Login screen.
  // This also handles the initial authentication loading state.
  if (!user && !isDemoMode) {
    return <Login isAuthLoading={isAuthLoading} firebaseError={firebaseInitializationError} />;
  }

  if (currentView === "presentation") {
    return (
      <ValuePresentation
        customerInfo={customerInfo}
        onSaveCustomerInfo={handleSaveCustomerInfo}
        onComplete={() => {
          hasShownPresentationRef.current = true;
          setCurrentView("menu");
        }}
      />
    );
  }

  const shouldLockMenuScroll =
    (isIpadLandscape || isDesktopKiosk) && currentView === "menu" && !isAdminView;

  return (
    <div
      className={`lux-app am-app-min-h antialiased flex flex-col ${
        shouldLockMenuScroll
          ? "ipad-landscape-lock h-[var(--app-height,100vh)] overflow-hidden"
          : ""
      }`}
    >
      {showBuildBadge ? (
        <div className="fixed left-2 top-[calc(env(safe-area-inset-top,0px)+8px)] z-[99999] pointer-events-none rounded-lg bg-black/70 backdrop-blur px-3 py-2 border border-white/10 text-[11px] text-white/80">
          <div className="font-mono">build {__BUILD_INFO__.sha}</div>
          <div className="font-mono">{__BUILD_INFO__.time}</div>
        </div>
      ) : null}
      <Header
        ref={headerRef}
        user={user}
        guestMode={guestMode}
        isDemoMode={isDemoMode}
        hasPricingOverrides={hasPricingOverrides}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        onToggleAdminView={handleToggleAdminView}
        isAdminView={isAdminView}
        onPrint={handlePrint}
        onShowPresentation={() => setCurrentView("presentation")}
        showPresentationButton={currentView === "menu" && !isAdminView}
      />

      {isAdminView && (isDemoMode || (!isDemoMode && !guestMode)) ? (
        <div className="h-[var(--app-height,100vh)] overflow-auto">
          {isDemoMode ? (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold font-teko tracking-wider uppercase text-lux-textStrong mb-4">
                Admin Setup
              </h2>
              <SetupGuide error={firebaseInitializationError} />
            </div>
          ) : (
            <ErrorBoundary>
              <AdminPanel onDataUpdate={loadData} />
            </ErrorBoundary>
          )}
        </div>
      ) : (
        <>
          <main
            className={`container mx-auto px-4 md:px-6 ${
              enableNoScrollLayout ? "py-2 md:py-3" : "py-4 md:py-6"
            } max-w-screen-2xl flex flex-col min-h-0 ${mainFlexClass} ${mainLayoutClass}`}
          >
            {isLoading ? (
              <LoadingSpinner />
            ) : currentView === "agreement" ? (
              <AgreementView
                onBack={handleShowMenu}
                selectedPackage={
                  selectedPackage
                    ? displayPackages.find((p) => p.id === selectedPackage.id) || null
                    : null
                }
                customPackageItems={displayCustomPackageItems}
                pick2={pick2Selection}
                totalPrice={totalPrice}
                totalCost={totalCost}
                customerInfo={customerInfo}
                baseTotalPrice={baseTotalPrice}
                basePackagePricesById={basePackagePricesById}
                baseAddonPricesById={baseAddonPricesById}
              />
            ) : (
              <div
                className={`lux-no-select ${
                  enableNoScrollLayout ? "flex-1 flex flex-col min-h-0" : "space-y-4"
                }`}
              >
                {renderMenuContent()}
              </div>
            )}
          </main>
          {currentView === "menu" && !isLoading && (
            <>
              <SelectionDrawer
                selectedPackage={
                  selectedPackage
                    ? displayPackages.find((p) => p.id === selectedPackage.id) || null
                    : null
                }
                customItems={displayCustomPackageItems}
                pick2={pick2Selection}
                pick2Summary={pick2SummaryText}
                pick2NeedsAttention={pick2NeedsAttention}
                totalPrice={totalPrice}
                baseTotalPrice={baseTotalPrice}
                basePackagePricesById={basePackagePricesById}
                baseAddonPricesById={baseAddonPricesById}
                onRemoveItem={handleRemoveAlaCarte}
                onPrint={handlePrint}
                onDeselectPackage={
                  selectedPackage ? () => handleSelectPackage(selectedPackage) : undefined
                }
                onShowAgreement={handleShowAgreement}
                onShowPick2={showPick2Tab ? () => setCurrentPage("pick2") : undefined}
                variant="bar"
                isCompact={enableNoScrollLayout}
                barRef={selectionBarRef}
              />
            </>
          )}
        </>
      )}

      {viewingDetailItem && <FeatureModal feature={viewingDetailItem} onClose={handleCloseModal} />}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        currentPriceOverrides={priceOverrides}
        basePackagePricesById={basePackagePricesById}
        basePackageCostsById={basePackageCostsById}
        baseAddonPricesById={baseAddonPricesById}
        baseAddonCostsById={baseAddonCostsById}
        selectedPackage={
          selectedPackage ? displayPackages.find((p) => p.id === selectedPackage.id) || null : null
        }
        selectedAddOns={displayCustomPackageItems}
      />
    </div>
  );
};

export default App;
