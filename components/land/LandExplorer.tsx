"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatePillLinkList } from "@/components/hub/StatePillLink";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { LandHubData } from "@/lib/server/loadLandHubData";

type Tab = "terrain" | "water" | "coast";

/** Terrain, water and coastline in three tabs, all from the catalogues. */
export default function LandExplorer({
  data,
  slugByStateId,
  idByStateName,
}: {
  data: LandHubData;
  /** State name → Places slug. */
  slugByStateId: Record<string, string>;
  /** State name → state id, for thumbnail highlights. */
  idByStateName: Record<string, string>;
}) {
  const [tab, setTab] = useState<Tab>("terrain");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const terrain = useMemo(
    () =>
      data.landforms.filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(q) ||
          l.landformType.includes(q) ||
          l.states.join(" ").toLowerCase().includes(q)
      ),
    [data.landforms, q]
  );

  const waterBodies = useMemo(
    () =>
      data.lakes.filter(
        (l) => !l.isPower && (!q || l.name.toLowerCase().includes(q) || l.states.join(" ").toLowerCase().includes(q))
      ),
    [data.lakes, q]
  );

  const rivers = useMemo(
    () =>
      data.waterways.filter(
        (w) => !q || w.name.toLowerCase().includes(q) || w.class.toLowerCase().includes(q)
      ),
    [data.waterways, q]
  );

  const coastFeatures = useMemo(
    () =>
      data.coast.filter(
        (c) => !q || c.name.toLowerCase().includes(q) || c.states.join(" ").toLowerCase().includes(q)
      ),
    [data.coast, q]
  );

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "terrain", label: "Terrain", count: data.counts.landforms },
    { id: "water", label: "Rivers & lakes", count: data.counts.rivers + data.counts.lakes },
    { id: "coast", label: "Coastline", count: data.counts.coast },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`h-10 rounded-full border px-4 text-body-sm font-semibold ${
              tab === t.id
                ? "border-primary-container bg-primary-container text-white"
                : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
        <label className="ml-auto block">
          <span className="sr-only">Search land features</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a feature or state"
            className="h-10 w-full max-w-[16rem] rounded-full border border-border-subtle bg-surface-card px-4 text-body-sm text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>
      </div>

      {tab === "terrain" && (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {terrain.length === 0 && (
            <li className="md:col-span-2">
              <EmptyState title="No terrain matches" badge="0 results">
                Nothing in the {data.counts.landforms}-entry landform catalogue
                matches that search.
              </EmptyState>
            </li>
          )}
          {terrain.map((l) => (
            <li
              key={l.id}
              className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-landing-display text-headline-sm text-text-primary">
                  {l.name}
                </h3>
                <span className="shrink-0 rounded-full border border-border-subtle bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-text-secondary">
                  {l.landformType.replace("-", " ")}
                </span>
              </div>
              {l.type && <p className="mt-1 text-body-sm text-text-muted">{l.type}</p>}
              <p className="mt-2 text-body-sm text-text-secondary">{l.summary}</p>
              {l.elevationNote && (
                <p className="mt-2 text-body-sm text-text-secondary">
                  <span className="font-semibold text-slate-800">Relief: </span>
                  {l.elevationNote}
                </p>
              )}
              <StatePills states={l.states} slugByStateId={slugByStateId} />
            </li>
          ))}
        </ul>
      )}

      {tab === "water" && (
        <div className="mt-6 space-y-8">
          <div>
            <h3 className="font-landing-display text-headline-sm text-text-primary">
              Rivers and waterways
            </h3>
            <p className="mt-1 text-body-sm text-text-muted">
              {rivers.length} catalogued, longest first.
            </p>
            <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
              {rivers.map((w) => (
                <li key={w.id} className="flex flex-wrap gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md font-semibold text-text-primary">
                      {w.name}
                    </p>
                    <p className="mt-0.5 text-body-sm text-text-muted">
                      {w.type || w.class}
                    </p>
                    <p className="mt-1 text-body-sm text-text-secondary">{w.summary}</p>
                    <StatePills states={w.states} slugByStateId={slugByStateId} />
                  </div>
                  <div className="w-28 shrink-0 text-right">
                    {w.lengthKm != null ? (
                      <>
                        <p className="font-mono text-headline-sm font-semibold text-text-primary">
                          {w.lengthKm.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-text-muted">km in Nigeria</p>
                      </>
                    ) : w.lengthNote ? (
                      <p className="text-[11px] text-text-muted">{w.lengthNote}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-landing-display text-headline-sm text-text-primary">
              Lakes, reservoirs and lagoons
            </h3>
            <ul className="mt-3 grid gap-4 md:grid-cols-2">
              {waterBodies.map((l) => (
                <li
                  key={l.id}
                  className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-landing-display text-headline-sm text-text-primary">
                      {l.name}
                    </h4>
                    <span className="shrink-0 rounded-full border border-border-subtle bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-text-secondary">
                      {l.lakeCategory || "water body"}
                    </span>
                  </div>
                  {l.type && <p className="mt-1 text-body-sm text-text-muted">{l.type}</p>}
                  <p className="mt-2 text-body-sm text-text-secondary">{l.summary}</p>
                  {l.areaNote && (
                    <p className="mt-2 text-body-sm text-text-secondary">
                      <span className="font-semibold text-slate-800">Size: </span>
                      {l.areaNote}
                    </p>
                  )}
                  <StatePills states={l.states} slugByStateId={slugByStateId} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "coast" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
            <NigeriaThumb
              source="states"
              highlight={[
                ...new Set(
                  coastFeatures
                    .flatMap((c) => c.states)
                    .map((name) => idByStateName[name])
                    .filter((x): x is string => x != null)
                ),
              ]}
              accent="#0e7490"
              className="h-56 w-full"
              title="Coastal states"
            />
            <Link
              href={sectionMapHref("land/physical")}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
            >
              Open terrain map
            </Link>
          </div>
          <ul className="space-y-4">
            {coastFeatures.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
              >
                <h3 className="font-landing-display text-headline-sm text-text-primary">
                  {c.name}
                </h3>
                <p className="mt-1 text-body-sm text-text-muted">{c.type}</p>
                <p className="mt-2 text-body-sm text-text-secondary">{c.summary}</p>
                {c.lengthNote && (
                  <p className="mt-2 text-body-sm text-text-secondary">
                    <span className="font-semibold text-slate-800">Extent: </span>
                    {c.lengthNote}
                  </p>
                )}
                <StatePills states={c.states} slugByStateId={slugByStateId} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <SourceNote className="mt-8" source={data.sources} updated="Repository catalogues" />
    </div>
  );
}

function StatePills({
  states,
  slugByStateId,
}: {
  states: string[];
  slugByStateId: Record<string, string>;
}) {
  if (states.length === 0) return null;
  return (
    <StatePillLinkList states={states} slugByStateId={slugByStateId} />
  );
}
