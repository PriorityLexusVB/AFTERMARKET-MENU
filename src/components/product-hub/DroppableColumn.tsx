import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableColumnProps {
  columnId: "unassigned" | "packages" | "alacarte";
  children: React.ReactNode;
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({ columnId, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `lane-${columnId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] transition-colors rounded-lg ${
        isOver ? "bg-blue-500/10 ring-2 ring-blue-500/50" : ""
      }`}
    >
      {children}
    </div>
  );
};
