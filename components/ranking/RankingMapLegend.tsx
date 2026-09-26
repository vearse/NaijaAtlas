"use client";

import { useEffect, useMemo } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import type { CompareBundle } from "@/types/compare";
import type { StateLocation } from "@/types/location";
import { buildRankingSnapshot } from "@/lib/ranking/computeRanking";

interface RankingMapLegendProps {
  compareBundle: CompareBundle;
  states: StateLocation[];
  /** Reported so the shared map slot can skip this card when it has nothing to show. */
  onVisibleChange?: (visible: boolean) => void;
}

export default function RankingMapLegend({
  compareBundle,
  states,
  onVisibleChange,
}: RankingMapLegendProps) {
  const mapType = useMapStore((s) => s.mapType);
  const rankingCategory = useMapStore((s) => s.rankingCategory);
  const rankingFieldKey = useMapStore((s) => s.rankingFieldKey);
  const rankingPeriod = useMapStore((s) => s.rankingPeriod);

  const snapshot = useMemo(() => {
    if (mapType !== "ranking") return null;
    return buildRankingSnapshot(
      compareBundle,
      states,
      rankingCategory,
      rankingFieldKey,
      rankingPeriod
    );
  }, [
    mapType,
    compareBundle,
    states,
    rankingCategory,
    rankingFieldKey,
    rankingPeriod,
  ]);

  const visible = mapType === "ranking" && snapshot?.hasData === true;

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [onVisibleChange, visible]);

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-slate-800 mb-1.5 truncate">
        {snapshot.field.label}
      </p>
      <ul className="space-y-1">
        {snapshot.legendSteps.slice(0, 6).map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-slate-600">
            <span
              className="h-2.5 w-4 rounded-sm shrink-0"
              style={{ backgroundColor: step.color }}
              aria-hidden
            />
            <span className="truncate">{step.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
