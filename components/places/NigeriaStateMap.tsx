"use client";

import { useState } from "react";
import {
  NIGERIA_STATE_PATHS,
  NIGERIA_VIEW_BOX,
} from "@/data/geo/hubThumbs";

export type NigeriaStateMapEntry = {
  id: string;
  name: string;
  slug: string;
  regionName: string;
  capital: string | null;
  population: number | null;
};

/**
 * Interactive Nigeria outline for the Places hero. Every state is a focusable
 * path: hovering names it, clicking opens its profile. Path data comes from the
 * precomputed thumbnails, so no MapLibre or GeoJSON ships with the hub.
 */
export default function NigeriaStateMap({
  states,
  selectedId = null,
  onSelect,
  className = "",
  mapClassName = "h-80 w-full md:h-[28rem]",
}: {
  states: NigeriaStateMapEntry[];
  /** When set, that state stays highlighted on the map. */
  selectedId?: string | null;
  onSelect?: (stateId: string) => void;
  className?: string;
  mapClassName?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const byId = new Map(states.map((s) => [s.id, s]));
  const focusId = selectedId ?? hover;
  const active = focusId ? byId.get(focusId) : null;

  const pick = (id: string) => {
    if (onSelect) onSelect(id);
  };

  return (
    <div className={className}>
      <svg
        viewBox={NIGERIA_VIEW_BOX}
        className={`mx-auto ${mapClassName}`}
        role="group"
        aria-label="Nigeria by state — select a state to see its snapshot"
        preserveAspectRatio="xMidYMid meet"
      >
        <g stroke="#ffffff" strokeWidth={0.25}>
          {NIGERIA_STATE_PATHS.map((p) => {
            const state = byId.get(p.key);
            const isSelected = selectedId === p.key;
            const isHover = hover === p.key;
            const isActive = isSelected || isHover;
            const isDim =
              (selectedId && selectedId !== p.key) ||
              (hover !== null && !isHover && !isSelected);
            return (
              <path
                key={p.key}
                d={p.d}
                tabIndex={0}
                role="button"
                aria-label={state ? `Select ${state.name}` : p.key}
                aria-pressed={isSelected}
                fill={isActive ? "#043828" : "#008751"}
                fillOpacity={isDim ? 0.35 : isActive ? 0.95 : 0.82}
                className="cursor-pointer transition-[fill-opacity] duration-150 outline-none focus-visible:fill-[#043828]"
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.key)}
                onBlur={() => setHover(null)}
                onClick={() => state && pick(p.key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (state) pick(p.key);
                  }
                }}
              >
                <title>{state?.name ?? p.key}</title>
              </path>
            );
          })}
        </g>
      </svg>
      {active && (
        <p className="sr-only">
          {active.name}, {active.regionName}
          {active.capital ? `, capital ${active.capital}` : ""}
        </p>
      )}
    </div>
  );
}