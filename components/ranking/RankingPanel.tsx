"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CompareBundle } from "@/types/compare";
import type { StateLocation, RegionLocation } from "@/types/location";
import { useMapStore } from "@/lib/store/mapStore";
import { getCategories } from "@/lib/compare/compareUtils";
import { getRankingFields } from "@/lib/ranking/rankingFields";
import { resolveCategoryLanding } from "@/lib/ranking/defaults";
import { buildRankingSnapshot } from "@/lib/ranking/computeRanking";
import { withUnit } from "@/lib/ranking/metricUnits";
import type { RankingCategoryId } from "@/lib/ranking/types";
import { useIsMobile } from "@/hooks/useMediaQuery";
import MobileBottomSheet from "@/components/location/MobileBottomSheet";

const TABS: { id: RankingCategoryId; label: string }[] = [
  { id: "economy", label: "Economy" },
  { id: "social", label: "Social" },
];

/** Small circular region swatch shown beside each ranked state. */
function RegionDot({ region }: { region?: RegionLocation }) {
  if (!region) return <span className="w-2.5 shrink-0" aria-hidden />;
  return (
    <span
      title={region.name}
      className="w-2.5 h-2.5 shrink-0 rounded-full border border-white/70 shadow-sm"
      style={{ backgroundColor: region.color }}
    >
      <span className="sr-only">{region.name}</span>
    </span>
  );
}

interface RankingPanelProps {
  compareBundle: CompareBundle;
  states: StateLocation[];
  regions: RegionLocation[];
}

export default function RankingPanel({
  compareBundle,
  states,
  regions,
}: RankingPanelProps) {
  const isMobile = useIsMobile();
  const mobileSheet = useMapStore((s) => s.mobileSheet);
  const openMobileSheet = useMapStore((s) => s.openMobileSheet);
  const rankingCategory = useMapStore((s) => s.rankingCategory);
  const rankingFieldKey = useMapStore((s) => s.rankingFieldKey);
  const rankingPeriod = useMapStore((s) => s.rankingPeriod);
  const highlightedId = useMapStore((s) => s.rankingHighlightedStateId);
  const setRankingMetric = useMapStore((s) => s.setRankingMetric);
  const setRankingPeriod = useMapStore((s) => s.setRankingPeriod);
  const setHighlighted = useMapStore((s) => s.setRankingHighlightedState);

  const [infoOpen, setInfoOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const fields = useMemo(() => getRankingFields(compareBundle), [compareBundle]);
  const visibleFields = fields.filter((f) => f.categoryId === rankingCategory);

  // stateId → region, for the circular region marker on each ranked row.
  const regionByStateId = useMemo(() => {
    const byId = new Map(regions.map((r) => [r.id, r]));
    const out = new Map<string, RegionLocation>();
    for (const s of states) {
      const region = byId.get(s.regionId);
      if (region) out.set(s.id, region);
    }
    return out;
  }, [states, regions]);

  const categoryDef = getCategories(compareBundle, "state").find(
    (c) => c.id === rankingCategory
  );
  const periods = categoryDef?.periods ?? [];

  const selectCategory = (next: RankingCategoryId) => {
    if (next === rankingCategory) return;
    const landing = resolveCategoryLanding(
      compareBundle,
      next,
      rankingFieldKey,
      rankingPeriod
    );
    if (landing.period && landing.period !== rankingPeriod) {
      setRankingPeriod(landing.period);
    }
    setRankingMetric(next, landing.fieldKey);
  };

  // Arrow/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    let next = -1;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next < 0) return;
    e.preventDefault();
    const target = TABS[next];
    selectCategory(target.id);
    tabRefs.current[target.id]?.focus();
  };

  useEffect(() => {
    if (!highlightedId) return;
    const el = rowRefs.current[highlightedId];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedId]);

  // `states` holds 36 states plus the FCT, so phrase it as a location count
  // rather than "N states and the FCT".
  const infoDescription = snapshot
    ? snapshot.field.footnote ??
      `${snapshot.field.label} for ${snapshot.periodLabel}, ranked across all ` +
        `${states.length} locations.`
    : "";

  const inner = (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 p-4 border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
          Rankings
        </p>
        <h2 className="text-lg font-bold text-slate-900">
          {snapshot?.field.label ?? "State indicators"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Economy & Social · NBS / NDHS data
        </p>
        {periods.length > 0 && (
          <label className="mt-3 block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Period
            </span>
            <select
              value={rankingPeriod}
              onChange={(e) => setRankingPeriod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="shrink-0 px-4 py-3 border-b border-slate-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Metric
        </p>
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Metric category"
        >
          {TABS.map((tab, i) => {
            const isActive = tab.id === rankingCategory;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={`ranking-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls="ranking-tabpanel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectCategory(tab.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 min-h-[32px] ${
                  isActive
                    ? "bg-ng-green text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            aria-expanded={infoOpen}
            aria-controls="ranking-metric-info"
            title="About this metric"
            className={`ml-auto shrink-0 grid place-items-center w-[32px] h-[32px] rounded-full transition-colors ${
              infoOpen
                ? "bg-emerald-50 text-ng-green ring-1 ring-ng-green/40"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="w-4 h-4"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <path d="M12 8h.01" />
            </svg>
            <span className="sr-only">
              {infoOpen ? "Hide metric details" : "Show metric details"}
            </span>
          </button>
        </div>

        {infoOpen && (
          <div
            id="ranking-metric-info"
            className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
          >
            <p className="text-xs font-semibold text-slate-800">
              {snapshot?.field.label ?? "This metric"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {categoryDef?.label ?? ""}
              {snapshot ? ` · ${snapshot.periodLabel}` : ""}
            </p>
            {infoDescription && (
              <p className="text-[11px] leading-relaxed text-slate-600 mt-2">
                {infoDescription}
              </p>
            )}

            {snapshot && snapshot.legendSteps.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Legend · {snapshot.directionLabel}
                </p>
                <ul className="space-y-1">
                  {snapshot.legendSteps.map((step) => (
                    <li
                      key={step.label}
                      className="flex items-center gap-2 text-[11px] text-slate-600"
                    >
                      <span
                        className="h-3 w-6 rounded shrink-0 border border-slate-200/80"
                        style={{ backgroundColor: step.color }}
                        aria-hidden
                      />
                      {step.label}
                    </li>
                  ))}
                </ul>
                {snapshot.sourceNote && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    {snapshot.sourceNote}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div
          id="ranking-tabpanel"
          role="tabpanel"
          aria-labelledby={`ranking-tab-${rankingCategory}`}
          className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 max-h-32 overflow-y-auto"
        >
          {visibleFields.map((f) => (
            <button
              key={`${f.categoryId}-${f.fieldKey}`}
              type="button"
              onClick={() => setRankingMetric(f.categoryId, f.fieldKey)}
              className={`text-left text-xs rounded-lg px-2 py-1.5 border ${
                rankingCategory === f.categoryId &&
                rankingFieldKey === f.fieldKey
                  ? "border-ng-green bg-emerald-50 text-emerald-900 font-semibold"
                  : "border-slate-100 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4">
        {!snapshot?.hasData ? (
          <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            No state data for this metric yet. Add values in compare CSV sources
            and run build:compare.
          </p>
        ) : (
          <ol className="space-y-1">
            {snapshot.entries.map((row) => (
              <li key={row.stateId}>
                <button
                  type="button"
                  ref={(el) => {
                    rowRefs.current[row.stateId] = el;
                  }}
                  onClick={() => setHighlighted(row.stateId)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                    highlightedId === row.stateId
                      ? "bg-emerald-50 ring-2 ring-ng-green/40"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-bold text-ng-green w-7 shrink-0">
                    #{row.rank}
                  </span>
                  <RegionDot region={regionByStateId.get(row.stateId)} />
                  <span className="flex-1 text-sm font-medium text-slate-900 truncate">
                    {row.stateName}
                  </span>
                  <span className="text-sm text-slate-600 shrink-0">
                    {snapshot
                      ? withUnit(row.display, snapshot.unit)
                      : row.display}
                  </span>
                </button>
              </li>
            ))}
            {snapshot.noData.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-4 pb-1">
                  No data
                </p>
                {snapshot.noData.map((row) => (
                  <li
                    key={row.stateId}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-400"
                  >
                    <span className="w-7 shrink-0">—</span>
                    <RegionDot region={regionByStateId.get(row.stateId)} />
                    <span className="flex-1 text-sm truncate">{row.stateName}</span>
                  </li>
                ))}
              </>
            )}
          </ol>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    if (mobileSheet === "hidden") {
      return (
        <button
          type="button"
          onClick={() => openMobileSheet()}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 lg:hidden rounded-full bg-ng-green px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Rankings
        </button>
      );
    }
    return (
      <MobileBottomSheet
        title="State rankings"
        subtitle={snapshot?.field.label ?? "Economy & Social"}
        hasContent
      >
        <div className="flex flex-col max-h-[75vh] min-h-[40vh]">{inner}</div>
      </MobileBottomSheet>
    );
  }

  return (
    <aside className="w-full lg:w-[400px] xl:w-[420px] shrink-0 border-l border-slate-200/80 bg-white flex flex-col min-h-0 hidden lg:flex">
      {inner}
    </aside>
  );
}
