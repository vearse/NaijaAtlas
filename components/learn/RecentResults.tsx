"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_RESULTS, type RecentResult } from "@/lib/learn/mockQuizzes";

const BADGE_TONE: Record<RecentResult["badgeTone"], string> = {
  primary:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border border-amber-200 bg-amber-50 text-amber-700",
};

export default function RecentResults() {
  const [showEmpty, setShowEmpty] = useState(false);

  return (
    <section className="mt-16 space-y-6" id="results">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="font-label-caps text-label-caps uppercase text-primary">
            Performance record
          </span>
          <h2 className="mt-1 font-landing-display text-headline-md font-bold tracking-tight text-text-primary">
            Recent results
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowEmpty((v) => !v)}
          className="shrink-0 text-xs text-text-muted underline decoration-dotted transition-colors hover:text-primary"
        >
          {showEmpty ? "Show results" : "Preview empty state"}
        </button>
      </div>

      {showEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-slate-50/60 px-6 py-12 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400"
            aria-hidden
          >
            ◷
          </span>
          <p className="text-sm font-bold text-text-primary">No plays yet?</p>
          <p className="mx-auto max-w-sm text-xs text-text-muted">
            Take your first quiz today to build your civic knowledge rating and
            benchmark your knowledge with peers.
          </p>
          <Link
            href="/learn/play?mode=find-state"
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary-container px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary"
          >
            Take first quiz
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
          {MOCK_RESULTS.map((result) => (
            <div
              key={result.id}
              className="flex flex-col items-start justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-primary">
                  {result.scorePct}%
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {result.title}
                  </h4>
                  <p className="text-xs text-text-muted">{result.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONE[result.badgeTone]}`}
                >
                  {result.badge}
                </span>
                <Link
                  href={result.href}
                  className="inline-flex items-center text-xs font-bold text-primary hover:underline"
                >
                  Review answers
                  <span className="ml-0.5" aria-hidden>
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}