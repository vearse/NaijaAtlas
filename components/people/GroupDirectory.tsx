"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import StateOverviewPanel from "@/components/places/StateOverviewPanel";
import { useWikiReader } from "@/hooks/useWikiReader";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { PeopleHubData } from "@/lib/server/loadPeopleHubData";
import type { WikiNote } from "@/types/location";

const DEFAULT_STATE = "NG-LA";
const PAGE = 9;

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
};

function formatPeriod(period: NonNullable<WikiNote["period"]>): string | null {
  const months = period.months?.length ? period.months.join("/") : null;
  if (period.frequency && months) return `${months} · ${period.frequency}`;
  return period.frequency ?? months;
}

/** One state at a time: its cultural groups first, then institutions, then the state profile. */
export default function GroupDirectory({ data }: { data: PeopleHubData }) {
  const reduceMotion = useReducedMotion();
  const { openArticle, openByName, resolving } = useWikiReader();

  const stateOptions = useMemo(
    () =>
      Object.values(data.stateOverviews).sort((a, b) => a.name.localeCompare(b.name)),
    [data.stateOverviews]
  );
  const [stateId, setStateId] = useState(
    data.stateOverviews[DEFAULT_STATE] ? DEFAULT_STATE : (stateOptions[0]?.id ?? "")
  );
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const overview = data.stateOverviews[stateId];
  const q = query.trim().toLowerCase();

  const matched = useMemo(
    () =>
      data.groups
        .filter((g) => {
          if (!g.stateIds.includes(stateId)) return false;
          if (!q) return true;
          return (
            g.name.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q) ||
            g.makeup.map((m) => m.name).join(" ").toLowerCase().includes(q)
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.groups, q, stateId]
  );

  const stateQueryKey = `${stateId}-${q}`;
  const visible = matched.slice(0, limit);
  const hidden = matched.length - visible.length;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-label-caps tracking-wider text-text-muted">State</span>
          <select
            value={stateId}
            onChange={(e) => {
              setStateId(e.target.value);
              setQuery("");
              setLimit(PAGE);
            }}
            className="mt-2 h-11 min-w-[14rem] rounded-xl border border-border-subtle bg-surface-card px-3 text-body-md font-semibold text-text-primary focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            {stateOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-3 text-body-sm text-text-muted">
          Groups are listed A–Z. Pick a state to read its institutions and profile.
        </p>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-landing-display text-headline-sm text-text-primary">
            Cultural groups in {overview?.name ?? "this state"}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="block">
              <span className="sr-only">Search groups</span>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(PAGE);
                }}
                placeholder="Search a group or community"
                className="h-10 w-64 rounded-full border border-border-subtle bg-surface-card px-4 text-body-sm text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>
            <Link
              href={sectionMapHref("people/groups", { stateIds: [stateId] })}
              className="text-label-md font-semibold text-primary hover:underline"
            >
              Homelands map →
            </Link>
          </div>
        </div>

        <div className="mt-4">
          {matched.length === 0 ? (
            <EmptyState title="No groups match" badge="No results">
              No documented cultural group in {overview?.name ?? "this state"} matches
              that search.
            </EmptyState>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.ul
                  key={stateQueryKey}
                  className="grid gap-4 md:grid-cols-2"
                  {...(reduceMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 8 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0 },
                        transition: { duration: 0.22 },
                      })}
                >
                  {visible.map((g) => (
                    <li
                      key={g.id}
                      className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-body-lg font-semibold text-text-primary">
                            {g.name}
                          </h4>
                          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                            {g.memberCount > 0
                              ? `${g.memberCount} documented LGA areas`
                              : "Homeland catalogue"}
                            {g.stateNames.length > 1
                              ? ` · ${g.stateNames.length} states`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            CONFIDENCE_BADGE[g.confidence] ??
                            "border-border-subtle bg-slate-50 text-text-muted"
                          }`}
                        >
                          {g.confidence}
                        </span>
                      </div>

                      {g.description && (
                        <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
                          {g.description}
                        </p>
                      )}

                      {g.makeup.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Ethnic makeup
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {g.makeup.map((m) => (
                              <span
                                key={`${m.name}-${m.role}`}
                                className="rounded-full border border-border-subtle bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary"
                              >
                                {m.name}
                                {m.role === "dominant" ? " · dominant" : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {g.stateNames.length > 0 && (
                        <p className="mt-3 text-body-sm text-text-muted">
                          <span className="font-semibold text-text-secondary">
                            Present in:{" "}
                          </span>
                          {g.stateNames.join(", ")}
                        </p>
                      )}

                      {g.stateNames.length > 1 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {g.stateNames
                            .filter((name) => data.stateIdByName[name] !== stateId)
                            .slice(0, 4)
                            .map((name) => {
                              const id = data.stateIdByName[name];
                              return (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => {
                                    if (id) setStateId(id);
                                    setLimit(PAGE);
                                  }}
                                  className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container/50 hover:text-primary"
                                >
                                  Also in {name}
                                </button>
                              );
                            })}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void openByName(g.name)}
                          disabled={resolving === g.name}
                          className="inline-flex items-center gap-1 text-label-md font-semibold text-primary transition-opacity hover:underline disabled:opacity-60"
                        >
                          {resolving === g.name ? "Loading…" : "Read more"}
                          <span aria-hidden>→</span>
                        </button>
                        <Link
                          href={sectionMapHref("people/groups", {
                            stateIds: g.stateIds.slice(0, 3),
                          })}
                          className="text-label-md font-semibold text-text-muted hover:text-primary"
                        >
                          On map →
                        </Link>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>

              {hidden > 0 ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setLimit((n) => n + PAGE)}
                    className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-5 py-2.5 text-label-md font-semibold text-text-secondary shadow-sm transition-colors hover:border-primary-container/40 hover:text-primary"
                  >
                    See more groups ({hidden} left)
                    <span aria-hidden>▾</span>
                  </button>
                </div>
              ) : null}

              <p className="mt-4 text-center text-body-sm text-text-muted">
                Showing {visible.length} of {matched.length} documented groups
                {overview ? ` in ${overview.name}` : ""} (A–Z).
              </p>
            </>
          )}
        </div>
      </div>

      {overview && overview.institutions.length > 0 ? (
        <div className="mt-12 border-t border-border-subtle pt-10">
          <h3 className="mb-4 font-landing-display text-headline-sm text-text-primary">
            Cultural institutions · {overview.name}
          </h3>
          <ul className="grid gap-3 md:grid-cols-2">
            {overview.institutions.map((n, i) => {
              const period = n.period ? formatPeriod(n.period) : null;
              return (
                <li
                  key={`${n.title}-${i}`}
                  className="rounded-xl border border-border-subtle bg-surface-card px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => n.url && openArticle(n.url, n.title)}
                    disabled={!n.url}
                    className="group w-full text-left"
                  >
                    <span className="text-body-md font-semibold text-text-primary group-hover:text-primary">
                      {n.title}
                    </span>
                  </button>
                  <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">
                    {n.note}
                  </p>
                  {period && (
                    <p className="mt-2 text-[11px] font-semibold tabular-nums text-text-muted">
                      {period}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {overview ? (
        <div className="mt-12 border-t border-border-subtle pt-10">
          <h3 className="mb-4 font-landing-display text-headline-sm text-text-primary">
            {overview.name} state details
          </h3>
          <StateOverviewPanel overview={overview} accent="#008751" />
        </div>
      ) : null}

      <SourceNote className="mt-8" source={data.sources} updated="Repository catalogues" />
    </div>
  );
}
