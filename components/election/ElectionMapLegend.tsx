"use client";

import { useMemo } from "react";
import type { PoliticsLookups } from "@/types/politics";
import { useMapStore } from "@/lib/store/mapStore";
import { colorForDistrict } from "@/lib/politics/senatorialColors";

interface ElectionMapLegendProps {
  lookups: PoliticsLookups;
}

export default function ElectionMapLegend({ lookups }: ElectionMapLegendProps) {
  const mapType = useMapStore((s) => s.mapType);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);

  const entries = useMemo(() => {
    if (selectedStateIds.size === 0) return [];
    const out: { id: string; name: string; stateLabel: string; color: string }[] =
      [];
    for (const stateId of selectedStateIds) {
      const districts = lookups.districtsByStateId[stateId] ?? [];
      for (const d of districts) {
        out.push({
          id: d.id,
          name: d.name,
          stateLabel: d.state,
          color: colorForDistrict(lookups, d.id),
        });
      }
    }
    return out;
  }, [lookups, selectedStateIds]);

  if (mapType !== "election" || entries.length === 0) return null;

  return (
    <div className="absolute bottom-20 left-3 z-10 max-w-[220px] rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">Senatorial districts</p>
      <ul className="space-y-1">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-2 text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: e.color }}
              aria-hidden
            />
            <span className="truncate">{e.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
