"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProfileSection from "./ProfileSection";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import type {
  PlacesCompareGroup,
  PlacesCompareMetric,
} from "@/lib/server/loadPlacesPageData";
import type { StateLocation } from "@/types/location";
import {
  IconArrow,
  IconDock,
  IconInfo,
  IconShare,
} from "@/components/landing/icons";

type Props = {
  insights: StateProfileInsights | null;
  compareGroups: PlacesCompareGroup[];
  allStates: StateLocation[];
  currentState: StateLocation;
  stateName: string;
};

/**
 * Data & state rankings plus the multi-state comparison matrix. Every figure is
 * read from the compare registry, with national rank and median context computed
 * from the same sheet, so nothing here is authored by hand.
 */
export default function ProfileDataSection({
  insights,
  compareGroups,
  allStates,
  currentState,
  stateName,
}: Props) {
  const metrics = insights?.metrics ?? [];
  const [picks, setPicks] = useState<string[]>([currentState.id]);

  const names = useMemo(
    () => new Map(allStates.map((s) => [s.id, s])),
    [allStates]
  );


  /* Default the matrix to two large states from other zones rather than the
     first two alphabetically, so the opening comparison spans the federation. */
  const comparison = useMemo(() => {
    const popRank = new Map<string, number>();
    for (const group of compareGroups) {
      for (const metric of group.metrics) {
        if (metric.key === "population") {
          for (const [id, rank] of Object.entries(metric.ranks)) popRank.set(id, rank);
        }
      }
    }
    const candidates = allStates
      .filter((s) => s.id !== currentState.id)
      .sort(
        (a, b) => (popRank.get(a.id) ?? 99) - (popRank.get(b.id) ?? 99)
      );
    const picks: string[] = [];
    for (const candidate of candidates) {
      if (picks.length >= 2) break;
      const regions = new Set(
        [currentState.id, ...picks].map((id) => names.get(id)?.regionId)
      );
      if (regions.has(candidate.regionId)) continue;
      picks.push(candidate.id);
    }
    return [currentState.id, ...picks];
  }, [allStates, compareGroups, currentState.id, names]);

  const toggle = (id: string) => {
    setPicks((current) => {
      const next = current.includes(id)
        ? current.filter((p) => p !== id)
        : [...current, id];
      return next.includes(currentState.id) ? next : [currentState.id, ...next].slice(0, 4);
    });
  };

  return (
    <ProfileSection
      id="data"
      tone="amber"
      kicker="Comparative national benchmark"
      title="Data & state rankings"
      action={
        <Link
          href="/data"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-surface-card px-4 py-2.5 text-label-md font-bold text-text-primary transition-colors hover:border-amber-400"
        >
          All indicators
          <IconArrow className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {metrics.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <li
              key={metric.key}
              className="rounded-2xl border border-amber-100 bg-surface-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-label-caps uppercase text-text-muted">
                  {metric.label}
                </p>
                {metric.rank ? (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    #{metric.rank} of {metric.rankOf}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-display text-headline-lg font-bold tabular-nums text-text-primary">
                {metric.value}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">{metric.note}</p>
              {metric.vsMedian ? (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    metric.vsMedian.startsWith("+")
                      ? "text-emerald-700"
                      : "text-text-secondary"
                  }`}
                >
                  {metric.vsMedian}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-border-subtle bg-slate-50 px-6 py-8 text-center text-body-sm text-text-secondary">
          No ranked indicators are published for {stateName} yet.
        </p>
      )}

      {/* Comparison matrix */}
      <div className="mt-8 rounded-2xl border border-border-subtle bg-surface-card p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-label-caps uppercase text-text-muted">
              Multi-entity benchmarking
            </p>
            <h3 className="mt-1 font-headline-sm text-headline-md font-bold text-text-primary">
              Compare {stateName} with other states
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-slate-50"
            >
              <IconShare className="h-3.5 w-3.5" />
              Share
            </button>
            <Link
              href="/data/map/rankings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-slate-50"
            >
              <IconDock className="h-3.5 w-3.5" />
              Open on map
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-xs font-semibold text-text-muted">
            Active comparison:
          </span>
          {[currentState.id, ...comparison.slice(1)].map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-card px-2.5 py-1 text-xs font-bold text-text-primary ring-1 ring-border-subtle"
            >
              {id === currentState.id ? <span aria-hidden>🔒</span> : null}
              {names.get(id)?.name ?? id}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">Add:</span>
          <select
            aria-label="Add a state to the comparison"
            value=""
            onChange={(e) => {
              if (e.target.value) toggle(e.target.value);
            }}
            className="h-8 rounded-lg border border-border-subtle bg-surface-card px-2 text-xs font-semibold text-text-secondary"
          >
            <option value="">Choose a state…</option>
            {allStates
              .filter((s) => ![currentState.id, ...comparison.slice(1)].includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        <div className="mt-4 space-y-5">
          {compareGroups.map((group) => (
            <div key={group.id}>
              <h4 className="text-label-md font-bold uppercase tracking-wide text-text-secondary">
                {group.label}
              </h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left">
                      <th className="py-2 pr-3 font-semibold text-text-muted">Metric</th>
                      {[currentState.id, ...comparison.slice(1)].map((id) => (
                        <th key={id} className="py-2 pr-3 font-semibold text-text-primary">
                          {names.get(id)?.name ?? id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.metrics.map((metric) => (
                      <CompareRow
                        key={metric.key}
                        metric={metric}
                        ids={[currentState.id, ...comparison.slice(1)]}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 flex items-start gap-2 text-xs text-text-muted">
          <IconInfo className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Ranks are national, 1-based, and ties share a rank. Values come from the
          compare registry sheets cited on each row.
        </p>
      </div>
    </ProfileSection>
  );
}

function CompareRow({ metric, ids }: { metric: PlacesCompareMetric; ids: string[] }) {
  return (
    <tr className="border-b border-border-subtle/70 last:border-0">
      <th scope="row" className="py-2.5 pr-3 text-left align-top font-semibold text-text-primary">
        {metric.label}
        <span className="block text-[11px] font-normal text-text-muted">
          {metric.note}
        </span>
      </th>
      {ids.map((id) => {
        const value = metric.values[id];
        const rank = metric.ranks[id];
        return (
          <td key={id} className="py-2.5 pr-3 align-top tabular-nums text-text-secondary">
            {value == null ? (
              <span className="text-text-muted">—</span>
            ) : (
              <>
                <span className="font-semibold text-text-primary">
                  {formatMetric(metric, value)}
                </span>
                {rank ? (
                  <span className="block text-[11px] text-text-muted">
                    {rank === 1 ? "★ #1" : `#${rank}`}
                  </span>
                ) : null}
              </>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function formatMetric(metric: PlacesCompareMetric, value: number): string {
  if (metric.format === "naira") {
    if (value >= 1_000_000_000_000) return `₦${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    return `₦${Math.round(value)}`;
  }
  if (metric.format === "compact") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return String(Math.round(value));
  }
  const rounded = Math.round(value);
  const grouped = new Intl.NumberFormat("en-NG").format(rounded);
  return metric.unit === "km²" ? `${grouped} km²` : grouped;
}