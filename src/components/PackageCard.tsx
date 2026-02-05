import React from "react";
import type { PackageTier, ProductFeature, AlaCarteOption } from "../types";

interface PackageCardProps {
  packageInfo: PackageTier;
  allFeaturesForDisplay: ProductFeature[];
  isSelected: boolean;
  onSelect: () => void;
  onViewFeature: (feature: ProductFeature | AlaCarteOption) => void;
  onMagnify?: () => void;
  showRecommendedBadge?: boolean;
  basePrice?: number;
  className?: string;
  isCompact?: boolean;
  isMagnified?: boolean;
  textSize?: "normal" | "large" | "xl";
  pick2Summary?: string;
}

const MagnifyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className ?? "w-5 h-5"}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M9 3.5a5.5 5.5 0 1 0 3.477 9.764l2.63 2.63a.75.75 0 1 0 1.06-1.06l-2.63-2.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
      clipRule="evenodd"
    />
  </svg>
);

const Divider: React.FC<{ connector: "AND" | "OR" }> = ({ connector }) => {
  if (connector === "AND") {
    return (
      <div
        className="flex items-center justify-center my-4"
        data-testid="package-connector"
        data-connector="AND"
      >
        <div className="h-px bg-white/20 flex-grow"></div>
        <span className="font-bold px-3 text-xs sm:text-sm uppercase tracking-wider text-green-400">
          AND
        </span>
        <div className="h-px bg-white/20 flex-grow"></div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center my-4"
      data-testid="package-connector"
      data-connector="OR"
    >
      <div className="h-px bg-white/20 flex-grow"></div>
      <span className="font-bold px-3 text-xs sm:text-sm uppercase tracking-wider text-yellow-400">
        OR
      </span>
      <div className="h-px bg-white/20 flex-grow"></div>
    </div>
  );
};

export const PackageCard: React.FC<PackageCardProps> = ({
  packageInfo,
  allFeaturesForDisplay: _allFeaturesForDisplay,
  isSelected,
  onSelect,
  onViewFeature,
  onMagnify,
  showRecommendedBadge = false,
  basePrice,
  className = "",
  isCompact = false,
  isMagnified = false,
  textSize = "normal",
  pick2Summary,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isRecommended = packageInfo.isRecommended ?? packageInfo.is_recommended ?? false;
  const shouldShowRecommended = Boolean(showRecommendedBadge && isRecommended);

  const isDiscounted = typeof basePrice === "number" && basePrice > packageInfo.price;

  const featureNameClass = isCompact
    ? textSize === "xl"
      ? "text-lg"
      : textSize === "large"
        ? "text-base"
        : "text-sm"
    : isMagnified
      ? "text-2xl"
      : textSize === "xl"
        ? "text-2xl sm:text-3xl"
        : textSize === "large"
          ? "text-xl sm:text-2xl"
          : "text-lg sm:text-xl";

  const pointsClass = isCompact
    ? textSize === "xl"
      ? "text-base mt-1.5 space-y-1"
      : textSize === "large"
        ? "text-sm mt-1 space-y-1"
        : "text-[11px] mt-1"
    : isMagnified
      ? "text-lg mt-2 space-y-2"
      : textSize === "xl"
        ? "text-lg sm:text-xl mt-2 space-y-2"
        : textSize === "large"
          ? "text-base sm:text-lg mt-2 space-y-2"
          : "text-sm sm:text-base mt-2 space-y-1";

  const pointsListLayoutClass = "";

  // Use packageInfo.features directly - it's already derived by deriveTierFeatures for the tier mapping
  const includedPackageFeatures = packageInfo.features ?? [];
  const maxFeatureCount = isCompact ? 6 : 7;
  const displayedPackageFeatures = isMagnified
    ? includedPackageFeatures
    : includedPackageFeatures.slice(0, maxFeatureCount);
  const hasMoreFeatures = includedPackageFeatures.length > displayedPackageFeatures.length;

  const CompactDivider: React.FC<{ connector: "AND" | "OR" }> = ({ connector }) => {
    if (connector === "AND") {
      return (
        <div
          className="flex items-center justify-center my-0.5"
          data-testid="package-connector"
          data-connector="AND"
        >
          <div className="h-px bg-white/10 flex-grow"></div>
          <span className="font-bold px-2 text-[11px] uppercase tracking-wider text-green-400">
            AND
          </span>
          <div className="h-px bg-white/10 flex-grow"></div>
        </div>
      );
    }

    return (
      <div
        className="flex items-center justify-center my-0.5"
        data-testid="package-connector"
        data-connector="OR"
      >
        <div className="h-px bg-white/10 flex-grow"></div>
        <span className="font-bold px-2 text-[11px] uppercase tracking-wider text-yellow-400">
          OR
        </span>
        <div className="h-px bg-white/10 flex-grow"></div>
      </div>
    );
  };

  return (
    <div
      data-testid="package-card"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`
      lux-card am-package-card flex flex-col h-full min-h-0 relative overflow-hidden
      ${isSelected ? "lux-card-selected" : ""}
      ${shouldShowRecommended ? "lux-card-recommended" : ""}
      ${className}
    `}
    >
      <div
        className={`${
          isCompact ? "am-package-header-compact" : "am-package-header"
        } flex items-start justify-between`}
      >
        <div className={`am-package-title-block ${isCompact ? "space-y-0.5" : "space-y-1"}`}>
          <p className="am-text-label text-left text-shadow-sm font-semibold text-lux-textMuted">
            Plan
          </p>
          <h3
            className={`font-teko ${
              isCompact
                ? "text-xl leading-none"
                : isMagnified
                  ? "text-4xl sm:text-5xl"
                  : "text-3xl sm:text-4xl"
            } font-bold uppercase tracking-wider ${
              isCompact ? "text-lux-gold text-shadow-lg" : "text-lux-textStrong text-shadow"
            }`}
          >
            {packageInfo.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onMagnify && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMagnify();
              }}
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors active:scale-98 focus:outline-none focus:ring-2 focus:ring-lux-blue/70"
              aria-label={`Magnify ${packageInfo.name} package`}
              title="Magnify"
            >
              <MagnifyIcon className="w-4 h-4" />
            </button>
          )}
          {shouldShowRecommended && (
            <span className="lux-chip-gold shadow-glow-gold">Recommended</span>
          )}
        </div>
      </div>

      {/* Features section stretches with page scroll */}
      <div className="relative flex-1 min-h-0">
        <div
          className={`am-package-first-feature ${
            isCompact ? "am-package-body-compact" : "am-package-body"
          } ${isCompact ? "space-y-1" : "space-y-3"} flex-1 min-h-0 overflow-y-auto ios-scroll scrollbar-luxury pr-1`}
        >
          {displayedPackageFeatures.map((feature, index) => {
            const connector = feature.connector || "AND";
            const divider =
              index > 0 ? (
                isCompact ? (
                  <CompactDivider connector={connector} />
                ) : (
                  <Divider connector={connector} />
                )
              ) : null;

            return (
              <div key={feature.id}>
                {divider}
                <div className={`text-center ${isCompact ? "mt-0" : "mt-2"}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewFeature(feature);
                    }}
                    className={`${
                      isCompact ? "min-h-[36px]" : "min-h-[44px]"
                    } font-semibold ${featureNameClass} text-lux-textStrong hover:text-lux-blue transition-colors underline decoration-2 decoration-lux-border underline-offset-4 active:scale-98 focus:outline-none focus:ring-2 focus:ring-lux-blue/60 focus:ring-offset-2 focus:ring-offset-lux-bg1`}
                    aria-label={`Learn more about ${feature.name}`}
                    data-testid="package-feature"
                  >
                    <span
                      className={
                        isMagnified
                          ? "clamp-3 break-words"
                          : isCompact
                            ? "break-words"
                            : "clamp-2 break-words"
                      }
                    >
                      {feature.name}
                    </span>
                  </button>
                  <ul className={`text-lux-textMuted ${pointsClass} ${pointsListLayoutClass}`}>
                    {feature.points.map((p, idx) => (
                      <li
                        key={`${feature.id}-point-${idx}`}
                        className={
                          isMagnified
                            ? "clamp-3 break-words"
                            : isCompact
                              ? "break-inside-avoid break-words mb-0.5"
                              : "clamp-3 break-words"
                        }
                      >
                        *{p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
          {hasMoreFeatures && onMagnify ? (
            <div
              className={`mt-2 text-center ${isCompact ? "text-[11px]" : "text-xs"} text-lux-textMuted`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMagnify();
                }}
                className="underline underline-offset-4 hover:text-white transition-colors"
                aria-label="View all package details"
              >
                View all details
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`${isCompact ? "space-y-1.5" : "space-y-3"} mt-auto ${
          isCompact ? "am-package-footer-compact" : "am-package-footer"
        }`}
      >
        {pick2Summary ? (
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-200">
            <span className="text-gray-400 uppercase tracking-[0.2em]">Pick-2:</span>
            <span className="ml-2 font-semibold">{pick2Summary}</span>
          </div>
        ) : null}
        <div className="lux-price-plaque">
          <div>
            <p className="am-text-label text-lux-textMuted">Investment</p>
            {isDiscounted && (
              <p className="text-sm text-lux-textMuted line-through decoration-2 decoration-lux-textMuted/60">
                {formatPrice(basePrice)}
              </p>
            )}
            <p className="am-text-price font-teko text-lux-textStrong">
              {formatPrice(packageInfo.price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lux-textMuted">Includes listed coverage</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`am-select-plan-btn w-full ${isCompact ? "text-sm" : "text-base lg:text-lg"} font-semibold uppercase tracking-wider transition-all duration-300 transform active:scale-98 focus:outline-none focus:ring-2 focus:ring-lux-blue/70 focus:ring-offset-2 focus:ring-offset-lux-bg1 rounded-xl ${isCompact ? "min-h-[44px] py-2" : "min-h-[48px]"}
            ${
              isSelected
                ? "bg-lux-blue text-lux-textStrong shadow-luxury-lg"
                : "bg-lux-bg2 text-lux-text border border-lux-border/70 hover:border-lux-gold/60"
            }
          `}
        >
          {isSelected ? (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">&#10003;</span>
              <span>Selected</span>
            </span>
          ) : (
            "Select Plan"
          )}
        </button>
      </div>
    </div>
  );
};
