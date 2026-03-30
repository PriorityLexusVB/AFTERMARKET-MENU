import React, { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AlaCarteOption, ProductFeature } from "../../types";

const columnLabels: Record<1 | 2 | 3, string> = {
  1: "Gold Package (Column 1)",
  2: "Elite Package (Column 2)",
  3: "Platinum Package (Column 3)",
};

export interface SortableProductCardProps {
  feature: ProductFeature;
  option?: AlaCarteOption;
  onEdit: (feature: ProductFeature) => void;
  onDuplicate: (feature: ProductFeature, column: 1 | 2 | 3) => void;
  isSelected: boolean;
  onToggleSelection: (featureId: string) => void;
  // State from parent
  isExpanded: boolean;
  onToggleExpanded: (featureId: string) => void;
  rowError?: string;
  isSaved: boolean;
  priceInputValue?: string;
  // Callbacks from parent
  onPackagePlacement: (feature: ProductFeature, column: 1 | 2 | 3 | undefined) => void;
  onPublishToggle: (feature: ProductFeature, publish: boolean) => void;
  onPriceInputChange: (featureId: string, value: string) => void;
  onPriceBlur: (feature: ProductFeature) => void;
  // Pick2 callbacks
  onPick2EligibleChange: (feature: ProductFeature, option: AlaCarteOption | undefined, eligible: boolean) => Promise<void>;
  onPick2SortBlur: (feature: ProductFeature, option: AlaCarteOption | undefined, raw: string) => Promise<void>;
  onPick2ShortValueBlur: (feature: ProductFeature, option: AlaCarteOption | undefined, raw: string) => Promise<void>;
  onPick2HighlightsBlur: (feature: ProductFeature, option: AlaCarteOption | undefined, line1: string, line2: string) => Promise<void>;
}

function getCategoryLabel(option?: AlaCarteOption): string {
  if (!option) return "Not placed";
  if (option.column === 4) return "Featured";
  if (option.column) return columnLabels[option.column as 1 | 2 | 3] ?? "Placed";
  return "Not placed";
}

export const SortableProductCard: React.FC<SortableProductCardProps> = ({
  feature,
  option,
  onEdit,
  onDuplicate,
  isSelected,
  onToggleSelection,
  isExpanded,
  onToggleExpanded,
  rowError,
  isSaved,
  priceInputValue,
  onPackagePlacement,
  onPublishToggle,
  onPriceInputChange,
  onPriceBlur,
  onPick2EligibleChange,
  onPick2SortBlur,
  onPick2ShortValueBlur,
  onPick2HighlightsBlur,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPublished = option?.isPublished ?? feature.publishToAlaCarte ?? false;
  const isFeatured = option?.column === 4;
  const laneLabel = feature.column
    ? (columnLabels[feature.column as 1 | 2 | 3] ?? "Not in packages")
    : "Not in packages";
  const categoryLabel = getCategoryLabel(option);
  const positionLabel =
    feature.position !== undefined ? `Position ${feature.position + 1}` : "Position -";

  const [showDuplicateMenu, setShowDuplicateMenu] = useState(false);
  const duplicateMenuRef = useRef<HTMLDivElement>(null);

  const [pick2EligibleDraft, setPick2EligibleDraft] = useState<boolean>(
    Boolean(option?.pick2Eligible)
  );
  const [pick2SortDraft, setPick2SortDraft] = useState<string>(
    option?.pick2Sort !== undefined ? String(option.pick2Sort) : ""
  );
  const [pick2ShortValueDraft, setPick2ShortValueDraft] = useState<string>(
    option?.shortValue ?? ""
  );
  const [pick2Highlight1Draft, setPick2Highlight1Draft] = useState<string>(
    option?.highlights?.[0] ?? ""
  );
  const [pick2Highlight2Draft, setPick2Highlight2Draft] = useState<string>(
    option?.highlights?.[1] ?? ""
  );

  const pick2Highlight1 = option?.highlights?.[0];
  const pick2Highlight2 = option?.highlights?.[1];

  useEffect(() => {
    setPick2EligibleDraft(Boolean(option?.pick2Eligible));
    setPick2SortDraft(option?.pick2Sort !== undefined ? String(option.pick2Sort) : "");
    setPick2ShortValueDraft(option?.shortValue ?? "");
    setPick2Highlight1Draft(pick2Highlight1 ?? "");
    setPick2Highlight2Draft(pick2Highlight2 ?? "");
  }, [
    option?.pick2Eligible,
    option?.pick2Sort,
    option?.shortValue,
    pick2Highlight1,
    pick2Highlight2,
  ]);

  const canEditPick2Fields = Boolean(option) || pick2EligibleDraft;

  // Click-outside handler to close duplicate menu
  useEffect(() => {
    if (!showDuplicateMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        duplicateMenuRef.current &&
        event.target &&
        !duplicateMenuRef.current.contains(event.target as Node)
      ) {
        setShowDuplicateMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDuplicateMenu]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800 p-4 rounded-md border ${
        isDragging ? "border-blue-500" : "border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-3 flex-1">
          {/* Selection checkbox for bulk operations */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(feature.id)}
            className="mt-1 flex-shrink-0"
            aria-label={`Select ${feature.name}`}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Position badge - Display 1-based index (position + 1) for user clarity */}
          {feature.position !== undefined && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-900 bg-blue-400 rounded-full flex-shrink-0">
              {feature.position + 1}
            </span>
          )}
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
            title="Drag to reorder or move between columns"
            aria-label={`Drag ${feature.name} to reorder or move between columns`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-base text-white">{feature.name}</div>
              {rowError && (
                <p className="text-xs text-red-400">{rowError}</p>
              )}
              {isSaved && <p className="text-xs text-green-400">Saved</p>}
            </div>
            <div className="text-xs text-gray-400 clamp-2">{feature.description}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 border border-gray-600">
                {laneLabel}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border ${
                  isPublished
                    ? "bg-green-500/10 text-green-300 border-green-500/40"
                    : "bg-gray-700 text-gray-300 border-gray-600"
                }`}
              >
                {isPublished ? "Published" : "Unpublished"}
              </span>
              {isFeatured && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/40">
                  Featured
                </span>
              )}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 border border-gray-600">
                {categoryLabel}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 border border-gray-600">
                {positionLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleExpanded(feature.id)}
            className="px-3 py-1.5 rounded bg-gray-700 text-gray-100 border border-gray-600 hover:border-blue-400 transition-colors text-xs whitespace-nowrap"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
          <button
            onClick={() => onEdit(feature)}
            className="px-3 py-1.5 rounded bg-blue-600/80 text-white hover:bg-blue-500 text-xs transition-colors whitespace-nowrap"
          >
            Edit details
          </button>
          <div className="relative" ref={duplicateMenuRef}>
            <button
              onClick={() => setShowDuplicateMenu(!showDuplicateMenu)}
              className="px-3 py-1.5 rounded bg-gray-700 text-gray-100 border border-gray-600 hover:border-green-400 transition-colors text-xs whitespace-nowrap w-full"
            >
              Duplicate
            </button>
            {showDuplicateMenu && (
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 p-2 space-y-1">
                <button
                  onClick={() => {
                    onDuplicate(feature, 1);
                    setShowDuplicateMenu(false);
                  }}
                  disabled={feature.column === 1}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gold
                </button>
                <button
                  onClick={() => {
                    onDuplicate(feature, 2);
                    setShowDuplicateMenu(false);
                  }}
                  disabled={feature.column === 2}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Elite
                </button>
                <button
                  onClick={() => {
                    onDuplicate(feature, 3);
                    setShowDuplicateMenu(false);
                  }}
                  disabled={feature.column === 3}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Platinum
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`package-lane-${feature.id}`}
                className="text-xs text-gray-400 block mb-1"
              >
                Package Lane
              </label>
              <select
                id={`package-lane-${feature.id}`}
                value={feature.column ?? ""}
                onChange={(e) =>
                  onPackagePlacement(
                    feature,
                    e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : undefined
                  )
                }
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
              >
                <option value="">Not in Packages</option>
                <option value="1">Gold Package (Column 1)</option>
                <option value="2">Elite Package (Column 2)</option>
                <option value="3">Platinum Package (Column 3)</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => onPublishToggle(feature, e.target.checked)}
                />
                <span>Publish to A La Carte</span>
              </label>
              {isPublished && (
                <div className="mt-2">
                  <label
                    htmlFor={`alacarte-price-${feature.id}`}
                    className="text-xs text-gray-400 block mb-1"
                  >
                    A La Carte Price
                  </label>
                  <input
                    id={`alacarte-price-${feature.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceInputValue ?? (feature.alaCartePrice ?? "").toString()}
                    onChange={(e) => onPriceInputChange(feature.id, e.target.value)}
                    onBlur={() => onPriceBlur(feature)}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-200 font-semibold">You Pick 2 (Pick2) Fields</p>
                {canEditPick2Fields ? (
                  <p className="text-xs text-gray-500">
                    These fields are stored on{" "}
                    <span className="text-gray-400">ala_carte_options</span>.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Enable Pick2 to create a hidden A La Carte record.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={pick2EligibleDraft}
                    disabled={false}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setPick2EligibleDraft(next);
                      onPick2EligibleChange(feature, option, next);
                    }}
                  />
                  <span>Pick2 Eligible</span>
                </label>
              </div>

              <div>
                <label
                  htmlFor={`pick2-sort-${feature.id}`}
                  className="text-xs text-gray-400 block mb-1"
                >
                  Pick2 Sort
                </label>
                <input
                  id={`pick2-sort-${feature.id}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={pick2SortDraft}
                  disabled={!canEditPick2Fields}
                  onChange={(e) => setPick2SortDraft(e.target.value)}
                  onBlur={() => onPick2SortBlur(feature, option, pick2SortDraft)}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full disabled:opacity-50"
                  placeholder="(optional)"
                />
              </div>

              <div>
                <label
                  htmlFor={`pick2-shortvalue-${feature.id}`}
                  className="text-xs text-gray-400 block mb-1"
                >
                  Short Value (single line)
                </label>
                <input
                  id={`pick2-shortvalue-${feature.id}`}
                  type="text"
                  value={pick2ShortValueDraft}
                  disabled={!canEditPick2Fields}
                  onChange={(e) => setPick2ShortValueDraft(e.target.value)}
                  onBlur={() => onPick2ShortValueBlur(feature, option, pick2ShortValueDraft)}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full disabled:opacity-50"
                  placeholder="e.g. $599"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 block mb-1">Highlights (up to 2 lines)</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={pick2Highlight1Draft}
                    disabled={!canEditPick2Fields}
                    onChange={(e) => setPick2Highlight1Draft(e.target.value)}
                    onBlur={() => onPick2HighlightsBlur(feature, option, pick2Highlight1Draft, pick2Highlight2Draft)}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full disabled:opacity-50"
                    placeholder="Highlight line 1"
                  />
                  <input
                    type="text"
                    value={pick2Highlight2Draft}
                    disabled={!canEditPick2Fields}
                    onChange={(e) => setPick2Highlight2Draft(e.target.value)}
                    onBlur={() => onPick2HighlightsBlur(feature, option, pick2Highlight1Draft, pick2Highlight2Draft)}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full disabled:opacity-50"
                    placeholder="Highlight line 2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
