"use client";

import { useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import RecentResults from "@/components/learn/RecentResults";
import {
  MOCK_DAILY,
  MOCK_QUIZZES,
  MOCK_RESULTS,
  type QuizCatalogItem,
} from "@/lib/learn/mockQuizzes";

const FILTERS = [
  { id: "all", label: "All quizzes" },
  { id: "geography", label: "Geography" },
  { id: "civic", label: "Civic & governance" },
  { id: "culture", label: "Culture & people" },
  { id: "quick", label: "Quick 5-min" },
] as const;

function QuizIcon({ kind }: { kind: string }) {
  const emoji =
    kind === "pin"
      ? "📍"
      : kind === "city"
        ? "🏙️"
        : kind === "grid"
          ? "▦"
          : kind === "vote"
            ? "🗳️"
            : kind === "terrain"
              ? "🏞️"
              : kind === "water"
                ? "💧"
                : kind === "festival"
                  ? "🎪"
                  : "⏱️";
  return (
    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-primary flex items-center justify-center text-xl">
      {emoji}
    </div>
  );
}

function QuizCard({ quiz }: { quiz: QuizCatalogItem }) {
  const diffClass =
    quiz.difficulty === "Hard"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : quiz.difficulty === "Medium"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-emerald-50 text-emerald-800 border-emerald-200";

  return (
    <article className="bg-surface-card rounded-2xl border border-border-subtle shadow-sm p-6 flex flex-col justify-between landing-light-card">
      <div>
        <div className="flex items-start justify-between mb-4">
          <QuizIcon kind={quiz.icon} />
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${diffClass}`}
            >
              {quiz.difficulty}
            </span>
            <span className="text-xs text-text-muted">{quiz.questionCount} Qs</span>
          </div>
        </div>
        <h3 className="font-landing-display text-headline-sm text-text-primary font-bold mb-2">
          {quiz.title}
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed">{quiz.description}</p>
      </div>
      <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-text-muted">Avg score: {quiz.avgScore}</span>
        <Link
          href={`/learn/play?mode=${quiz.mode}`}
          className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-sm"
        >
          Start →
        </Link>
      </div>
    </article>
  );
}

export default function LearnHubClient() {
  const [filter, setFilter] = useState<string>("all");

  const visible =
    filter === "all"
      ? MOCK_QUIZZES
      : MOCK_QUIZZES.filter((q) => q.category === filter);

  return (
    <HubShell>
      <HubHeader
        active="learn"
        primaryCta={{ label: "Start quiz", href: "/learn/play?mode=find-state" }}
      />
      <HubBreadcrumb trail={[{ label: "Learn", href: "/learn" }]} />

      <main className="mx-auto max-w-[1200px] px-4 md:px-6 pb-16">
        <section className="pt-12 md:pt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-label-caps">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                LEARN
              </span>
              <h1 className="mt-4 font-landing-display text-display-hero-mobile md:text-display-hero text-text-primary tracking-tight">
                Test yourself.
              </h1>
              <p className="mt-3 text-body-lg text-text-secondary">
                Geography, zones, civic basics, and culture — UI preview with mock
                scores until the question bank ships.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 p-2 bg-surface-card rounded-2xl border border-border-subtle shadow-sm">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-primary px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200/60">
                🔥 7 day streak
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200/60">
                🏆 Best: 96%
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
                {MOCK_DAILY.scholarLevel}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="w-full bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-teal-50 border-b border-emerald-100 px-6 py-3 flex flex-wrap justify-between gap-2 text-label-caps text-emerald-800">
              <span>Daily civic challenge • {MOCK_DAILY.cycleLabel}</span>
              <span className="text-xs font-medium">
                Refreshes in {MOCK_DAILY.refreshesIn}
              </span>
            </div>
            <div className="p-6 md:p-8 grid lg:grid-cols-2 gap-8 items-center">
              <div className="bg-slate-50 rounded-xl border border-border-subtle p-6 flex flex-col items-center">
                <span className="text-xs text-text-muted w-full mb-2 font-mono">
                  {MOCK_DAILY.stateCode}
                </span>
                <svg
                  viewBox="0 0 400 320"
                  className="w-full max-w-sm aspect-[4/3]"
                  aria-hidden
                >
                  <path
                    d="M 60,110 L 110,60 L 160,50 L 220,65 L 290,55 L 340,95 L 370,160 L 350,220 L 310,260 L 270,250 L 250,290 L 190,290 L 160,265 L 120,280 L 70,240 L 40,190 Z"
                    fill="#e2e8f0"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                  />
                  <path
                    d="M 215,145 L 250,140 L 270,175 L 245,190 L 210,175 Z"
                    fill="#008751"
                    stroke="#00522f"
                    strokeWidth="2"
                  />
                  <circle cx="238" cy="165" r="6" fill="#fff" stroke="#008751" strokeWidth="2" />
                </svg>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-tint-light px-2.5 py-1 font-label-caps text-label-caps text-primary">
                  {MOCK_DAILY.boundaryFocus}
                </span>
                <p className="text-xs text-text-muted mt-2">Static schematic · not live map</p>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-primary uppercase mb-2">
                  <span>
                    Question {MOCK_DAILY.questionIndex} of {MOCK_DAILY.totalQuestions}
                  </span>
                  <span>{MOCK_DAILY.progressPct}% complete</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full border border-border-subtle overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full"
                    style={{ width: `${MOCK_DAILY.progressPct}%` }}
                  />
                </div>
                <h2 className="font-landing-display text-headline-md text-text-primary mt-5 font-bold">
                  {MOCK_DAILY.prompt}
                </h2>
                <p className="text-sm text-text-secondary mt-2">{MOCK_DAILY.hint}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/learn/play?mode=daily"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-container px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary"
                  >
                    Play today&apos;s challenge
                    <span className="text-xs font-normal opacity-80">
                      ~3 mins · 10 bonus scholar XP
                    </span>
                  </Link>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-slate-50 px-4 py-3">
                  <span className="text-sm text-text-secondary">
                    Already played today?
                  </span>
                  <Link
                    href="/learn/play?mode=results"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    See your result
                    <span aria-hidden>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16" id="quizzes">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-5">
            <div>
              <span className="text-label-caps text-primary">Catalog</span>
              <h2 className="font-landing-display text-headline-lg text-text-primary font-bold mt-1">
                Choose your challenge
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${
                    filter === f.id
                      ? "bg-primary-container text-white border-primary-container"
                      : "bg-surface-card text-slate-700 border-border-subtle hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((q) => (
              <QuizCard key={q.id} quiz={q} />
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-border-subtle pt-12">
          <h2 className="font-landing-display text-headline-lg text-text-primary">
            Learn from the atlas
          </h2>
          <p className="text-body-md text-text-secondary mt-2 max-w-2xl">
            Until quizzes are wired to a verified bank, study with section hubs and
            maps.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <MapWorkspaceCard map="land/physical" kicker="Terrain & water" />
            <MapWorkspaceCard map="people/groups" kicker="Homelands" />
            <MapWorkspaceCard map="civic/elections" kicker="Civic basics" />
          </div>
        </section>

        <RecentResults />

        <div className="mt-14 rounded-xl border border-border-subtle bg-slate-100/70 px-6 py-4 text-center text-xs text-text-muted">
          Source: Nigerian Educational Research and Development Council (NERDC)
          &amp; NPC · Verified open data · Last updated October 2024
        </div>

        <p className="mt-12 text-body-sm text-text-muted border-t border-border-subtle pt-8">
          Mock UI only — scores, streaks, and answers are placeholders. Gameplay
          helpers live on{" "}
          <Link href="/learn/play" className="text-primary font-semibold hover:underline">
            /learn/play
          </Link>
          .
        </p>
      </main>

      <HubFooter />
    </HubShell>
  );
}
