"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import type { PlacesDirectoryData } from "@/lib/server/loadPlacesPageData";
import type {
  PlacesBrowseRow,
  PlacesCompareGroup,
  PlacesCompareMetric,
  PlacesDossier,
  PlacesLandFeature,
  PlacesSpotlightItem,
  PlacesZoneCard,
} from "@/lib/server/loadPlacesPageData";
import NigeriaStateMap from "@/components/places/NigeriaStateMap";
import {
  formatCompareValue,
  formatNumber,
  formatPopulation,
  formatVsMedian,
} from "@/lib/places/formatters";
import {
  IconArrow,
  IconChevronRight,
  IconClose,
  IconDock,
  IconExplore,
  IconExternal,
  IconFinance,
  IconInfo,
  IconLandmark,
  IconMap,
  IconPlane,
  IconSearch,
  IconShare,
  IconShuffle,
  IconTrend,
  IconUsers,
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

const CATEGORY_TONE: Record<PlacesBrowseRow["category"], string> = {
  STATE: "bg-primary-container text-white",
  METRO: "bg-slate-800 text-white",
  LGA: "bg-sky-100 text-sky-800",
  "LAND FEATURE": "bg-lime-100 text-lime-800",
};

const DOSSIER_ICON: Record<string, typeof IconPlane> = {
  plane: IconPlane,
  finance: IconFinance,
  people: IconUsers,
  map: IconMap,
  landmark: IconLandmark,
  water: IconWater,
  dock: IconDock,
  external: IconExternal,
  arrow: IconArrow,
  explore: IconExplore,
  share: IconShare,
  info: IconInfo,
  trend: IconTrend,
  shuffle: IconShuffle,
  search: IconSearch,
  close: IconClose,
};

/** Per-card art for the Discover Today rail, keyed by the spotlights' position. */
const SPOTLIGHT_TONE: Record<string, string> = {
  STATE: "from-[#008751] to-emerald-800",
  METRO: "from-slate-800 to-slate-950",
  LGA: "from-sky-600 to-sky-900",
  "LAND FEATURE": "from-lime-600 to-emerald-900",
};

/* --- section 1: sticky section bar ------------------------------------------ */

const SECTIONS = [
  { id: "discover", label: "Discover Today" },
  { id: "compare", label: "Compare States" },
  { id: "browse", label: "Browse Directory" },
  { id: "zones", label: "Six Zones" },
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
}: {
  data: PlacesDirectoryData;
  mode: BrowseMode;
  onModeChange: (m: BrowseMode) => void;
  query: string;
  onQueryChange: (q: string) => void;
  categoryCounts: Record<BrowseMode, number>;
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

  return (
    <section className="relative overflow-hidden bg-surface-canvas">
      <div
        className="absolute inset-0 landing-topo-grid opacity-60 pointer-events-none"
        aria-hidden
      />
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-300 text-[#1a2e05] text-label-caps font-bold tracking-widest uppercase border border-lime-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a2e05] landing-pulse-radar" />
            Live directory
          </div>
          <h1 className="font-landing-display text-display-lg text-text-primary mt-4">
            Where in Nigeria do you want to explore?
          </h1>
          <p className="text-body-lg text-text-secondary mt-3 max-w-2xl">
            Every state, LGA, metropolis and geomorphic feature in one place —
            capitals, populations, land area, revenue and governance, straight from
            the atlas data.
          </p>

          {/* Search */}
          <form
            className="mt-7 max-w-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById("browse")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <div className="flex items-center gap-3 bg-surface-card rounded-2xl border border-border-subtle shadow-sm focus-within:border-primary-container focus-within:ring-4 focus-within:ring-emerald-100 px-4 py-3">
              <IconSearch className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search a state, LGA, metropolis or land feature…"
                aria-label="Search the Places directory"
                className="flex-1 bg-transparent text-body-md text-text-primary placeholder:text-slate-400 outline-none"
              />
              <kbd className="hidden sm:block text-label-caps text-slate-400 border border-border-subtle rounded-md px-1.5 py-0.5">
                ⌘K
              </kbd>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-white text-label-md font-bold hover:bg-[#006d40] shrink-0"
              >
                <span>Search</span>
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
                className="px-2.5 py-1 rounded-full bg-surface-card border border-border-subtle hover:border-primary-container hover:text-primary font-semibold transition-colors"
              >
                {name}
              </button>
            ))}
          </div>

          {/* Browse-by segmented control */}
          <div className="mt-7">
            <span className="text-label-caps text-text-muted font-bold tracking-widest uppercase block mb-2">
              Browse by
            </span>
            <div
              role="tablist"
              aria-label="Browse by category"
              className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 border border-border-subtle"
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
                    className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${
                      mode === m.id
                        ? "bg-[#043828] text-white font-bold shadow-sm"
                        : "text-text-secondary font-semibold hover:text-text-primary"
                    }`}
                  >
                    {m.label}
                    <span className="ml-1.5 opacity-70 tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <NigeriaStateMap states={mapStates} className="pb-12" />
          <div className="-mt-6 rounded-2xl border border-border-subtle bg-surface-card shadow-sm p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-landing-display text-headline-md text-text-primary">
                Nigeria in numbers
              </h2>
              <span className="text-label-caps text-text-muted font-bold uppercase">
                {data.country.officialName}
              </span>
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              {[
                data.country.capital ? `Capital ${data.country.capital}` : null,
                data.country.independence
                  ? `Independent since ${data.country.independence}`
                  : null,
                data.country.governmentType,
                data.country.currency,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {data.country.stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-xl border border-border-subtle border-l-4 ${TONE_RING[stat.tone]} bg-slate-50/60 px-3 py-2.5`}
                >
                  <dt className="text-label-caps text-text-muted font-bold uppercase">
                    {stat.label}
                  </dt>
                  <dd className="font-landing-display text-headline-sm text-text-primary tabular-nums">
                    {stat.value}
                  </dd>
                  <dd className="text-[11px] text-text-muted">{stat.note}</dd>
                </div>
              ))}
            </dl>
            {data.country.languages && (
              <p className="mt-4 text-body-sm text-text-secondary">
                <span className="text-label-caps text-text-muted font-bold uppercase mr-1.5">
                  Languages
                </span>
                {data.country.languages}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- section 3: Discover Today ---------------------------------------------- */

function SpotlightCard({
  item,
  index,
  isOpen,
  onOpen,
}: {
  item: PlacesSpotlightItem;
  index: number;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const gradient = SPOTLIGHT_TONE[item.category] ?? SPOTLIGHT_TONE.STATE;
  const card = (
    <>
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95`}
        aria-hidden
      />
      <div
        className="absolute inset-0 landing-contour-overlay opacity-25"
        aria-hidden
      />
      <div className="relative flex flex-col h-full p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded-md bg-surface-card/20 text-white text-label-caps font-bold border border-white/25">
            {item.category}
          </span>
          <span className="text-label-caps text-white/70 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-landing-display text-headline-md text-white mt-4">
          {item.name}
        </h3>
        <p className="text-body-sm text-white/85 mt-1">{item.zoneLabel}</p>
        <p className="text-body-sm text-white/75 mt-3 line-clamp-3 flex-1">
          {item.summary}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-white/20">
          <span className="text-label-caps text-white/80">{item.detail}</span>
          {item.href ? (
            <IconExternal className="w-4 h-4 text-white shrink-0" />
          ) : (
            <IconArrow className="w-4 h-4 text-white shrink-0" />
          )}
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-md transition-all ${
        isOpen ? "ring-4 ring-emerald-200" : "hover:-translate-y-0.5"
      }`}
    >
      {item.dossier ? (
        <button
          type="button"
          onClick={onOpen}
          aria-expanded={isOpen}
          className="block w-full h-full text-left"
        >
          {card}
        </button>
      ) : (
        <Link href={item.exploreHref} className="block w-full h-full">
          {card}
        </Link>
      )}
    </div>
  );
}

function SpotlightPanel({
  item,
  onClose,
}: {
  item: PlacesSpotlightItem;
  onClose: () => void;
}) {
  const dossier: PlacesDossier | undefined = item.dossier;

  return (
    <aside
      aria-label={`${item.name} profile snapshot`}
      className="rounded-2xl border border-border-subtle bg-surface-card shadow-xl p-6 flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-label-caps text-primary font-bold tracking-widest uppercase">
            {item.category} snapshot
          </span>
          <h3 className="font-landing-display text-headline-md text-text-primary truncate">
            {dossier?.title ?? `${item.name} at a glance`}
          </h3>
          {dossier && (
            <p className="text-body-sm text-text-muted">{dossier.subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close snapshot"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
        >
          <IconClose className="w-5 h-5" />
        </button>
      </div>

      {dossier && (
        <>
          <p className="text-body-sm text-text-secondary mt-3">{dossier.summary}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            {dossier.facts.map((f) => (
              <div
                key={f.label}
                className={`rounded-xl border border-border-subtle border-l-4 ${TONE_RING[f.tone]} bg-slate-50/60 p-3`}
              >
                <dt className="text-label-caps text-text-muted font-bold">
                  {f.label}
                </dt>
                <dd className="font-landing-display text-headline-sm text-text-primary tabular-nums">
                  {f.value}
                </dd>
                <dd className="text-[11px] text-text-muted">{f.note}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {dossier.dossierLinks.map((link) => {
              const Icon = DOSSIER_ICON[link.icon] ?? IconExternal;
              return (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#043828] text-white text-label-md font-bold hover:bg-[#065a41]"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            {dossier.profileHref && (
              <Link
                href={dossier.profileHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-white text-label-md font-bold hover:bg-[#006d40]"
              >
                <IconLandmark className="w-4 h-4" />
                Open {item.name} profile
              </Link>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function DiscoverToday({ items }: { items: PlacesSpotlightItem[] }) {
  const firstDossier = useMemo(
    () => items.find((i) => i.dossier) ?? null,
    [items]
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const open =
    items.find((i) => i.id === openId && i.dossier) ??
    (openId ? null : firstDossier);

  return (
    <section id="discover" className="max-w-7xl mx-auto px-4 md:px-8 py-14 scroll-mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
            Discover today
          </span>
          <h2 className="font-landing-display text-headline-xl text-text-primary">
            Start anywhere in the country
          </h2>
          <p className="text-body-md text-text-secondary mt-1 max-w-2xl">
            Eight fresh entry points from the atlas — open one to read its snapshot,
            or follow it straight into the explorer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenId(null)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-subtle text-label-md font-bold text-text-secondary hover:bg-slate-50"
        >
          <IconShuffle />
          Reset
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((item, i) => (
            <SpotlightCard
              key={item.id}
              item={item}
              index={i}
              isOpen={open?.id === item.id}
              onOpen={() => setOpenId(item.id)}
            />
          ))}
        </div>
        <div className="lg:col-span-5">
          {open ? (
            <div className="lg:sticky lg:top-32">
              <SpotlightPanel item={open} onClose={() => setOpenId(null)} />
            </div>
          ) : (
            <div className="lg:sticky lg:top-32 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-body-sm text-text-muted">
              Open a state, metro or LGA card to read its snapshot here.
            </div>
          )}
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
        <span className="text-label-caps text-text-muted font-bold tracking-wider uppercase">
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
              className={`rounded-xl px-2.5 py-2 border ${
                isBest
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-border-subtle bg-surface-card"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isBest && (
                  <span
                    className="text-[11px] text-primary"
                    title={`Best of the three (rank ${metric.ranks[id]})`}
                    aria-label={`Best of the three, rank ${metric.ranks[id]}`}
                  >
                    &#9733;
                  </span>
                )}
                <span className="text-[11px] text-text-muted truncate font-semibold">
                  {names[id]}
                </span>
              </div>
              <p className="font-landing-display text-headline-sm text-text-primary tabular-nums leading-tight">
                {formatCompareValue(value, metric.format)}
                {metric.unit && (
                  <span className="ml-0.5 text-[11px] text-slate-400 font-sans">
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

const COMPARE_GROUP_ICON: Record<string, typeof IconTrend> = {
  territory: IconMap,
  people: IconUsers,
  fiscal: IconTrend,
};

function CompareGroup({
  group,
  ids,
  names,
}: {
  group: PlacesCompareGroup;
  ids: string[];
  names: Record<string, string>;
}) {
  const Icon = COMPARE_GROUP_ICON[group.id] ?? IconTrend;
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border-subtle bg-slate-50">
        <span className="text-primary">
          <Icon />
        </span>
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

function CompareStates({
  groups,
  states,
  defaultCompare,
  initialCompare,
}: {
  groups: PlacesCompareGroup[];
  states: PlacesDirectoryData["allStates"];
  defaultCompare: [string, string, string];
  initialCompare?: string[];
}) {
  const starting = useMemo<[string, string, string]>(() => {
    const known = new Set(states.map((s) => s.id));
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
  }, [defaultCompare, initialCompare, states]);

  const [ids, setIds] = useState<string[]>(starting);

  useEffect(() => {
    setIds(starting);
  }, [starting]);

  const names = useMemo(
    () => Object.fromEntries(states.map((s) => [s.id, s.name])),
    [states]
  );

  const swap = (slot: number) => {
    const used = new Set(ids);
    const next = states.find((s) => !used.has(s.id));
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
      className="bg-surface-card border-y border-border-subtle scroll-mt-32"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
              Head to head
            </span>
            <h2 className="font-landing-display text-headline-xl text-text-primary">
              Compare states side by side
            </h2>
            <p className="text-body-md text-text-secondary mt-1 max-w-2xl">
              Three states, real figures, and a straight read against the national
              median. The star marks the leader of each row.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/economy/map"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-subtle text-label-md font-bold text-text-secondary hover:bg-slate-50"
            >
              <IconMap />
              Map it
            </Link>
            <button
              type="button"
              onClick={() =>
                setIds((prev) => {
                  const used = new Set(prev);
                  const free = states.filter((s) => !used.has(s.id));
                  if (free.length < 3) return prev;
                  return [...prev.map((id, i) => free[i].id)];
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-container text-white text-label-md font-bold hover:bg-[#006d40]"
            >
              <IconShare />
              New comparison
            </button>
          </div>
        </div>

        {/* State pickers */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ids.map((id, slot) => (
            <div
              key={slot}
              className="flex items-center gap-2 rounded-xl border border-border-subtle bg-slate-50 p-2"
            >
              <span className="w-6 h-6 rounded-lg bg-primary-container text-white text-label-caps font-bold grid place-items-center shrink-0">
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
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => swap(slot)}
                aria-label={`Swap state for column ${slot + 1}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-surface-card shrink-0"
              >
                <IconShuffle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {groups.map((g) => (
            <CompareGroup key={g.id} group={g} ids={ids} names={names} />
          ))}
        </div>

        <p className="mt-4 text-body-sm text-text-muted">
          Figures come from the atlas general dataset, 2023 population estimates
          and 2024 internally generated revenue. Land area is UN SALB, wards and
          polling units are INEC delimitation, and per-capita and per-LGA revenue
          are derived from those same published totals. State GDP is not published
          per state, so revenue stands in for fiscal weight.
        </p>
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
                  <span className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-label-caps font-bold ${CATEGORY_TONE[r.category]}`}
                    >
                      {r.category}
                    </span>
                    <span className="font-landing-display text-headline-sm text-text-primary">
                      {r.name}
                    </span>
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

/* --- section 6: Six zones ---------------------------------------------------- */

function ZoneCard({ zone }: { zone: PlacesZoneCard }) {
  return (
    <article className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <span
          className="px-2.5 py-1 rounded-full text-label-caps font-bold text-white"
          style={{ backgroundColor: zone.accent }}
        >
          {zone.character}
        </span>
        <span className="text-label-caps text-slate-400 tabular-nums">
          {zone.memberLabel}
        </span>
      </div>
      <h3 className="font-landing-display text-headline-md text-text-primary mt-3">
        {zone.name}
      </h3>
      <p className="text-body-sm text-text-secondary mt-2 flex-1">{zone.blurb}</p>
      <ul className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
        {zone.memberNames.map((m) => (
          <li
            key={m}
            className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] text-text-secondary font-semibold"
          >
            {m}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ZonesBand({ zones }: { zones: PlacesZoneCard[] }) {
  return (
    <section
      id="zones"
      className="bg-surface-card border-y border-border-subtle scroll-mt-32"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
        <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
          Nigeria at a glance
        </span>
        <h2 className="font-landing-display text-headline-xl text-text-primary">
          Six zones, one country
        </h2>
        <p className="text-body-md text-text-secondary mt-1 max-w-2xl">
          The backbone of the atlas, and the first cut of every Places filter.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {zones.map((z) => (
            <ZoneCard key={z.regionId} zone={z} />
          ))}
        </div>
      </div>
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
      <div className="relative overflow-hidden rounded-3xl bg-[#043828] text-white border border-emerald-900 shadow-2xl">
        <div
          className="absolute inset-0 landing-contour-overlay opacity-40"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_10%,rgba(52,211,153,0.28),transparent_55%)]"
          aria-hidden
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-12 items-center">
          <div className="lg:col-span-7">
            <span className="text-label-caps text-lime-300 tracking-widest uppercase block mb-1">
              Take it further
            </span>
            <h2 className="font-landing-display text-headline-xl text-white">
              Put all 37 states on one canvas
            </h2>
            <p className="text-body-md text-emerald-100/90 mt-2 max-w-xl">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white text-label-md font-bold hover:bg-surface-card/10"
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
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-card/10 border border-white/15 px-4 py-3"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-lime-300 shrink-0">
                      {f.tone === "sky" ? <IconWater /> : <IconLandmark />}
                    </span>
                    <span className="text-label-md font-bold truncate">
                      {f.name}
                    </span>
                  </span>
                  <span className="text-[11px] text-emerald-200/80 tabular-nums shrink-0">
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

export default function PlacesHubClient(props: PlacesDirectoryData) {
  const { allStates, lgaCount, stateCount } = props;
  const [mode, setMode] = useState<BrowseMode>("states");
  const [query, setQuery] = useState("");

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

  const filteredSpotlight = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.spotlight;
    return props.spotlight.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.zoneLabel.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [props.spotlight, query]);

  const categoryCounts = useMemo(
    () => ({
      states: props.browseRows.filter((r) => r.category === "STATE").length,
      lgas: props.browseRows.filter((r) => r.category === "LGA").length,
      metros: props.browseRows.filter((r) => r.category === "METRO").length,
      land: props.browseRows.filter((r) => r.category === "LAND FEATURE").length,
    }),
    [props.browseRows]
  );

  const filteredBrowse = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byMode = (row: PlacesBrowseRow) => {
      if (mode === "states") return row.category === "STATE";
      if (mode === "lgas") return row.category === "LGA";
      if (mode === "metros") return row.category === "METRO";
      return row.category === "LAND FEATURE";
    };
    const base = props.browseRows.filter(byMode);
    if (!q) return base;
    return base.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.seat.toLowerCase().includes(q)
    );
  }, [props.browseRows, mode, query]);

  return (
    <HubShell>
      <HubHeader primaryCta={{ label: "Places map", href: "/places/map" }} />
      <PlacesSectionBar />

      <PlacesHero
        data={props}
        mode={mode}
        onModeChange={setMode}
        query={query}
        onQueryChange={setQuery}
        categoryCounts={categoryCounts}
      />

      <DiscoverToday items={filteredSpotlight.length ? filteredSpotlight : props.spotlight} />

      <CompareStates
        groups={props.compareGroups}
        states={allStates}
        defaultCompare={props.defaultCompare}
        initialCompare={compareSeed}
      />

      <BrowseDirectory rows={filteredBrowse} />

      <ZonesBand zones={props.zones} />

      <LandBand
        features={props.landFeatures}
        stateCount={stateCount}
        lgaCount={lgaCount}
      />

      <MapCta landFeatures={props.landFeatures} />

      <HubFooter />
    </HubShell>
  );
}
