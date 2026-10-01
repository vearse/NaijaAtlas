"use client";

import { useMemo } from "react";
import type { CompareBundle } from "@/types/compare";
import type { StateLocation } from "@/types/location";
import { useMapStore } from "@/lib/store/mapStore";
import { buildRankingSnapshot } from "@/lib/ranking/computeRanking";
import { withUnit } from "@/lib/ranking/metricUnits";

type Props = {
  compareBundle: CompareBundle;
  states: StateLocation[];
};

export default function RankingsMapCallouts({ compareBundle, states }: Props) {
  const rankingCategory = useMapStore((s) => s.rankingCategory);
  const rankingFieldKey = useMapStore((s) => s.rankingFieldKey);
  const rankingPeriod = useMapStore((s) => s.rankingPeriod);

  const topThree = useMemo(() => {
    const snapshot = buildRankingSnapshot(
      compareBundle,
      states,
      rankingCategory,
      rankingFieldKey,
      rankingPeriod
    );
    return snapshot?.entries.slice(0, 3) ?? [];
  }, [
    compareBundle,
    states,
    rankingCategory,
    rankingFieldKey,
    rankingPeriod,
  ]);

  const unit = useMemo(() => {
    const snapshot = buildRankingSnapshot(
      compareBundle,
      states,
      rankingCategory,
      rankingFieldKey,
      rankingPeriod
    );
    return snapshot?.unit;
  }, [
    compareBundle,
    states,
    rankingCategory,
    rankingFieldKey,
    rankingPeriod,
  ]);

  const positions = [
    "top-[28%] left-[22%]",
    "top-[42%] right-[18%]",
    "top-[18%] left-[48%]",
  ];

  if (!topThree.length || !unit) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 hidden md:block">
      {topThree.map((row, i) => (
        <div
          key={row.stateId}
          className={`absolute ${positions[i] ?? "top-1/2 left-1/2"}`}
        >
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 text-white text-[11px] font-semibold shadow-lg border border-white/10 whitespace-nowrap">
            #{row.rank} {row.stateName} — {withUnit(row.display, unit)}
          </div>
        </div>
      ))}
    </div>
  );
}
