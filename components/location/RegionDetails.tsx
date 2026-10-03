"use client";

import ShowLgasButton from "@/components/map/ShowLgasButton";
import { useMapStore } from "@/lib/store/mapStore";
import type { RegionLocation, StateLocation, StateContent } from "@/types/location";
import {
  explorerKickerClass,
  explorerTitleClass,
  explorerListCardClass,
} from "@/components/location/explorerPanelStyles";

interface RegionDetailsProps {
  region: RegionLocation;
  states: StateLocation[];
  stateContent: StateContent[];
}

export default function RegionDetails({
  region,
  states,
  stateContent,
}: RegionDetailsProps) {
  const { toggleState, selectStates } = useMapStore();
  const memberStates = states
    .filter((s) => region.stateIds.includes(s.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="h-4 w-4 rounded-full shrink-0 ring-2 ring-white shadow"
            style={{ backgroundColor: region.color }}
          />
          <span className={explorerKickerClass}>Geopolitical region</span>
        </div>
        <h2 className={`${explorerTitleClass} mt-2`}>{region.name}</h2>
        <p className="text-sm text-text-secondary mt-2">
          {memberStates.length} states · names and colours shown on the map.
          Click a state to explore its LGAs, or select all below.
        </p>
      </div>

      <button
        type="button"
        onClick={() => selectStates(region.stateIds)}
        className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
        style={{ backgroundColor: region.color }}
      >
        Explore all {memberStates.length} states &amp; LGAs on map
      </button>

      <ul className={`space-y-0 max-h-64 overflow-y-auto ${explorerListCardClass}`}>
        {memberStates.map((s) => {
          const c = stateContent.find((x) => x.id === s.id);
          return (
            <li key={s.id} className="flex items-center gap-1 pr-2">
              <button
                type="button"
                onClick={() => toggleState(s.id)}
                className="flex-1 text-left px-3 py-2.5 hover:bg-lime-50/60 transition-colors"
              >
                <span className="font-medium text-slate-800">{s.name}</span>
                {c?.capital && (
                  <span className="text-xs text-slate-400 ml-2">
                    {c.capital}
                  </span>
                )}
                <span className="text-xs text-slate-400 ml-2">
                  · {s.lgaCount} LGAs
                </span>
              </button>
              <ShowLgasButton stateId={s.id} stateName={s.name} compact />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
