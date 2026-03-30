import { useCallback, useEffect, useState } from "react";

const IPAD_LANDSCAPE_QUERY =
  "(min-width: 1024px) and (min-height: 740px) and (max-height: 1100px) and (orientation: landscape)";

const DESKTOP_KIOSK_QUERY =
  "(min-width: 1280px) and (min-height: 800px) and (orientation: landscape)";

export interface UseViewportLayoutReturn {
  isIpadLandscape: boolean;
  isDesktopKiosk: boolean;
  isLandscapeViewport: boolean;
  showBuildBadge: boolean;
  ipadLandscapeQuery: string;
  desktopKioskQuery: string;
}

export function useViewportLayout(): UseViewportLayoutReturn {
  const computeIsIpadLandscape = useCallback(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;

    // Local override to help validate iPad-only layout in desktop emulation.
    // Example: http://localhost:5174/?forceIpad=1
    const forceIpad = new URLSearchParams(window.location.search).get("forceIpad") === "1";
    if (forceIpad) {
      return true;
    }

    // Prefer layout-based detection over user agent parsing.
    // This keeps the iPad "paper mode" lock stable across iOS/Safari UA changes.
    const matchesLayout = window.matchMedia(IPAD_LANDSCAPE_QUERY).matches;
    if (!matchesLayout) return false;

    // iPadOS commonly reports itself as "MacIntel" with touch points.
    // This is a strong signal that avoids false-positives on desktop Chromium (incl. Playwright).
    const platform = navigator.platform || "";
    const isIpadOS = platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (isIpadOS) return true;

    const ua = navigator.userAgent || "";
    return /\biPad\b/i.test(ua);
  }, []);

  const [isIpadLandscape, setIsIpadLandscape] = useState<boolean>(() => computeIsIpadLandscape());

  const [isLandscapeViewport, setIsLandscapeViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(orientation: landscape)").matches;
  });

  const [showBuildBadge, setShowBuildBadge] = useState(false);

  const [isDesktopKiosk, setIsDesktopKiosk] = useState(false);

  // Build badge from query param or localStorage
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

  // iPad landscape media query listener
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(IPAD_LANDSCAPE_QUERY);
    const updateMatches = () => setIsIpadLandscape(computeIsIpadLandscape());
    mediaQuery.addEventListener("change", updateMatches);
    return () => {
      mediaQuery.removeEventListener("change", updateMatches);
    };
  }, [computeIsIpadLandscape]);

  // Orientation detection and lock
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(orientation: landscape)");
    const updateOrientation = () => {
      const byMedia = mediaQuery.matches;
      const byDimensions = window.innerWidth >= window.innerHeight;
      setIsLandscapeViewport(byMedia || byDimensions);
    };

    const lockLandscape = async () => {
      try {
        const orientation = window.screen.orientation as ScreenOrientation & {
          lock?: (orientation: "any" | "natural" | "landscape" | "portrait") => Promise<void>;
        };
        if (typeof orientation?.lock === "function") {
          await orientation.lock("landscape");
        }
      } catch {
        // Best effort only; many browsers restrict lock() without fullscreen/PWA context.
      }
    };

    updateOrientation();
    void lockLandscape();

    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    mediaQuery.addEventListener("change", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
      mediaQuery.removeEventListener("change", updateOrientation);
    };
  }, []);

  // Viewport height CSS variables (--app-vh, --app-height)
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const root = document.documentElement;
    let lastStableHeight = 0;

    const isValidHeight = (value: number | null | undefined): value is number =>
      typeof value === "number" && Number.isFinite(value) && value >= 300;

    const setViewportVars = () => {
      const innerHeight = Math.round(window.innerHeight);
      const clientHeight = Math.round(document.documentElement.clientHeight);
      const visualHeightRaw = window.visualViewport?.height;
      const visualHeight = isValidHeight(visualHeightRaw) ? Math.round(visualHeightRaw) : null;

      const baseHeight = isValidHeight(innerHeight)
        ? innerHeight
        : isValidHeight(clientHeight)
          ? clientHeight
          : 0;

      let height = baseHeight;

      if (visualHeight != null) {
        const candidateHeight = baseHeight > 0 ? Math.min(baseHeight, visualHeight) : visualHeight;
        const isLikelyTransient =
          baseHeight > 0 && candidateHeight < Math.round(baseHeight * 0.65);
        if (!isLikelyTransient) {
          height = candidateHeight;
        }
      }

      if (!isValidHeight(height)) {
        height = lastStableHeight > 0 ? lastStableHeight : Math.max(baseHeight, 300);
      }

      if (lastStableHeight > 0 && height < Math.round(lastStableHeight * 0.6)) {
        height = lastStableHeight;
      }

      lastStableHeight = height;
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

  // Desktop kiosk media query listener
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_KIOSK_QUERY);

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
      const mql = mediaQuery as MediaQueryList;
      mql.addListener(handleChange);
      return () => {
        mql.removeListener(handleChange);
      };
    }
  }, []);

  return {
    isIpadLandscape,
    isDesktopKiosk,
    isLandscapeViewport,
    showBuildBadge,
    ipadLandscapeQuery: IPAD_LANDSCAPE_QUERY,
    desktopKioskQuery: DESKTOP_KIOSK_QUERY,
  };
}
