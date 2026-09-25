"use client";

import { useMapStore } from "@/lib/store/mapStore";
import {
  MAX_METRO_MAP_VIEWS,
  METRO_MAP_VIEW_CHIP_CLASSES,
} from "@/lib/map/metroMapViews";
import type { MetroGroup, LgaLocation } from "@/types/location";

interface MetroMapPanelProps {
  metroGroups: MetroGroup[];
  lgas: LgaLocation[];
}

export default function MetroMapPanel({
  metroGroups,
  lgas,
}: MetroMapPanelProps) {
  const metroMapViews = useMapStore((s) => s.metroMapViews);
  const activeMetroPanelId = useMapStore((s) => s.activeMetroPanelId);
  const setActiveMetroPanelId = useMapStore((s) => s.setActiveMetroPanelId);
  const removeMetroMapView = useMapStore((s) => s.removeMetroMapView);
  const clearMetroMapViews = useMapStore((s) => s.clearMetroMapViews);

  const activeId = activeMetroPanelId ?? metroMapViews[0]?.id ?? null;
  const activeView = metroMapViews.find((v) => v.id === activeId);
  const meta = activeId ? metroGroups.find((m) => m.id === activeId) : null;

  const lgaById = new Map(lgas.map((l) => [l.id, l]));
  const memberLgas =
    activeView?.lgaIds
      .map((id) => lgaById.get(id))
      .filter((l): l is LgaLocation => l !== undefined) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Metro on map
        </p>
        <h2 className="text-xl font-bold text-slate-900">
          {activeView?.label ?? "Metro areas"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {metroMapViews.length} of {MAX_METRO_MAP_VIEWS} on map · states not
          selected
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {metroMapViews.map((view) => {
          const chip =
            METRO_MAP_VIEW_CHIP_CLASSES[
              view.colorIndex % METRO_MAP_VIEW_CHIP_CLASSES.length
            ];
          const on = view.id === activeId;
          return (
            <span
              key={view.id}
              className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs font-medium border shadow-sm max-w-[200px] ${chip} ${
                on ? "ring-2 ring-ng-green/40" : ""
              }`}
            >
              <button
                type="button"
                className="truncate text-left"
                onClick={() => setActiveMetroPanelId(view.id)}
              >
                {view.label}
              </button>
              <button
                type="button"
                aria-label={`Remove ${view.label} from map`}
                onClick={() => removeMetroMapView(view.id)}
                className="rounded-full hover:bg-black/10 w-5 h-5 flex items-center justify-center shrink-0"
              >
                ×
              </button>
            </span>
          );
        })}
        {metroMapViews.length > 1 && (
          <button
            type="button"
            onClick={() => clearMetroMapViews()}
            className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-ng-green"
          >
            Clear all
          </button>
        )}
      </div>

      {meta?.description && (
        <p className="text-sm text-slate-600 leading-relaxed">
          {meta.description}
        </p>
      )}

      {memberLgas.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            LGAs in this metro ({memberLgas.length})
          </p>
          <ul className="text-sm text-slate-700 space-y-1 columns-2 gap-x-4">
            {memberLgas.map((l) => (
              <li key={l.id} className="break-inside-avoid">
                {l.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
