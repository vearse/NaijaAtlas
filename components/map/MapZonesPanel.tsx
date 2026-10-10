"use client";

import { useMemo } from "react";
import FadeIn from "@/components/ui/FadeIn";
import ZoneBoard from "@/components/zones/ZoneBoard";
import { buildElectionZoneBoard } from "@/lib/election/buildElectionZoneBoard";
import { electionBreakdownUnavailableMessage } from "@/lib/election/electionAvailability";
import { electionHasStateVoteCounts } from "@/lib/election/zoneAggregate";
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
      if (!electionHasStateVoteCounts(presidentialResults)) return null;
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

  const unavailableNote =
    mode === "elections" && presidentialResults
      ? electionBreakdownUnavailableMessage(presidentialResults)
      : null;

  if (!boardProps) {
    return (
      <div className="absolute inset-0 z-[5] overflow-y-auto bg-surface-canvas p-3 md:p-5">
        <div
          className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center"
          role="status"
        >
          <p className="text-label-caps font-bold text-amber-900">
            {mode === "elections" && presidentialResults
              ? `${presidentialResults.election.year} presidential · zones`
              : "Zone view"}
          </p>
          <p className="max-w-lg text-sm leading-relaxed text-amber-950/90">
            {unavailableNote ??
              "Zone breakdown is not available for this selection yet."}
          </p>
        </div>
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
