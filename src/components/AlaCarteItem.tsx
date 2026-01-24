import React from "react";
import type { AlaCarteOption } from "../types";

interface AlaCarteItemProps {
  item: AlaCarteOption;
  basePrice?: number;
  onViewItem: () => void;
  onDragStart: (e: React.DragEvent) => void;
  disableDrag?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
  isCompact?: boolean;
}

export const AlaCarteItem: React.FC<AlaCarteItemProps> = ({
  item,
  basePrice,
  onViewItem,
  onDragStart,
  disableDrag = false,
  isSelected = false,
  onToggle,
  isCompact = false,
}) => {
  const canToggle = disableDrag && typeof onToggle === "function";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isDiscounted = typeof basePrice === "number" && basePrice > item.price;

  if (isCompact) {
    if (canToggle) {
      return (
        <div
          draggable={!disableDrag}
          onDragStart={disableDrag ? undefined : onDragStart}
          className={`lux-card p-3 flex items-center justify-between gap-4 transition-all duration-200 ${
            isSelected ? "ring-1 ring-lux-blue/70 bg-lux-blue/5" : ""
          } relative cursor-pointer hover:-translate-y-0.5`}
        >
          <button
            type="button"
            onClick={onToggle}
            className="absolute inset-0"
            aria-label={`Toggle ${item.name}`}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewItem();
            }}
            className="relative z-10 flex-1 min-w-0 text-left min-h-[44px]"
            aria-label={`Learn more about ${item.name}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl leading-tight font-bold font-teko tracking-wider text-lux-textStrong hover:text-lux-blue transition-colors clamp-1">
                {item.name}
              </span>
              {item.isNew && <span className="lux-chip-gold">New</span>}
            </div>
            {item.warranty && (
              <div className="text-sm font-bold text-lux-gold mt-0.5">{item.warranty}</div>
            )}
          </button>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-lux-textMuted">Price</div>
              {isDiscounted && (
                <div className="text-base font-teko leading-none text-lux-textMuted line-through decoration-2 decoration-lux-textMuted/60">
                  {formatPrice(basePrice)}
                </div>
              )}
              <div className="text-4xl font-teko leading-none text-lux-textStrong">
                {formatPrice(item.price)}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`min-h-[48px] min-w-[120px] px-5 py-3 text-lg font-semibold rounded-md transition-colors ${
                isSelected
                  ? "btn-lux-ghost border border-red-500/40 text-red-200 hover:border-red-500/60 hover:text-red-100"
                  : "btn-lux-primary"
              }`}
            >
              {isSelected ? "REMOVE" : "ADD"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        draggable={!disableDrag}
        onDragStart={disableDrag ? undefined : onDragStart}
        className={`lux-card p-3 flex items-center justify-between gap-4 transition-all duration-200 ${
          isSelected ? "ring-1 ring-lux-blue/70 bg-lux-blue/5" : ""
        } ${disableDrag ? "" : "cursor-grab active:cursor-grabbing hover:-translate-y-0.5"}`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewItem();
          }}
          className="flex-1 min-w-0 text-left min-h-[44px]"
          aria-label={`Learn more about ${item.name}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl leading-tight font-bold font-teko tracking-wider text-lux-textStrong hover:text-lux-blue transition-colors clamp-1">
              {item.name}
            </span>
            {item.isNew && <span className="lux-chip-gold">New</span>}
          </div>
          {item.warranty && (
            <div className="text-sm font-bold text-lux-gold mt-0.5">{item.warranty}</div>
          )}
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-lux-textMuted">Price</div>
            {isDiscounted && (
              <div className="text-base font-teko leading-none text-lux-textMuted line-through decoration-2 decoration-lux-textMuted/60">
                {formatPrice(basePrice)}
              </div>
            )}
            <div className="text-4xl font-teko leading-none text-lux-textStrong">
              {formatPrice(item.price)}
            </div>
          </div>

          {canToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`min-h-[48px] min-w-[120px] px-5 py-3 text-lg font-semibold rounded-md transition-colors ${
                isSelected
                  ? "btn-lux-ghost border border-red-500/40 text-red-200 hover:border-red-500/60 hover:text-red-100"
                  : "btn-lux-primary"
              }`}
            >
              {isSelected ? "REMOVE" : "ADD"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={!disableDrag}
      onDragStart={disableDrag ? undefined : onDragStart}
      className={`lux-card ${
        isCompact ? "p-4" : "p-6"
      } flex flex-col relative transition-all duration-200 ${
        isSelected ? "ring-1 ring-lux-blue/70 bg-lux-blue/5" : ""
      } ${
        canToggle
          ? "cursor-pointer hover:-translate-y-0.5"
          : disableDrag
            ? ""
            : "cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
      }`}
    >
      {canToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-0"
          aria-label={`Toggle ${item.name}`}
        />
      )}
      {item.isNew && <div className="absolute top-0 right-0 -mt-3 -mr-3 lux-chip-gold">New</div>}

      <div className="flex-grow relative z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewItem();
          }}
          className={`${
            isCompact ? "text-xl leading-tight min-h-[44px]" : "text-xl"
          } font-bold font-teko tracking-wider text-left text-lux-textStrong hover:text-lux-blue transition-colors w-full`}
          aria-label={`Learn more about ${item.name}`}
        >
          <span className={isCompact ? "clamp-2" : ""}>{item.name}</span>
        </button>

        {item.warranty && <p className="text-sm font-bold text-lux-gold mb-2">{item.warranty}</p>}

        <div className="lux-price-plaque mt-2">
          <span className="text-xs uppercase tracking-[0.2em] text-lux-textMuted">Price</span>
          <div className="flex flex-col items-start">
            {isDiscounted && (
              <span className="text-xs text-lux-textMuted line-through decoration-2 decoration-lux-textMuted/60">
                {formatPrice(basePrice)}
              </span>
            )}
            <span
              className={
                isCompact
                  ? "text-3xl font-teko text-lux-textStrong"
                  : "text-2xl font-teko text-lux-textStrong"
              }
            >
              {formatPrice(item.price)}
            </span>
          </div>
        </div>

        {!isCompact && (
          <>
            <p className="text-sm text-lux-textMuted mt-3 mb-4">{item.description}</p>
            {item.points.length > 0 && (
              <ul className="text-sm text-lux-text space-y-1 list-disc list-inside">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className={`${isCompact ? "mt-4" : "mt-6"} flex flex-col gap-3 relative z-10`}>
        {!disableDrag && !isCompact && (
          <div className="text-xs text-lux-textMuted font-semibold uppercase tracking-wider">
            Drag to add
          </div>
        )}
        {canToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-full min-h-[48px] px-4 py-3 ${
              isCompact ? "text-base" : "text-sm"
            } font-semibold rounded-md transition-colors ${
              isSelected
                ? "btn-lux-ghost border border-red-500/40 text-red-200 hover:border-red-500/60 hover:text-red-100"
                : "btn-lux-primary"
            }`}
          >
            {isSelected ? "REMOVE" : "ADD"}
          </button>
        )}
      </div>
    </div>
  );
};
