import React, { useEffect, useState } from "react";
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
  variant?: "default" | "pick2";
  cardTestId?: string;
  ctaTestId?: string;
  isCtaDisabled?: boolean;
}


const resolveCategoryAccentClass = (signal: string): string => {
  if (/warranty|service contract|vsc/.test(signal)) return "am-chip-accent-warranty";
  if (/tire|wheel|road hazard/.test(signal)) return "am-chip-accent-tire";
  if (/maintenan|oil|service/.test(signal)) return "am-chip-accent-maintenance";
  if (/appear|paint|interior|fabric|leather/.test(signal)) return "am-chip-accent-appearance";
  if (/gap|theft|loss/.test(signal)) return "am-chip-accent-risk";
  return "";
};

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
  variant = "default",
  cardTestId,
  ctaTestId,
  isCtaDisabled = false,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isDiscounted = typeof basePrice === "number" && basePrice > item.price;

  const [showThumbnail, setShowThumbnail] = useState(Boolean(item.thumbnailUrl));

  useEffect(() => {
    if (!item.thumbnailUrl) {
      setShowThumbnail(false);
      return;
    }

    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (!cancelled) {
        setShowThumbnail(true);
      }
    };

    image.onerror = () => {
      if (!cancelled) {
        setShowThumbnail(false);
      }
    };

    image.src = item.thumbnailUrl;

    return () => {
      cancelled = true;
    };
  }, [item.thumbnailUrl]);

  const highlightsSource =
    item.highlights && item.highlights.length > 0 ? item.highlights : (item.points ?? []);
  const highlights = highlightsSource.filter(Boolean).slice(0, 2);
  const isCompactPick2 = isCompact && variant === "pick2";
  const visibleHighlights = isCompactPick2 ? highlights.slice(0, 1) : highlights;

  const description =
    variant === "pick2"
      ? item.shortValue || item.description
      : item.description
        ? item.shortValue || item.description
        : undefined;

  const nameClass = isCompact
    ? textSize === "xl"
      ? "text-lg"
      : textSize === "large"
        ? "text-lg"
        : variant === "pick2"
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

  const showIndividualPrice = variant === "pick2" && Number.isFinite(item.price);

  const pick2SignalText = [item.shortValue, ...(item.highlights ?? []), ...(item.points ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hasWarrantySignal = Boolean(item.warranty) || pick2SignalText.includes("warranty");
  const hasMobileSignal = /(mobile|on[- ]?site|at your home|at your location)/.test(
    pick2SignalText
  );

  const pick2Chips =
    variant === "pick2"
      ? [
          hasWarrantySignal ? (item.warranty ?? "Warranty") : null,
          hasMobileSignal ? "Mobile service" : null,
        ].filter(Boolean)
      : [];

  const categorySignal = `${item.name} ${item.description} ${(item.points ?? []).join(" ")}`.toLowerCase();
  const categoryAccentClass = resolveCategoryAccentClass(categorySignal);

  const thumbnailSizeClass = isCompact ? "h-12 w-12" : "h-14 w-14";
  const shouldShowThumbnail = variant === "pick2" && Boolean(item.thumbnailUrl) && showThumbnail;

  return (
    <div
      className={`border rounded-lg ${isCompact ? "p-2" : "p-3"} flex flex-col transition-shadow hover:shadow-md ${
        variant === "pick2" && isCompact ? "bg-gray-900/75" : "bg-gray-800"
      } ${
        isSelected ? "border-lux-gold/70 ring-1 ring-lux-gold/20" : "border-gray-700"
      }`}
      data-testid={cardTestId}
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {shouldShowThumbnail ? (
              <div className={`${thumbnailSizeClass} shrink-0 overflow-hidden rounded-lg bg-black/30`}>
                <img
                  src={item.thumbnailUrl}
                  alt={`${item.name} thumbnail`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  data-testid={`pick2-thumbnail-${item.id}`}
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={onView}
              className={`font-semibold ${nameClass} text-gray-200 text-left hover:text-lux-blue transition-colors w-full min-w-0 leading-snug clamp-2 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lux-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded`}
              aria-label={`Learn more about ${item.name}`}
            >
              {item.name}
            </button>
          </div>

          <div className="shrink-0 text-right">
            {variant === "pick2" ? (
              showIndividualPrice ? (
                <p className={`${isCompact ? "text-[11px]" : "text-xs"} text-gray-400`}>
                  Individually {formatPrice(item.price)}
                </p>
              ) : null
            ) : (
              <>
                {isDiscounted ? (
                  <p
                    className={`${isCompact ? "text-xs" : "text-[11px]"} text-gray-400 line-through decoration-2 decoration-gray-500/60`}
                  >
                    {formatPrice(basePrice)}
                  </p>
                ) : null}
                <p className={`${priceClass} text-gray-200 font-semibold`}>
                  {formatPrice(item.price)}
                </p>
              </>
            )}
          </div>
        </div>

        {description ? (
          <p
            className={`${isCompact ? "mt-1 text-xs" : "mt-1.5 text-[11px]"} text-gray-300/90 leading-snug ${isCompactPick2 ? "clamp-1" : "clamp-2"}`}
          >
            {description}
          </p>
        ) : null}

        {visibleHighlights.length > 0 ? (
          <ul className={`${isCompact ? "mt-2" : "mt-2.5"} space-y-1`}>
            {visibleHighlights.map((point, idx) => (
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

        {pick2Chips.length > 0 ? (
          <div className={`${isCompact ? "mt-2" : "mt-2.5"} flex flex-wrap gap-2`}>
            {pick2Chips.map((chip) => (
              <span
                key={`${item.id}-${chip}`}
                className="inline-flex items-center rounded-full bg-black/30 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-200 transition-all duration-200"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : item.warranty ? (
          <div className={`${isCompact ? "mt-2" : "mt-2.5"}`}>
            <span
              className={`inline-flex items-center rounded-full bg-black/30 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-200 transition-all duration-200 ${categoryAccentClass}`}
            >
              {item.warranty}
            </span>
          </div>
        ) : null}
      </div>
      <div className={isCompact ? "mt-2" : "mt-3"}>
        <button
          type="button"
          onClick={onToggle}
          disabled={isCtaDisabled}
          className={`w-full ${isCompact ? "py-2 px-2" : "py-3 px-3"} rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 min-h-touch
            ${
              isSelected
                ? "bg-luxury-green-600 text-white hover:bg-luxury-green-700"
                : "bg-lux-gold text-lux-bg0 hover:bg-luxury-gold-400"
            }
            ${isCtaDisabled && !isSelected ? "opacity-60 cursor-not-allowed hover:bg-lux-gold" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lux-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
          `}
          aria-label={
            isSelected
              ? (ariaSelectedLabel ?? `Remove ${item.name} from quote`)
              : (ariaAddLabel ?? `Add ${item.name} to quote`)
          }
          data-testid={ctaTestId}
        >
          {isSelected ? (
            <span className="inline-flex items-center gap-1">
              <span>{ctaSelectedLabel ?? "Added"}</span>
              <span aria-hidden="true">&#10003;</span>
            </span>
          ) : variant === "pick2" ? (
            <span>{ctaAddLabel ?? "Select"}</span>
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
