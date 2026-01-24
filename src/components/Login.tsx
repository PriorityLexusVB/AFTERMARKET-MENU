import React, { useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { SetupGuide } from "./SetupGuide";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface LoginProps {
  isAuthLoading: boolean;
  firebaseError: string | null;
}

export const Login: React.FC<LoginProps> = ({ isAuthLoading, firebaseError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const installSupport = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return {
        isIOS: false,
        isStandalone: false,
        canPromptInstall: false,
      };
    }

    const platform = navigator.platform || "";
    const isIpadOS = platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const isIOS = isIpadOS || /\b(iPad|iPhone|iPod)\b/i.test(navigator.userAgent || "");
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari legacy
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    return {
      isIOS,
      isStandalone,
      canPromptInstall: !isIOS,
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstallPrompt = (e: Event) => {
      // Chromium/Android only (Safari iOS does not support this).
      e.preventDefault?.();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    setIsInstalled(installSupport.isStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [installSupport.isStandalone]);

  const ensureFocus = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    // iOS standalone Safari can be finicky about focusing inputs; ensure focus on user gesture.
    if (document.activeElement !== input) {
      input.focus();
    }
  };

  const scrollIntoViewOnFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    // When the software keyboard appears, keep the focused field visible.
    window.requestAnimationFrame(() => {
      try {
        input.scrollIntoView({ block: "center", inline: "nearest" });
      } catch {
        // Older Safari may not support scrollIntoView options.
        input.scrollIntoView();
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Firebase authentication is not available.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.tsx will handle the view change
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };

      // Handle specific Firebase auth error codes
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Invalid email or password. Please try again.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled. Please contact support.");
          break;
        case "auth/too-many-requests":
          setError(
            "Too many failed login attempts. Please try again later or reset your password."
          );
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection and try again.");
          break;
        case "auth/operation-not-allowed":
          setError("Email/password sign-in is not enabled. Please contact support.");
          break;
        default:
          setError(
            `Login failed: ${error.message || "An unexpected error occurred. Please try again later."}`
          );
      }

      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (firebaseError) {
      return <SetupGuide error={firebaseError} />;
    }

    return (
      <>
        {isAuthLoading && (
          <div className="text-center text-gray-400 text-sm mb-6 p-3 bg-gray-900/50 rounded-md animate-pulse">
            <p>Checking session...</p>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPointerDown={ensureFocus}
              onTouchEnd={ensureFocus}
              onFocus={scrollIntoViewOnFocus}
              disabled={isSubmitting}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPointerDown={ensureFocus}
              onTouchEnd={ensureFocus}
              onFocus={scrollIntoViewOnFocus}
              disabled={isSubmitting}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/30">
              {error}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={isAuthLoading || isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </form>

        {!installSupport.isStandalone && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              type="button"
              className="w-full btn-lux-ghost text-sm px-3"
              disabled={isInstalled}
              onClick={async () => {
                if (installSupport.isIOS) {
                  alert(
                    "To install on iPad/iPhone:\n\n1) Open this site in Safari\n2) Tap the Share icon\n3) Tap 'Add to Home Screen'\n\nSafari iOS does not support an install button in the URL bar."
                  );
                  return;
                }
                if (!installPrompt) {
                  alert(
                    "Install is not available in this browser right now. If you're on Android Chrome/Edge, open the menu and choose 'Install app'."
                  );
                  return;
                }

                await installPrompt.prompt();
                await installPrompt.userChoice;
                setInstallPrompt(null);
              }}
            >
              Install / Add to Home Screen
            </button>
            <p className="mt-2 text-xs text-gray-400">
              Tip: iPad Safari installs via the Share menu.
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-gray-900 text-white min-h-[var(--app-height,100vh)] overflow-y-auto flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-widest font-teko text-white">
            PRIORITY <span className="text-gray-400">LEXUS</span>
          </h1>
          <p className="text-xl text-gray-400 font-teko tracking-wider">
            {firebaseError ? "System Configuration" : "Admin Panel"}
          </p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};
