import React from "react";
import { User } from "firebase/auth";

const SettingsIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.905c-.008.379.137.752.43.992l1.004.827a1.125 1.125 0 0 1 .26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.905c.008-.379-.137-.752-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

interface HeaderProps {
  user: User | null;
  guestMode: boolean;
  isDemoMode?: boolean;
  hasPricingOverrides?: boolean;
  onOpenSettings: () => void;
  onLogout: () => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
  onPrint: () => void;
  onShowPresentation?: () => void;
  showPresentationButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  guestMode,
  isDemoMode = false,
  hasPricingOverrides = false,
  onOpenSettings,
  onLogout,
  onToggleAdminView,
  isAdminView,
  onPrint,
  onShowPresentation,
  showPresentationButton = false,
}) => {
  return (
    <header className="am-app-header bg-lux-bg1/80 backdrop-blur-sm py-4 border-b border-lux-border/60 sticky top-0 z-header">
      <div className="am-app-header-inner container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="am-app-header-brand text-center sm:text-left">
          <h1 className="am-app-header-title text-3xl sm:text-4xl font-bold tracking-widest font-teko text-lux-textStrong">
            PRIORITY <span className="text-lux-textMuted">LEXUS</span>
          </h1>
          <p className="am-app-header-subtitle text-sm text-lux-textMuted tracking-widest">
            VIRGINIA BEACH
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onPrint} className="btn-lux-ghost text-sm flex items-center gap-2 px-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V9h1.25A2.75 2.75 0 0 1 22 11.75v4.5A2.75 2.75 0 0 1 19.25 19h-.75V21a.75.75 0 0 1-.75.75h-11A.75.75 0 0 1 6 21v-2h-.25A2.75 2.75 0 0 1 3 16.25v-4.5A2.75 2.75 0 0 1 5.75 9H7V4.5ZM17.25 9V4.5a.25.25 0 0 0-.25-.25h-9a.25.25 0 0 0-.25.25V9h9.5ZM6.5 19.5h11v-5h-11v5Zm-2.5-3.25c0 .69.56 1.25 1.25 1.25H6v-3.5h-1.5c-.69 0-1.25.56-1.25 1.25v1ZM18 14v3.5h1.25c.69 0 1.25-.56 1.25-1.25v-1c0-.69-.56-1.25-1.25-1.25H18Z" />
            </svg>
            Print
          </button>
          {(!guestMode || isDemoMode) && (
            <>
              <button onClick={onToggleAdminView} className="btn-lux-secondary text-sm px-3">
                {isAdminView ? "View Menu" : isDemoMode ? "Admin Setup" : "Admin Panel"}
              </button>
              {showPresentationButton && onShowPresentation && (
                <button
                  type="button"
                  onClick={onShowPresentation}
                  className="btn-lux-ghost text-sm px-3"
                  aria-label="Show presentation"
                  title="Show presentation"
                >
                  Presentation
                </button>
              )}
              {user && (
                <button onClick={onLogout} className="btn-lux-ghost text-sm px-3">
                  Logout
                </button>
              )}
              {!isDemoMode && (
                <>
                  <div className="h-6 w-px bg-lux-border/70"></div>
                  <p className="am-app-header-tagline text-lg text-lux-textMuted font-light font-teko tracking-widest hidden md:block">
                    PRIORITIES FOR LIFE
                  </p>
                  <button
                    onClick={onOpenSettings}
                    className="btn-lux-ghost p-2 text-lux-textMuted hover:text-lux-textStrong hover:rotate-90 transition-all duration-300"
                    aria-label="Open pricing settings"
                    title={hasPricingOverrides ? "Pricing adjustments (active)" : "Pricing adjustments"}
                  >
                    <span className="relative inline-flex">
                      <SettingsIcon />
                      {hasPricingOverrides && (
                        <span
                          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
