import React from "react";

export interface DuplicateGroup {
  key: string;
  name: string;
  count: number;
  mismatches: string[];
}

interface DuplicatesPanelProps {
  possibleDuplicates: DuplicateGroup[];
}

export const DuplicatesPanel: React.FC<DuplicatesPanelProps> = ({ possibleDuplicates }) => (
  <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <p className="text-sm text-gray-300 font-semibold">Duplicates</p>
        <p className="text-xs text-gray-500">
          Grouped by normalized name. Drift flags highlight price, cost, warranty, and
          description length mismatches.
        </p>
      </div>
      <span className="text-xs text-gray-400">{possibleDuplicates.length} group(s)</span>
    </div>
    {possibleDuplicates.length === 0 ? (
      <p className="text-xs text-gray-500 mt-2">No possible duplicates detected.</p>
    ) : (
      <div className="mt-3 space-y-2">
        {possibleDuplicates.map((group) => (
          <div
            key={group.key}
            className="rounded-md border border-white/10 bg-black/30 px-3 py-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-200 font-semibold">{group.name}</p>
              <span className="text-xs text-gray-400">{group.count} items</span>
            </div>
            {group.mismatches.length > 0 ? (
              <p className="text-xs text-red-300 mt-1">
                Drift: {group.mismatches.join(", ")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">No drift detected.</p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
