"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { METRO_VIBES as VIBES } from "@/components/travel/metroVibes";
import { useWikiReader } from "@/hooks/useWikiReader";
import type { HubMetro, MetroVibe } from "@/lib/server/loadTravelHubData";

export default function MetroCities({
  metros,
  onRouteTo,
}: {
  metros: HubMetro[];
  /** Receives the city name of the metro's seat. */
  onRouteTo?: (cityName: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const { openArticle, openByName, resolving } = useWikiReader();
  const vibes = useMemo(
    () => VIBES.filter((v) => metros.some((m) => m.vibe === v.id)),
    [metros]
  );
  const [vibeId, setVibeId] = useState<MetroVibe>(vibes[0]?.id ?? "capital");
  const inVibe = useMemo(() => metros.filter((m) => m.vibe === vibeId), [metros, vibeId]);
  const [activeId, setActiveId] = useState(inVibe[0]?.id ?? "");
  const [noteIdx, setNoteIdx] = useState(0);

  const vibe = VIBES.find((v) => v.id === vibeId) ?? VIBES[0];
  const metro = inVibe.find((m) => m.id === activeId) ?? inVibe[0];

  const pickVibe = (id: MetroVibe) => {
    setVibeId(id);
    setActiveId(metros.find((m) => m.vibe === id)?.id ?? "");
    setNoteIdx(0);
  };
  const pickMetro = (id: string) => {
    setActiveId(id);
    setNoteIdx(0);
  };
  const surprise = () => {
    const pool = metros.filter((m) => m.id !== metro?.id);
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (!next) return;
    setVibeId(next.vibe);
    setActiveId(next.id);
    setNoteIdx(0);
  };

  if (!metro) return null;
  const note = metro.notes.length ? metro.notes[noteIdx % metro.notes.length] : null;

  const swap = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -12 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <section id="metro-cities" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-heritage-amber">
            Metro cities
          </span>
          <h2 className="mt-1 font-landing-display text-headline-lg text-text-primary">
            Pick a city by its mood.
          </h2>
          <p className="mt-1 max-w-xl text-body-md text-text-secondary">
            Every Nigerian metro has a personality. Choose a vibe, open a city,
            and send it straight to the route planner.
          </p>
        </div>
        <button
          type="button"
          onClick={surprise}
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-label-md font-semibold text-text-secondary shadow-sm hover:border-primary-container/40 hover:text-primary"
        >
          <span aria-hidden>🎲</span>
          Surprise me
        </button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Metro vibe">
        {vibes.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={vibeId === v.id}
            onClick={() => pickVibe(v.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-label-md font-semibold transition-all duration-200 ${
              vibeId === v.id
                ? "border-transparent text-white shadow-md"
                : "border-border-subtle bg-surface-card text-text-secondary hover:text-text-primary"
            }`}
            style={vibeId === v.id ? { backgroundColor: v.accent } : undefined}
          >
            <span aria-hidden>{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      <div
        className={`mt-6 overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br ${vibe.wash} via-white to-white shadow-sm`}
      >
        <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          {/* Ticket stack */}
          <div className="border-b border-border-subtle p-4 lg:border-b-0 lg:border-r">
            <p className="px-1 text-body-sm italic text-text-muted">{vibe.tagline}</p>
            <ul className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
              {inVibe.map((m) => {
                const active = m.id === metro.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => pickMetro(m.id)}
                      className={`group relative flex w-full items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-left transition-all duration-200 ${
                        active
                          ? "border-transparent bg-white shadow-md"
                          : "border-slate-300 bg-white/60 hover:bg-white"
                      }`}
                      style={active ? { boxShadow: `inset 4px 0 0 ${vibe.accent}` } : undefined}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ backgroundColor: vibe.accent, opacity: active ? 1 : 0.65 }}
                      >
                        {(m.cityName ?? m.name).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-text-primary">
                          {m.cityName ?? m.name}
                        </span>
                        <span className="block truncate text-[11px] text-text-muted">
                          {m.stateNames.join(" · ")}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Feature */}
          <AnimatePresence mode="wait">
            <motion.div
              key={metro.id}
              className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_200px] md:p-6"
              {...swap}
            >
              <div className="min-w-0">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-caps uppercase text-white"
                  style={{ backgroundColor: vibe.accent }}
                >
                  {vibe.icon} {vibe.label}
                </span>
                <h3 className="mt-3 font-landing-display text-headline-md text-text-primary">
                  {metro.name}
                </h3>
                <p className="mt-2 text-body-md text-text-secondary">{metro.description}</p>

                {metro.peoples.length > 0 && (
                  <div className="mt-4">
                    <p className="text-label-caps uppercase text-text-muted">Who you&apos;ll meet</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {metro.peoples.slice(0, 4).map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-border-subtle bg-white px-2.5 py-1 text-[11px] font-semibold text-text-secondary"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {note && (
                  <div className="mt-5 rounded-2xl border border-border-subtle bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-label-caps uppercase" style={{ color: vibe.accent }}>
                        Did you know?
                      </p>
                      {metro.notes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNoteIdx((i) => i + 1)}
                          className="text-[11px] font-semibold text-text-muted hover:text-text-primary"
                        >
                          Next fact →
                        </button>
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={noteIdx}
                        {...(reduceMotion
                          ? {}
                          : {
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              exit: { opacity: 0 },
                              transition: { duration: 0.18 },
                            })}
                      >
                        <p className="mt-1 font-semibold text-text-primary">{note.title}</p>
                        <p className="mt-1 text-body-sm text-text-secondary">{note.note}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {onRouteTo && metro.cityName && (
                    <button
                      type="button"
                      onClick={() => onRouteTo(metro.cityName as string)}
                      className="inline-flex h-10 items-center rounded-xl px-4 text-label-md font-semibold text-white"
                      style={{ backgroundColor: vibe.accent }}
                    >
                      Plan a trip here
                    </button>
                  )}
                  {metro.slug && (
                    <Link
                      href={`/places/${metro.slug}`}
                      className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-white px-4 text-label-md font-semibold text-text-secondary hover:text-primary"
                    >
                      {metro.stateNames[0]} profile
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      metro.wikiUrl
                        ? openArticle(metro.wikiUrl, metro.name)
                        : void openByName(metro.name)
                    }
                    disabled={resolving === metro.name}
                    className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-white px-4 text-label-md font-semibold text-text-secondary hover:text-primary disabled:opacity-60"
                  >
                    {resolving === metro.name ? "Loading…" : "Read more"}
                  </button>
                  <Link
                    href={`/travel/map?states=${metro.stateIds.join(",")}`}
                    className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-white px-4 text-label-md font-semibold text-text-secondary hover:text-primary"
                  >
                    On the map
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-white p-3">
                <NigeriaThumb
                  source="states"
                  highlight={metro.stateIds}
                  accent={vibe.accent}
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
        </div>
      </div>
    </section>
  );
}
