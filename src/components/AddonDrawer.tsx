import React, { useEffect } from "react";

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
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
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
            onClick={onClose}
            role="button"
            tabIndex={0}
            aria-label="Dismiss add-ons"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
              }
            }}
          />

          <aside
            className="absolute right-0 top-0 w-[360px] max-w-[90vw] bg-gray-900/95 border-l border-gray-700 shadow-2xl flex flex-col"
            style={{ bottom: "var(--ipad-bottom-bar-h, 170px)" }}
          >
            <header className="sticky top-0 z-10 px-4 pt-4 pb-3 border-b border-gray-700 bg-gray-900/95">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-teko text-3xl text-white tracking-wider">Add-Ons</h3>
                  <p className="am-text-label text-lux-textMuted">Customize</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-600 text-white/90 hover:text-white hover:border-white/40"
                  aria-label="Close add-ons"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-300">
                {selectedCount} selected
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain ios-scroll scrollbar-luxury px-4 py-3">
              {children}
            </div>

            <footer className="sticky bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 border-t border-gray-700 bg-gray-900/95">
              <button type="button" onClick={onClose} className="btn-lux-primary w-full">
                Done
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
};
