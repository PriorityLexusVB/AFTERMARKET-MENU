import React from "react";

interface FilterBarProps {
  packageLaneFilter: "all" | "1" | "2" | "3" | "none";
  publishFilter: "all" | "published" | "unpublished";
  featuredFilter: "all" | "featured" | "not-featured";
  categoryFilter: "all" | "1" | "2" | "3" | "unplaced" | "featured";
  onPackageLaneFilterChange: (value: "all" | "1" | "2" | "3" | "none") => void;
  onPublishFilterChange: (value: "all" | "published" | "unpublished") => void;
  onFeaturedFilterChange: (value: "all" | "featured" | "not-featured") => void;
  onCategoryFilterChange: (value: "all" | "1" | "2" | "3" | "unplaced" | "featured") => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  packageLaneFilter,
  publishFilter,
  featuredFilter,
  categoryFilter,
  onPackageLaneFilterChange,
  onPublishFilterChange,
  onFeaturedFilterChange,
  onCategoryFilterChange,
}) => (
  <div className="flex flex-wrap gap-3 text-sm text-gray-300">
    <label className="flex items-center gap-2">
      <span className="text-gray-400">Package lane</span>
      <select
        value={packageLaneFilter}
        onChange={(e) => onPackageLaneFilterChange(e.target.value as typeof packageLaneFilter)}
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
      >
        <option value="all">All</option>
        <option value="1">Gold</option>
        <option value="2">Elite</option>
        <option value="3">Platinum</option>
        <option value="none">Not in packages</option>
      </select>
    </label>
    <label className="flex items-center gap-2">
      <span className="text-gray-400">Published</span>
      <select
        value={publishFilter}
        onChange={(e) => onPublishFilterChange(e.target.value as typeof publishFilter)}
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
      >
        <option value="all">All</option>
        <option value="published">Published</option>
        <option value="unpublished">Unpublished</option>
      </select>
    </label>
    <label className="flex items-center gap-2">
      <span className="text-gray-400">Featured</span>
      <select
        value={featuredFilter}
        onChange={(e) => onFeaturedFilterChange(e.target.value as typeof featuredFilter)}
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
      >
        <option value="all">All</option>
        <option value="featured">Featured</option>
        <option value="not-featured">Not featured</option>
      </select>
    </label>
    <label className="flex items-center gap-2">
      <span className="text-gray-400">A La Carte Category</span>
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value as typeof categoryFilter)}
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
      >
        <option value="all">All</option>
        <option value="featured">Featured</option>
        <option value="1">Column 1 (Gold)</option>
        <option value="2">Column 2 (Elite)</option>
        <option value="3">Column 3 (Platinum)</option>
        <option value="unplaced">Not placed</option>
      </select>
    </label>
  </div>
);
