"use client";

import { useMapStore } from "@/lib/store/mapStore";
import type { RegionLocation } from "@/types/location";

interface RegionFilterProps {
  regions: RegionLocation[];
}

export default function RegionFilter({ regions }: RegionFilterProps) {
  const { activeRegionId, setActiveRegion, selectStates } = useMapStore();

  const activeRegion = regions.find((r) => r.id === activeRegionId);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {regions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              if (activeRegionId === r.id) {
                selectStates(r.stateIds);
              } else {
                setActiveRegion(r.id);
              }
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeRegionId === r.id
                ? "text-white shadow-md ring-2 ring-offset-1 ring-white/50"
                : "bg-white/90 text-slate-600 hover:bg-white border border-slate-200/80 hover:border-slate-300"
            }`}
            style={
              activeRegionId === r.id ? { backgroundColor: r.color } : undefined
            }
          >
            {r.name}
          </button>
        ))}
      </div>
      {activeRegion ? (
        <p className="text-xs text-slate-500">
          <span
            className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
            style={{ backgroundColor: activeRegion.color }}
          />
          <span className="font-medium text-slate-700">{activeRegion.name}</span>
          {" — "}
          state names &amp; colours on map. Click again to load all LGAs.
        </p>
      ) : (
        <p className="text-xs text-slate-400">
          Click a region to highlight its states on the map
        </p>
      )}
    </div>
  );
}
