"use client";

import { useMapStore, MAX_COMPARE_STATES } from "@/lib/store/mapStore";
import type { StateLocation } from "@/types/location";

interface SelectedStatesBarProps {
  states: StateLocation[];
}

const CHIP_STYLES = [
  "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  "bg-sky-50 text-sky-800 border-sky-200/80",
  "bg-violet-50 text-violet-800 border-violet-200/80",
];

const DRAG_ARMED_CHIP =
  "bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/40";

const DRAG_LIFTED_CHIP =
  "bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-500/50";

export default function SelectedStatesBar({ states }: SelectedStatesBarProps) {
  const {
    selectedStateIds,
    draggedStateId,
    dragModeStateId,
    toggleState,
    toggleDragMode,
    openMobileSheet,
  } = useMapStore();

  const selected = states.filter((s) => selectedStateIds.has(s.id));
  const dragModeState = dragModeStateId
    ? states.find((s) => s.id === dragModeStateId)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mr-1">
        {selected.length === 0
          ? `Select up to ${MAX_COMPARE_STATES} states to compare`
          : "Selected"}
      </span>
      {selected.map((s, i) => {
        const isLifted = draggedStateId === s.id;
        const isDragMode = dragModeStateId === s.id;
        const chipStyle = isLifted
          ? DRAG_LIFTED_CHIP
          : isDragMode
            ? DRAG_ARMED_CHIP
            : CHIP_STYLES[i] ?? CHIP_STYLES[0];

        return (
          <span
            key={s.id}
            className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-1.5 py-1 text-xs font-medium shadow-sm border ${chipStyle}`}
          >
            <button
              type="button"
              className="hover:underline"
              onClick={() => openMobileSheet()}
            >
              {s.name}
            </button>
            <button
              type="button"
              aria-label={
                isDragMode
                  ? `Stop drag mode for ${s.name}`
                  : `Enable drag mode for ${s.name}`
              }
              aria-pressed={isDragMode}
              title={isDragMode ? "Drag mode on — drag on map" : "Enable drag"}
              onClick={() => toggleDragMode(s.id)}
              className={`rounded-full w-6 h-6 flex items-center justify-center text-[11px] leading-none transition-colors ${
                isDragMode
                  ? "bg-amber-500 text-white shadow-sm"
                  : "hover:bg-black/10 text-current"
              }`}
            >
              ↔
            </button>
            <button
              type="button"
              aria-label={`Remove ${s.name}`}
              onClick={() => toggleState(s.id)}
              className="rounded-full hover:bg-black/10 w-5 h-5 flex items-center justify-center leading-none -ml-0.5"
            >
              ×
            </button>
          </span>
        );
      })}
      {selected.length >= 1 && selected.length < MAX_COMPARE_STATES && (
        <span className="text-[10px] text-slate-400">
          · add up to {MAX_COMPARE_STATES - selected.length} more to compare
        </span>
      )}
      {dragModeState && (
        <span className="text-[10px] font-medium text-amber-700">
          · drag {dragModeState.name} on the map
        </span>
      )}
    </div>
  );
}
