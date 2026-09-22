"use client";

import VisitDirectionsControl from "@/components/directions/VisitDirectionsControl";
import { useMapStore } from "@/lib/store/mapStore";

export default function DirectionsPanel() {
  const target = useMapStore((s) => s.directionsPanelTarget);
  const closeDirectionsPanel = useMapStore((s) => s.closeDirectionsPanel);

  if (!target) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Directions
          </p>
          <h2 className="text-xl font-bold text-slate-900">{target.name}</h2>
        </div>
        <button
          type="button"
          onClick={closeDirectionsPanel}
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close directions"
        >
          Close
        </button>
      </div>

      <VisitDirectionsControl
        feature={{
          name: target.name,
          lonLat: target.lonLat,
          kind: target.kind === "custom" ? "overlay" : target.kind,
        }}
        restoreMapTypeOnClose
      />
    </div>
  );
}