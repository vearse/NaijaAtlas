"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubPlace, TravelHubData } from "@/lib/server/loadTravelHubData";

type Mode = "destinations" | "cities";

export default function PlacesBrowser({ data }: { data: TravelHubData }) {
  const [mode, setMode] = useState<Mode>("destinations");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const rows: HubPlace[] = mode === "destinations" ? data.destinations : data.cities;
  const categoryCounts =
    mode === "destinations" ? data.categoryCounts : data.cityCategoryCounts;

  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      rows.filter((p) => {
        if (category !== "all" && p.category !== category) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.stateName.toLowerCase().includes(q) ||
          p.landmarks.join(" ").toLowerCase().includes(q)
        );
      }),
    [rows, category, q]
  );

  const activeCategory = categoryCounts.find((c) => c.key === category);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("destinations");
            setCategory("all");
          }}
          aria-pressed={mode === "destinations"}
          className={`h-10 rounded-full border px-4 text-body-sm font-semibold ${
            mode === "destinations"
              ? "border-primary-container bg-primary-container text-white"
              : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
          }`}
        >
          Destinations ({data.counts.destinations})
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("cities");
            setCategory("all");
          }}
          aria-pressed={mode === "cities"}
          className={`h-10 rounded-full border px-4 text-body-sm font-semibold ${
            mode === "cities"
              ? "border-primary-container bg-primary-container text-white"
              : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
          }`}
        >
          Cities ({data.counts.cities})
        </button>
        <label className="ml-auto block">
          <span className="sr-only">Search places</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a place, state or landmark"
            className="h-10 w-full max-w-[17rem] rounded-full border border-border-subtle bg-surface-card px-4 text-body-sm text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          aria-pressed={category === "all"}
          className={`h-9 rounded-full border px-3 text-[11px] font-semibold ${
            category === "all"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
          }`}
        >
          All
        </button>
        {categoryCounts.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            aria-pressed={category === c.key}
            className={`h-9 rounded-full border px-3 text-[11px] font-semibold ${
              category === c.key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
            }`}
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
          <NigeriaThumb
            source="states"
            highlight={[...new Set(visible.map((p) => p.stateId).filter((x): x is string => x != null))]}
            accent="#be123c"
            markers={visible
              .filter((p) => p.lon != null && p.lat != null)
              .slice(0, 40)
              .map((p) => ({ lon: p.lon as number, lat: p.lat as number }))}
            className="h-52 w-full"
            title="Places on this page"
          />
          <p className="mt-2 text-[11px] text-text-muted">
            {visible.length} of {rows.length} shown
            {activeCategory ? ` · ${activeCategory.label}` : ""}
          </p>
          <Link
            href={sectionMapHref("travel/places", {
              stateIds: [...new Set(visible.map((p) => p.stateId).filter((x): x is string => x != null))].slice(0, 12),
            })}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Open places map
          </Link>
        </div>

        {visible.length === 0 ? (
          <EmptyState title="Nothing matches" badge="0 results">
            No {mode === "destinations" ? "destination" : "city"} in the
            catalogue matches that filter.
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visible.map((p) => (
              <li
                key={p.id}
                className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-body-md font-semibold text-text-primary">
                    {p.name}
                  </h3>
                  <span className="shrink-0 rounded-full border border-border-subtle bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                    {p.category.replace(/-/g, " ")}
                  </span>
                </div>
                {p.summary && (
                  <p className="mt-1.5 line-clamp-3 text-body-sm text-text-secondary">
                    {p.summary}
                  </p>
                )}
                {p.note && (
                  <p className="mt-1 text-[11px] text-text-muted">{p.note}</p>
                )}
                {p.landmarks.length > 0 && (
                  <p className="mt-1 line-clamp-1 text-[11px] text-text-muted">
                    {p.landmarks.slice(0, 3).join(" · ")}
                  </p>
                )}
                <div className="mt-auto pt-3">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SourceNote className="mt-8" source={data.sources} updated="Repository catalogues" />
    </div>
  );
}
