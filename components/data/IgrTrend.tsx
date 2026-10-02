"use client";

import { useMemo } from "react";
import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  rankHubIndicator,
  sumOf,
  formatHubValue,
  type HubIndicator,
} from "@/lib/ranking/hubIndicator";

type StateMeta = { id: string; name: string; region: string; slug: string };

/**
 * The one indicator with a full multi-year series, so it gets a real trend
 * module: national growth, regional shares, and how concentrated the top of
 * the distribution is.
 */
export default function IgrTrend({
  indicator,
  states,
  slugByStateId,
}: {
  indicator: HubIndicator | null;
  states: StateMeta[];
  slugByStateId: Record<string, string>;
}) {
  const data = useMemo(() => {
    if (!indicator) return null;

    const years = indicator.periods.map((p) => {
      const r = rankHubIndicator(indicator, p.id, states);
      if (!r) return null;
      const total = sumOf(r);
      const byRegion = new Map<string, number>();
      for (const row of r.rows) {
        byRegion.set(row.regionName, (byRegion.get(row.regionName) ?? 0) + row.value);
      }
      return {
        id: p.id,
        label: p.label,
        total,
        count: r.rows.length,
        ranking: r,
        regions: [...byRegion.entries()]
          .map(([name, value]) => ({ name, value, share: value / total }))
          .sort((a, b) => b.value - a.value),
      };
    });

    const clean = years.filter((y): y is NonNullable<typeof y> => y != null);
    if (clean.length === 0) return null;

    const first = clean[0];
    const last = clean[clean.length - 1];
    const growth = (last.total / first.total - 1) * 100;

    // Concentration of the latest year.
    const rows = [...last.ranking.rows].sort((a, b) => b.value - a.value);
    const top5 = rows.slice(0, 5);
    const top5Share = top5.reduce((s, r) => s + r.value, 0) / last.total;
    const top1Share = rows[0].value / last.total;

    return { clean, first, last, growth, top5, top5Share, top1Share, unit: indicator.unit };
  }, [indicator, states]);

  if (!data) return null;
  const { clean, first, last, growth, top5, top5Share, unit } = data;
  const maxTotal = Math.max(...clean.map((y) => y.total));

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="rounded-2xl border border-border-subtle bg-surface-card p-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <h3 className="font-landing-display text-headline-sm text-text-primary">
                Internally Generated Revenue
              </h3>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                {indicator!.label}
              </span>
            </div>
            <p className="mt-2 text-body-md text-text-secondary">
              Revenue each state raised on its own, before any federation
              allocation. All {last.count} states reported every year.
            </p>

            <div className="mt-6 space-y-3">
              {clean.map((y) => {
                const h = Math.max(6, (y.total / maxTotal) * 100);
                return (
                  <div key={y.id} className="flex items-center gap-4">
                    <span className="w-20 shrink-0 text-body-sm font-semibold text-text-secondary">
                      {y.label.replace("FY ", "")}
                    </span>
                    <div className="h-8 flex-1 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="flex h-full items-center rounded-lg bg-primary-container px-3 transition-[width]"
                        style={{ width: `${h}%` }}
                      >
                        <span className="whitespace-nowrap font-mono text-[11px] font-semibold text-white">
                          {formatHubValue(y.total, unit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-body-sm text-text-secondary">
              National total grew{" "}
              <span className="font-semibold text-text-primary">
                +{growth.toFixed(0)}%
              </span>{" "}
              from {formatHubValue(first.total, unit)} in{" "}
              {first.label.replace("FY ", "")} to{" "}
              {formatHubValue(last.total, unit)} in{" "}
              {last.label.replace("FY ", "")}.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-card p-6">
            <h3 className="font-landing-display text-headline-sm text-text-primary">
              Where the {last.label.replace("FY ", "")} total came from
            </h3>
            <ul className="mt-4 space-y-3">
              {last.regions.map((r) => (
                <li key={r.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-body-sm font-semibold text-slate-800">
                      {r.name}
                    </span>
                    <span className="font-mono text-body-sm text-text-secondary">
                      {formatHubValue(r.value, unit)} ·{" "}
                      {(r.share * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-metric-teal"
                      style={{ width: `${r.share * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
            <NigeriaThumb
              source="states"
              fillByKey={last.ranking.fillByStateId}
              className="h-52 w-full"
              title={`IGR choropleth, ${last.label}`}
            />
            <Link
              href={sectionMapHref("data/rankings", {
                ranking: {
                  category: "economy",
                  field: "igr",
                  period: last.id,
                },
              })}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
            >
              Open rankings map
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-label-caps text-amber-900">
              Concentration
            </p>
            <p className="mt-1 font-landing-display text-headline-sm text-text-primary">
              {(data.top5Share * 100).toFixed(0)}%
            </p>
            <p className="text-body-sm text-slate-700">
              of all state IGR in {last.label.replace("FY ", "")} came from just
              five states.
            </p>
            <ul className="mt-4 space-y-2">
              {top5.map((r) => (
                <li
                  key={r.stateId}
                  className="flex items-baseline justify-between gap-2"
                >
                  <Link
                    href={`/places/${slugByStateId[r.stateId] ?? r.stateId}`}
                    className="text-body-sm font-semibold text-slate-800 hover:text-primary"
                  >
                    {r.stateName}
                  </Link>
                  <span className="font-mono text-[11px] text-text-secondary">
                    {formatHubValue(r.value, unit)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <SourceNote
        className="mt-6"
        source={indicator!.sourceNote || "NBS"}
        updated={`FY ${first.id}–${last.id}`}
      />
    </div>
  );
}
