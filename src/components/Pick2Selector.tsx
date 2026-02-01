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
      setBlockedMessage("You’ve selected 2 — remove one to swap.");
      return;
    }

    setBlockedMessage(null);
    onToggle(item);
  };

  const progressText = isComplete
    ? `${selectedCount}/${maxSelections} ✓`
    : `${selectedCount}/${maxSelections}`;

  const headerWrapperClass = isCompact
    ? "sticky top-0 z-10 -mx-2 px-2 pt-2 pb-2 bg-gray-900/80 backdrop-blur-sm"
    : "sticky top-0 z-10 -mx-4 px-4 pt-4 pb-3 bg-gray-900/80 backdrop-blur-sm";

  return (
    <div
      className={`bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg ${
        isCompact ? "p-2" : "p-4"
      } h-full min-h-0 flex flex-col ${className ?? ""}`}
    >
      <header className={headerWrapperClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`${headerClass} font-teko font-bold tracking-wider ${
                isCompact ? "text-lux-gold text-shadow-sm" : "text-gray-200"
              } text-left`}
            >
              You Pick 2
            </h3>
            <p className={`${isCompact ? "mt-0.5 text-xs" : "mt-1 text-sm"} text-gray-300/90`}>
              Bundle price:{" "}
              <span className="font-semibold text-gray-100">{formatPrice(bundlePrice)}</span>
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
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

        {blockedMessage ? (
          <div
            className={`${isCompact ? "mt-2" : "mt-3"} rounded-lg border border-lux-gold/30 bg-lux-gold/10 px-3 py-2 text-sm text-gray-200`}
            role="status"
          >
            {blockedMessage}
          </div>
        ) : null}
      </header>

      <div
        className={`${isCompact ? "mt-2 space-y-2" : "mt-3 space-y-3"} flex-grow pr-2 min-h-0 overflow-y-auto ios-scroll scrollbar-luxury`}
        data-testid="pick2-list"
      >
        {items.length === 0 ? (
          <div className="text-sm text-gray-400 space-y-1">
            <p>No eligible Pick2 items configured yet.</p>
          </div>
        ) : (
          items.map((item) => (
            <AddonItem
              key={item.id}
              item={item}
              isSelected={selectedIdSet.has(item.id)}
              onToggle={() => handleToggle(item)}
              onView={() => onView(item)}
              isCompact={isCompact}
              textSize={textSize}
              ctaAddLabel="Select"
              ctaSelectedLabel="Selected ✓"
              ariaAddLabel={`Select ${item.name} for Pick 2`}
              ariaSelectedLabel={`Remove ${item.name} from Pick 2`}
            />
          ))
        )}
      </div>
    </div>
  );
};
