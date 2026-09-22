"use client";

import {
  useMapStore,
  MAX_COMPARE_STATES,
  MAX_ELECTION_STATES,
} from "@/lib/store/mapStore";
import type { StateLocation } from "@/types/location";
import { MapLayersIcon } from "@/components/map/ShowLgasButton";

interface SelectedStatesBarProps {
  states: StateLocation[];
}

const CHIP_STYLES = [
  "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  "bg-sky-50 text-sky-800 border-sky-200/80",
  "bg-violet-50 text-violet-800 border-violet-200/80",
  "bg-amber-50 text-amber-900 border-amber-200/80",
  "bg-rose-50 text-rose-900 border-rose-200/80",
];

const LGA_VISIBLE_CHIP =
  "bg-emerald-100 text-emerald-900 border-emerald-400 ring-1 ring-emerald-500/40";

export default function SelectedStatesBar({ states }: SelectedStatesBarProps) {
  const {
    selectedStateIds,
    lgaVisibleStateIds,
    toggleState,
    showLgas,
    hideLgas,
    openMobileSheet,
    selectStates,
    mapType,
  } = useMapStore();

  const maxStates =
    mapType === "election" ? MAX_ELECTION_STATES : MAX_COMPARE_STATES;
  const isElection = mapType === "election";

  const selected = states.filter((s) => selectedStateIds.has(s.id));

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mr-1">
        {selected.length === 0
          ? isElection
            ? `Select up to ${maxStates} states on the map`
            : `Select up to ${maxStates} states to compare`
          : "Selected"}
      </span>
      {selected.map((s, i) => {
        const lgaVisible = lgaVisibleStateIds.has(s.id);
        const chipStyle = lgaVisible
          ? LGA_VISIBLE_CHIP
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
            {!isElection && (
              <button
                type="button"
                aria-label={
                  lgaVisible
                    ? `Hide ${s.name} LGAs on map`
                    : `Show ${s.name} LGAs on map`
                }
                aria-pressed={lgaVisible}
                title={lgaVisible ? "LGAs visible on map" : "Show LGAs on map"}
                onClick={() =>
                  lgaVisible ? hideLgas(s.id) : showLgas(s.id)
                }
                className={`rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                  lgaVisible
                    ? "bg-ng-green text-white shadow-sm"
                    : "hover:bg-black/10 text-current"
                }`}
              >
                <MapLayersIcon active={lgaVisible} />
              </button>
            )}
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
      {selected.length >= 1 && selected.length < maxStates && (
        <span className="text-[10px] text-slate-400">
          · add up to {maxStates - selected.length} more
        </span>
      )}
      {selected.length > 1 && (
        <button
          type="button"
          onClick={() => selectStates([])}
          className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-ng-green transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
