"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  className = "",
}: {
  states: NigeriaStateMapEntry[];
  className?: string;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const byId = new Map(states.map((s) => [s.id, s]));
  const active = hover ? byId.get(hover) : null;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={NIGERIA_VIEW_BOX}
        className="w-full h-auto"
        role="group"
        aria-label="Nigeria by state — select a state to open its Places profile"
        preserveAspectRatio="xMidYMid meet"
      >
        <g stroke="#ffffff" strokeWidth={0.25}>
          {NIGERIA_STATE_PATHS.map((p) => {
            const state = byId.get(p.key);
            const isHover = hover === p.key;
            const isDim = hover !== null && !isHover;
            return (
              <path
                key={p.key}
                d={p.d}
                tabIndex={0}
                role="link"
                aria-label={state ? `Open ${state.name} profile` : p.key}
                fill={isHover ? "#043828" : "#008751"}
                fillOpacity={isDim ? 0.35 : isHover ? 0.95 : 0.82}
                className="cursor-pointer transition-[fill-opacity] duration-150 outline-none focus-visible:fill-[#043828]"
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.key)}
                onBlur={() => setHover(null)}
                onClick={() => state && router.push(`/places/${state.slug}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (state) router.push(`/places/${state.slug}`);
                  }
                }}
              >
                <title>{state?.name ?? p.key}</title>
              </path>
            );
          })}
        </g>
      </svg>

      <div className="absolute left-0 right-0 bottom-0 flex items-center justify-between gap-3 rounded-xl bg-surface-card/95 border border-border-subtle px-3 py-2 shadow-sm">
        <span className="min-w-0">
          <span className="block text-label-caps text-text-muted font-bold uppercase">
            {active ? active.regionName : "Tap a state"}
          </span>
          <span className="block font-landing-display text-headline-sm text-text-primary truncate">
            {active ? active.name : "37 states, one outline"}
          </span>
        </span>
        <span className="text-[11px] text-text-muted shrink-0 text-right tabular-nums">
          {active?.capital ? `Capital ${active.capital}` : "Open any state"}
        </span>
      </div>
    </div>
  );
}