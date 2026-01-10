import React from "react";
import type { AlaCarteOption, ProductFeature } from "../types";
import { AlaCarteItem } from "./AlaCarteItem";
import { isCuratedOption } from "../utils/alaCarte";

interface AlaCarteSelectorProps {
  items: AlaCarteOption[];
  onViewItem: (item: ProductFeature | AlaCarteOption) => void;
  disableDrag?: boolean;
  onToggleItem?: (item: AlaCarteOption) => void;
  selectedIds?: string[];
  isCompact?: boolean;
}

export const AlaCarteSelector: React.FC<AlaCarteSelectorProps> = ({
  items,
  onViewItem,
  disableDrag = false,
  onToggleItem,
  selectedIds = [],
  isCompact = false,
}) => {
  const [compactPage, setCompactPage] = React.useState(1);
  const curatedItems = items.filter(isCuratedOption);

  const featuredItems = curatedItems
    .filter((item) => item.column === 4)
    .sort((a, b) => {
      const posA = a.position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.position ?? Number.MAX_SAFE_INTEGER;
      if (posA !== posB) return posA - posB;
      return a.name.localeCompare(b.name);
    });

  const otherItems = curatedItems
    .filter((item) => item.column !== 4)
    .sort((a, b) => {
      const posA = a.position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.position ?? Number.MAX_SAFE_INTEGER;
      if (posA !== posB) return posA - posB;
      return a.name.localeCompare(b.name);
    });

  const selectedSet = new Set(selectedIds);

  const handleDragStart = (e: React.DragEvent, item: AlaCarteOption) => {
    if (disableDrag) return;
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  };

  if (curatedItems.length === 0) {
    return (
      <div className="text-center py-10 px-6 lux-card border-dashed border-lux-border/60 col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-16 h-16 mb-4 text-lux-gold"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <h4 className="text-xl font-bold font-teko text-lux-textStrong tracking-wider">
          No add-ons configured
        </h4>
        <p className="lux-subtitle mt-1">
          Please check back for curated options.
        </p>
      </div>
    );
  }

  if (isCompact) {
    const orderedItems = [...featuredItems, ...otherItems];
    const itemsPerPage = 6;
    const totalPages = Math.max(
      1,
      Math.ceil(orderedItems.length / itemsPerPage)
    );
    const safePage = Math.min(Math.max(compactPage, 1), totalPages);
    const start = (safePage - 1) * itemsPerPage;
    const pageItems = orderedItems.slice(start, start + itemsPerPage);

    const handlePrev = () => setCompactPage((p) => Math.max(1, p - 1));
    const handleNext = () => setCompactPage((p) => Math.min(totalPages, p + 1));

    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-lux-text">
              Available Add-Ons
            </h4>
            <p className="text-xs text-lux-textMuted">
              Page {safePage} of {totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safePage <= 1}
              className="btn-lux-ghost px-3 py-2 min-h-[44px] disabled:opacity-50"
              aria-label="Previous add-ons page"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={safePage >= totalPages}
              className="btn-lux-ghost px-3 py-2 min-h-[44px] disabled:opacity-50"
              aria-label="Next add-ons page"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          {pageItems.map((item) => (
            <AlaCarteItem
              key={item.id}
              item={item}
              onViewItem={() => onViewItem(item)}
              onDragStart={(e) => handleDragStart(e, item)}
              disableDrag={disableDrag}
              isSelected={selectedSet.has(item.id)}
              onToggle={onToggleItem ? () => onToggleItem(item) : undefined}
              isCompact
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {featuredItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-lux-text">
            Featured Add-Ons
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:col-span-3 gap-6">
            {featuredItems.map((item) => (
              <AlaCarteItem
                key={item.id}
                item={item}
                onViewItem={() => onViewItem(item)}
                onDragStart={(e) => handleDragStart(e, item)}
                disableDrag={disableDrag}
                isSelected={selectedSet.has(item.id)}
                onToggle={onToggleItem ? () => onToggleItem(item) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {otherItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-lux-text">All Add-Ons</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:col-span-3 gap-6">
            {otherItems.map((item) => (
              <AlaCarteItem
                key={item.id}
                item={item}
                onViewItem={() => onViewItem(item)}
                onDragStart={(e) => handleDragStart(e, item)}
                disableDrag={disableDrag}
                isSelected={selectedSet.has(item.id)}
                onToggle={onToggleItem ? () => onToggleItem(item) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
