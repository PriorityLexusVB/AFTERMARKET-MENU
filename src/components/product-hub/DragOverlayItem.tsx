import React from "react";
import type { ProductFeature } from "../../types";

interface DragOverlayItemProps {
  feature: ProductFeature;
}

export const DragOverlayItem: React.FC<DragOverlayItemProps> = ({ feature }) => (
  <div className="bg-gray-800 p-4 rounded-md border border-blue-500 shadow-lg">
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4 text-gray-500"
      >
        <path
          fillRule="evenodd"
          d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-semibold text-gray-200 text-sm">{feature.name}</span>
    </div>
  </div>
);
