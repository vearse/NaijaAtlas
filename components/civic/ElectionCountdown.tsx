"use client";

import { useEffect, useState } from "react";
import { formatElectionDate } from "@/lib/election/countdown";

type Props = {
  /** ISO date, e.g. `2027-01-16`. */
  date: string | null;
  year: number;
  source: string;
};

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
};

function remainingTo(iso: string | null): Remaining | null {
  if (!iso) return null;
  const target = Date.parse(iso);
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

const CELLS: { key: keyof Omit<Remaining, "past">; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hrs" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
];

/** Live DAYS/HRS/MIN/SEC grid for the next general election. */
export default function ElectionCountdown({
  date,
  year,
  source,
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
    <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label-caps tracking-wider text-text-muted">
          {year} General Elections
        </p>
        {!remaining.past && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-alert-coral">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-alert-coral" />
            LIVE
          </span>
        )}
      </div>

      <p className="mt-1 text-headline-sm font-semibold text-text-primary">
        {remaining.past ? "Polling has closed" : "Counting down to election day"}
      </p>
      <p className="mt-1 text-body-sm text-text-muted">
        {formatElectionDate(date ?? undefined)} · {source}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {CELLS.map((cell) => (
          <div
            key={cell.key}
            className="rounded-xl border border-border-subtle bg-slate-50 px-2 py-2.5 text-center"
          >
            <p className="font-landing-display text-headline-sm tabular-nums text-text-primary">
              {String(remaining[cell.key]).padStart(2, "0")}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {cell.label}
            </p>
          </div>
        ))}
      </div>

      <a
        href="https://inecnigeria.org/"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline"
      >
        Full INEC calendar
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}
