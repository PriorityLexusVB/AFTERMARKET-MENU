import React from "react";
import type { PackageTier } from "../../types";

interface RecommendedPackagePanelProps {
  packages: PackageTier[];
  recommendedSelection: string;
  isSavingRecommended?: boolean;
  recommendedMessage?: string | null;
  recommendedError?: string | null;
  onRecommendedChange: (packageId: string | "none") => void;
  elitePackageId?: string;
  platinumPackageId?: string;
  goldPackageId?: string;
}

export const RecommendedPackagePanel: React.FC<RecommendedPackagePanelProps> = ({
  recommendedSelection,
  isSavingRecommended,
  recommendedMessage,
  recommendedError,
  onRecommendedChange,
  elitePackageId,
  platinumPackageId,
  goldPackageId,
}) => (
  <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <p className="text-sm text-gray-300 font-semibold">Recommended package</p>
        <p className="text-xs text-gray-500">
          Choose which package shows the recommended badge to customers.
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {isSavingRecommended ? (
          <span className="text-blue-400 flex items-center gap-1">Saving...</span>
        ) : null}
        {recommendedMessage && !isSavingRecommended ? (
          <span className="text-green-400 flex items-center gap-1">Saved</span>
        ) : null}
      </div>
    </div>
    <div
      className="flex flex-wrap gap-4 mt-3"
      role="radiogroup"
      aria-label="Recommended package"
    >
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="radio"
          name="recommended-package-product-hub"
          checked={recommendedSelection === elitePackageId}
          disabled={!elitePackageId || Boolean(isSavingRecommended)}
          onChange={() => elitePackageId && onRecommendedChange(elitePackageId)}
          className="form-radio h-4 w-4 text-blue-500"
        />
        Elite
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="radio"
          name="recommended-package-product-hub"
          checked={recommendedSelection === platinumPackageId}
          disabled={!platinumPackageId || Boolean(isSavingRecommended)}
          onChange={() => platinumPackageId && onRecommendedChange(platinumPackageId)}
          className="form-radio h-4 w-4 text-blue-500"
        />
        Platinum
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="radio"
          name="recommended-package-product-hub"
          checked={recommendedSelection === goldPackageId}
          disabled={!goldPackageId || Boolean(isSavingRecommended)}
          onChange={() => goldPackageId && onRecommendedChange(goldPackageId)}
          className="form-radio h-4 w-4 text-blue-500"
        />
        Gold
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="radio"
          name="recommended-package-product-hub"
          checked={recommendedSelection === "none"}
          disabled={Boolean(isSavingRecommended)}
          onChange={() => onRecommendedChange("none")}
          className="form-radio h-4 w-4 text-blue-500"
        />
        None
      </label>
    </div>
    {recommendedError ? (
      <p className="text-red-400 text-sm mt-2">{recommendedError}</p>
    ) : null}
  </div>
);
