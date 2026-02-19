import React, { useEffect, useId, useRef } from "react";

interface AddonDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  selectedCount: number;
  children: React.ReactNode;
}

export const AddonDrawer: React.FC<AddonDrawerProps> = ({
  isOpen,
  onOpen,
  onClose,
  selectedCount,
  children,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerPanelRef = useRef<HTMLElement | null>(null);
  const lastOpenerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();
  const selectedCountId = useId();

  const handleOpen = () => {
    if (typeof document !== "undefined") {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        lastOpenerRef.current = activeElement;
      }
    }
    onOpen();
  };

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = drawerPanelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

      if (focusable.length === 0) {
        event.preventDefault();
        closeButtonRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        closeButtonRef.current?.focus();
        return;
      }
      const active = document.activeElement;
      const activeInPanel = active instanceof HTMLElement ? panel.contains(active) : false;

      if (event.shiftKey) {
        if (!activeInPanel || active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeInPanel || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      return;
    }

    if (lastOpenerRef.current) {
      lastOpenerRef.current.focus();
      lastOpenerRef.current = null;
    }
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed right-3 top-[calc(env(safe-area-inset-top,0px)+120px)] z-40 bg-gray-900/90 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs uppercase tracking-[0.3em] hover:bg-gray-900 min-h-[44px]"
        aria-label="Open add-ons"
        title="Open add-ons"
      >
        Add-Ons
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            style={{ bottom: "var(--ipad-bottom-bar-h, 170px)" }}
            onClick={handleClose}
            role="button"
            tabIndex={0}
            aria-label="Dismiss add-ons"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleClose();
              }
            }}
          />

          <aside
            ref={drawerPanelRef}
            className="absolute right-0 top-0 w-[360px] max-w-[90vw] bg-gray-900/95 border-l border-gray-700 shadow-2xl flex flex-col min-h-0 overflow-hidden"
            style={{ bottom: "var(--ipad-bottom-bar-h, 170px)" }}
            aria-labelledby={titleId}
            aria-describedby={`${subtitleId} ${selectedCountId}`}
          >
            <header className="sticky top-0 z-10 px-4 pt-4 pb-3 border-b border-gray-700 bg-gray-900/95">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 id={titleId} className="font-teko text-3xl text-white tracking-wider">
                    Add-Ons
                  </h3>
                  <p id={subtitleId} className="am-text-label text-lux-textMuted">
                    Customize
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  ref={closeButtonRef}
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-600 text-white/90 hover:text-white hover:border-white/40 flex items-center justify-center text-lg"
                  aria-label="Close add-ons"
                  title="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div id={selectedCountId} className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-300">
                {selectedCount} selected
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain ios-scroll scrollbar-luxury px-4 py-3">
              {children}
            </div>

            <footer className="sticky bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 border-t border-gray-700 bg-gray-900/95">
              <button type="button" onClick={handleClose} className="btn-lux-primary w-full">
                Done
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
};
