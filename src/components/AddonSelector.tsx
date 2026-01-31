import React from "react";
import type { AlaCarteOption, ProductFeature } from "../types";
import { AddonItem } from "./AddonItem";

interface AddonSelectorProps {
  items: AlaCarteOption[];
  selectedItems: AlaCarteOption[];
  onToggleItem: (item: AlaCarteOption) => void;
  onViewItem: (item: ProductFeature | AlaCarteOption) => void;
  basePricesById?: Record<string, number>;
  className?: string;
  isCompact?: boolean;
  textSize?: "normal" | "large" | "xl";
}

export const AddonSelector: React.FC<AddonSelectorProps> = ({
  items,
  selectedItems,
  onToggleItem,
  onViewItem,
  basePricesById,
  className,
  isCompact = false,
  textSize = "normal",
}) => {
  const selectedCount = selectedItems.length;

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

  return (
    <div
      className={`bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg ${isCompact ? "p-2" : "p-4"} h-full min-h-0 flex flex-col ${
        className ?? ""
      }`}
    >
      <h3
        className={`${headerClass} font-teko font-bold tracking-wider ${
          isCompact ? "text-lux-gold text-shadow-sm" : "text-gray-200"
        } ${isCompact ? "mb-2" : "mb-4"} text-center`}
      >
        Add-Ons
      </h3>

      {items.length > 0 ? (
        <div className={`${isCompact ? "mb-2" : "mb-3"} text-center`}>
          <span className="inline-flex items-center rounded-full bg-black/30 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-300">
            {selectedCount} selected
          </span>
        </div>
      ) : null}

      <div
        data-testid="addons-drawer-list"
        className={`${
          isCompact ? "space-y-2" : "space-y-3"
        } flex-grow pr-2 min-h-0 overflow-y-auto ios-scroll scrollbar-luxury`}
      >
        {items.length === 0 ? (
          <div className="text-sm text-gray-400 space-y-1">
            <p>No featured add-ons configured yet.</p>
            <p>
              Set the Packages-page add-ons list via MAIN_PAGE_ADDON_IDS (or assign items to Column
              4 in the A La Carte admin).
            </p>
          </div>
        ) : (
          items.map((item) => (
            <AddonItem
              key={item.id}
              item={item}
              basePrice={basePricesById?.[item.id]}
              isSelected={selectedItems.some((selected) => selected.id === item.id)}
              onToggle={() => onToggleItem(item)}
              onView={() => onViewItem(item)}
              isCompact={isCompact}
              textSize={textSize}
            />
          ))
        )}
      </div>
    </div>
  );
};
