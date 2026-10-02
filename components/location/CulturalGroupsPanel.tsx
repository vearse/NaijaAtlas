"use client";

import { useMemo, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import ViewLgasOnMapButton from "@/components/map/ViewLgasOnMapButton";
import { resolveLgaFocusPlan } from "@/lib/map/lgaMapFocus";
import type { MetroGroup, LgaLocation, StateLocation } from "@/types/location";

const PAGE = 8;

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-50 text-slate-600",
};

/**
 * The People map's default panel. The homelands map is about peoples, so it
 * lists the cultural groups from the catalogue and lets each one highlight its
 * member LGAs — the same LGA-focus machinery metros use, no new layer needed.
 */
export default function CulturalGroupsPanel({
  metroGroups,
  lgas,
  states,
}: {
  metroGroups: MetroGroup[];
  lgas: LgaLocation[];
  states: StateLocation[];
}) {
  const metroMapViews = useMapStore((s) => s.metroMapViews);
  const clearMetroMapViews = useMapStore((s) => s.clearMetroMapViews);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [limit, setLimit] = useState(PAGE);

  const culturalGroups = useMemo(
    () =>
      metroGroups
        .filter((g) => g.groupType === "cultural-group")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [metroGroups]
  );

  const nameById = useMemo(
    () => new Map(states.map((s) => [s.id, s.name])),
    [states]
  );

  /** State filters come from the data: the states with the most groups listed. */
  const stateFilters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of culturalGroups) {
      for (const id of group.stateIds) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return [
      { id: "all", label: "All states" },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([id, count]) => ({
          id,
          label: `${nameById.get(id) ?? id} ${count}`,
        })),
    ];
  }, [culturalGroups, nameById]);

  const q = query.trim().toLowerCase();
  const matched = useMemo(
    () =>
      culturalGroups.filter((g) => {
        if (stateFilter !== "all" && !g.stateIds.includes(stateFilter))
          return false;
        if (!q) return true;
        return (
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        );
      }),
    [culturalGroups, q, stateFilter]
  );

  const focusedId = metroMapViews[0]?.id ?? null;
  const ordered = useMemo(() => {
    if (!focusedId) return matched;
    return [
      ...matched.filter((g) => g.id === focusedId),
      ...matched.filter((g) => g.id !== focusedId),
    ];
  }, [matched, focusedId]);

  const visible = ordered.slice(0, limit);
  const hidden = ordered.length - visible.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Peoples of Nigeria
        </p>
        <h2 className="text-xl font-bold text-text-primary">
          Cultural groups &amp; homelands
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          {culturalGroups.length} documented groups · pick one to highlight the
          LGAs it covers
        </p>
      </div>

      {focusedId && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-ng-green/40 bg-emerald-50 px-3 py-2">
          <p className="text-[11px] font-semibold text-emerald-900">
            {metroMapViews.length > 1
              ? `${metroMapViews.length} groups highlighted on the map`
              : `${metroMapViews[0].label} highlighted on the map`}
          </p>
          <button
            type="button"
            onClick={clearMetroMapViews}
            className="shrink-0 rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-white"
          >
            Clear map
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search a group"
          aria-label="Search cultural groups"
          className="h-9 min-w-[10rem] flex-1 rounded-full border border-border-subtle bg-surface-card px-3 text-xs text-text-primary placeholder:text-slate-400 focus:border-ng-green focus:outline-none"
        />
        {stateFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setStateFilter(f.id);
              setLimit(PAGE);
            }}
            aria-pressed={stateFilter === f.id}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              stateFilter === f.id
                ? "border-ng-green bg-ng-green text-white"
                : "border-border-subtle bg-surface-card text-text-secondary hover:border-ng-green/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-muted">
          No cultural group matches that search.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((group) => {
            const onMap = metroMapViews.some((v) => v.id === group.id);
            const plan = resolveLgaFocusPlan(
              group.memberIds ?? [],
              lgas,
              group.stateIds,
              { id: group.id, label: group.name }
            );
            return (
              <li
                key={group.id}
                className={`rounded-xl border bg-white px-3.5 py-3 ${
                  onMap
                    ? "border-ng-green shadow-[0_0_0_3px_rgba(0,135,81,0.12)]"
                    : "border-border-subtle"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary">
                    {group.name}
                  </p>
                  {onMap ? (
                    <span className="shrink-0 rounded-full bg-ng-green px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-white">
                      on map
                    </span>
                  ) : group.confidence ? (
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                        CONFIDENCE_BADGE[group.confidence] ??
                        CONFIDENCE_BADGE.low
                      }`}
                    >
                      {group.confidence}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-secondary">
                  {group.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-text-muted">
                    {group.memberIds?.length ?? 0} LGAs ·{" "}
                    {(group.stateIds ?? [])
                      .map((id) => nameById.get(id))
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                  <ViewLgasOnMapButton plan={plan} noun="group" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hidden > 0 ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-ng-green/50 hover:text-ng-green"
          >
            See more groups ({hidden} left)
            <span aria-hidden>▾</span>
          </button>
          <p className="text-[11px] text-text-muted">
            Showing {visible.length} of {matched.length} groups
          </p>
        </div>
      ) : null}
    </div>
  );
}