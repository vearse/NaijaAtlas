"use client";

import { useMemo } from "react";
import FadeIn from "@/components/ui/FadeIn";
import ZoneBoard from "@/components/zones/ZoneBoard";
import { buildElectionZoneBoard } from "@/lib/election/buildElectionZoneBoard";
import { buildRankingZoneBoard } from "@/lib/ranking/zoneRanking";
import { useMapStore } from "@/lib/store/mapStore";
import type { CompareBundle } from "@/types/compare";
import type { RegionLocation, StateLocation } from "@/types/location";
import type { PresidentialResultsBundle } from "@/types/politics";

type Props = {
  mode: "elections" | "rankings";
  regions: RegionLocation[];
  states: StateLocation[];
  compareBundle: CompareBundle;
  presidentialResults?: PresidentialResultsBundle | null;
};

export default function MapZonesPanel({
  mode,
  regions,
  states,
  compareBundle,
  presidentialResults,
}: Props) {
  const rankingCategory = useMapStore((s) => s.rankingCategory);
  const rankingFieldKey = useMapStore((s) => s.rankingFieldKey);
  const rankingPeriod = useMapStore((s) => s.rankingPeriod);
  const setMapCanvasView = useMapStore((s) => s.setMapCanvasView);
  const setActiveRegion = useMapStore((s) => s.setActiveRegion);
  const selectStates = useMapStore((s) => s.selectStates);

  const boardProps = useMemo(() => {
    if (mode === "elections" && presidentialResults) {
      const base = buildElectionZoneBoard(
        presidentialResults,
        regions,
        states,
        { compact: true }
      );
      return {
        ...base,
        zones: base.zones.map((z) => ({
          ...z,
          onSelect: () => {
            setActiveRegion(z.id);
            selectStates([]);
            setMapCanvasView("map");
          },
        })),
      };
    }
    if (mode === "rankings") {
      const base = buildRankingZoneBoard(
        compareBundle,
        states,
        regions,
        rankingCategory,
        rankingFieldKey,
        rankingPeriod
      );
      if (!base) return null;
      return {
        ...base,
        zones: base.zones.map((z) => ({
          ...z,
          onSelect: () => {
            setActiveRegion(z.id);
            setMapCanvasView("map");
          },
        })),
      };
    }
    return null;
  }, [
    mode,
    presidentialResults,
    regions,
    states,
    compareBundle,
    rankingCategory,
    rankingFieldKey,
    rankingPeriod,
    setActiveRegion,
    setMapCanvasView,
    selectStates,
  ]);

  const animationKey =
    mode === "rankings"
      ? `${rankingCategory}|${rankingFieldKey}|${rankingPeriod}`
      : `election-${presidentialResults?.election.year ?? ""}`;

  if (!boardProps) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface-card p-8 text-center text-sm text-text-muted">
        Zone breakdown is not available for this selection yet.
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[5] overflow-y-auto overscroll-contain bg-surface-canvas p-3 md:p-5">
      <FadeIn animationKey={animationKey}>
        <ZoneBoard {...boardProps} className="shadow-sm" />
      </FadeIn>
    </div>
  );
}
