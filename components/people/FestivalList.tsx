"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { festivalDayRange, monthIndex, type Festival } from "@/lib/festivals";
import { useWikiReader } from "@/hooks/useWikiReader";

const PAGE = 6;

const TONE_BADGE: Record<Festival["tone"], string> = {
  primary: "bg-primary-tint-light text-primary",
  amber: "bg-heritage-amber-tint text-heritage-amber border border-amber-200",
  slate: "bg-slate-100 text-text-secondary",
};

const TONE_CHIP: Record<Festival["tone"], string> = {
  primary: "bg-primary-tint-light border-primary/20 text-primary border",
  amber: "bg-surface-base border-border-subtle text-text-muted border",
  slate: "bg-surface-base border-border-subtle text-text-muted border",
};

/** Every tracked festival, in calendar order, six at a time behind "See more". */
export default function FestivalList({ festivals }: { festivals: Festival[] }) {
  const reduceMotion = useReducedMotion();
  const { openByName, resolving } = useWikiReader();
  const [limit, setLimit] = useState(PAGE);
  const [stateName, setStateName] = useState<string | null>(null);

  const ordered = useMemo(
    () =>
      [...festivals].sort(
        (a, b) => monthIndex(a.window) - monthIndex(b.window) || a.startDay - b.startDay
      ),
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-landing-display text-headline-lg tracking-tight text-text-primary">
            Festivals &amp; cultural gatherings
          </h2>
          <p className="mt-1 max-w-2xl text-body-md text-text-secondary">
            Every recurring festival in the catalogue, in calendar order — the
            dances, harvest rites, masquerades and processions that mark the year.
          </p>
        </div>

        <div
          className="flex max-w-full gap-1.5 overflow-x-auto pb-1 lg:max-w-md lg:justify-end"
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
                className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-lg border text-center ${TONE_CHIP[festival.tone]}`}
              >
                <span className="font-label-caps text-label-caps font-bold uppercase">
                  {festival.month}
                </span>
                <span className="font-headline-sm text-headline-sm font-bold leading-none text-text-primary">
                  {festivalDayRange(festival)}
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="text-body-md font-semibold leading-tight text-text-primary">
                  {festival.name}
                </h3>
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 font-label-caps text-label-caps ${TONE_BADGE[festival.tone]}`}
                >
                  {festival.category}
                </span>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 text-body-sm text-text-secondary">
              {festival.summary}
            </p>
            <p className="mt-2 text-[11px] text-text-muted">
              {festival.stateName} · {festival.venue}
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
                href={`/explore?map=minimal&states=${festival.stateName}`}
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
          Showing {visible.length} of {rows.length} tracked festivals
          {stateName ? ` in ${stateName}` : " nationwide"}.
        </p>
      </div>
    </div>
  );
}