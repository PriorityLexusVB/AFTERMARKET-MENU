import React from 'react';
import type { AlaCarteOption, PackageTier } from '../types';

interface SelectionDrawerProps {
  selectedPackage: PackageTier | null;
  customItems: AlaCarteOption[];
  totalPrice: number;
  onRemoveItem: (itemId: string) => void;
  onPrint: () => void;
  onDeselectPackage?: () => void;
  onShowAgreement?: () => void;
  variant?: 'panel' | 'bar';
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);

export const SelectionDrawer: React.FC<SelectionDrawerProps> = ({
  selectedPackage,
  customItems,
  totalPrice,
  onRemoveItem,
  onPrint,
  onDeselectPackage,
  onShowAgreement,
  variant = 'panel',
  }) => {
  if (variant === 'bar') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/80 backdrop-blur print:hidden">
        <div className="container mx-auto px-4 sm:px-8 py-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Your Selection</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-lux-text">
                <span className="font-semibold text-white">
                  {selectedPackage ? `${selectedPackage.name} Package` : 'No package selected'}
                </span>
                <span className="px-2 py-1 rounded-full bg-gray-800 text-gray-200 text-xs">
                  {customItems.length} add-on{customItems.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 flex-wrap justify-end">
              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Total</p>
                <p className="text-3xl sm:text-4xl font-teko text-white">{formatPrice(totalPrice)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onPrint}
                  className="btn-lux-ghost px-4 min-h-[44px]"
                  aria-label="Print summary"
                >
                  Print Selection
                </button>
                {onShowAgreement && (
                  <button
                    onClick={onShowAgreement}
                    className="btn-lux-primary px-4 min-h-[44px]"
                    aria-label="Finalize and view agreement"
                  >
                    Finalize
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="lux-card lg:sticky lg:top-6 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Your Selection</p>
          <h3 className="lux-title text-2xl mt-1">Summary</h3>
        </div>
        <button
          onClick={onPrint}
          className="btn-lux-ghost flex items-center gap-2 px-3"
          aria-label="Print summary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V9h1.25A2.75 2.75 0 0 1 22 11.75v4.5A2.75 2.75 0 0 1 19.25 19h-.75V21a.75.75 0 0 1-.75.75h-11A.75.75 0 0 1 6 21v-2h-.25A2.75 2.75 0 0 1 3 16.25v-4.5A2.75 2.75 0 0 1 5.75 9H7V4.5ZM17.25 9V4.5a.25.25 0 0 0-.25-.25h-9a.25.25 0 0 0-.25.25V9h9.5ZM6.5 19.5h11v-5h-11v5Zm-2.5-3.25c0 .69.56 1.25 1.25 1.25H6v-3.5h-1.5c-.69 0-1.25.56-1.25 1.25v1ZM18 14v3.5h1.25c.69 0 1.25-.56 1.25-1.25v-1c0-.69-.56-1.25-1.25-1.25H18Z" />
          </svg>
          Print
        </button>
      </div>

      <div className="space-y-3">
        <div className="lux-divider" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Package</p>
            {selectedPackage ? (
              <>
                <p className="text-lg font-semibold text-lux-textStrong">{selectedPackage.name}</p>
                <div className="lux-price-plaque mt-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Price</span>
                  <span className="text-2xl font-teko text-lux-textStrong">{formatPrice(selectedPackage.price)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-lux-textMuted mt-1">No package selected</p>
            )}
          </div>
          {selectedPackage && onDeselectPackage && (
            <button
              onClick={onDeselectPackage}
              className="btn-lux-ghost text-sm"
              aria-label="Remove selected package"
            >
              Clear
            </button>
          )}
        </div>
        <div className="lux-divider" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Add-ons</p>
          <span className="text-xs text-lux-textMuted">{customItems.length} selected</span>
        </div>
        {customItems.length === 0 ? (
          <p className="text-sm text-lux-textMuted">No add-ons selected</p>
        ) : (
          <div className="space-y-2">
            {customItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-lux-bg2/70 border border-lux-border/60 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-lux-text">{item.name}</p>
                  <p className="text-xs text-lux-textMuted">{formatPrice(item.price)}</p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-lux-textMuted hover:text-lux-red transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm2.28-11.28a.75.75 0 0 0-1.06 0L10 7.94 8.78 6.72a.75.75 0 1 0-1.06 1.06L8.94 9l-1.22 1.22a.75.75 0 1 0 1.06 1.06L10 10.06l1.22 1.22a.75.75 0 1 0 1.06-1.06L11.06 9l1.22-1.22a.75.75 0 0 0 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lux-divider" />

      <div className="space-y-3">
        <div className="lux-price-plaque">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Total</p>
            <p className="text-3xl font-teko text-lux-textStrong">{formatPrice(totalPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lux-textMuted">Taxes not included</p>
          </div>
        </div>
        <button onClick={onPrint} className="btn-lux-primary w-full">
          Print Selection
        </button>
      </div>
    </aside>
  );
};
