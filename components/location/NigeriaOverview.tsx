"use client";

import { useMemo, useState } from "react";
import PopulationBarChart from "@/components/charts/PopulationBarChart";
import CountryProfile from "@/components/compare/CountryProfile";
import { useMapStore } from "@/lib/store/mapStore";
import { totalLandAreaKm2 } from "@/lib/compare/landArea";
import {
  getCategoryData,
  getCategories,
  defaultPeriodForCategory,
} from "@/lib/compare/compareUtils";
import { formatAreaKm2 } from "@/lib/map/metrics";
import type { CompareBundle } from "@/types/compare";
import type {
  CountryNote,
  CountryNotesMap,
  LgaLocation,
  PeopleNotesMap,
  StateLocation,
  WikiNote,
} from "@/types/location";

interface NigeriaOverviewProps {
  states: StateLocation[];
  lgas?: LgaLocation[];
  compareBundle: CompareBundle;
  countryNotes?: CountryNotesMap;
  peopleNotes?: PeopleNotesMap;
}

const NOTE_CATEGORY_STYLES: Record<string, string> = {
  history: "bg-sky-50 text-sky-700 border-sky-200",
  culture: "bg-violet-50 text-violet-700 border-violet-200",
  festival: "bg-pink-50 text-pink-700 border-pink-200",
  institution: "bg-orange-50 text-orange-700 border-orange-200",
  geography: "bg-amber-50 text-amber-700 border-amber-200",
  economy: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const CATEGORY_ORDER = [
  "history",
  "culture",
  "festival",
  "institution",
  "geography",
  "economy",
];

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

interface RankRow {
  id: string;
  name: string;
  subtitle: string;
  value: number;
}

function RankBadge({ rank }: { rank: number }) {
  const badge =
    rank === 1
      ? "bg-ng-green text-white"
      : rank <= 3
        ? "bg-emerald-100 text-ng-green"
        : "bg-slate-100 text-slate-500";
  return (
    <span
      className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold ${badge}`}
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
    <ol className="rounded-lg border border-slate-100 divide-y divide-slate-100">
      {items.map((row, i) => (
        <li key={row.id} className="flex items-center gap-3 px-3 py-2">
          <RankBadge rank={i + 1} />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-slate-800 truncate">
              {row.name}
            </span>
            {row.subtitle && (
              <span className="block text-[10px] font-medium text-slate-400 truncate">
                {row.subtitle}
              </span>
            )}
          </span>
          <span className="text-sm font-semibold text-slate-600 tabular-nums">
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
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {title}
      </h4>
      <ol className="rounded-lg border border-slate-100 divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 px-3 py-2">
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-slate-800 truncate">
                {row.name}
              </span>
              {row.subtitle && (
                <span className="block text-[10px] font-medium text-slate-400 truncate">
                  {row.subtitle}
                </span>
              )}
            </span>
            <span className="text-sm font-semibold text-slate-600 tabular-nums">
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
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-800">
            {title}
          </span>
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5">
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

export default function NigeriaOverview({
  states,
  lgas = [],
  compareBundle,
  countryNotes = {},
  peopleNotes = {},
}: NigeriaOverviewProps) {
  const openWikiModal = useMapStore((s) => s.openWikiModal);
  const [openIndex, setOpenIndex] = useState(0);
  const totalLgas = states.reduce((n, s) => n + s.lgaCount, 0);
  const totalLand = totalLandAreaKm2(
    compareBundle,
    states.map((s) => s.id)
  );

  const countryNoteList: CountryNote[] = useMemo(
    () => Object.values(countryNotes).flat(),
    [countryNotes]
  );

  const groupedNotes = useMemo(() => {
    const groups = new Map<string, CountryNote[]>();
    for (const note of countryNoteList) {
      const list = groups.get(note.category) ?? [];
      list.push(note);
      groups.set(note.category, list);
    }
    return groups;
  }, [countryNoteList]);

  const orderedCategories = useMemo(() => {
    const present = new Set(groupedNotes.keys());
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    for (const c of present) {
      if (!ordered.includes(c)) ordered.push(c);
    }
    return ordered;
  }, [groupedNotes]);

  const generalData = useMemo(() => {
    return getCategoryData(compareBundle, "state", "general", "default");
  }, [compareBundle]);

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
        (r): r is {
          id: string;
          name: string;
          subtitle: string;
          year: number;
        } => r !== null
      );
    const newest = [...rows]
      .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((r) => ({ id: r.id, name: r.name, subtitle: r.subtitle, value: String(r.year) }));
    const oldest = [...rows]
      .sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((r) => ({ id: r.id, name: r.name, subtitle: r.subtitle, value: String(r.year) }));
    return { newest, oldest };
  }, [states, generalData]);

  const peopleList: WikiNote[] = useMemo(
    () => Object.values(peopleNotes).flat(),
    [peopleNotes]
  );

  const toggle = (i: number) => setOpenIndex(openIndex === i ? -1 : i);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Nigeria</h2>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          The Federal Republic of Nigeria — 36 states, the Federal Capital
          Territory, 774 local government areas, and 6 geopolitical regions.
          Click a state on the map, pick a region above, or search to explore.
          Select up to 3 states to compare side by side.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            States
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">
            {states.length}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            LGAs
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">
            {totalLgas}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total land area
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">
            {totalLand != null ? formatAreaKm2(totalLand) : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Geopolitical regions
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">6</dd>
        </div>
      </dl>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Country profile
        </p>
        <CountryProfile bundle={compareBundle} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Highlights
        </p>
        <div className="space-y-2">
          <AccordionItem
            title="Interesting history"
            count={countryNoteList.length}
            open={openIndex === 0}
            onToggle={() => toggle(0)}
          >
            <div className="space-y-4">
              {orderedCategories.map((category) => {
                const notes = groupedNotes.get(category) ?? [];
                return (
                  <div key={category}>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      {category}
                    </h4>
                    <ul className="space-y-2">
                      {notes.map((n, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-slate-100 px-2.5 py-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              n.url && openWikiModal(n.url, n.title)
                            }
                            disabled={!n.url}
                            className="group w-full text-left"
                          >
                            <span className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-ng-green">
                              {n.title}
                              <span
                                className={`rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                                  NOTE_CATEGORY_STYLES[n.category] ??
                                  "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                              >
                                {n.category}
                              </span>
                            </span>
                          </button>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1">
                            {n.note}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </AccordionItem>

          <AccordionItem
            title="Top states by population"
            count={populationRanking.ranked.length}
            open={openIndex === 1}
            onToggle={() => toggle(1)}
          >
            <div className="space-y-2">
              {populationRanking.sourceNote && (
                <p className="text-[10px] font-medium text-slate-500">
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
            title="Top states by economy"
            count={economyRanking.ranked.length}
            open={openIndex === 2}
            onToggle={() => toggle(2)}
          >
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-slate-500">
                Internal revenue (IGR)
              </p>
              {economyRanking.sourceNote && (
                <p className="text-[10px] font-medium text-slate-500">
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
            open={openIndex === 3}
            onToggle={() => toggle(3)}
          >
            <RankedList items={largestLgas} formatValue={formatKm2} />
          </AccordionItem>

          <AccordionItem
            title="Largest states by area"
            count={largestStates.length}
            open={openIndex === 4}
            onToggle={() => toggle(4)}
          >
            <RankedList items={largestStates} formatValue={formatKm2} />
          </AccordionItem>

          <AccordionItem
            title="Newest & oldest states"
            count={years.newest.length}
            open={openIndex === 5}
            onToggle={() => toggle(5)}
          >
            <div className="space-y-3">
              <YearList title="Newest" rows={years.newest} />
              <YearList title="Oldest" rows={years.oldest} />
            </div>
          </AccordionItem>

          <AccordionItem
            title="LGA count — top states"
            count={states.length}
            open={openIndex === 6}
            onToggle={() => toggle(6)}
          >
            <PopulationBarChart states={states} />
          </AccordionItem>

          {peopleList.length > 0 && (
            <AccordionItem
              title="Famous people"
              count={peopleList.length}
              open={openIndex === 7}
              onToggle={() => toggle(7)}
            >
              <ul className="space-y-2">
                {peopleList.map((n, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-slate-100 px-2.5 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => n.url && openWikiModal(n.url, n.title)}
                      disabled={!n.url}
                      className="group w-full text-left"
                    >
                      <span className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-ng-green">
                        {n.title}
                        <span
                          className={`rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                            NOTE_CATEGORY_STYLES[n.category] ??
                            "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {n.category}
                        </span>
                      </span>
                    </button>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      {n.note}
                    </p>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          )}
        </div>
      </div>
    </div>
  );
}