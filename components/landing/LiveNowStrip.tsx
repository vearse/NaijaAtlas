"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GENERAL_ELECTION_DATE_MS } from "@/lib/election/schedule";
import { IconArrow } from "@/components/landing/icons";

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

      <div className="landing-light-card rounded-2xl p-6 flex flex-col justify-between bg-surface-card">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 font-bold">
            Daily challenge
          </span>
          <span
            className={`text-label-caps ${
              quizStatus.includes("CORRECT")
                ? "text-primary font-bold"
                : quizStatus.includes("INCORRECT")
                  ? "text-rose-600"
                  : "text-text-muted"
            }`}
          >
            {quizStatus}
          </span>
        </div>
        <div className="my-3">
          <p className="text-label-md text-text-muted">Question 14 of 30</p>
          <h2 className="text-headline-sm text-text-primary mt-1 mb-3 font-bold">
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
                className="px-3 py-2 rounded-lg bg-slate-50 text-label-md text-slate-800 border border-border-subtle hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-left"
                onClick={() => handleQuiz(ok)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-2 flex items-center justify-between text-body-sm text-text-muted">
          <span>78% answered correctly today</span>
          <span aria-hidden>🏆</span>
        </div>
      </div>
    </section>
  );
}
