import React from "react";

interface BulkActionsBarProps {
  bulkSelectRef: React.RefObject<HTMLInputElement | null>;
  allFilteredSelected: boolean;
  selectedCount: number;
  selectedFeatureCount: number;
  isBulkWorking: boolean;
  onSelectAll: (checked: boolean) => void;
  onBulkPublish: (publish: boolean) => void;
  onBulkSetFeatured: (featured: boolean) => void;
  onBulkSetCategory: (column: 1 | 2 | 3 | null) => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  bulkSelectRef,
  allFilteredSelected,
  selectedCount,
  selectedFeatureCount,
  isBulkWorking,
  onSelectAll,
  onBulkPublish,
  onBulkSetFeatured,
  onBulkSetCategory,
}) => (
  <div className="flex flex-wrap items-center gap-2 text-sm bg-gray-900/60 border border-gray-800 rounded px-3 py-2">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        ref={bulkSelectRef}
        checked={allFilteredSelected}
        onChange={(e) => onSelectAll(e.target.checked)}
        aria-label="Select all filtered products"
      />
      <span className="text-gray-300">{selectedCount} selected</span>
    </label>
    <span className="text-gray-600">|</span>
    <button
      className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50"
      onClick={() => onBulkPublish(true)}
      disabled={isBulkWorking || selectedFeatureCount === 0}
      aria-label="Publish selected items"
    >
      Publish
    </button>
    <button
      className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
      onClick={() => onBulkPublish(false)}
      disabled={isBulkWorking || selectedFeatureCount === 0}
      aria-label="Unpublish selected items"
    >
      Unpublish
    </button>
    <button
      className="px-2 py-1 rounded bg-blue-700 text-white disabled:opacity-50"
      onClick={() => onBulkSetFeatured(true)}
      disabled={isBulkWorking || selectedFeatureCount === 0}
      aria-label="Mark selected items as featured"
    >
      Set Featured
    </button>
    <button
      className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
      onClick={() => onBulkSetFeatured(false)}
      disabled={isBulkWorking || selectedFeatureCount === 0}
      aria-label="Remove featured from selected items"
    >
      Remove Featured
    </button>
    <label className="flex items-center gap-2 text-gray-300">
      Category:
      <select
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
        aria-label="Set A La Carte category for selected items"
        onChange={(e) => {
          const val = e.target.value;
          if (!val) return;
          if (val === "none") {
            onBulkSetCategory(null);
          } else {
            onBulkSetCategory(Number(val) as 1 | 2 | 3);
          }
        }}
        defaultValue=""
        disabled={isBulkWorking || selectedFeatureCount === 0}
      >
        <option value="" disabled>
          Set category...
        </option>
        <option value="1">Gold</option>
        <option value="2">Elite</option>
        <option value="3">Platinum</option>
        <option value="none">Not placed</option>
      </select>
    </label>
    <span className="text-xs text-gray-500">
      Duplicate to lane creates a separate record. Use only when placements must diverge.
    </span>
  </div>
);
