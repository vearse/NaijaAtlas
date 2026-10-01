"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubPlace, TravelHubData } from "@/lib/server/loadTravelHubData";

type Mode = "tours" | "cities";

const PAGE = 6;

const MODE_META: Record<Mode, { label: string; accent: string; blurb: string }> = {
  tours: {
    label: "Tours",
    accent: "#be123c",
    blurb: "Parks, waterfalls, heritage sites and resorts worth the journey.",
  },
  cities: {
    label: "Cities",
    accent: "#0369a1",
    blurb: "Capitals, trading towns, port cities and campus towns.",
  },
};

/** Cities and tour destinations, filtered by category, with a live map preview. */
export default function PlacesBrowser({
  data,
  onRouteTo,
}: {
  data: TravelHubData;
  onRouteTo?: (placeId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("tours");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const rows: HubPlace[] = mode === "tours" ? data.destinations : data.cities;
  const categories = mode === "tours" ? data.categoryCounts : data.cityCategoryCounts;
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      rows.filter((p) => {
        if (category && p.category !== category) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.stateName.toLowerCase().includes(q) ||
          p.landmarks.join(" ").toLowerCase().includes(q)
        );
      }),
    [rows, category, q]
  );

  const shown = visible.slice(0, limit);
  const meta = MODE_META[mode];
  const highlight = [
    ...new Set(visible.map((p) => p.stateId).filter((x): x is string => x != null)),
  ];

  const switchMode = (next: Mode) => {
    setMode(next);
    setCategory(null);
    setLimit(PAGE);
  };
  const pickCategory = (key: string | null) => {
    setCategory(key);
    setLimit(PAGE);
  };

  const listKey = `${mode}-${category ?? "any"}-${q}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-xl border border-border-subtle bg-slate-100 p-1"
          role="tablist"
          aria-label="Cities or tours"
        >
          {(Object.keys(MODE_META) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`rounded-lg px-4 py-2 text-label-md font-semibold transition-all duration-200 ${
                mode === m
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>
        <p className="text-body-sm text-text-muted">{meta.blurb}</p>
        <label className="block sm:ml-auto">
          <span className="sr-only">Search places</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search a place, state or landmark"
            className="h-10 w-full rounded-full border border-border-subtle bg-surface-card px-4 text-body-sm text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10 sm:w-72"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip active={category === null} onClick={() => pickCategory(null)}>
          Everything
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip
            key={c.key}
            active={category === c.key}
            onClick={() => pickCategory(c.key)}
          >
            {c.label}
          </CategoryChip>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <aside className="self-start rounded-2xl border border-border-subtle bg-slate-50 p-4 lg:sticky lg:top-28">
          <NigeriaThumb
            source="states"
            highlight={highlight}
            accent={meta.accent}
            markers={visible
              .filter((p) => p.lon != null && p.lat != null)
              .slice(0, 60)
              .map((p) => ({ lon: p.lon as number, lat: p.lat as number }))}
            className="h-64 w-full"
            title={`${meta.label} on the map`}
          />
          <Link
            href={sectionMapHref("travel/places", { stateIds: highlight.slice(0, 12) })}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Open on the tourist map
          </Link>
        </aside>

        <div className="min-w-0">
          {visible.length === 0 ? (
            <EmptyState title="Nothing matches" badge="No results">
              Try another category or clear the search.
            </EmptyState>
          ) : (
            <AnimatePresence mode="wait">
              <motion.ul
                key={listKey}
                className="grid gap-3 sm:grid-cols-2"
                {...(reduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -6 },
                      transition: { duration: 0.22 },
                    })}
              >
                {shown.map((p) => (
                  <PlaceCard key={p.id} place={p} onRouteTo={onRouteTo} />
                ))}
              </motion.ul>
            </AnimatePresence>
          )}
          {visible.length > shown.length && (
            <button
              type="button"
              onClick={() => setLimit((n) => n + PAGE)}
              className="mt-4 w-full rounded-xl border border-border-subtle bg-surface-card py-3 text-label-md font-semibold text-text-secondary hover:border-primary-container/40 hover:text-primary"
            >
              Show more
            </button>
          )}
        </div>
      </div>

      <SourceNote className="mt-8" source={data.sources} updated="Repository catalogues" />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 shrink-0 rounded-full border px-3.5 text-[12px] font-semibold transition-colors ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function PlaceCard({
  place: p,
  onRouteTo,
}: {
  place: HubPlace;
  onRouteTo?: (placeId: string) => void;
}) {
  return (
    <li className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-body-md font-semibold text-text-primary">{p.name}</h3>
        <span className="shrink-0 rounded-full border border-border-subtle bg-slate-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-text-muted">
          {p.category.replace(/-/g, " ")}
        </span>
      </div>
      {p.summary && (
        <p className="mt-1.5 line-clamp-3 text-body-sm text-text-secondary">{p.summary}</p>
      )}
      {p.landmarks.length > 0 && (
        <p className="mt-1 line-clamp-1 text-[11px] text-text-muted">
          {p.landmarks.slice(0, 3).join(" · ")}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        {p.slug ? (
          <Link
            href={`/places/${p.slug}`}
            className="text-label-md font-semibold text-primary hover:underline"
          >
            {p.stateName} →
          </Link>
        ) : (
          <span className="text-[11px] text-slate-400">{p.stateName}</span>
        )}
        {onRouteTo && p.lon != null && (
          <button
            type="button"
            onClick={() => onRouteTo(p.id)}
            className="rounded-lg border border-border-subtle px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container hover:text-primary"
          >
            Route here
          </button>
        )}
      </div>
    </li>
  );
}
