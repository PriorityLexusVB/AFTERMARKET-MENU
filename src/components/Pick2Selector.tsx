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
  recommendedPairs?: Array<{
    label: string;
    optionIds: [string, string];
  }>;
  onPresetSelect?: (ids: string[]) => void;
  onDone?: () => void;
  onClear?: () => void;
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
  recommendedPairs,
  onPresetSelect,
  onDone,
  onClear,
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
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
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
      setBlockedMessage("You’re at 2. Remove one to swap.");
      return;
    }

    setBlockedMessage(null);
    onToggle(item);
  };

  const progressText = isComplete
    ? `All set — ${selectedCount} selected`
    : `${selectedCount} of ${maxSelections} selected`;
  const blockedText = blockedMessage;

  const hasSelectionValue =
    selectedItems.length === maxSelections &&
    selectedItems.every((item) => Number.isFinite(item.price));
  const selectedValue = hasSelectionValue
    ? selectedItems.reduce((sum, item) => sum + item.price, 0)
    : null;
  const savings = selectedValue !== null ? Math.max(0, selectedValue - bundlePrice) : null;

  const headerWrapperClass = isCompact
    ? "sticky top-0 z-20 -mx-2 px-2 pt-2 pb-2 bg-gray-900/90 backdrop-blur-sm"
    : "sticky top-0 z-20 -mx-4 px-4 pt-4 pb-3 bg-gray-900/90 backdrop-blur-sm";

  const titleText = title?.trim() || "You Pick 2";
  const subtitleText = subtitle?.trim() || "Choose any 2 featured add-ons for one price.";

  const selectedSlots = Array.from({ length: maxSelections }, (_, index) =>
    selectedItems[index] ? selectedItems[index] : null
  );

  const availablePresets = useMemo(() => {
    if (!recommendedPairs) return [];
    return recommendedPairs.filter((pair) => {
      const [first, second] = pair.optionIds;
      return Boolean(first && second && itemById.has(first) && itemById.has(second));
    });
  }, [recommendedPairs, itemById]);

  const handlePresetSelect = (optionIds: [string, string]) => {
    setBlockedMessage(null);
    onPresetSelect?.(optionIds);
  };

  const handleClear = () => {
    setBlockedMessage(null);
    onClear?.();
  };

  return (
    <div
      className={`bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg ${
        isCompact ? "p-2" : "p-4"
      } h-full min-h-0 flex flex-col ${className ?? ""}`}
    >
      <header className={headerWrapperClass} data-testid="pick2-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
                className={`${isCompact ? "text-lg" : "text-xl"} font-semibold text-gray-100`}
                data-testid="pick2-price"
              >
                {formatPrice(bundlePrice)} total
              </p>
              <p className={`${isCompact ? "text-[11px]" : "text-xs"} text-gray-400`}>
                Installed today
              </p>
              {hasSelectionValue ? (
                <div
                  className={`${isCompact ? "mt-1" : "mt-2"} text-[11px] text-gray-300 space-y-0.5`}
                  data-testid="pick2-savings"
                >
                  <p>Individually: {formatPrice(selectedValue ?? 0)}</p>
                  <p>Bundle: {formatPrice(bundlePrice)}</p>
                  {savings && savings > 0 ? (
                    <p className="text-lux-gold/90">Savings: {formatPrice(savings)}</p>
                  ) : (
                    <p className="text-gray-400">Bundle price applied.</p>
                  )}
                </div>
              ) : null}
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

        <div className={`${isCompact ? "mt-2" : "mt-3"} flex flex-col gap-2`}>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Selected</p>
          <div className="flex flex-wrap gap-2">
            {selectedSlots.map((item, index) => {
              if (item) {
                return (
                  <button
                    key={`pick2-chip-${item.id}`}
                    type="button"
                    onClick={() => onToggle(item)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-100 hover:border-lux-gold/60 hover:text-white min-h-touch transition-all duration-200"
                    aria-label={`Remove ${item.name} from Pick 2`}
                    data-testid="pick2-selected-chip"
                  >
                    <span className="max-w-[160px] truncate">{item.name}</span>
                    <span className="text-[11px] text-gray-300" aria-hidden="true">
                      &times;
                    </span>
                  </button>
                );
              }

              const emptyText =
                index === 0
                  ? "Select your first add-on"
                  : index === 1
                    ? "Select one more"
                    : "Select another add-on";
              return (
                <span
                  key={`pick2-slot-${index}`}
                  className="inline-flex items-center rounded-full border border-dashed border-white/15 bg-black/20 px-3 py-2 text-xs text-gray-400 min-h-touch transition-all duration-200"
                >
                  {emptyText}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">Swap anytime before finalizing.</p>
        </div>

        {availablePresets.length > 0 ? (
          <div className={`${isCompact ? "mt-2" : "mt-3"} flex flex-wrap gap-2`}>
            <p className="w-full text-xs uppercase tracking-[0.2em] text-gray-400">
              Recommended pairs
            </p>
            <div className="flex flex-wrap gap-2" data-testid="pick2-presets">
              {availablePresets.map((pair, index) => (
                <button
                  key={`pick2-preset-${index}`}
                  type="button"
                  onClick={() => handlePresetSelect(pair.optionIds)}
                  className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-100 hover:border-lux-gold/60 hover:text-white min-h-touch transition-all duration-200"
                  data-testid="pick2-preset-button"
                >
                  {pair.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {blockedText ? (
          <div
            className={`${isCompact ? "mt-2" : "mt-3"} rounded-lg border border-lux-gold/30 bg-lux-gold/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200`}
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
                  ctaSelectedLabel="Selected"
                  ariaAddLabel={`Select ${item.name} for Pick 2`}
                  ariaSelectedLabel={`Remove ${item.name} from Pick 2`}
                  variant="pick2"
                  cardTestId={`pick2-card-${item.id}`}
                  ctaTestId={`pick2-cta-${item.id}`}
                />
              );
            })}
          </div>
        )}
      </div>

      <div
        className={`${isCompact ? "mt-2" : "mt-3"} shrink-0 border-t border-white/10 pt-2 bg-gray-900/80 backdrop-blur-sm sticky bottom-0`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDone}
            disabled={!onDone}
            className="flex-1 rounded-md bg-lux-blue text-lux-textStrong border border-lux-blue/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:brightness-110 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            data-testid="pick2-done"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!onClear || selectedCount === 0}
            className="flex-1 rounded-md bg-transparent text-gray-200 border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:border-lux-gold/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            data-testid="pick2-clear"
          >
            Clear picks
          </button>
        </div>
      </div>
    </div>
  );
};
