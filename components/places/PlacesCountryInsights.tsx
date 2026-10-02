"use client";

import { useMemo, useState } from "react";
import PopulationBarChart from "@/components/charts/PopulationBarChart";
import CountryProfile from "@/components/compare/CountryProfile";
import {
  defaultPeriodForCategory,
  getCategories,
  getCategoryData,
} from "@/lib/compare/compareUtils";
import { totalLandAreaKm2 } from "@/lib/compare/landArea";
import { formatAreaKm2 } from "@/lib/map/metrics";
import type { CompareBundle } from "@/types/compare";
import type { LgaLocation, StateLocation } from "@/types/location";

interface RankRow {
  id: string;
  name: string;
  subtitle: string;
  value: number;
}

function formatPopulation(value: number): string {
  return value.toLocaleString("en-US");
}

function formatNaira(value: number): string {
  if (value >= 1e9) return `₦${(value / 1e9).toFixed(1)}bn`;
  if (value >= 1e6) return `₦${(value / 1e6).toFixed(1)}m`;
  return `₦${Math.round(value).toLocaleString("en-US")}`;
}

function formatKm2(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} km²`;
}

function RankBadge({ rank }: { rank: number }) {
  const badge =
    rank === 1
      ? "bg-ng-green text-white"
      : rank <= 3
        ? "bg-emerald-100 text-ng-green"
        : "bg-slate-100 text-text-muted";
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${badge}`}
    >
      {rank}
    </span>
  );
}

function RankedList({
  items,
  formatValue,
}: {
  items: RankRow[];
  formatValue: (value: number) => string;
}) {
  if (items.length === 0) return null;
  return (
    <ol className="divide-y divide-slate-100 rounded-lg border border-slate-100">
      {items.map((row, i) => (
        <li key={row.id} className="flex items-center gap-3 px-3 py-2">
          <RankBadge rank={i + 1} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-800">
              {row.name}
            </span>
            {row.subtitle && (
              <span className="block truncate text-[10px] font-medium text-slate-400">
                {row.subtitle}
              </span>
            )}
          </span>
          <span className="text-sm font-semibold tabular-nums text-text-secondary">
            {formatValue(row.value)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function YearList({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; subtitle?: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h4>
      <ol className="divide-y divide-slate-100 rounded-lg border border-slate-100">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800">
                {row.name}
              </span>
              {row.subtitle && (
                <span className="block truncate text-[10px] font-medium text-slate-400">
                  {row.subtitle}
                </span>
              )}
            </span>
            <span className="text-sm font-semibold tabular-nums text-text-secondary">
              {row.value}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AccordionItem({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-text-muted">
              {count}
            </span>
          )}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="px-3 pb-3 pt-0.5">{children}</div>}
    </div>
  );
}

export default function PlacesCountryInsights({
  states,
  lgas,
  compareBundle,
}: {
  states: StateLocation[];
  lgas: LgaLocation[];
  compareBundle: CompareBundle;
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0, 1]));
  const totalLgas = states.reduce((n, s) => n + s.lgaCount, 0);
  const totalLand = totalLandAreaKm2(
    compareBundle,
    states.map((s) => s.id)
  );

  const generalData = useMemo(
    () => getCategoryData(compareBundle, "state", "general", "default"),
    [compareBundle]
  );

  const populationRanking = useMemo(() => {
    const demoCat = getCategories(compareBundle, "state").find(
      (c) => c.id === "demographics"
    );
    const period = demoCat ? defaultPeriodForCategory(demoCat) : "2023";
    const popData = getCategoryData(
      compareBundle,
      "state",
      "demographics",
      period
    );
    const ranked = states
      .map((s) => {
        const raw = popData[s.id]?.population;
        const population =
          typeof raw === "number" && raw > 0 ? raw : null;
        return population === null
          ? null
          : {
              id: s.id,
              name: s.name,
              subtitle: s.regionName ?? "",
              value: population,
            };
      })
      .filter((r): r is RankRow => r !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    return { ranked, sourceNote: demoCat?.sourceNote ?? "" };
  }, [compareBundle, states]);

  const economyRanking = useMemo(() => {
    const econCat = getCategories(compareBundle, "state").find(
      (c) => c.id === "economy"
    );
    const period = econCat ? defaultPeriodForCategory(econCat) : "2023";
    const econData = getCategoryData(
      compareBundle,
      "state",
      "economy",
      period
    );
    const ranked = states
      .map((s) => {
        const raw = econData[s.id]?.igr;
        const igr =
          typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
        return Number.isFinite(igr) && igr > 0
          ? {
              id: s.id,
              name: s.name,
              subtitle: s.regionName ?? "",
              value: igr,
            }
          : null;
      })
      .filter((r): r is RankRow => r !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    return { ranked, sourceNote: econCat?.sourceNote ?? "" };
  }, [compareBundle, states]);

  const largestLgas = useMemo(() => {
    return lgas
      .filter((l) => typeof l.areaKm2 === "number" && l.areaKm2 > 0)
      .map((l) => ({
        id: l.id,
        name: l.name,
        subtitle: l.stateName,
        value: l.areaKm2 as number,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [lgas]);

  const largestStates = useMemo(() => {
    return states
      .map((s) => {
        const area = generalData[s.id]?.landAreaKm2;
        return typeof area === "number" && area > 0
          ? {
              id: s.id,
              name: s.name,
              subtitle: s.regionName ?? "",
              value: area,
            }
          : null;
      })
      .filter((r): r is RankRow => r !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [states, generalData]);

  const years = useMemo(() => {
    const rows = states
      .map((s) => {
        const year = Number(generalData[s.id]?.yearCreated);
        return Number.isFinite(year) && year > 0
          ? { id: s.id, name: s.name, subtitle: s.regionName, year }
          : null;
      })
      .filter(
        (
          r
        ): r is {
          id: string;
          name: string;
          subtitle: string;
          year: number;
        } => r !== null
      );
    const newest = [...rows]
      .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.subtitle,
        value: String(r.year),
      }));
    const oldest = [...rows]
      .sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.subtitle,
        value: String(r.year),
      }));
    return { newest, oldest };
  }, [states, generalData]);

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section
      id="insights"
      className="border-y border-border-subtle bg-slate-50/40 scroll-mt-32"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <span className="mb-1 block text-label-caps uppercase tracking-widest text-primary">
          Country profile
        </span>
        <h2 className="font-landing-display text-headline-xl text-text-primary">
          Nigeria by the numbers
        </h2>
        <p className="mt-1 max-w-2xl text-body-md text-text-secondary">
          Atlas metrics for the federation — the same categories and sources as
          the explorer compare panel.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "States", value: String(states.length) },
            { label: "LGAs", value: String(totalLgas) },
            {
              label: "Total land area",
              value: totalLand != null ? formatAreaKm2(totalLand) : "—",
            },
            { label: "Geopolitical regions", value: "6" },
          ].map((chip) => (
            <div
              key={chip.label}
              className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center"
            >
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {chip.label}
              </dt>
              <dd className="mt-0.5 text-2xl font-bold text-ng-green">
                {chip.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <CountryProfile bundle={compareBundle} />
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-3 md:grid-cols-2">
          <AccordionItem
            title="Top states by population"
            count={populationRanking.ranked.length}
            open={open.has(0)}
            onToggle={() => toggle(0)}
          >
            <div className="space-y-2">
              {populationRanking.sourceNote && (
                <p className="text-[10px] font-medium text-text-muted">
                  {populationRanking.sourceNote}
                </p>
              )}
              <RankedList
                items={populationRanking.ranked}
                formatValue={formatPopulation}
              />
            </div>
          </AccordionItem>

          <AccordionItem
            title="Top states by economy (IGR)"
            count={economyRanking.ranked.length}
            open={open.has(1)}
            onToggle={() => toggle(1)}
          >
            <div className="space-y-2">
              {economyRanking.sourceNote && (
                <p className="text-[10px] font-medium text-text-muted">
                  {economyRanking.sourceNote}
                </p>
              )}
              <RankedList
                items={economyRanking.ranked}
                formatValue={formatNaira}
              />
            </div>
          </AccordionItem>

          <AccordionItem
            title="Largest LGAs by area"
            count={largestLgas.length}
            open={open.has(2)}
            onToggle={() => toggle(2)}
          >
            <RankedList items={largestLgas} formatValue={formatKm2} />
          </AccordionItem>

          <AccordionItem
            title="Largest states by area"
            count={largestStates.length}
            open={open.has(3)}
            onToggle={() => toggle(3)}
          >
            <RankedList items={largestStates} formatValue={formatKm2} />
          </AccordionItem>

          <AccordionItem
            title="Newest & oldest states"
            count={years.newest.length}
            open={open.has(4)}
            onToggle={() => toggle(4)}
          >
            <div className="space-y-3">
              <YearList title="Newest" rows={years.newest} />
              <YearList title="Oldest" rows={years.oldest} />
            </div>
          </AccordionItem>

          <AccordionItem
            title="LGA count — top states"
            count={states.length}
            open={open.has(5)}
            onToggle={() => toggle(5)}
          >
            <PopulationBarChart states={states} />
          </AccordionItem>
        </div>
      </div>
    </section>
  );
}
