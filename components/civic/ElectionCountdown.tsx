"use client";

import { useEffect, useState } from "react";
import { formatElectionDate } from "@/lib/election/countdown";
import { GENERAL_ELECTION_DATE_ISO } from "@/lib/election/schedule";

type Props = {
  /** ISO date, e.g. `2027-01-16`. */
  date: string | null;
  year: number;
  source: string;
  className?: string;
};

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
};

function remainingTo(iso: string | null): Remaining | null {
  const resolved = iso ?? GENERAL_ELECTION_DATE_ISO;
  const target =
    /^\d{4}-\d{2}-\d{2}$/.test(resolved)
      ? Date.parse(`${resolved}T08:00:00+01:00`)
      : Date.parse(resolved);
  if (Number.isNaN(target)) return null;
  const delta = target - Date.now();
  const abs = Math.abs(delta);
  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor(abs / 3_600_000) % 24,
    minutes: Math.floor(abs / 60_000) % 60,
    seconds: Math.floor(abs / 1000) % 60,
    past: delta <= 0,
  };
}

/** Live countdown for the next general election. */
export default function ElectionCountdown({
  date,
  year,
  source,
  className = "",
}: Props) {
  const [remaining, setRemaining] = useState<Remaining | null>(() =>
    remainingTo(date)
  );

  useEffect(() => {
    setRemaining(remainingTo(date));
    const id = window.setInterval(() => setRemaining(remainingTo(date)), 1000);
    return () => window.clearInterval(id);
  }, [date]);

  if (!remaining) return null;

  return (
    <div
      className={`flex h-full flex-col justify-between space-y-5 rounded-xl border border-border-subtle bg-surface-card p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!remaining.past && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert-coral opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-alert-coral" />
            </span>
          )}
          <p className="text-label-caps font-bold tracking-wider text-text-muted">
            {year} General Elections
          </p>
        </div>
        <a
          href="https://inecnigeria.org/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-primary hover:underline"
        >
          INEC schedule →
        </a>
      </div>

      <div className="rounded-xl border border-border-subtle bg-[#fafaf9] p-4 text-center">
        <p className="font-landing-display text-headline-xl font-bold tabular-nums tracking-tight text-primary">
          {remaining.days}
          <span className="mx-1 text-sm font-normal text-slate-400">d</span>
          {String(remaining.hours).padStart(2, "0")}
          <span className="mx-1 text-sm font-normal text-slate-400">h</span>
          {String(remaining.minutes).padStart(2, "0")}
          <span className="mx-1 text-sm font-normal text-slate-400">m</span>
          {String(remaining.seconds).padStart(2, "0")}
          <span className="mx-1 text-sm font-normal text-slate-400">s</span>
        </p>
        <p className="mt-1 text-xs font-medium text-text-muted">
          {remaining.past
            ? "Polling has closed"
            : `Official polling · ${formatElectionDate(date ?? undefined)} · ${source}`}
        </p>
      </div>
    </div>
  );
}
