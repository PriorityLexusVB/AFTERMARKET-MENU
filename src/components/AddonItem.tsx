import React from "react";
import type { AlaCarteOption } from "../types";

interface AddonItemProps {
  item: AlaCarteOption;
  basePrice?: number;
  isSelected: boolean;
  onToggle: () => void;
  onView: () => void;
  isCompact?: boolean;
  textSize?: "normal" | "large" | "xl";
  ctaAddLabel?: string;
  ctaSelectedLabel?: string;
  ariaAddLabel?: string;
  ariaSelectedLabel?: string;
}

const PlusIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

export const AddonItem: React.FC<AddonItemProps> = ({
  item,
  basePrice,
  isSelected,
  onToggle,
  onView,
  isCompact = false,
  textSize = "normal",
  ctaAddLabel,
  ctaSelectedLabel,
  ariaAddLabel,
  ariaSelectedLabel,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isDiscounted = typeof basePrice === "number" && basePrice > item.price;

  const highlightsSource =
    item.highlights && item.highlights.length > 0 ? item.highlights : item.points ?? [];
  const highlights = highlightsSource.filter(Boolean).slice(0, 2);

  const nameClass = isCompact
    ? textSize === "xl"
      ? "text-lg"
      : textSize === "large"
        ? "text-base"
        : "text-sm"
    : textSize === "xl"
      ? "text-xl"
      : textSize === "large"
        ? "text-lg"
        : "text-sm";

  const priceClass = isCompact
    ? textSize === "xl"
      ? "text-base"
      : textSize === "large"
        ? "text-sm"
        : "text-xs"
    : textSize === "xl"
      ? "text-lg"
      : textSize === "large"
        ? "text-base"
        : "text-xs";

  return (
    <div
      className={`bg-gray-800 border rounded-lg ${isCompact ? "p-2" : "p-3"} flex flex-col transition-shadow hover:shadow-md ${
        isSelected ? "border-lux-gold/70 ring-1 ring-lux-gold/20" : "border-gray-700"
      }`}
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onView}
            className={`font-semibold ${nameClass} text-gray-200 text-left hover:text-lux-blue transition-colors w-full leading-snug clamp-2 break-words`}
            aria-label={`Learn more about ${item.name}`}
          >
            {item.name}
          </button>

          <div className="shrink-0 text-right">
            {isDiscounted ? (
              <p
                className={`${isCompact ? "text-xs" : "text-[11px]"} text-gray-400 line-through decoration-2 decoration-gray-500/60`}
              >
                {formatPrice(basePrice)}
              </p>
            ) : null}
            <p className={`${priceClass} text-gray-200 font-semibold`}>{formatPrice(item.price)}</p>
          </div>
        </div>

        {item.description ? (
          <p
            className={`${isCompact ? "mt-1 text-xs" : "mt-1.5 text-[11px]"} text-gray-300/90 leading-snug clamp-2`}
          >
            {item.shortValue || item.description}
          </p>
        ) : null}

        {highlights.length > 0 ? (
          <ul className={`${isCompact ? "mt-2" : "mt-2.5"} space-y-1`}>
            {highlights.map((point, idx) => (
              <li
                key={`${item.id}-highlight-${idx}`}
                className={`${isCompact ? "text-xs" : "text-[11px]"} text-gray-300 flex gap-2`}
              >
                <span className="mt-[2px] inline-block h-1.5 w-1.5 rounded-full bg-lux-gold/80" />
                <span className="min-w-0 clamp-2">{point}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {item.warranty ? (
          <div className={`${isCompact ? "mt-2" : "mt-2.5"}`}>
            <span className="inline-flex items-center rounded-full bg-black/30 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-200">
              {item.warranty}
            </span>
          </div>
        ) : null}
      </div>
      <div className={isCompact ? "mt-2" : "mt-3"}>
        <button
          type="button"
          onClick={onToggle}
          className={`w-full ${isCompact ? "py-2 px-2" : "py-3 px-3"} rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 min-h-touch
            ${isSelected ? "bg-luxury-green-600 text-white hover:bg-luxury-green-700" : "bg-lux-gold text-lux-bg0 hover:bg-luxury-gold-400"}
          `}
          aria-label={
            isSelected
              ? ariaSelectedLabel ?? `Remove ${item.name} from quote`
              : ariaAddLabel ?? `Add ${item.name} to quote`
          }
        >
          {isSelected ? (
            <span>{ctaSelectedLabel ?? "Added ✓"}</span>
          ) : (
            <>
              <span className="inline-block animate-icon-pop-in">
                <PlusIcon />
              </span>
              <span>{ctaAddLabel ?? "Add to Quote"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
