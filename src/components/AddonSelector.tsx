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
}

export const AddonSelector: React.FC<AddonSelectorProps> = ({
  items,
  selectedItems,
  onToggleItem,
  onViewItem,
  basePricesById,
  className,
  isCompact = false,
}) => {
  return (
    <div
      className={`bg-gray-800/50 border border-gray-700 rounded-lg ${isCompact ? "p-2" : "p-4"} h-full min-h-0 flex flex-col ${
        className ?? ""
      }`}
    >
      <h3 className={`${isCompact ? "text-lg" : "text-2xl"} font-teko font-bold tracking-wider text-gray-200 ${isCompact ? "mb-2" : "mb-4"} text-center`}>
        Add-Ons
      </h3>
      <div className={`${isCompact ? "space-y-2" : "space-y-3"} flex-grow pr-2 min-h-0 overflow-hidden`}>
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
            />
          ))
        )}
      </div>
    </div>
  );
};
