"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { type Festival } from "@/lib/festivals";
import { useWikiReader } from "@/hooks/useWikiReader";

const PAGE = 6;

const TONE_BADGE: Record<Festival["tone"], string> = {
  primary: "bg-primary-tint-light text-primary",
  amber: "bg-heritage-amber-tint text-heritage-amber border border-amber-200",
  slate: "bg-slate-100 text-text-secondary",
};

function dayChip(festival: Festival): string {
  if (festival.dateLabel) return festival.dateLabel.replace(/[^0-9–\-/]/g, "").slice(0, 8) || "—";
  if (festival.startDay === festival.endDay) return String(festival.startDay);
  return `${festival.startDay}–${festival.endDay}`;
}

/** Festivals A–Z by default, with optional state filter. */
export default function FestivalList({ festivals }: { festivals: Festival[] }) {
  const reduceMotion = useReducedMotion();
  const { openByName, resolving } = useWikiReader();
  const [limit, setLimit] = useState(PAGE);
  const [stateName, setStateName] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...festivals].sort((a, b) => a.name.localeCompare(b.name)),
    [festivals]
  );

  const stateOptions = useMemo(
    () => [...new Set(ordered.map((f) => f.stateName))].sort((a, b) => a.localeCompare(b)),
    [ordered]
  );

  const rows = useMemo(
    () => (stateName ? ordered.filter((f) => f.stateName === stateName) : ordered),
    [ordered, stateName]
  );

  const visible = rows.slice(0, limit);
  const hidden = rows.length - visible.length;

  if (festivals.length === 0) return null;

  return (
    <div>
      <div
        className="flex max-w-full gap-1.5 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter festivals by state"
      >
        <button
          type="button"
          onClick={() => {
            setStateName(null);
            setLimit(PAGE);
          }}
          aria-pressed={stateName === null}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-label-md font-semibold transition-colors ${
            stateName === null
              ? "border-primary-container bg-primary-container text-white"
              : "border-border-subtle bg-surface-card text-text-secondary hover:text-text-primary"
          }`}
        >
          All states
        </button>
        {stateOptions.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setStateName(name);
              setLimit(PAGE);
            }}
            aria-pressed={stateName === name}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-label-md font-semibold transition-colors ${
              stateName === name
                ? "border-primary-container bg-primary-container text-white"
                : "border-border-subtle bg-surface-card text-text-secondary hover:text-text-primary"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((festival, i) => (
          <motion.li
            key={`${stateName ?? "all"}-${festival.id}`}
            className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
            {...(reduceMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.2, delay: Math.min(i, PAGE - 1) * 0.03 },
                })}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-border-subtle bg-slate-50 text-center"
                title={festival.window}
              >
                <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">
                  {festival.month}
                </span>
                <span className="text-lg font-bold tabular-nums leading-none text-text-primary">
                  {dayChip(festival)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-body-md font-semibold leading-tight text-text-primary">
                  {festival.name}
                </h3>
                <p className="mt-1 text-[11px] text-text-muted">
                  {festival.stateName}
                  {festival.venue ? ` · ${festival.venue}` : ""}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TONE_BADGE[festival.tone]}`}
                >
                  {festival.category}
                </span>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 text-body-sm text-text-secondary">
              {festival.summary}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => void openByName(festival.name)}
                disabled={resolving === festival.name}
                className="text-label-md font-semibold text-primary transition-opacity hover:underline disabled:opacity-60"
              >
                {resolving === festival.name ? "Loading…" : "Read more"}
              </button>
              <Link
                href={`/people/map?states=${festival.stateId ?? festival.stateName}`}
                className="text-label-md font-semibold text-text-secondary transition-colors hover:text-text-primary"
              >
                On map →
              </Link>
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col items-center gap-2">
        {hidden > 0 ? (
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-5 py-2.5 text-label-md font-semibold text-text-secondary shadow-sm transition-colors hover:border-primary-container/40 hover:text-primary"
          >
            See more festivals ({hidden} left)
            <span aria-hidden>▾</span>
          </button>
        ) : null}
        <p className="text-body-sm text-text-muted">
          Showing {visible.length} of {rows.length} festivals
          {stateName ? ` in ${stateName}` : ""} (A–Z).
        </p>
      </div>
    </div>
  );
}
