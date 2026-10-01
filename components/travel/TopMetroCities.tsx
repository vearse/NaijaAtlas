"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { VIBE_BY_ID } from "@/components/travel/metroVibes";
import { useWikiReader } from "@/hooks/useWikiReader";
import type { HubMetro } from "@/lib/server/loadTravelHubData";

const PAGE = 6;

type Props = {
  metros: HubMetro[];
  /** Called with the seat city name so the route planner can resolve it. */
  onRouteTo: (cityName: string) => void;
};

/**
 * The opening picks: metro cities rather than parks, six at a time, expandable
 * to the full catalogue. Picking a card sets it as the route destination.
 */
export default function TopMetroCities({ metros, onRouteTo }: Props) {
  const reduceMotion = useReducedMotion();
  const { openArticle, openByName, resolving } = useWikiReader();

  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState(metros[0]?.id ?? "");

  const visible = useMemo(
    () => (expanded ? metros : metros.slice(0, PAGE)),
    [expanded, metros]
  );
  const metro = metros.find((m) => m.id === activeId) ?? metros[0];

  const pick = (id: string) => {
    setActiveId(id);
    const next = metros.find((m) => m.id === id);
    if (next?.cityName) onRouteTo(next.cityName);
  };

  if (!metro) return null;

  const remaining = metros.length - PAGE;

  return (
    <section className="space-y-6" id="destinations">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-heritage-amber">
            Top destinations
          </span>
          <h2 className="mt-1 font-landing-display text-headline-lg tracking-tight text-text-primary">
            Start in a metro city.
          </h2>
          <p className="max-w-xl text-body-md text-text-secondary">
            Where the crowds, the jobs and the night life are. Tap a city to set
            it as your destination — the route bar at the bottom follows along.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-label-md font-semibold text-text-secondary shadow-sm transition-colors hover:border-primary-container/40 hover:text-primary sm:self-auto"
        >
          {expanded ? "Show top 6" : `See more (${remaining})`}
          <span
            className={`inline-block transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((m) => {
          const vibe = VIBE_BY_ID[m.vibe];
          const isActive = m.id === metro.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m.id)}
              aria-pressed={isActive}
              className={`relative flex flex-col rounded-2xl p-4 text-left shadow-sm transition-all ${
                isActive
                  ? "border-2 border-primary bg-primary-tint-light"
                  : "border border-border-subtle bg-surface-card hover:border-slate-300"
              }`}
            >
              <span
                className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: vibe.accent }}
              >
                <span aria-hidden>{vibe.icon}</span>
                {vibe.label}
              </span>

              <h3 className="font-headline-sm text-headline-sm text-text-primary">
                {m.name}
              </h3>
              <p className="mt-0.5 text-[11px] text-text-muted">
                {m.stateNames.join(" · ")}
              </p>
              <p className="mt-2 line-clamp-3 text-body-sm text-text-secondary">
                {m.description}
              </p>

              <span
                className={`mt-4 flex items-center justify-between border-t pt-3 text-label-md ${
                  isActive ? "border-primary/20 font-semibold text-primary" : "border-border-subtle text-text-muted"
                }`}
              >
                <span>{isActive ? "Destination set" : "Set as destination"}</span>
                <span aria-hidden>→</span>
              </span>
            </button>
          );
        })}
      </div>

      {!expanded && remaining > 0 ? (
        <p className="text-center text-body-sm text-text-muted">
          Showing {PAGE} of {metros.length} metro cities.
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={metro.id}
          className="grid gap-6 rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_220px] md:p-6"
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0 },
                transition: { duration: 0.22 },
              })}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
                {metro.name}
              </h3>
              <span className="rounded-full border border-primary/20 bg-primary-tint-light px-2.5 py-0.5 font-label-caps text-label-caps text-primary">
                {metro.stateNames[0] ?? "Nigeria"}
              </span>
              <span className="text-[11px] text-text-muted">
                {metro.lon != null && metro.lat != null
                  ? `${metro.lat.toFixed(3)}°, ${metro.lon.toFixed(3)}°`
                  : "Not geocoded"}
              </span>
            </div>

            <p className="mt-2 text-body-md text-text-secondary">{metro.description}</p>

            {metro.peoples.length > 0 ? (
              <div className="mt-4">
                <p className="font-label-caps text-label-caps uppercase text-text-muted">
                  Who you&apos;ll meet
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {metro.peoples.slice(0, 5).map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-border-subtle bg-surface-base px-2.5 py-1 text-[11px] font-semibold text-text-secondary"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {metro.notes.length > 0 ? (
              <div className="mt-4 rounded-xl border border-border-subtle bg-surface-base p-3">
                <p
                  className="font-label-caps text-label-caps uppercase"
                  style={{ color: VIBE_BY_ID[metro.vibe].accent }}
                >
                  Did you know?
                </p>
                <p className="mt-1 font-semibold text-text-primary">
                  {metro.notes[0].title}
                </p>
                <p className="mt-1 text-body-sm text-text-secondary">
                  {metro.notes[0].note}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {metro.cityName ? (
                <button
                  type="button"
                  onClick={() => onRouteTo(metro.cityName as string)}
                  className="inline-flex h-10 items-center rounded-xl bg-primary-container px-4 text-label-md font-semibold text-white transition-colors hover:bg-primary"
                >
                  Plan a trip here
                </button>
              ) : null}

              {metro.wikiUrl ? (
                <button
                  type="button"
                  onClick={() => openArticle(metro.wikiUrl as string, metro.name)}
                  disabled={resolving === metro.name}
                  className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-surface-base px-4 text-label-md font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary disabled:opacity-60"
                >
                  Read more
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void openByName(metro.name)}
                  disabled={resolving === metro.name}
                  className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-surface-base px-4 text-label-md font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary disabled:opacity-60"
                >
                  {resolving === metro.name ? "Loading…" : "Read more"}
                </button>
              )}

              {metro.slug ? (
                <Link
                  href={`/places/${metro.slug}`}
                  className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-surface-base px-4 text-label-md font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary"
                >
                  {metro.stateNames[0]} profile
                </Link>
              ) : null}

              <Link
                href={`/explore?lens=tourist&states=${metro.stateIds.join(",")}`}
                className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-surface-base px-4 text-label-md font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary"
              >
                On the map
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-base p-3">
            <NigeriaThumb
              source="states"
              highlight={metro.stateIds}
              accent={VIBE_BY_ID[metro.vibe].accent}
              markers={
                metro.lon != null && metro.lat != null
                  ? [{ lon: metro.lon, lat: metro.lat }]
                  : []
              }
              className="h-44 w-full md:h-full md:min-h-[12rem]"
              title={metro.name}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}