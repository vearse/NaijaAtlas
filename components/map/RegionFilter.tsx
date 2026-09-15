"use client";

import { useMapStore } from "@/lib/store/mapStore";
import type { RegionLocation } from "@/types/location";

interface RegionFilterProps {
  regions: RegionLocation[];
}

const REGION_SHORT: Record<string, string> = {
  "North Central": "NC",
  "North East": "NE",
  "North West": "NW",
  "South East": "SE",
  "South South": "SS",
  "South West": "SW",
};

export default function RegionFilter({ regions }: RegionFilterProps) {
  const { activeRegionId, setActiveRegion, selectStates } = useMapStore();

  const activeRegion = regions.find((r) => r.id === activeRegionId);

  const shortName = (name: string): string =>
    REGION_SHORT[name] ?? name;

  return (
    <div className="space-y-2">
      <div className="flex flex-nowrap lg:flex-wrap items-center gap-1.5 lg:gap-2 overflow-x-auto lg:overflow-visible">
        {regions.map((r) => (
          <button
            key={r.id}
            type="button"
            title={r.name}
            onClick={() => {
              if (activeRegionId === r.id) {
                selectStates(r.stateIds);
              } else {
                setActiveRegion(r.id);
              }
            }}
            className={`shrink-0 rounded-full px-2.5 lg:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeRegionId === r.id
                ? "text-white shadow-md ring-2 ring-offset-1 ring-white/50"
                : "bg-white/90 text-slate-600 hover:bg-white border border-slate-200/80 hover:border-slate-300"
            }`}
            style={
              activeRegionId === r.id ? { backgroundColor: r.color } : undefined
            }
          >
            <span className="lg:hidden">{shortName(r.name)}</span>
            <span className="hidden lg:inline">{r.name}</span>
          </button>
        ))}
      </div>
      {activeRegion && (
        <p className="text-xs text-slate-500">
          <span
            className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
            style={{ backgroundColor: activeRegion.color }}
          />
          <span className="font-medium text-slate-700">{activeRegion.name}</span>
          {" — "}
          state names &amp; colours on map. Click again to load all LGAs.
        </p>
      )}
    </div>
  );
}
