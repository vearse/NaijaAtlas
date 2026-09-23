"use client";

import {
  useMapStore,
  MAX_COMPARE_STATES,
  MAX_ELECTION_STATES,
  type DirectionsTarget,
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

const DIRECTION_CHIP =
  "bg-blue-50 text-blue-900 border-blue-300/80 ring-1 ring-blue-400/40";

function FocusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M3.5 4A1.5 1.5 0 015 2.5h3a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm.75 11a.75.75 0 01.75-.75h3a.75.75 0 010 1.5H5A.75.75 0 014.25 15zM13.5 2.5A1.5 1.5 0 0115 4v3a1 1 0 102 0V4a3 3 0 00-3-3h-3a1 1 0 000 2h2.5zM15 12.25a.75.75 0 01.75.75v3a.75.75 0 01-.75.75H12a.75.75 0 010-1.5h2.25V13a.75.75 0 01.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
    directions,
    openDirectionsPanel,
    restoreMapTypeAfterDirections,
  } = useMapStore();

  const maxStates =
    mapType === "election" ? MAX_ELECTION_STATES : MAX_COMPARE_STATES;
  const isElection = mapType === "election";

  const selected = states.filter((s) => selectedStateIds.has(s.id));

  const directionTarget: DirectionsTarget | null =
    directions.active && directions.to ? directions.to : null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mr-1">
        {selected.length === 0 && !directionTarget
          ? isElection
            ? `Select up to ${maxStates} states on the map`
            : `Select up to ${maxStates} states to compare`
          : selected.length > 0
            ? "Selected"
            : "Directions"}
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
      {directionTarget && (
        <span
          className={`inline-flex items-center gap-1 rounded-full pl-2 pr-1.5 py-1 text-xs font-medium shadow-sm border ${DIRECTION_CHIP}`}
        >
          <span aria-hidden className="text-sm leading-none">
            🧭
          </span>
          <button
            type="button"
            className="max-w-[180px] truncate hover:underline"
            onClick={() => openDirectionsPanel(directionTarget)}
            title={`Focus directions to ${directionTarget.name} in the panel`}
          >
            To {directionTarget.name}
          </button>
          <button
            type="button"
            aria-label={`Focus directions to ${directionTarget.name} in the panel`}
            title="Focus in panel"
            onClick={() => openDirectionsPanel(directionTarget)}
            className="rounded-full w-6 h-6 flex items-center justify-center transition-colors hover:bg-black/10 text-current"
          >
            <FocusIcon />
          </button>
          <button
            type="button"
            aria-label={`Cancel directions to ${directionTarget.name}`}
            title="Cancel directions"
            onClick={() => restoreMapTypeAfterDirections()}
            className="rounded-full hover:bg-black/10 w-5 h-5 flex items-center justify-center leading-none -ml-0.5"
          >
            ×
          </button>
        </span>
      )}
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
