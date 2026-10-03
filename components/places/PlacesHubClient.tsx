"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import type { PlacesDirectoryData } from "@/lib/server/loadPlacesPageData";
import type { PlacesBrowseRow, PlacesLandFeature } from "@/lib/server/loadPlacesPageData";
import NigeriaStateMap from "@/components/places/NigeriaStateMap";
import PlacesCountryInsights from "@/components/places/PlacesCountryInsights";
import StateCompare from "@/components/location/StateCompare";
import type { CompareBundle } from "@/types/compare";
import type { LgaLocation, StateContent, StateLocation } from "@/types/location";
import type {
  PlacesCompareGroup,
  PlacesCompareMetric,
} from "@/lib/server/loadPlacesPageData";
import {
  formatCompareValue,
  formatNumber,
  formatVsMedian,
} from "@/lib/places/formatters";
import {
  IconArrow,
  IconChevronRight,
  IconClose,
  IconExplore,
  IconInfo,
  IconLandmark,
  IconMap,
  IconSearch,
  IconShuffle,
  IconWater,
} from "@/components/landing/icons";

/* --- shared design tokens --------------------------------------------------- */

const TONE_RING: Record<string, string> = {
  primary: "border-l-[#008751]",
  amber: "border-l-amber-500",
  sky: "border-l-sky-500",
  lime: "border-l-lime-500",
  neutral: "border-l-slate-300",
};

/* --- section 1: sticky section bar ------------------------------------------ */

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "insights", label: "Country profile" },
  { id: "compare", label: "Compare States" },
  { id: "browse", label: "Browse Directory" },
  { id: "land", label: "Land & Waters" },
  { id: "map", label: "Explore Map" },
] as const;

function PlacesSectionBar() {
  const [activeSection, setActiveSection] = useState<string>("discover");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px" }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-16 z-40 bg-surface-card/90 backdrop-blur-lg border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
        <nav
          aria-label="Places sections"
          className="hidden md:flex items-center gap-1.5 text-label-md text-text-muted shrink-0"
        >
          <Link href="/" className="hover:text-primary font-semibold">
            Home
          </Link>
          <IconChevronRight className="w-3.5 h-3.5" />
          <span className="text-text-primary font-bold">Places</span>
        </nav>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={activeSection === s.id ? "true" : undefined}
              className={`px-3 py-1.5 rounded-full text-label-md whitespace-nowrap transition-colors ${
                activeSection === s.id
                  ? "bg-primary-container text-white font-bold"
                  : "bg-slate-100 text-text-secondary hover:bg-slate-200"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
        <Link
          href="/places/map"
          className="ml-auto hidden sm:inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-lg bg-[#043828] text-white text-label-md font-bold hover:bg-[#065a41]"
        >
          <IconMap />
          Open explorer
        </Link>
      </div>
    </div>
  );
}

/* --- section 2: hero --------------------------------------------------------- */

const BROWSE_MODES = [
  { id: "states", label: "States" },
  { id: "lgas", label: "LGAs" },
  { id: "metros", label: "Metros" },
  { id: "land", label: "Land features" },
] as const;

type BrowseMode = (typeof BROWSE_MODES)[number]["id"];

function PlacesHero({
  data,
  mode,
  onModeChange,
  query,
  onQueryChange,
  categoryCounts,
  selectedStateId,
  onSelectState,
}: {
  data: PlacesDirectoryData;
  mode: BrowseMode;
  onModeChange: (m: BrowseMode) => void;
  query: string;
  onQueryChange: (q: string) => void;
  categoryCounts: Record<BrowseMode, number>;
  selectedStateId: string | null;
  onSelectState: (id: string | null) => void;
}) {
  const popular = ["Lagos", "Kano", "Rivers", "Borno", "Osun"];
  const mapStates = data.allStates.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    regionName: s.regionName,
    capital: s.capital,
    population: s.population,
  }));
  const selected = selectedStateId
    ? data.allStates.find((s) => s.id === selectedStateId)
    : null;
  const dossier = selectedStateId ? data.stateDossiers[selectedStateId] : null;

  return (
    <section
      id="overview"
      className="scroll-mt-32 border-b border-border-subtle bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 md:px-8">
        <div className="mb-8 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-label-caps text-lime-800">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-600" />
            NIGERIA OVERVIEW · PLACES
          </span>
          <h1 className="mt-4 font-landing-display text-headline-xl-mobile text-text-primary md:text-headline-xl">
            Where in Nigeria do you want to explore?
          </h1>
          <p className="mt-3 max-w-2xl text-body-lg text-text-secondary">
            Every state, LGA, metropolis and land feature — tap the map for a
            snapshot, then dive into profiles, compare and the full atlas.
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div className="rounded-3xl border border-border-subtle bg-surface-card p-5 shadow-sm md:p-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-2 py-4">
              <NigeriaStateMap
                states={mapStates}
                selectedId={selectedStateId}
                onSelect={(id) => onSelectState(id)}
                mapClassName="h-[22rem] w-full md:h-[30rem]"
              />
            </div>
          </div>

          <div className="min-h-[20rem] rounded-3xl border border-border-subtle bg-surface-card p-5 shadow-sm md:p-6">
            {selected && dossier ? (
              <aside aria-label={`${selected.name} snapshot`} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-label-caps font-bold uppercase tracking-widest text-primary">
                      State snapshot
                    </span>
                    <h2 className="truncate font-landing-display text-headline-md text-text-primary">
                      {dossier.title}
                    </h2>
                    <p className="text-body-sm text-text-muted">{dossier.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectState(null)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 text-label-md font-semibold text-text-secondary hover:bg-slate-50"
                    aria-label="Back to Nigeria overview"
                  >
                    <IconClose className="h-4 w-4" />
                    Nigeria
                  </button>
                </div>

                <p className="mt-3 text-body-sm text-text-secondary">{dossier.summary}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  {dossier.facts.map((f) => (
                    <div
                      key={f.label}
                      className={`rounded-xl border border-border-subtle border-l-4 ${TONE_RING[f.tone]} bg-slate-50/60 p-3`}
                    >
                      <dt className="text-label-caps font-bold text-text-muted">{f.label}</dt>
                      <dd className="font-landing-display text-headline-sm tabular-nums text-text-primary">
                        {f.value}
                      </dd>
                      <dd className="text-[11px] text-text-muted">{f.note}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {dossier.dossierLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-label-md font-bold ${link.tone}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  {dossier.profileHref && (
                    <Link
                      href={dossier.profileHref}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary-container px-5 text-label-md font-semibold text-white hover:bg-[#006d40]"
                    >
                      <IconLandmark className="h-4 w-4" />
                      Open {selected.name} profile
                    </Link>
                  )}
                  <Link
                    href={dossier.mapHref}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-primary-container px-5 text-label-md font-semibold text-primary hover:bg-emerald-50"
                  >
                    <IconMap />
                    On the map
                  </Link>
                </div>
              </aside>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-label-caps font-bold uppercase tracking-wider text-text-muted">
                    Tap a state
                  </p>
                  <h2 className="font-landing-display text-headline-md text-text-primary">
                    Nigeria in numbers
                  </h2>
                  <p className="mt-1 text-body-sm text-text-secondary">
                    {[
                      data.country.capital
                        ? `Capital ${data.country.capital}`
                        : null,
                      data.country.independence
                        ? `Independent since ${data.country.independence}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  {data.country.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-xl border border-border-subtle border-l-4 ${TONE_RING[stat.tone]} bg-slate-50/60 px-3 py-2.5`}
                    >
                      <dt className="text-label-caps font-bold uppercase text-text-muted">
                        {stat.label}
                      </dt>
                      <dd className="font-landing-display text-headline-sm tabular-nums text-text-primary">
                        {stat.value}
                      </dd>
                      <dd className="text-[11px] text-text-muted">{stat.note}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-body-sm text-text-muted">
                  Select any state on the map to preview it here — use the{" "}
                  <span className="font-semibold text-text-secondary">×</span>{" "}
                  control to return to this overview.
                </p>
              </div>
            )}
          </div>
        </div>

        <form
          className="mt-10 max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            document
              .getElementById("browse")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-card px-4 py-3 shadow-sm focus-within:border-primary-container focus-within:ring-4 focus-within:ring-emerald-100">
            <IconSearch className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search a state, LGA, metropolis or land feature…"
              aria-label="Search the Places directory"
              className="flex-1 bg-transparent text-body-md text-text-primary outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-label-md font-bold text-white hover:bg-[#006d40]"
            >
              Search
              <IconArrow />
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-body-sm text-text-muted">
          <span className="text-label-caps font-semibold">Popular:</span>
          {popular.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onQueryChange(name)}
              className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 font-semibold transition-colors hover:border-primary-container hover:text-primary"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="mt-7">
          <span className="mb-2 block text-label-caps font-bold uppercase tracking-widest text-text-muted">
            Browse by
          </span>
          <div
            role="tablist"
            aria-label="Browse by category"
            className="inline-flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-slate-100 p-1"
          >
            {BROWSE_MODES.map((m) => {
              const count = categoryCounts[m.id];
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === m.id}
                  onClick={() => onModeChange(m.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-label-md transition-all ${
                    mode === m.id
                      ? "bg-[#043828] font-bold text-white shadow-sm"
                      : "font-semibold text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {m.label}
                  <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- section 4: Compare States ---------------------------------------------- */

function MetricRow({
  metric,
  ids,
  names,
}: {
  metric: PlacesCompareMetric;
  ids: string[];
  names: Record<string, string>;
}) {
  const best = ids.reduce<{ id: string; rank: number } | null>((acc, id) => {
    const rank = metric.ranks[id];
    if (rank === undefined) return acc;
    if (!acc || rank < acc.rank) return { id, rank };
    return acc;
  }, null);

  return (
    <div className="px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-label-caps font-bold uppercase tracking-wider text-text-muted">
          {metric.label}
        </span>
        <span className="text-[11px] text-slate-400">{metric.note}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-4">
        {ids.map((id) => {
          const value = metric.values[id] ?? null;
          const vs = formatVsMedian(value, metric.median);
          const isBest = best?.id === id;
          return (
            <div
              key={id}
              className={`rounded-xl border px-2.5 py-2 ${
                isBest
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-border-subtle bg-surface-card"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isBest && (
                  <span
                    className="text-[11px] text-primary"
                    aria-label={`Best of the three, rank ${metric.ranks[id]}`}
                  >
                    &#9733;
                  </span>
                )}
                <span className="truncate text-[11px] font-semibold text-text-muted">
                  {names[id]}
                </span>
              </div>
              <p className="font-landing-display text-headline-sm leading-tight tabular-nums text-text-primary">
                {formatCompareValue(value, metric.format)}
                {metric.unit && (
                  <span className="ml-0.5 font-sans text-[11px] text-slate-400">
                    {metric.unit}
                  </span>
                )}
              </p>
              <p
                className={`text-[11px] font-semibold ${
                  vs.tone === "up"
                    ? "text-emerald-600"
                    : vs.tone === "down"
                      ? "text-rose-500"
                      : "text-slate-400"
                }`}
              >
                {vs.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareGroup({
  group,
  ids,
  names,
}: {
  group: PlacesCompareGroup;
  ids: string[];
  names: Record<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
      <div className="border-b border-border-subtle bg-slate-50 px-4 py-3 sm:px-5">
        <h3 className="font-landing-display text-headline-sm text-text-primary">
          {group.label}
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {group.metrics.map((m) => (
          <MetricRow key={m.key} metric={m} ids={ids} names={names} />
        ))}
      </div>
    </div>
  );
}

function PlacesHubCompare({
  groups,
  allStates,
  states,
  contents,
  lgas,
  compareBundle,
  defaultCompare,
  initialCompare,
}: {
  groups: PlacesCompareGroup[];
  allStates: PlacesDirectoryData["allStates"];
  states: StateLocation[];
  contents: StateContent[];
  lgas: LgaLocation[];
  compareBundle: CompareBundle;
  defaultCompare: [string, string, string];
  initialCompare?: string[];
}) {
  const starting = useMemo<[string, string, string]>(() => {
    const known = new Set(allStates.map((s) => s.id));
    const wanted = (initialCompare ?? defaultCompare).filter((id) =>
      known.has(id)
    );
    if (wanted.length === 3) return wanted as [string, string, string];
    const fill = defaultCompare.filter((id) => !wanted.includes(id));
    return [
      wanted[0] ?? fill[0],
      wanted[1] ?? fill[1],
      wanted[2] ?? fill[2],
    ] as [string, string, string];
  }, [defaultCompare, initialCompare, allStates]);

  const [ids, setIds] = useState<string[]>(starting);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setIds(starting);
  }, [starting]);

  const names = useMemo(
    () => Object.fromEntries(allStates.map((s) => [s.id, s.name])),
    [allStates]
  );

  const picked = useMemo(
    () =>
      ids
        .map((id) => states.find((s) => s.id === id))
        .filter((s): s is StateLocation => Boolean(s)),
    [ids, states]
  );

  const swap = (slot: number) => {
    const used = new Set(ids);
    const next = allStates.find((s) => !used.has(s.id));
    if (!next) return;
    setIds((prev) => {
      const copy = [...prev];
      copy[slot] = next.id;
      return copy;
    });
  };

  return (
    <section
      id="compare"
      className="scroll-mt-32 border-y border-border-subtle bg-surface-card"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-1 block text-label-caps uppercase tracking-widest text-primary">
              Head to head
            </span>
            <h2 className="font-landing-display text-headline-xl text-text-primary">
              Compare states side by side
            </h2>
            <p className="mt-1 max-w-2xl text-body-md text-text-secondary">
              Same categories, tabs and metric rows as the explorer — pick three
              states and read them line by line.
            </p>
          </div>
          <Link
            href="/economy/map"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3.5 py-2 text-label-md font-bold text-text-secondary hover:bg-slate-50"
          >
            <IconMap />
            Map it
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ids.map((id, slot) => (
            <div
              key={slot}
              className="flex items-center gap-2 rounded-xl border border-border-subtle bg-slate-50 p-2"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary-container text-label-caps font-bold text-white">
                {slot + 1}
              </span>
              <select
                value={id}
                aria-label={`State for column ${slot + 1}`}
                onChange={(e) =>
                  setIds((prev) => {
                    const copy = [...prev];
                    copy[slot] = e.target.value;
                    return copy;
                  })
                }
                className="flex-1 bg-transparent text-label-md font-bold text-text-primary outline-none"
              >
                {allStates.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => swap(slot)}
                aria-label={`Swap state for column ${slot + 1}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-surface-card hover:text-slate-700"
              >
                <IconShuffle className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
          {groups.map((g) => (
            <CompareGroup key={g.id} group={g} ids={ids} names={names} />
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-container px-5 py-2.5 text-label-md font-bold text-primary hover:bg-emerald-50"
          >
            {showAll ? "Hide detailed categories" : "View more — every category & year"}
            <IconChevronRight
              className={`h-4 w-4 transition-transform ${showAll ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
        </div>

        {showAll && (
          <div className="mt-6 rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
            {picked.length === 3 ? (
              <StateCompare
                states={picked}
                contents={contents}
                lgas={lgas}
                compareBundle={compareBundle}
              />
            ) : (
              <p className="text-body-sm text-text-muted">
                Choose three distinct states to compare.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* --- section 5: Browse Territories & Features ------------------------------- */

function BrowseDirectory({ rows }: { rows: PlacesBrowseRow[] }) {
  const [zone, setZone] = useState("ALL");
  const zones = useMemo(
    () => ["ALL", ...Array.from(new Set(rows.map((r) => r.zone).filter(Boolean)))],
    [rows]
  );
  const visible = zone === "ALL" ? rows : rows.filter((r) => r.zone === zone);
  const shown = visible.slice(0, 18);

  return (
    <section id="browse" className="max-w-7xl mx-auto px-4 md:px-8 py-14 scroll-mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
            Browse directory
          </span>
          <h2 className="font-landing-display text-headline-xl text-text-primary">
            Territories &amp; features
          </h2>
          <p className="text-body-md text-text-secondary mt-1 max-w-2xl">
            {rows.length} entries — every state, the largest LGAs, the biggest
            conurbations and the headwaters that hold them together.
          </p>
        </div>
        <span className="text-body-sm text-text-muted tabular-nums">
          Showing {shown.length} of {visible.length}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {zones.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setZone(z)}
            aria-pressed={zone === z}
            className={`px-3 py-1.5 rounded-full text-label-md transition-colors ${
              zone === z
                ? "bg-[#043828] text-white font-bold"
                : "bg-slate-100 text-text-secondary hover:bg-slate-200 font-semibold"
            }`}
          >
            {z === "ALL" ? "All" : z}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-label-caps text-text-muted uppercase tracking-wider">
              <th scope="col" className="px-4 py-3 font-bold">Place</th>
              <th scope="col" className="px-4 py-3 font-bold hidden sm:table-cell">Zone</th>
              <th scope="col" className="px-4 py-3 font-bold hidden md:table-cell">Seat</th>
              <th scope="col" className="px-4 py-3 font-bold hidden md:table-cell">LGAs</th>
              <th scope="col" className="px-4 py-3 font-bold">Population</th>
              <th scope="col" className="px-4 py-3 font-bold text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => (
              <tr key={`${r.category}-${r.id}`} className="hover:bg-slate-50/70">
                <th scope="row" className="px-4 py-3 font-normal">
                  <span className="font-landing-display text-headline-sm text-text-primary">
                    {r.name}
                  </span>
                </th>
                <td className="px-4 py-3 text-body-sm text-text-secondary hidden sm:table-cell">
                  {r.zone}
                </td>
                <td className="px-4 py-3 text-body-sm text-text-secondary hidden md:table-cell">
                  {r.seat}
                </td>
                <td className="px-4 py-3 text-body-sm text-text-secondary tabular-nums hidden md:table-cell">
                  {r.lgaCount === null ? "—" : r.lgaCount}
                </td>
                <td className="px-4 py-3 text-body-sm text-text-primary font-semibold tabular-nums">
                  {r.population}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={r.href ?? r.exploreHref}
                    className="inline-flex items-center gap-1 text-label-md font-bold text-primary hover:underline"
                  >
                    {r.actionLabel}
                    <IconChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length > shown.length && (
        <p className="mt-3 text-body-sm text-text-muted">
          Use the zone filters, or the search above, to reach the remaining{" "}
          {visible.length - shown.length} entries.
        </p>
      )}
    </section>
  );
}

/* --- section 7: Land & Waters ----------------------------------------------- */

const LAND_TONE: Record<PlacesLandFeature["tone"], string> = {
  sky: "from-sky-600 to-sky-900",
  lime: "from-lime-600 to-emerald-900",
};

function LandCard({ feature }: { feature: PlacesLandFeature }) {
  return (
    <article className="rounded-2xl overflow-hidden border border-border-subtle bg-surface-card shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div
        className={`relative h-28 bg-gradient-to-br ${LAND_TONE[feature.tone]}`}
      >
        <div className="absolute inset-0 landing-contour-overlay opacity-30" aria-hidden />
        <div className="absolute inset-0 flex items-end justify-between gap-2 p-4">
          <span className="px-2 py-0.5 rounded-md bg-surface-card/20 text-white text-label-caps font-bold border border-white/25">
            {feature.badge}
          </span>
          <span className="text-label-caps text-white/90 font-bold tabular-nums">
            {feature.metric}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-landing-display text-headline-md text-text-primary">
          {feature.name}
        </h3>
        <p className="text-body-sm text-text-secondary mt-2 flex-1">{feature.summary}</p>
        <p className="text-[11px] text-text-muted mt-3 font-semibold">
          {feature.detail}
        </p>
        <Link
          href={feature.exploreHref}
          className="mt-4 inline-flex items-center gap-1.5 text-label-md font-bold text-primary hover:underline"
        >
          {feature.name} on the map
          <IconArrow />
        </Link>
      </div>
    </article>
  );
}

function LandBand({
  features,
  stateCount,
  lgaCount,
}: {
  features: PlacesLandFeature[];
  stateCount: number;
  lgaCount: number;
}) {
  const notes = [
    { label: "States & FCT", value: String(stateCount) },
    { label: "Local government areas", value: formatNumber(lgaCount) },
    { label: "Geopolitical zones", value: "6" },
    { label: "Mapped features", value: String(features.length) },
  ];

  return (
    <section id="land" className="max-w-7xl mx-auto px-4 md:px-8 py-14 scroll-mt-32">
      <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
        Featured land &amp; waters
      </span>
      <h2 className="font-landing-display text-headline-xl text-text-primary">
        The geography underneath it all
      </h2>
      <p className="text-body-md text-text-secondary mt-1 max-w-2xl">
        Rivers, reservoirs and highlands that decide where people settle and how
        the states are shaped.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f) => (
          <LandCard key={f.id} feature={f} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 border border-border-subtle p-5">
        <div className="flex items-start gap-2">
          <span className="text-slate-400 mt-0.5 shrink-0">
            <IconInfo />
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {notes.map((n) => (
              <div key={n.label}>
                <p className="text-label-caps text-text-muted font-bold uppercase">
                  {n.label}
                </p>
                <p className="font-landing-display text-headline-md text-text-primary tabular-nums">
                  {n.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- section 8: map CTA ------------------------------------------------------ */

function MapCta({ landFeatures }: { landFeatures: PlacesLandFeature[] }) {
  return (
    <section id="map" className="max-w-7xl mx-auto px-4 md:px-8 pb-20 scroll-mt-32">
      <div className="rounded-3xl border border-border-subtle bg-surface-card shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-12 items-center">
          <div className="lg:col-span-7">
            <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
              Take it further
            </span>
            <h2 className="font-landing-display text-headline-xl text-text-primary">
              Put all 37 states on one canvas
            </h2>
            <p className="text-body-md text-text-secondary mt-2 max-w-xl">
              Open the explorer to move between the political, economic and
              physical lenses with every place in the atlas already geocoded.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/places/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-white text-label-md font-bold hover:bg-[#006d40]"
              >
                <IconExplore />
                Open the explorer
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-subtle text-text-primary text-label-md font-bold hover:bg-slate-50"
              >
                Back to Home
                <IconArrow />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ul className="space-y-2">
              {landFeatures.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-slate-50 px-4 py-3"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-primary shrink-0">
                      {f.tone === "sky" ? <IconWater /> : <IconLandmark />}
                    </span>
                    <span className="text-label-md font-bold truncate text-text-primary">
                      {f.name}
                    </span>
                  </span>
                  <span className="text-[11px] text-text-muted tabular-nums shrink-0">
                    {f.metric}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- page ------------------------------------------------------------------- */

export type PlacesHubClientProps = {
  directory: PlacesDirectoryData;
  compareStates: StateLocation[];
  compareContents: StateContent[];
  compareLgas: LgaLocation[];
  compareBundle: CompareBundle;
};

export default function PlacesHubClient({
  directory,
  compareStates,
  compareContents,
  compareLgas,
  compareBundle,
}: PlacesHubClientProps) {
  const { allStates, lgaCount, stateCount } = directory;
  const [mode, setMode] = useState<BrowseMode>("states");
  const [query, setQuery] = useState("");
  const [heroStateId, setHeroStateId] = useState<string | null>(null);

  /* `?compare=NG-LA,NG-KN` seeds the matrix from a state profile link. Read
     after mount so the prerendered page stays static and hydration matches. */
  const [compareSeed, setCompareSeed] = useState<string[] | undefined>();
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("compare");
    if (!raw) return;
    setCompareSeed(
      raw
        .split(",")
        .map((id) => id.trim().toUpperCase())
        .filter(Boolean)
    );
  }, []);

  const categoryCounts = useMemo(
    () => ({
      states: directory.browseRows.filter((r) => r.category === "STATE").length,
      lgas: directory.browseRows.filter((r) => r.category === "LGA").length,
      metros: directory.browseRows.filter((r) => r.category === "METRO").length,
      land: directory.browseRows.filter(
        (r) => r.category === "LAND FEATURE"
      ).length,
    }),
    [directory.browseRows]
  );

  const filteredBrowse = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byMode = (row: PlacesBrowseRow) => {
      if (mode === "states") return row.category === "STATE";
      if (mode === "lgas") return row.category === "LGA";
      if (mode === "metros") return row.category === "METRO";
      return row.category === "LAND FEATURE";
    };
    const base = directory.browseRows.filter(byMode);
    if (!q) return base;
    return base.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.seat.toLowerCase().includes(q)
    );
  }, [directory.browseRows, mode, query]);

  return (
    <HubShell canvas="white">
      <HubHeader primaryCta={{ label: "Places map", href: "/places/map" }} />
      <PlacesSectionBar />

      <PlacesHero
        data={directory}
        mode={mode}
        onModeChange={setMode}
        query={query}
        onQueryChange={setQuery}
        categoryCounts={categoryCounts}
        selectedStateId={heroStateId}
        onSelectState={setHeroStateId}
      />

      <PlacesCountryInsights
        states={compareStates}
        lgas={compareLgas}
        compareBundle={compareBundle}
      />

      <PlacesHubCompare
        groups={directory.compareGroups}
        allStates={allStates}
        states={compareStates}
        contents={compareContents}
        lgas={compareLgas}
        compareBundle={compareBundle}
        defaultCompare={directory.defaultCompare}
        initialCompare={compareSeed}
      />

      <BrowseDirectory rows={filteredBrowse} />

      <LandBand
        features={directory.landFeatures}
        stateCount={stateCount}
        lgaCount={lgaCount}
      />

      <MapCta landFeatures={directory.landFeatures} />

      <HubFooter />
    </HubShell>
  );
}
