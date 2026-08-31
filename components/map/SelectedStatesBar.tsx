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

export default function SelectedStatesBar({ states }: SelectedStatesBarProps) {
  const { selectedStateIds, toggleState, openMobileSheet } = useMapStore();

  const selected = states.filter((s) => selectedStateIds.has(s.id));

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mr-1">
        {selected.length === 0
          ? `Select up to ${MAX_COMPARE_STATES} states to compare`
          : "Selected"}
      </span>
      {selected.map((s, i) => (
        <span
          key={s.id}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-sm border ${
            CHIP_STYLES[i] ?? CHIP_STYLES[0]
          }`}
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
            aria-label={`Remove ${s.name}`}
            onClick={() => toggleState(s.id)}
            className="rounded-full hover:bg-black/10 w-4 h-4 flex items-center justify-center leading-none"
          >
            ×
          </button>
        </span>
      ))}
      {selected.length >= 1 && selected.length < MAX_COMPARE_STATES && (
        <span className="text-[10px] text-slate-400">
          · add up to {MAX_COMPARE_STATES - selected.length} more to compare
        </span>
      )}
    </div>
  );
}
