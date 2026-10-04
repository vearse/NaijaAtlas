"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import NigeriaStateMap, { type NigeriaStateMapEntry } from "@/components/places/NigeriaStateMap";
import RecentResults from "@/components/learn/RecentResults";
import { QUIZ_MODES, type QuizMode } from "@/lib/learn/quizModes";
import { levelFromXp, useLearnProgress } from "@/lib/learn/progress";
import { todayKey } from "@/lib/learn/rng";

type HubState = NigeriaStateMapEntry & { lgaCount: number };

const FILTERS = [
  { id: "all", label: "All games" },
  { id: "map", label: "Map hunts" },
  { id: "geography", label: "Geography" },
  { id: "civic", label: "Nigeria overview" },
  { id: "arcade", label: "Arcade" },
] as const;

function playHref(mode: string, extra = "") {
  return `/learn/play?mode=${mode}${extra}`;
}

function ModeCard({ mode, count, best, index }: { mode: QuizMode; count: number; best?: number; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="landing-light-card flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm"
    >
      <div>
        <div className="mb-4 flex items-start justify-between">
          <motion.div
            whileHover={{ rotate: [0, -12, 12, 0], scale: 1.1 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl"
          >
            {mode.emoji}
          </motion.div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
            {count.toLocaleString("en-NG")} Qs
          </span>
        </div>
        <h3 className="font-landing-display text-headline-sm font-bold text-text-primary">{mode.title}</h3>
        <p className="text-xs font-semibold text-primary-container">{mode.tagline}</p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{mode.description}</p>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-text-muted">
          {best === undefined
            ? "Not played yet"
            : `Your best: ${mode.id === "blitz" || mode.id === "survival" ? best.toLocaleString("en-NG") : `${best}%`}`}
        </span>
        <Link
          href={playHref(mode.id)}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-container px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#006d40]"
        >
          Play →
        </Link>
      </div>
    </motion.article>
  );
}

export default function LearnHubClient({
  totalQuestions,
  modeCounts,
  states,
  lgaTotal,
}: {
  totalQuestions: number;
  modeCounts: Record<string, number>;
  states: HubState[];
  lgaTotal: number;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [picked, setPicked] = useState<string | null>(null);
  const progress = useLearnProgress();
  const lvl = levelFromXp(progress.xp);
  const dailyDone = progress.daily.results[todayKey()];
  const pickedState = states.find((s) => s.id === picked);
  const bestPct = Math.max(0, ...Object.entries(progress.best).filter(([k]) => k !== "blitz" && k !== "survival").map(([, v]) => v));
  const visible = filter === "all" ? QUIZ_MODES : QUIZ_MODES.filter((m) => m.category === filter);

  return (
    <HubShell>
      <HubHeader active="learn" primaryCta={{ label: "Play now", href: "/learn/play" }} />
      <HubBreadcrumb trail={[{ label: "Learn", href: "/learn" }]} />

      <main className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
        <section className="pt-12 md:pt-16">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-label-caps text-emerald-800">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
                LEARN
              </span>
              <h1 className="mt-4 font-landing-display text-display-hero-mobile tracking-tight text-text-primary md:text-display-hero">
                How well do you know Naija?
              </h1>
              <p className="mt-3 text-body-lg text-text-secondary">
                {totalQuestions.toLocaleString("en-NG")} questions generated from {states.length} states and {lgaTotal} LGAs — tap
                the map, beat the clock, and keep your streak alive.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border-subtle bg-surface-card p-2 shadow-sm">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200/60 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                🔥 {progress.daily.streak} day streak
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                🏆 Best: {bestPct ? `${bestPct}%` : "—"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                Level {lvl.level} Atlas Scholar
                <span className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full bg-primary-container" style={{ width: `${(lvl.into / lvl.next) * 100}%` }} />
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
            <div className="flex flex-wrap justify-between gap-2 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-teal-50 px-6 py-3 text-label-caps text-emerald-800">
              <span>Quick play · pick a state</span>
              <span className="text-xs font-medium normal-case">Tap any state to quiz its LGAs</span>
            </div>
            <div className="relative bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 p-4">
              <NigeriaStateMap states={states} selectedId={picked} onSelect={setPicked} mapClassName="h-72 w-full md:h-[22rem]" />
              <AnimatePresence>
                {pickedState ? (
                  <motion.div
                    key={pickedState.id}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16 }}
                    className="absolute inset-x-4 bottom-4 rounded-2xl border border-border-subtle bg-white/95 p-4 shadow-lg backdrop-blur md:left-auto md:w-80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-landing-display text-headline-sm font-bold text-text-primary">{pickedState.name}</p>
                        <p className="text-xs text-text-muted">
                          {pickedState.regionName} · {pickedState.lgaCount} LGAs
                          {pickedState.capital ? ` · ${pickedState.capital}` : ""}
                        </p>
                      </div>
                      <button type="button" onClick={() => setPicked(null)} aria-label="Close" className="text-text-muted hover:text-text-primary">
                        ✕
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link
                        href={playHref("map-lgas", `&state=${pickedState.id}&autostart=1`)}
                        className="flex h-10 items-center justify-center rounded-xl bg-primary-container text-xs font-bold text-white hover:bg-[#006d40]"
                      >
                        🧭 Find its LGAs
                      </Link>
                      <Link
                        href={playHref("lga-master", `&state=${pickedState.id}&autostart=1`)}
                        className="flex h-10 items-center justify-center rounded-xl border border-border-subtle text-xs font-bold text-text-secondary hover:bg-slate-50"
                      >
                        🏘️ LGA master
                      </Link>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#043828] to-[#008751] p-6 text-white shadow-sm md:p-8">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-label-caps">📅 Daily challenge</span>
              <h2 className="mt-4 font-landing-display text-headline-lg font-bold">Seven questions. Same for everyone.</h2>
              <p className="mt-2 text-sm text-white/80">
                A fresh mix of map hunts, states and LGAs every day. Come back daily to grow your streak and earn bonus XP.
              </p>
            </div>
            <div className="mt-6">
              <div className="mb-4 flex gap-1.5" aria-label="Last 7 days">
                {Array.from({ length: 7 }, (_, i) => {
                  const key = todayKey(new Date(Date.now() - (6 - i) * 86_400_000));
                  const r = progress.daily.results[key];
                  return (
                    <motion.span
                      key={key}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      title={key}
                      className={`flex h-9 flex-1 items-center justify-center rounded-lg text-[11px] font-bold ${
                        r === undefined ? "bg-white/10 text-white/50" : r >= 70 ? "bg-emerald-300 text-emerald-950" : "bg-amber-300 text-amber-950"
                      }`}
                    >
                      {r === undefined ? "·" : `${r}%`}
                    </motion.span>
                  );
                })}
              </div>
              {dailyDone !== undefined ? (
                <p className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                  ✅ Done today with <b>{dailyDone}%</b>. New questions at midnight.
                </p>
              ) : (
                <Link
                  href={playHref("daily", "&autostart=1")}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-[#043828] shadow-md transition-transform hover:scale-[1.02]"
                >
                  Play today&apos;s challenge →
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mt-16" id="quizzes">
          <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-end">
            <div>
              <span className="text-label-caps text-primary-container">Game modes</span>
              <h2 className="mt-1 font-landing-display text-headline-lg font-bold text-text-primary">Choose your challenge</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                    filter === f.id
                      ? "border-primary-container bg-primary-container text-white"
                      : "border-border-subtle bg-surface-card text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <motion.div layout className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((m, i) => (
                <ModeCard key={m.id} mode={m} count={modeCounts[m.id] ?? 0} best={progress.best[m.id]} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        <RecentResults history={progress.history} />

        <section className="mt-16 border-t border-border-subtle pt-12">
          <h2 className="font-landing-display text-headline-lg text-text-primary">Study the atlas</h2>
          <p className="mt-2 max-w-2xl text-body-md text-text-secondary">
            Every quiz question links back to its source — explore the maps to level up faster.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <MapWorkspaceCard map="land/physical" kicker="Terrain & water" />
            <MapWorkspaceCard map="people/groups" kicker="Homelands" />
            <MapWorkspaceCard map="civic/elections" kicker="Civic basics" />
          </div>
        </section>

        <div className="mt-14 rounded-xl border border-border-subtle bg-slate-100/70 px-6 py-4 text-center text-xs text-text-muted">
          Questions are generated from the NaijaAtlas registry (UN SALB boundaries, NPC/NBS figures, state & LGA profiles). Progress is
          saved on this device.
        </div>
      </main>

      <HubFooter />
    </HubShell>
  );
}
