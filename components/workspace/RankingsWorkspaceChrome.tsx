"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CompareBundle } from "@/types/compare";
import type { StateLocation, RegionLocation } from "@/types/location";
import { useMapStore } from "@/lib/store/mapStore";
import { buildRankingSnapshot } from "@/lib/ranking/computeRanking";
import RankingPanel from "@/components/ranking/RankingPanel";

type Props = {
  compareBundle: CompareBundle;
  states: StateLocation[];
  regions: RegionLocation[];
};

const DUMMY_COMPARE = [
  { id: "NG-LA", name: "Lagos", rank: 1, color: "bg-emerald-500" },
  { id: "NG-RI", name: "Rivers", rank: 2, color: "bg-cyan-500" },
  { id: "NG-KN", name: "Kano", rank: 5, color: "bg-violet-500" },
];

export default function RankingsWorkspaceChrome({
  compareBundle,
  states,
  regions,
}: Props) {
  const rankingCategory = useMapStore((s) => s.rankingCategory);
  const rankingFieldKey = useMapStore((s) => s.rankingFieldKey);
  const rankingPeriod = useMapStore((s) => s.rankingPeriod);
  const setHighlighted = useMapStore((s) => s.setRankingHighlightedState);
  const [compareIds, setCompareIds] = useState(DUMMY_COMPARE.map((c) => c.id));

  const snapshot = useMemo(
    () =>
      buildRankingSnapshot(
        compareBundle,
        states,
        rankingCategory,
        rankingFieldKey,
        rankingPeriod
      ),
    [compareBundle, states, rankingCategory, rankingFieldKey, rankingPeriod]
  );

  const topState = snapshot?.entries[0];
  const slugById = useMemo(
    () => new Map(states.map((s) => [s.id, s.slug])),
    [states]
  );

  const medianLabel = useMemo(() => {
    if (!snapshot?.entries.length) return "—";
    const mid = snapshot.entries[Math.floor(snapshot.entries.length / 2)];
    return mid?.display ?? "—";
  }, [snapshot]);

  const removeCompare = (id: string) =>
    setCompareIds((prev) => prev.filter((x) => x !== id));

  return (
    <div className="w-full lg:w-[min(520px,40vw)] xl:w-[560px] shrink-0 border-l border-border-subtle bg-surface-card flex flex-col min-h-0">
      <div className="shrink-0 overflow-y-auto border-b border-slate-100 p-5 space-y-5 max-h-[45vh] lg:max-h-[38vh]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-label-caps text-slate-400 tracking-wider">
              Rankings workspace
            </p>
            <h2 className="text-headline-sm font-bold text-text-primary mt-1">
              {snapshot?.field.label ?? "Internally generated revenue (IGR)"}
            </h2>
            <p className="text-body-sm text-text-muted mt-0.5">
              Fiscal year {snapshot?.periodLabel ?? rankingPeriod} · NBS
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-cyan-50 text-cyan-800 border border-cyan-100">
            Official
          </span>
        </div>

        <div>
          <p className="text-label-caps text-slate-400 mb-2">
            Compare jurisdictions
          </p>
          <div className="flex flex-wrap gap-2">
            {compareIds.map((id) => {
              const chip = DUMMY_COMPARE.find((c) => c.id === id);
              const row = snapshot?.entries.find((r) => r.stateId === id);
              if (!chip) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setHighlighted(id);
                    removeCompare(id);
                  }}
                  className="inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-border-subtle bg-slate-50 text-body-sm"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${chip.color}`}
                    aria-hidden
                  />
                  <span className="font-medium">{chip.name}</span>
                  <span className="text-slate-400 text-xs">
                    #{row?.rank ?? chip.rank}
                  </span>
                  <span className="text-slate-400 px-1" aria-hidden>×</span>
                </button>
              );
            })}
            <button
              type="button"
              className="text-label-md text-primary font-semibold px-2"
            >
              + Add up to 3
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "National total",
              value: "₦2.05T",
              sub: "↑ 18.4% YoY (illustrative)",
              subClass: "text-emerald-600",
            },
            {
              label: "National median",
              value: medianLabel,
              sub: "Across 37 units",
              subClass: "text-text-muted",
            },
            {
              label: "Top state share",
              value: "31.8%",
              sub: topState?.stateName ?? "Lagos",
              subClass: "text-text-muted",
            },
            {
              label: "Coverage",
              value: "37",
              sub: "36 states + FCT",
              subClass: "text-text-muted",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border-subtle p-3 bg-slate-50/50"
            >
              <p className="text-[10px] font-semibold uppercase text-slate-400">
                {card.label}
              </p>
              <p className="text-lg font-bold text-text-primary tabular-nums mt-0.5">
                {card.value}
              </p>
              <p className={`text-xs mt-0.5 ${card.subClass}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {topState && (
          <Link
            href={`/places/${slugById.get(topState.stateId) ?? "lagos"}`}
            className="flex justify-center h-11 items-center rounded-xl bg-primary-container text-white font-semibold text-label-md"
          >
            Open state page ({topState.stateName}) →
          </Link>
        )}
      </div>

      <RankingPanel
        compareBundle={compareBundle}
        states={states}
        regions={regions}
        variant="workspace"
      />
    </div>
  );
}
