"use client";

import { useMapStore } from "@/lib/store/mapStore";
import type { PresidentialResultsBundle } from "@/types/politics";

export default function ElectionResultsPartyLegend({
  results,
}: {
  results: PresidentialResultsBundle;
}) {
  const mapCanvasView = useMapStore((s) => s.mapCanvasView);

  return (
    <div
      className={`absolute left-3 z-10 flex flex-wrap gap-2 rounded-xl border border-border-subtle/90 bg-surface-card/95 px-3 py-2 shadow-sm backdrop-blur-sm ${
        mapCanvasView === "map" ? "bottom-20" : "bottom-3"
      }`}
    >
      {results.candidates.map((c) => (
        <span
          key={c.party}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary"
        >
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: c.color }}
            aria-hidden
          />
          {c.party}
        </span>
      ))}
    </div>
  );
}
