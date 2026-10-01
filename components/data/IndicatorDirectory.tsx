"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/hub/EmptyState";
import { formatHubValue, type HubIndicator } from "@/lib/ranking/hubIndicator";

type StateMeta = { id: string; name: string; region: string; slug: string };

/**
 * The indicator directory. It lists exactly what the dataset contains, and
 * names the reserved-but-empty columns rather than presenting them as
 * available.
 */
export default function IndicatorDirectory({
  indicators,
  reserved,
}: {
  indicators: HubIndicator[];
  reserved: { key: string; label: string; categoryId: string }[];
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return indicators;
    return indicators.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q) ||
        i.categoryId.toLowerCase().includes(q)
    );
  }, [indicators, query]);

  const reservedMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return reserved.filter(
      (r) => r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q)
    );
  }, [reserved, query]);

  return (
    <div>
      <label className="block max-w-md">
        <span className="sr-only">Search indicators</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search indicators, e.g. IGR or literacy"
          className="h-11 w-full rounded-xl border border-border-subtle bg-surface-card px-4 text-body-md text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
        />
      </label>

      {matches.length === 0 && reservedMatches.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No indicators found" badge="0 matches">
            Nothing in the dataset matches “{query.trim()}”. The schema reserves{" "}
            {reserved.length} more columns that have not been collected yet.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((i) => {
            const latest = i.periods[i.periods.length - 1];
            return (
              <li
                key={i.key}
                className="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-body-md font-semibold text-text-primary">
                    {i.label}
                  </h3>
                  <span className="shrink-0 rounded-full border border-border-subtle bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {i.categoryId}
                  </span>
                </div>
                <p className="mt-2 text-body-sm text-text-muted">
                  {i.periods.length} period{i.periods.length === 1 ? "" : "s"} ·{" "}
                  {latest.count} states in {latest.label}
                </p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  {i.key} · {i.highlight === "min" ? "lower is better" : "higher is better"}
                </p>
              </li>
            );
          })}

          {reservedMatches.map((r) => (
            <li
              key={r.key}
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"
            >
              <h3 className="text-body-md font-semibold text-text-muted line-through decoration-slate-300">
                {r.label}
              </h3>
              <p className="mt-2 text-body-sm text-text-muted">
                Reserved in the schema, no values published.
              </p>
            </li>
          ))}
        </ul>
      )}

      {reserved.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border-subtle bg-slate-50 p-6">
          <h3 className="font-landing-display text-headline-sm text-text-primary">
            {reserved.length} reserved indicators, not yet collected
          </h3>
          <p className="mt-2 max-w-2xl text-body-sm text-text-secondary">
            The dataset schema already reserves these columns, so the structure
            is in place — but the source CSVs are empty. We list them so the gap
            is visible, and we do not rank them, because an empty column is not
            a zero.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {reserved.slice(0, 18).map((r) => (
              <li
                key={r.key}
                className="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-[11px] text-text-muted"
              >
                {r.label}
              </li>
            ))}
            {reserved.length > 18 && (
              <li className="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-[11px] text-slate-400">
                +{reserved.length - 18} more
              </li>
            )}
          </ul>
        </div>
      )}

      <p className="mt-6 text-body-sm text-text-muted">
        Want the numbers side by side?{" "}
        <Link href="/explore?map=ranking" className="font-semibold text-primary hover:underline">
          Open the rankings map
        </Link>{" "}
        or{" "}
        <Link href="/places" className="font-semibold text-primary hover:underline">
          compare states in the directory
        </Link>
        .
      </p>
    </div>
  );
}
