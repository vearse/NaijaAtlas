"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { QuizFactBase } from "@/lib/learn/factBase";
import { countQuestions, type QuizIndex } from "@/lib/learn/questions";
import {
  ALL_TOPICS,
  DIFFICULTIES,
  QUIZ_MODES,
  filterForConfig,
  getQuizMode,
  type QuizConfig,
} from "@/lib/learn/quizModes";
import { useLearnProgress } from "@/lib/learn/progress";
import { todayKey } from "@/lib/learn/rng";
import { QuizStateMap, prefetchLgaSvg } from "@/components/learn/quiz/QuizMaps";

const LENGTHS = [5, 10, 15, 20];

export default function QuizSetup({
  fb,
  ix,
  config,
  onChange,
  onStart,
}: {
  fb: QuizFactBase;
  ix: QuizIndex;
  config: QuizConfig;
  onChange: (c: QuizConfig) => void;
  onStart: () => void;
}) {
  const progress = useLearnProgress();
  const mode = getQuizMode(config.modeId);
  const names = useMemo(() => new Map(fb.states.map((s) => [s.id, s.name])), [fb.states]);
  const available = countQuestions(ix, filterForConfig(mode, config));
  const chosenState = config.stateId ? ix.stateById.get(config.stateId) : null;
  const dailyDone = progress.daily.results[todayKey()];
  const canStart = available > 0 && (!mode.needsState || !!config.stateId);

  const set = (patch: Partial<QuizConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-label-caps uppercase text-primary-container">Choose your game</p>
          <h1 className="mt-1 font-landing-display text-headline-lg font-bold text-text-primary">How do you want to play?</h1>
        </div>
        <p className="text-sm text-text-muted">
          <span className="font-bold text-text-primary">{countQuestions(ix).toLocaleString("en-NG")}</span> questions generated from the atlas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <ul className="grid gap-3 sm:grid-cols-2">
          {QUIZ_MODES.map((m, i) => {
            const active = m.id === mode.id;
            const best = progress.best[m.id];
            return (
              <motion.li key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
                <button
                  type="button"
                  onClick={() => set({
                      modeId: m.id,
                      length: !m.endless && !m.daily && LENGTHS.includes(config.length) ? config.length : m.defaultLength,
                    })
                  }
                  aria-pressed={active}
                  className={`group relative flex h-full w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-primary-container bg-emerald-50 shadow-md ring-2 ring-primary-container/30"
                      : "border-border-subtle bg-surface-card hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
                  }`}
                >
                  <motion.span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm"
                    animate={active ? { rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {m.emoji}
                  </motion.span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-text-primary">{m.title}</span>
                    <span className="block text-xs font-semibold text-primary-container">{m.tagline}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{m.description}</span>
                    {m.daily && dailyDone !== undefined ? (
                      <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        Done today · {dailyDone}%
                      </span>
                    ) : best !== undefined ? (
                      <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        Best: {m.id === "blitz" || m.id === "survival" ? best.toLocaleString("en-NG") : `${best}%`}
                      </span>
                    ) : null}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        <motion.aside
          key={mode.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-fit space-y-5 rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm lg:sticky lg:top-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mode.emoji}</span>
            <div>
              <p className="font-landing-display text-headline-sm font-bold text-text-primary">{mode.title}</p>
              <p className="text-xs text-text-muted">
                {available.toLocaleString("en-NG")} possible question{available === 1 ? "" : "s"}
                {mode.gameSeconds ? ` · ${mode.gameSeconds}s on the clock` : ""}
                {mode.lives ? ` · ${mode.lives} lives` : ""}
              </p>
            </div>
          </div>

          {mode.needsState ? (
            <div>
              <p className="mb-2 text-label-caps uppercase text-text-muted">Pick a state on the map</p>
              <div className="overflow-hidden rounded-xl border border-border-subtle bg-gradient-to-br from-emerald-50 via-white to-slate-50">
                <QuizStateMap
                  names={names}
                  className="h-64"
                  showHoverName
                  focusId={null}
                  labels={config.stateId ? [config.stateId] : []}
                  pulseId={config.stateId}
                  stateOf={(id) => (id === config.stateId ? "spotlight" : "idle")}
                  onPick={(id) => {
                    prefetchLgaSvg(id);
                    set({ stateId: id });
                  }}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <select
                  value={config.stateId ?? ""}
                  onChange={(e) => {
                    prefetchLgaSvg(e.target.value);
                    set({ stateId: e.target.value || null });
                  }}
                  className="h-10 flex-1 rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-text-primary"
                  aria-label="State"
                >
                  <option value="">Choose a state…</option>
                  {[...fb.states].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.lgaCount} LGAs
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const s = fb.states[Math.floor(Math.random() * fb.states.length)];
                    prefetchLgaSvg(s.id);
                    set({ stateId: s.id });
                  }}
                  className="h-10 rounded-xl border border-border-subtle px-3 text-sm font-semibold text-text-secondary hover:bg-slate-50"
                  title="Surprise me"
                >
                  🎲
                </button>
              </div>
              <AnimatePresence>
                {chosenState ? (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-xs text-text-secondary"
                  >
                    <span className="font-bold text-text-primary">{chosenState.name}</span> · {chosenState.zoneName} ·{" "}
                    {chosenState.lgaCount} LGAs{chosenState.capital ? ` · capital ${chosenState.capital}` : ""}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}

          {mode.topicPicker ? (
            <div>
              <p className="mb-2 text-label-caps uppercase text-text-muted">Topics</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map((t) => {
                  const on = config.topics.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        const topics = on ? config.topics.filter((x) => x !== t.id) : [...config.topics, t.id];
                        if (topics.length) set({ topics });
                      }}
                      className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                        on ? "border-primary-container bg-primary-container text-white" : "border-border-subtle bg-white text-text-secondary hover:bg-slate-50"
                      }`}
                    >
                      <span>{t.emoji}</span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!mode.endless && !mode.daily ? (
            <div>
              <p className="mb-2 text-label-caps uppercase text-text-muted">Questions</p>
              <div className="grid grid-cols-4 gap-2">
                {LENGTHS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={config.length === n}
                    disabled={n > available}
                    onClick={() => set({ length: n })}
                    className={`h-10 rounded-xl border text-sm font-bold transition-colors disabled:opacity-40 ${
                      config.length === n ? "border-primary-container bg-emerald-50 text-primary-container" : "border-border-subtle bg-white text-text-secondary hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!mode.daily ? (
            <div>
              <p className="mb-2 text-label-caps uppercase text-text-muted">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={config.difficulty === d.id}
                    onClick={() => set({ difficulty: d.id })}
                    className={`rounded-xl border px-2 py-2 text-left transition-colors ${
                      config.difficulty === d.id ? "border-primary-container bg-emerald-50" : "border-border-subtle bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-sm font-bold text-text-primary">{d.label}</span>
                    <span className="block text-[11px] leading-tight text-text-muted">{d.detail}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Everyone gets the same 7 questions today. Daily streak: <b>{progress.daily.streak}</b> 🔥
            </p>
          )}

          <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-text-muted">
            Helpers: <b>50:50</b> removes wrong choices · <b>Hint</b> gives a clue (or lights up the zone) · <b>Skip</b> passes. Keys: 1–4,
            H, F, S, Enter.
          </div>

          <motion.button
            type="button"
            disabled={!canStart}
            onClick={onStart}
            whileHover={canStart ? { scale: 1.02 } : undefined}
            whileTap={canStart ? { scale: 0.97 } : undefined}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-container text-base font-bold text-white shadow-md transition-colors hover:bg-[#006d40] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {mode.needsState && !config.stateId ? "Pick a state to start" : available === 0 ? "No questions yet" : "Start playing"}
            {canStart ? <span aria-hidden>→</span> : null}
          </motion.button>
        </motion.aside>
      </div>
    </div>
  );
}
