"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { QuizQuestion } from "@/lib/learn/questions";
import type { QuizMode } from "@/lib/learn/quizModes";
import { ConfettiBurst, CountUp } from "@/components/learn/quiz/Fx";

export type AnswerLog = {
  question: QuizQuestion;
  pickedId: string | null;
  pickedLabel: string | null;
  outcome: "correct" | "wrong" | "skipped" | "timeout";
  points: number;
};

function verdict(pct: number) {
  if (pct === 100) return { title: "Flawless! Atlas legend 🏆", tone: "text-amber-600" };
  if (pct >= 90) return { title: "Oshey! You sabi Nigeria 🔥", tone: "text-emerald-600" };
  if (pct >= 75) return { title: "Sharp! Nearly there 💪", tone: "text-emerald-600" };
  if (pct >= 50) return { title: "Not bad — keep exploring 🧭", tone: "text-amber-600" };
  return { title: "E no reach yet — try again! 🌱", tone: "text-rose-600" };
}

export default function QuizResults({
  mode,
  log,
  score,
  xp,
  bestStreak,
  newBest,
  onReplay,
  onChangeMode,
}: {
  mode: QuizMode;
  log: AnswerLog[];
  score: number;
  xp: number;
  bestStreak: number;
  newBest: boolean;
  onReplay: () => void;
  onChangeMode: () => void;
}) {
  const correct = log.filter((l) => l.outcome === "correct").length;
  const total = log.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const stars = pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0;
  const missed = log.filter((l) => l.outcome !== "correct");
  const v = verdict(pct);
  const [copied, setCopied] = useState(false);
  const r = 54;
  const c = 2 * Math.PI * r;

  const share = async () => {
    const grid = log.map((l) => (l.outcome === "correct" ? "🟩" : l.outcome === "skipped" ? "⬜" : "🟥")).join("");
    const text = `NaijaAtlas · ${mode.title}\n${correct}/${total} (${pct}%) · ${score.toLocaleString("en-NG")} pts\n${grid}\n${window.location.origin}/learn`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* share dismissed */
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-card p-8 text-center shadow-sm"
      >
        <ConfettiBurst fireKey={pct >= 75 ? "results" : null} count={60} big />
        <p className="text-label-caps uppercase text-primary-container">{mode.emoji} {mode.title} · complete</p>
        <h2 className={`mt-2 font-landing-display text-headline-md font-bold ${v.tone}`}>{v.title}</h2>

        <div className="relative mx-auto mt-6 h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <motion.circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={pct >= 75 ? "#008751" : pct >= 50 ? "#f59e0b" : "#e11d48"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - pct / 100) }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-black text-text-primary">
              <CountUp value={pct} duration={1.2} />%
            </span>
            <span className="text-[11px] text-text-muted">
              {correct}/{total} correct
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2" aria-label={`${stars} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={`text-4xl ${i < stars ? "" : "opacity-20 grayscale"}`}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.9 + i * 0.2, type: "spring", stiffness: 400, damping: 12 }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        {newBest ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mx-auto mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800"
          >
            New personal best!
          </motion.p>
        ) : null}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat term="Score" value={<CountUp value={score} duration={1.2} />} />
          <Stat term="XP earned" value={<>+<CountUp value={xp} duration={1.2} /></>} />
          <Stat term="Best streak" value={`${bestStreak} 🔥`} />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-1" aria-hidden>
          {log.map((l, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.03 }}
              className={`h-3 w-3 rounded-sm ${l.outcome === "correct" ? "bg-emerald-500" : l.outcome === "skipped" ? "bg-slate-300" : "bg-rose-500"}`}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onReplay}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary-container font-semibold text-white transition-colors hover:bg-[#006d40]"
          >
            {mode.daily ? "Practice mixed" : "Play again"}
          </button>
          <button
            type="button"
            onClick={onChangeMode}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border-subtle font-semibold text-text-secondary transition-colors hover:bg-slate-50"
          >
            Change mode
          </button>
          <button
            type="button"
            onClick={share}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border-subtle font-semibold text-text-secondary transition-colors hover:bg-slate-50"
          >
            {copied ? "Copied!" : "Share result"}
          </button>
        </div>
      </motion.div>

      {missed.length ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm"
        >
          <p className="text-label-caps uppercase text-text-muted">Review · {missed.length} to learn</p>
          <ul className="mt-4 space-y-3">
            {missed.map((m, i) => (
              <li key={m.question.key + i} className="rounded-xl border border-border-subtle bg-slate-50 p-4">
                <p className="text-sm font-bold text-text-primary">{m.question.prompt}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {m.outcome === "skipped" ? (
                    "Skipped"
                  ) : m.outcome === "timeout" ? (
                    "Time ran out"
                  ) : (
                    <>
                      You chose <span className="font-semibold text-rose-700">{m.pickedLabel}</span>
                    </>
                  )}
                  {" · "}answer: <span className="font-semibold text-emerald-700">{m.question.answerLabel}</span>
                </p>
                <p className="mt-1 text-xs text-text-muted">{m.question.explanation}</p>
                {m.question.learnMoreHref ? (
                  <Link href={m.question.learnMoreHref} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-container hover:underline">
                    Learn more <span aria-hidden>→</span>
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}
    </div>
  );
}

function Stat({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase text-text-muted">{term}</p>
      <p className="mt-1 font-mono text-lg font-black text-text-primary">{value}</p>
    </div>
  );
}
