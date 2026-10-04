"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GENERAL_ELECTION_DATE_MS } from "@/lib/election/schedule";
import { IconArrow } from "@/components/landing/icons";
import type { LandingDailyTeaser } from "@/lib/server/loadLandingDailyTeaser";
import { useLearnProgress } from "@/lib/learn/progress";
import { todayKey } from "@/lib/learn/rng";

const ELECTION_DATE = new Date(GENERAL_ELECTION_DATE_MS);

function useCountdown(target: Date) {
  const [parts, setParts] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setParts({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        mins: Math.floor((diff / 60000) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return parts;
}

type TeaserOutcome = "idle" | "correct" | "wrong";

export default function LiveNowStrip({ dailyTeaser }: { dailyTeaser: LandingDailyTeaser | null }) {
  const { days, hours, mins, secs } = useCountdown(ELECTION_DATE);
  const progress = useLearnProgress();
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<TeaserOutcome>("idle");
  const dailyDone = progress.daily.results[todayKey()];

  const handlePick = (id: string) => {
    if (!dailyTeaser || outcome !== "idle") return;
    setPicked(id);
    setOutcome(id === dailyTeaser.answerId ? "correct" : "wrong");
  };

  const statusLabel =
    outcome === "correct"
      ? `Correct · ${dailyTeaser?.answerLabel ?? ""}`
      : outcome === "wrong"
        ? "Not quite"
        : "Tap an answer";

  return (
    <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="landing-light-card rounded-2xl p-6 flex flex-col justify-between bg-surface-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 landing-pulse-radar" />
            <span className="text-label-caps text-rose-700 uppercase font-bold">
              Electoral pulse
            </span>
          </div>
          <span className="text-label-md text-text-muted">INEC schedule</span>
        </div>
        <div className="my-4">
          <h2 className="text-headline-sm text-text-primary mb-3 font-bold">
            2027 General Election
          </h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { v: days, l: "DAYS" },
              { v: hours, l: "HOURS" },
              { v: mins, l: "MINS" },
              { v: secs, l: "SECS", accent: true },
            ].map(({ v, l, accent }) => (
              <div
                key={l}
                className="bg-slate-50 border border-border-subtle rounded-lg p-2"
              >
                <span
                  className={`text-metric-mono block leading-none tabular-nums font-bold ${
                    accent ? "text-primary" : "text-text-primary"
                  }`}
                >
                  {v}
                </span>
                <span className="text-[10px] font-label-caps text-text-muted uppercase mt-1 block">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Link
          href="/civic"
          className="inline-flex items-center justify-between w-full pt-2 text-label-md text-primary hover:text-primary-container font-semibold transition-colors"
        >
          <span>View candidates &amp; ballot specs</span>
          <IconArrow />
        </Link>
      </div>

      <div className="landing-light-card rounded-2xl p-6 flex flex-col justify-between group bg-surface-card">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-bold">
            Happening this month
          </span>
          <span className="text-label-md text-text-muted">Heritage</span>
        </div>
        <div className="my-3 flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-border-subtle shrink-0 bg-amber-50">
            <Image
              src="/images/osun-osogbo-grove.svg"
              alt="Illustration of worshippers in ceremonial white and indigo cloth at the riverbank of the Osun-Osogbo Sacred Grove, with brass offerings and ancient rainforest canopy behind them."
              width={80}
              height={80}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div>
            <h2 className="text-headline-sm text-text-primary leading-tight font-bold">
              Osun-Osogbo Sacred Grove
            </h2>
            <p className="text-body-sm text-text-secondary mt-1">
              UNESCO World Heritage Site · Osun State
            </p>
            <p className="text-[12px] font-label-caps text-amber-700 mt-1 font-bold">
              Annual festival season
            </p>
          </div>
        </div>
        <Link
          href="/travel"
          className="inline-flex items-center justify-between w-full pt-2 text-label-md text-primary hover:text-primary-container font-semibold transition-colors"
        >
          <span>Discover festival guide</span>
          <IconArrow />
        </Link>
      </div>

      <div className="landing-light-card rounded-2xl p-6 flex flex-col justify-between bg-surface-card relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-label-caps text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 font-bold shrink-0">
            Daily challenge
          </span>
          <span
            className={`text-label-caps truncate ${
              outcome === "correct"
                ? "text-primary font-bold"
                : outcome === "wrong"
                  ? "text-rose-600 font-bold"
                  : "text-text-muted"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {dailyTeaser ? (
          <div className="my-3 min-h-0 flex-1">
            <p className="text-label-md text-text-muted">
              Question {dailyTeaser.questionIndex} of {dailyTeaser.totalQuestions} · same set on Learn today
            </p>
            <h2 className="text-headline-sm text-text-primary mt-1 mb-3 font-bold leading-snug">
              {dailyTeaser.prompt}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {dailyTeaser.options.map((opt) => {
                const isPicked = picked === opt.id;
                const isAnswer = opt.id === dailyTeaser.answerId;
                let btnClass =
                  "px-3 py-2 rounded-lg text-label-md border text-left transition-colors ";
                if (outcome === "idle") {
                  btnClass +=
                    "bg-slate-50 text-slate-800 border-border-subtle hover:bg-emerald-50 hover:border-emerald-300";
                } else if (isAnswer) {
                  btnClass += "bg-emerald-500 text-white border-emerald-600 font-semibold";
                } else if (isPicked) {
                  btnClass += "bg-rose-500 text-white border-rose-600";
                } else {
                  btnClass += "bg-slate-50 text-slate-400 border-border-subtle opacity-60";
                }
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    disabled={outcome !== "idle"}
                    className={btnClass}
                    onClick={() => handlePick(opt.id)}
                    animate={
                      reduce
                        ? undefined
                        : isPicked && outcome === "wrong"
                          ? { x: [0, -6, 6, -4, 4, 0] }
                          : isAnswer && outcome !== "idle"
                            ? { scale: [1, 1.04, 1] }
                            : undefined
                    }
                    transition={{ duration: 0.4 }}
                  >
                    <span className="block font-semibold">{opt.label}</span>
                    {opt.sub ? (
                      <span className={`block text-[10px] font-normal ${isAnswer && outcome !== "idle" ? "text-white/85" : "text-text-muted"}`}>
                        {opt.sub}
                      </span>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {outcome !== "idle" ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2 overflow-hidden"
                >
                  {outcome === "wrong" ? (
                    <p className="text-body-sm text-text-secondary">
                      Answer: <span className="font-bold text-emerald-700">{dailyTeaser.answerLabel}</span>
                    </p>
                  ) : null}
                  <p className="line-clamp-2 text-body-sm text-text-muted">{dailyTeaser.explanation}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                      href="/learn/play?mode=daily&autostart=1"
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-container px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#006d40]"
                    >
                      {dailyDone !== undefined ? "Play more on Learn" : "Continue playing"}
                      <span aria-hidden>→</span>
                    </Link>
                    <Link
                      href="/learn"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle px-4 text-sm font-semibold text-text-secondary hover:bg-slate-50"
                    >
                      All game modes
                    </Link>
                  </div>
                  {progress.daily.streak > 0 ? (
                    <p className="text-[11px] font-semibold text-teal-800">
                      🔥 {progress.daily.streak}-day streak on Learn — keep it going
                    </p>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : (
          <div className="my-3">
            <p className="text-body-sm text-text-secondary">Today&apos;s teaser is loading…</p>
            <Link href="/learn/play?mode=daily&autostart=1" className="mt-3 inline-flex text-sm font-semibold text-primary">
              Open daily challenge →
            </Link>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-body-sm text-text-muted border-t border-slate-100 mt-2">
          <span>
            {outcome === "idle"
              ? dailyDone !== undefined
                ? `You finished today's run (${dailyDone}%)`
                : "Atlas-generated · refreshes at midnight"
              : "6 more in today's set on Learn"}
          </span>
          <span aria-hidden>🏆</span>
        </div>
      </div>
    </section>
  );
}
