import { getAnalytics, logEvent, setUserProperties, Analytics } from "firebase/analytics";
import { app } from "./firebase";
import type { PackageTier, AlaCarteOption } from "./types";

let analytics: Analytics | null = null;

function safeLogEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    // Analytics must never break core UI flows.
    console.warn(`Failed to log analytics event: ${eventName}`, error);
  }
}

/**
 * Initialize Firebase Analytics
 * Only initializes in browser environment and if app is configured
 */
export function initializeAnalytics(): void {
  // Only initialize in browser environment
  if (typeof window === "undefined") return;

  // Only initialize if Firebase app is configured
  if (!app) {
    console.warn("Firebase app not configured, analytics disabled");
    return;
  }

  try {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized");
  } catch (error) {
    console.warn("Failed to initialize Firebase Analytics:", error);
  }
}

/**
 * Track page views
 */
export function trackPageView(pageName: string): void {
  safeLogEvent("page_view", {
    page_title: pageName,
    page_location: window.location.href,
  });
}

/**
 * Track package selection
 */
export function trackPackageSelect(packageInfo: PackageTier): void {
  safeLogEvent("select_package", {
    package_id: packageInfo.id,
    package_name: packageInfo.name,
    package_price: packageInfo.price,
    is_recommended: packageInfo.isRecommended ?? packageInfo.is_recommended ?? false,
  });
}

/**
 * Track a la carte option added
 */
export function trackAlaCarteAdd(option: AlaCarteOption): void {
  safeLogEvent("add_alacarte_option", {
    option_id: option.id,
    option_name: option.name,
    option_price: option.price,
  });
}

/**
 * Track a la carte option removed
 */
export function trackAlaCarteRemove(option: AlaCarteOption): void {
  safeLogEvent("remove_alacarte_option", {
    option_id: option.id,
    option_name: option.name,
    option_price: option.price,
  });
}

/**
 * Track feature modal view
 */
export function trackFeatureView(featureName: string, featureType: "package" | "alacarte"): void {
  safeLogEvent("view_feature_details", {
    feature_name: featureName,
    feature_type: featureType,
  });
}

/**
 * Track quote finalization
 */
export function trackQuoteFinalize(data: {
  selectedPackage: PackageTier | null;
  customItems: AlaCarteOption[];
  totalPrice: number;
  customerName?: string;
  vehicleInfo?: string;
}): void {
  safeLogEvent("finalize_quote", {
    package_id: data.selectedPackage?.id || null,
    package_name: data.selectedPackage?.name || null,
    package_price: data.selectedPackage?.price || 0,
    custom_items_count: data.customItems.length,
    custom_items: data.customItems.map((item) => item.name).join(", "),
    total_price: data.totalPrice,
    has_customer_name: !!data.customerName,
    has_vehicle_info: !!data.vehicleInfo,
  });
}

/**
 * Track quote print
 */
export function trackQuotePrint(totalPrice: number): void {
  safeLogEvent("print_quote", {
    total_price: totalPrice,
  });
}

/**
 * Track settings menu open
 */
export function trackSettingsOpen(): void {
  safeLogEvent("settings_open");
}

/**
 * Track admin panel access
 */
export function trackAdminPanelAccess(): void {
  safeLogEvent("admin_panel_access");
}

/**
 * Track admin feature added
 */
export function trackAdminFeatureAdd(featureName: string): void {
  safeLogEvent("admin_feature_add", {
    feature_name: featureName,
  });
}

/**
 * Track user authentication
 */
export function trackUserLogin(method: string): void {
  safeLogEvent("login", {
    method: method,
  });
}

/**
 * Track user logout
 */
export function trackUserLogout(): void {
  safeLogEvent("logout");
}

/**
 * Set user properties for analytics
 */
export function setAnalyticsUserProperties(properties: Record<string, string>): void {
  if (!analytics) return;

  setUserProperties(analytics, properties);
}

/**
 * Track errors
 */
export function trackError(errorMessage: string, errorContext?: string): void {
  safeLogEvent("error", {
    error_message: errorMessage,
    error_context: errorContext || "unknown",
  });
}

/**
 * Track custom events
 */
export function trackCustomEvent(eventName: string, eventParams?: Record<string, unknown>): void {
  safeLogEvent(eventName, eventParams);
}
