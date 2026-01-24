import React, { useState } from "react";
import { ERROR_AUTO_HIDE_TIMEOUT } from "../constants";
import type { AlaCarteOption } from "../types";

interface CustomPackageBuilderProps {
  items: AlaCarteOption[];
  onDropItem: (item: AlaCarteOption) => void;
  onRemoveItem: (itemId: string) => void;
  enableDrop?: boolean;
  isCompact?: boolean;
  basePricesById?: Record<string, number>;
  baseSubtotal?: number;
}

export const CustomPackageBuilder: React.FC<CustomPackageBuilderProps> = ({
  items,
  onDropItem,
  onRemoveItem,
  enableDrop = true,
  isCompact = false,
  basePricesById,
  baseSubtotal,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleDragOver = (e: React.DragEvent) => {
    if (!enableDrop) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!enableDrop) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!enableDrop) return;
    e.preventDefault();
    setIsDragOver(false);
    setDropError(null);

    try {
      const dataString = e.dataTransfer.getData("application/json");

      if (!dataString) {
        throw new Error("No data found in drop event");
      }

      const item = JSON.parse(dataString) as AlaCarteOption;

      // Validate that the item has required properties
      if (!item.id || !item.name) {
        throw new Error("Invalid item data");
      }

      onDropItem(item);
      setHighlightedItemId(item.id);
      setTimeout(() => setHighlightedItemId(null), 1000);
    } catch (error) {
      console.error("Failed to parse dropped data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setDropError(`Failed to add item: ${errorMessage}. Please try again.`);

      // Auto-hide error after configured timeout
      setTimeout(() => setDropError(null), ERROR_AUTO_HIDE_TIMEOUT);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  const showDiscountSubtotal = typeof baseSubtotal === "number" && baseSubtotal > subtotal;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const itemsPerPage = isCompact ? 5 : Number.POSITIVE_INFINITY;
  const totalPages = isCompact ? Math.max(1, Math.ceil(items.length / itemsPerPage)) : 1;
  const safePage = isCompact ? Math.min(Math.max(page, 1), totalPages) : 1;
  const pageStart = (safePage - 1) * itemsPerPage;
  const visibleItems = isCompact ? items.slice(pageStart, pageStart + itemsPerPage) : items;

  return (
    <>
      {/* Error message for failed drops */}
      {dropError && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 flex-shrink-0 mt-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1">
            <p>{dropError}</p>
          </div>
          <button
            type="button"
            onClick={() => setDropError(null)}
            className="flex-shrink-0 text-red-400 hover:text-red-300"
            aria-label="Dismiss error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Drag/drop handlers are required for the dropzone; keyboard DnD isn't supported here. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
        lux-card ${enableDrop ? "border-dashed" : "border-solid"} ${
          isCompact ? "p-3 min-h-0" : "p-4 min-h-[300px]"
        } h-full transition-colors
        ${isDragOver ? "border-lux-blue bg-lux-blue/5" : "border-lux-border/70"}
      `}
      >
        {items.length === 0 ? (
          <div
            className={`flex flex-col justify-center items-center h-full text-center p-6 ${
              isCompact ? "text-lux-textMuted" : "text-gray-500"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`${isCompact ? "w-12 h-12" : "w-16 h-16"} mb-3 ${
                isCompact ? "text-lux-textMuted" : "text-gray-600"
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.65 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.012-1.244h3.86M9 18a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 0-1.5h-4.5A.75.75 0 0 0 9 18Z"
              />
            </svg>
            <h4
              className={`font-semibold ${
                isCompact
                  ? "text-2xl font-teko tracking-wider text-lux-textStrong"
                  : "text-lg text-gray-400"
              }`}
            >
              No items selected
            </h4>
            <p className={`mt-1 ${isCompact ? "text-sm" : "text-sm max-w-xs"}`}>
              {!enableDrop
                ? "Tap ADD (or tap an option) on the left to build your package."
                : isCompact
                  ? "Tap ADD on the left to build your package."
                  : "Drag items from the 'Available Options' list and drop them here to build your personalized protection plan."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {isCompact && totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs text-lux-textMuted">
                  Items {pageStart + 1}-{Math.min(pageStart + itemsPerPage, items.length)} of{" "}
                  {items.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="btn-lux-ghost px-3 py-2 min-h-[44px] disabled:opacity-50"
                    aria-label="Previous selected items page"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="btn-lux-ghost px-3 py-2 min-h-[44px] disabled:opacity-50"
                    aria-label="Next selected items page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            <div
              className={`flex-grow ${isCompact ? "space-y-2" : "space-y-3 pr-2 overflow-y-auto"}`}
            >
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 flex justify-between items-center animate-fade-in transition-all duration-500 ease-out ${
                    highlightedItemId === item.id
                      ? "border-lux-blue/70 bg-lux-blue/10"
                      : "border-lux-border/60 bg-lux-bg2/50"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-lux-text">{item.name}</p>
                    {(() => {
                      const basePrice = basePricesById?.[item.id];
                      const showDiscount = typeof basePrice === "number" && basePrice > item.price;

                      if (showDiscount) {
                        return (
                          <div className="text-sm">
                            <div className="text-lux-textMuted line-through decoration-2 decoration-lux-textMuted/60">
                              {formatPrice(basePrice)}
                            </div>
                            <div className="text-lux-textStrong">{formatPrice(item.price)}</div>
                          </div>
                        );
                      }

                      return (
                        <p className="text-sm text-lux-textMuted">{formatPrice(item.price)}</p>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className={`text-gray-300 hover:text-red-400 transition-colors ${
                      isCompact
                        ? "min-w-[44px] min-h-[44px] flex items-center justify-center"
                        : "p-1"
                    }`}
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className={`${isCompact ? "mt-3 pt-3" : "mt-4 pt-4"} border-t border-gray-700`}>
              <div className="flex justify-between items-center text-lg">
                <p className="font-semibold text-gray-300">Subtotal:</p>
                <div className="text-right">
                  {showDiscountSubtotal && (
                    <p className="text-sm text-gray-300 line-through decoration-2 decoration-gray-400/60">
                      {formatPrice(baseSubtotal)}
                    </p>
                  )}
                  <p className="font-bold font-teko text-3xl text-white">{formatPrice(subtotal)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
