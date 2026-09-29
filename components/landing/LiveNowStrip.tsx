"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrow } from "@/components/landing/icons";

const ELECTION_DATE = new Date("2027-02-21T08:00:00+01:00");

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

export default function LiveNowStrip() {
  const { days, hours, mins, secs } = useCountdown(ELECTION_DATE);
  const [quizStatus, setQuizStatus] = useState("CHOOSE ONE");

  const handleQuiz = (correct: boolean) => {
    setQuizStatus(
      correct ? "CORRECT! NIGER STATE" : "INCORRECT · TRY AGAIN"
    );
  };

  return (
    <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="landing-glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error landing-pulse-radar" />
            <span className="text-label-caps text-error tracking-wider uppercase">
              Electoral pulse
            </span>
          </div>
          <span className="text-label-md text-on-surface-variant">
            INEC schedule
          </span>
        </div>
        <div className="my-4">
          <h2 className="text-headline-sm text-on-surface mb-3">
            2027 General Election
          </h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { v: days, l: "DAYS" },
              { v: hours, l: "HOURS" },
              { v: mins, l: "MINS" },
              { v: secs, l: "SECS" },
            ].map(({ v, l }) => (
              <div
                key={l}
                className="bg-surface-container-lowest/90 border border-outline-variant/40 rounded-lg p-2 shadow-inner"
              >
                <span className="text-metric-mono text-primary block leading-none tabular-nums">
                  {v}
                </span>
                <span className="text-[10px] font-label-caps text-outline uppercase mt-1 block">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Link
          href="/explore?map=election"
          className="inline-flex items-center justify-between w-full pt-2 text-label-md text-primary hover:text-primary-fixed transition-colors"
        >
          <span>View candidates &amp; ballot specs</span>
          <IconArrow />
        </Link>
      </div>

      <div className="landing-glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-500/20">
            Happening this month
          </span>
          <span className="text-label-md text-on-surface-variant">
            Heritage
          </span>
        </div>
        <div className="my-3">
          <h2 className="text-headline-sm text-on-surface leading-tight">
            Osun-Osogbo Sacred Grove
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            UNESCO World Heritage Site · Osun State
          </p>
          <p className="text-[12px] font-label-caps text-tertiary mt-1">
            Annual festival season
          </p>
        </div>
        <Link
          href="/explore?lens=tourist"
          className="inline-flex items-center justify-between w-full pt-2 text-label-md text-primary hover:text-primary-fixed transition-colors"
        >
          <span>Discover festival guide</span>
          <IconArrow />
        </Link>
      </div>

      <div className="landing-glass-card rounded-2xl p-6 flex flex-col justify-between relative">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-tertiary bg-tertiary-container/30 px-2.5 py-1 rounded-full border border-tertiary/20">
            Daily challenge
          </span>
          <span
            className={`text-label-caps ${
              quizStatus.includes("CORRECT")
                ? "text-primary font-bold"
                : quizStatus.includes("INCORRECT")
                  ? "text-error"
                  : "text-outline"
            }`}
          >
            {quizStatus}
          </span>
        </div>
        <div className="my-3">
          <p className="text-label-md text-on-surface-variant">
            Question 14 of 30
          </p>
          <h2 className="text-headline-sm text-on-surface mt-1 mb-3">
            Which state is Kainji Lake in?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Niger", ok: true },
              { label: "Kebbi", ok: false },
              { label: "Kwara", ok: false },
              { label: "Kogi", ok: false },
            ].map(({ label, ok }) => (
              <button
                key={label}
                type="button"
                className="px-3 py-2 rounded-lg bg-surface-container text-label-md text-on-surface border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-left"
                onClick={() => handleQuiz(ok)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-2 flex items-center justify-between text-body-sm text-outline">
          <span>78% answered correctly today</span>
          <span aria-hidden>🏆</span>
        </div>
      </div>
    </section>
  );
}
