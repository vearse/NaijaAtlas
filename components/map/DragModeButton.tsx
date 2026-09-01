"use client";

import { useMapStore } from "@/lib/store/mapStore";

interface DragModeButtonProps {
  stateId: string;
  stateName: string;
  /** Taller button to match the full-width LGA toggle */
  size?: "sm" | "md";
}

export default function DragModeButton({
  stateId,
  stateName,
  size = "sm",
}: DragModeButtonProps) {
  const { selectedStateIds, dragModeStateId, toggleDragMode } = useMapStore();
  const isSelected = selectedStateIds.has(stateId);
  const dragMode = dragModeStateId === stateId;
  const dim = size === "md" ? "h-11 w-11 rounded-xl" : "h-8 w-8 rounded-lg";

  return (
    <button
      type="button"
      onClick={() => toggleDragMode(stateId)}
      disabled={!isSelected}
      className={`shrink-0 flex items-center justify-center transition-colors ${dim} ${
        !isSelected
          ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
          : dragMode
            ? "bg-amber-500 text-white shadow-sm border border-amber-500"
            : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800 border border-slate-200"
      }`}
      aria-pressed={dragMode}
      aria-label={
        dragMode
          ? `Disable drag mode for ${stateName}`
          : `Enable drag mode for ${stateName}`
      }
      title={
        !isSelected
          ? "Select state first"
          : dragMode
            ? "Drag mode on — drag on map"
            : "Enable drag on map"
      }
    >
      <span className="text-sm font-bold leading-none" aria-hidden>
        ↔
      </span>
    </button>
  );
}
