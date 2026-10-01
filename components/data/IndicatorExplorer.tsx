"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  rankHubIndicator,
  formatHubValue,
  type HubIndicator,
} from "@/lib/ranking/hubIndicator";

type StateMeta = { id: string; name: string; region: string; slug: string };

type Props = {
  indicators: HubIndicator[];
  states: StateMeta[];
  /** Restrict to one category, or show both. */
  categoryId: "economy" | "social";
  /** `explorer` shows the selector and table; `spotlight` shows one indicator. */
  initialIndicatorKey?: string;
  slugByStateId: Record<string, string>;
};

/**
 * The core Data hub module: pick an indicator, pick a period, read the
 * choropleth, the leaderboard and the full 37-row table. All ranking happens
 * client-side over the trimmed series the loader ships.
 */
export default function IndicatorExplorer({
  indicators,
  states,
  categoryId,
  initialIndicatorKey,
  slugByStateId,
}: Props) {
  const scoped = useMemo(
    () => indicators.filter((i) => i.categoryId === categoryId),
    [indicators, categoryId]
  );

  const [indicatorKey, setIndicatorKey] = useState(
    initialIndicatorKey ?? scoped[0]?.key ?? ""
  );
  const indicator =
    scoped.find((i) => i.key === indicatorKey) ?? scoped[0] ?? null;
  const [period, setPeriod] = useState(indicator?.defaultPeriod ?? "");
  const [showAll, setShowAll] = useState(false);

  const activePeriod =
    indicator && indicator.periods.some((p) => p.id === period)
      ? period
      : (indicator?.defaultPeriod ?? "");
  const ranking = useMemo(
    () => (indicator ? rankHubIndicator(indicator, activePeriod, states) : null),
    [indicator, activePeriod, states]
  );

  if (!indicator || !ranking) {
    return (
      <EmptyState title="No indicators collected yet">
        The schema reserves columns for this category, but the source CSVs have
        no values in them yet.
      </EmptyState>
    );
  }

  const rows = showAll ? ranking.rows : ranking.rows.slice(0, 10);
  const mapHref = sectionMapHref("data/rankings", {
    ranking: {
      category: indicator.categoryId,
      field: indicator.fieldKey,
      period: activePeriod,
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-label-caps tracking-wider text-text-muted">
            Indicator
          </span>
          <select
            value={indicator.key}
            onChange={(e) => {
              const next = scoped.find((i) => i.key === e.target.value);
              setIndicatorKey(e.target.value);
              setPeriod(next?.defaultPeriod ?? "");
            }}
            className="mt-2 h-11 min-w-[15rem] rounded-xl border border-border-subtle bg-surface-card px-3 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            {scoped.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </select>
        </label>

        {indicator.periods.length > 1 && (
          <div>
            <span className="text-label-caps tracking-wider text-text-muted">
              Period
            </span>
            <div className="mt-2 inline-flex rounded-xl border border-border-subtle bg-surface-card p-1">
              {indicator.periods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  aria-pressed={p.id === activePeriod}
                  className={`h-9 rounded-lg px-3 text-body-sm font-semibold transition ${
                    p.id === activePeriod
                      ? "bg-primary-container text-white"
                      : "text-text-secondary hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Link
          href={mapHref}
          className="ml-auto inline-flex h-11 items-center rounded-xl border border-primary-container px-5 text-label-md font-semibold text-primary hover:bg-emerald-50"
        >
          View on map
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
            <NigeriaThumb
              source="states"
              fillByKey={ranking.fillByStateId}
              className="h-56 w-full"
              title={`${indicator.label}, ${ranking.periodLabel}`}
            />
            <ul className="mt-3 space-y-1">
              {ranking.legend.map((step) => (
                <li
                  key={step.color + step.label}
                  className="flex items-center gap-2 text-[11px] text-text-secondary"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ background: step.color }}
                    aria-hidden
                  />
                  <span className="font-mono">{step.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-text-muted">
              {ranking.directionLabel} ·{" "}
              {ranking.missing.length > 0
                ? `${ranking.missing.length} state${
                    ranking.missing.length === 1 ? "" : "s"
                  } not reported`
                : `all ${ranking.rows.length} states reported`}
            </p>
          </div>

          {ranking.leader && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-label-caps text-emerald-800">
                {ranking.directionLabel === "Lower is better" ? "Lowest" : "Highest"}
              </p>
              <p className="mt-1 font-landing-display text-headline-sm text-text-primary">
                {ranking.leader.stateName}
              </p>
              <p className="text-body-md text-slate-700">
                {formatHubValue(ranking.leader.value, indicator.unit)}
              </p>
              <p className="mt-1 text-body-sm text-text-muted">
                {ranking.leader.regionName}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
            <table className="w-full text-left text-body-sm">
              <caption className="sr-only">
                {indicator.label} by state, {ranking.periodLabel}
              </caption>
              <thead className="border-b border-border-subtle bg-slate-50 text-label-caps text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3">
                    State
                  </th>
                  <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                    Region
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {indicator.label}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.stateId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {r.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/places/${slugByStateId[r.stateId] ?? r.stateId}`}
                        className="font-semibold text-text-primary hover:text-primary"
                      >
                        {r.stateName}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-text-muted sm:table-cell">
                      {r.regionName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">
                      {formatHubValue(r.value, indicator.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-label-md font-semibold text-primary hover:underline"
            >
              {showAll
                ? "Show top 10"
                : `See all ${ranking.rows.length} states`}
            </button>
            {ranking.missing.length > 0 && (
              <span className="text-body-sm text-text-muted">
                Not reported:{" "}
                {ranking.missing.map((m) => m.stateName).join(", ")}
              </span>
            )}
          </div>

          <p className="mt-4 text-body-sm text-text-muted">
            <span className="font-semibold text-slate-700">
              {indicator.label}
            </span>{" "}
            — {indicator.footnote ?? "State-level figures as published."} Values
            are reproduced from the source dataset; the rankings map applies the
            same scale.
          </p>
        </div>
      </div>

      <SourceNote
        className="mt-6"
        source={indicator.sourceNote || "NBS"}
        updated={ranking.periodLabel}
      />
    </div>
  );
}
