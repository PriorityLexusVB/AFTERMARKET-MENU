import React, { useEffect, useMemo, useState } from "react";
import type { AlaCarteOption, ProductFeature } from "../types";
import { AddonItem } from "./AddonItem";

interface Pick2SelectorProps {
  items: AlaCarteOption[];
  selectedIds: string[];
  maxSelections: number;
  onToggle: (item: AlaCarteOption) => void;
  onView: (item: ProductFeature | AlaCarteOption) => void;
  bundlePrice: number;
  title?: string;
  subtitle?: string;
  className?: string;
  isCompact?: boolean;
  textSize?: "normal" | "large" | "xl";
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);

export const Pick2Selector: React.FC<Pick2SelectorProps> = ({
  items,
  selectedIds,
  maxSelections,
  onToggle,
  onView,
  bundlePrice,
  title,
  subtitle,
  className,
  isCompact = false,
  textSize = "normal",
}) => {
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const selectedCount = selectedIds.length;
  const isComplete = selectedCount === maxSelections;

  useEffect(() => {
    // Clear the message once the user deselects something (or max changes).
    if (blockedMessage && selectedCount < maxSelections) {
      setBlockedMessage(null);
    }
  }, [blockedMessage, selectedCount, maxSelections]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIdSet.has(item.id)),
    [items, selectedIdSet]
  );
  const slotItems = [selectedItems[0] ?? null, selectedItems[1] ?? null];
  const selectedValue = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price, 0),
    [selectedItems]
  );
  const savings = selectedValue > bundlePrice ? selectedValue - bundlePrice : 0;

  const headerClass = isCompact
    ? textSize === "xl"
      ? "text-2xl"
      : textSize === "large"
        ? "text-xl"
        : "text-lg"
    : textSize === "xl"
      ? "text-4xl"
      : textSize === "large"
        ? "text-3xl"
        : "text-2xl";

  const handleToggle = (item: AlaCarteOption) => {
    const isSelected = selectedIdSet.has(item.id);
    if (isSelected) {
      setBlockedMessage(null);
      onToggle(item);
      return;
    }

    if (selectedCount >= maxSelections) {
      setBlockedMessage("You've selected 2 - remove one to swap.");
      return;
    }

    setBlockedMessage(null);
    onToggle(item);
  };

  const progressText = `${selectedCount}/${maxSelections} selected`;
  const blockedText =
    blockedMessage ?? (isComplete ? "You've selected 2 - remove one to swap." : null);

  const headerWrapperClass = isCompact
    ? "sticky top-0 z-20 -mx-2 px-2 pt-2 pb-2 bg-gray-900/90 backdrop-blur-sm"
    : "sticky top-0 z-20 -mx-4 px-4 pt-4 pb-3 bg-gray-900/90 backdrop-blur-sm";

  const titleText = title?.trim() || "You Pick 2";
  const subtitleText = subtitle?.trim() || "Choose any 2 featured add-ons for one price";

  return (
    <div
      className={`bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg ${
        isCompact ? "p-2" : "p-4"
      } h-full min-h-0 flex flex-col ${className ?? ""}`}
    >
      <header className={headerWrapperClass} data-testid="pick2-header">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`${headerClass} font-teko font-bold tracking-wider ${
                isCompact ? "text-lux-gold text-shadow-sm" : "text-gray-200"
              } text-left`}
            >
              {titleText}
            </h3>
            <p className={`${isCompact ? "mt-0.5 text-xs" : "mt-1 text-sm"} text-gray-300/90`}>
              {subtitleText}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="text-right">
              <p
                className={`${isCompact ? "text-[11px]" : "text-xs"} text-gray-400 uppercase tracking-[0.2em]`}
              >
                Any 2 for
              </p>
              <p
                className={`${isCompact ? "text-lg" : "text-xl"} font-semibold text-gray-100`}
                data-testid="pick2-price"
              >
                {formatPrice(bundlePrice)}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                isComplete
                  ? "bg-luxury-green-600/20 border-luxury-green-600/30 text-luxury-green-200"
                  : "bg-black/30 border-white/10 text-gray-300"
              }`}
              aria-label={`Pick 2 progress ${progressText}`}
            >
              {progressText}
            </span>
          </div>
        </div>

        {isComplete ? (
          <div
            className={`${isCompact ? "mt-2" : "mt-3"} flex flex-wrap items-center gap-2 text-sm text-gray-200`}
          >
            <span className="inline-flex items-center rounded-full border border-luxury-green-600/30 bg-luxury-green-600/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-luxury-green-200">
              Bundle ready
            </span>
            {savings > 0 ? (
              <span className="text-xs text-lux-gold/90">Save {formatPrice(savings)}</span>
            ) : null}
          </div>
        ) : null}

        <div
          className={`${isCompact ? "mt-2" : "mt-3"} grid grid-cols-1 gap-2`}
          aria-label="Pick 2 slots"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Choose exactly {maxSelections}
          </p>
          {slotItems.map((slotItem, index) => (
            <div
              key={`pick2-slot-${index}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            >
              <div className="text-sm text-gray-200">
                <span className="text-gray-400">Slot {index + 1}: </span>
                {slotItem ? slotItem.name : "Tap an upgrade to fill"}
              </div>
              {slotItem ? (
                <button
                  type="button"
                  onClick={() => onToggle(slotItem)}
                  className="min-h-[36px] min-w-[36px] rounded-lg border border-white/10 text-gray-200 hover:text-white"
                  aria-label={`Clear ${slotItem.name} from slot ${index + 1}`}
                >
                  
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className={`${isCompact ? "mt-2" : "mt-3"} flex flex-wrap gap-2`}>
          {selectedItems.length === 0 ? (
            <span className="text-xs text-gray-400">Select two to build your bundle.</span>
          ) : (
            selectedItems.map((item) => (
              <button
                key={`pick2-chip-${item.id}`}
                type="button"
                onClick={() => onToggle(item)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-100 hover:border-lux-gold/60 hover:text-white min-h-touch"
                aria-label={`Remove ${item.name} from Pick 2`}
                data-testid="pick2-selected-chip"
              >
                <span className="max-w-[160px] truncate">{item.name}</span>
                <span className="text-[11px] text-gray-300"></span>
              </button>
            ))
          )}
        </div>

        {blockedText ? (
          <div
            className={`${isCompact ? "mt-2" : "mt-3"} rounded-lg border border-lux-gold/30 bg-lux-gold/10 px-3 py-2 text-sm text-gray-200`}
            role="status"
          >
            {blockedText}
          </div>
        ) : null}
      </header>

      <div
        className={`${isCompact ? "mt-2" : "mt-3"} flex-1 min-h-0 overflow-y-auto ios-scroll scrollbar-luxury`}
        data-testid="pick2-list"
      >
        {items.length === 0 ? (
          <div className="text-sm text-gray-400 space-y-1">
            <p>No eligible Pick2 items configured yet.</p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${
              isCompact ? "gap-2" : "gap-3"
            } pr-2`}
          >
            {items.map((item) => {
              const isSelected = selectedIdSet.has(item.id);
              return (
                <AddonItem
                  key={item.id}
                  item={item}
                  isSelected={isSelected}
                  onToggle={() => handleToggle(item)}
                  onView={() => onView(item)}
                  isCompact={isCompact}
                  textSize={textSize}
                  ctaAddLabel="Select"
                  ctaSelectedLabel="Added "
                  ariaAddLabel={`Select ${item.name} for Pick 2`}
                  ariaSelectedLabel={`Remove ${item.name} from Pick 2`}
                  variant="pick2"
                  priceLabel="Value"
                  cardTestId={`pick2-card-${item.id}`}
                  ctaTestId={`pick2-cta-${item.id}`}
                  isCtaDisabled={isComplete && !isSelected}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
