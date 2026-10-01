"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { PeopleHubData } from "@/lib/server/loadPeopleHubData";

/** The cultural-group directory, searchable and filterable by state. */
export default function GroupDirectory({ data }: { data: PeopleHubData }) {
  const [query, setQuery] = useState("");
  const [stateId, setStateId] = useState("all");

  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      data.groups.filter((g) => {
        if (stateId !== "all" && !g.stateIds.includes(stateId)) return false;
        if (!q) return true;
        return (
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.stateNames.join(" ").toLowerCase().includes(q) ||
          g.makeup.map((m) => m.name).join(" ").toLowerCase().includes(q)
        );
      }),
    [data.groups, q, stateId]
  );

  const stateOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of data.groups) {
      for (const id of g.stateIds) {
        const name = data.slugByStateId[id];
        if (name) m.set(id, name);
      }
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data.groups, data.slugByStateId]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-label-caps tracking-wider text-text-muted">
            State
          </span>
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="mt-2 h-11 min-w-[12rem] rounded-xl border border-border-subtle bg-surface-card px-3 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="all">All states</option>
            {stateOptions.map(([id, slug]) => (
              <option key={id} value={id}>
                {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="text-label-caps tracking-wider text-text-muted">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Group, community, state or language"
            className="mt-2 h-11 w-full rounded-xl border border-border-subtle bg-surface-card px-4 text-body-md text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>
        <p className="pb-3 text-body-sm text-text-muted">
          {visible.length} of {data.groups.length}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
          <NigeriaThumb
            source="states"
            highlight={
              stateId === "all"
                ? [...new Set(visible.flatMap((g) => g.stateIds))]
                : [stateId]
            }
            accent="#7c3aed"
            className="h-48 w-full"
            title="States with documented groups"
          />
          <Link
            href={sectionMapHref("people/groups", {
              stateIds: stateId === "all" ? undefined : [stateId],
            })}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Open homelands map
          </Link>
          <p className="mt-2 text-[11px] text-text-muted">
            The map shows states and LGAs; it has no homeland polygons to draw.
          </p>
        </div>

        {visible.length === 0 ? (
          <EmptyState title="No groups match" badge="0 results">
            Nothing in the {data.groups.length}-group catalogue matches that
            filter.
          </EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {visible.map((g) => (
              <li
                key={g.id}
                className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-body-md font-semibold text-text-primary">
                    {g.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      g.confidence === "high"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-border-subtle bg-slate-50 text-text-muted"
                    }`}
                  >
                    {g.confidence}
                  </span>
                </div>
                {g.description && (
                  <p className="mt-1.5 line-clamp-3 text-body-sm text-text-secondary">
                    {g.description}
                  </p>
                )}
                {g.makeup.length > 0 && (
                  <p className="mt-2 text-[11px] text-text-muted">
                    {g.makeup
                      .slice(0, 3)
                      .map((m) => `${m.name}${m.role === "dominant" ? " (dominant)" : ""}`)
                      .join(" · ")}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                  <span className="text-[11px] text-slate-400">
                    {g.memberCount} LGA area{g.memberCount === 1 ? "" : "s"}
                  </span>
                  {g.stateNames.slice(0, 3).map((name) => {
                    const id = data.stateIdByName[name];
                    return (
                      <Link
                        key={name}
                        href={`/places/${id ? data.slugByStateId[id] : name.toLowerCase()}`}
                        className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container hover:text-primary"
                      >
                        {name}
                      </Link>
                    );
                  })}
                  {g.stateNames.length > 3 && (
                    <span className="text-[11px] text-slate-400">
                      +{g.stateNames.length - 3}
                    </span>
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
