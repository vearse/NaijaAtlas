"use client";

import Link from "next/link";
import type { QuizRunRecord } from "@/lib/learn/progress";

function ago(at: number) {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export default function RecentResults({ history }: { history: QuizRunRecord[] }) {
  return (
    <section className="mt-16 space-y-6" id="results">
      <div>
        <span className="font-label-caps text-label-caps uppercase text-primary-container">Performance record</span>
        <h2 className="mt-1 font-landing-display text-headline-md font-bold tracking-tight text-text-primary">Recent results</h2>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-slate-50/60 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl" aria-hidden>
            🎯
          </span>
          <p className="font-bold text-text-primary">No games yet</p>
          <p className="max-w-sm text-sm text-text-secondary">Play any mode and your scores will show up here.</p>
          <Link href="/learn/play" className="mt-1 text-sm font-semibold text-primary-container hover:underline">
            Start your first quiz →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {history.slice(0, 6).map((r) => {
            const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
            const perfect = pct === 100 && r.total >= 5;
            return (
              <li key={r.at} className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-mono text-sm font-black ${
                    pct >= 75 ? "bg-emerald-50 text-emerald-700" : pct >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {pct}%
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-text-primary">{r.title}</p>
                  <p className="text-xs text-text-muted">
                    {r.correct}/{r.total} · {r.score.toLocaleString("en-NG")} pts · {ago(r.at)}
                  </p>
                  {perfect ? (
                    <span className="mt-1 inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      Perfect ⭐
                    </span>
                  ) : null}
                </div>
                <Link href={`/learn/play?mode=${r.modeId}`} className="text-xs font-semibold text-primary-container hover:underline">
                  Retry
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
