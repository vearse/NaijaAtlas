"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconExplore } from "@/components/landing/icons";

type GameMode =
  | "find-state"
  | "capitals"
  | "zones"
  | "civic"
  | "features"
  | "quick"
  | "daily"
  | "feedback"
  | "results";

const MODE_TABS: { id: GameMode; label: string }[] = [
  { id: "find-state", label: "Find state (map)" },
  { id: "capitals", label: "Multiple choice" },
  { id: "features", label: "Feature quiz" },
  { id: "feedback", label: "Feedback" },
  { id: "results", label: "Results" },
  { id: "daily", label: "Daily" },
];

const MOCK_OPTIONS = ["Plateau", "Nasarawa", "Benue", "Taraba"];

const SESSION = {
  questionNumber: 4,
  totalQuestions: 10,
  progressPct: 40,
  xp: 320,
  streak: 3,
  streakTarget: 3,
  finalScorePct: 90,
  correct: 9,
  xpEarned: 450,
  xpBonus: 50,
  countdown: "14h 22m 10s",
};

const MISSED = [
  {
    question: "Where is Shiroro Dam located?",
    chose: "Kaduna",
    correct: "Niger",
  },
];

const LEADERBOARD = {
  topState: "Enugu",
  citizens: "14,820",
  daysRunning: 8,
};

export default function QuizGameShellClient() {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("mode") as GameMode) || "find-state";
  const [mode, setMode] = useState<GameMode>(
    MODE_TABS.some((m) => m.id === initial) ? initial : "find-state"
  );
  const [selected, setSelected] = useState<string | null>(null);

  const title = useMemo(() => {
    const t = MODE_TABS.find((m) => m.id === mode);
    return t?.label ?? "Quiz";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "daily") return "Daily Civic Challenge • 36 States Atlas";
    if (mode === "results") return "Session complete • Find the State";
    return "NaijaAtlas Quiz • 36 States Atlas";
  }, [mode]);

  const showActionDeck =
    mode !== "feedback" && mode !== "results" && mode !== "daily";

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas font-landing">
      <div className="bg-surface-card border-b border-border-subtle px-4 py-2 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <span className="text-label-caps text-text-muted">Preview modes</span>
          <div className="flex flex-wrap gap-1.5">
            {MODE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  setSelected(null);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  mode === tab.id
                    ? "border-primary-container bg-primary-container text-white"
                    : "border-border-subtle bg-surface-card text-text-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-card shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link
            href="/learn"
            className="inline-flex shrink-0 items-center gap-2 text-label-md font-semibold text-text-secondary transition-colors hover:text-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-sm text-white">
              <IconExplore className="h-4 w-4" />
            </span>
            Exit quiz
          </Link>

          <div className="min-w-0 text-center">
            <p className="truncate text-headline-sm font-bold text-text-primary">
              {title}
            </p>
            <p className="truncate text-[11px] text-text-muted">{subtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 sm:inline-flex">
              <span aria-hidden>⚡</span>
              {SESSION.xp} XP
            </span>
            <span className="hidden text-xs text-text-muted md:inline">
              Question {SESSION.questionNumber} of {SESSION.totalQuestions}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
              {SESSION.streak}/{SESSION.streakTarget} Correct Streak
            </span>
            <button
              type="button"
              title="Help"
              aria-label="Quiz help"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-secondary transition-colors hover:bg-slate-50 hover:text-text-primary"
            >
              ?
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-primary-container"
            style={{ width: `${SESSION.progressPct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {(mode === "find-state" || mode === "daily") && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-border-subtle bg-surface-card p-4">
              <p className="mb-2 text-label-caps text-text-muted">Map helper</p>
              <div className="absolute inset-4 top-10 flex items-center justify-center rounded-xl border border-border-subtle bg-slate-100">
                <svg viewBox="0 0 400 320" className="h-auto w-4/5 max-h-[240px]" aria-hidden>
                  <path
                    d="M 60,110 L 110,60 L 160,50 L 220,65 L 290,55 L 340,95 L 370,160 L 350,220 L 310,260 L 270,250 L 250,290 L 190,290 L 160,265 L 120,280 L 70,240 L 40,190 Z"
                    fill="#e2e8f0"
                    stroke="#94a3b8"
                  />
                  <path
                    d="M 215,145 L 250,140 L 270,175 L 245,190 L 210,175 Z"
                    fill="#008751"
                    opacity="0.9"
                  />
                </svg>
              </div>
              <div className="absolute right-4 top-4 flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label="Zoom in"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary shadow-sm transition-colors hover:bg-slate-50"
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label="Zoom out"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary shadow-sm transition-colors hover:bg-slate-50"
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label="Toggle layers"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary shadow-sm transition-colors hover:bg-slate-50"
                >
                  ◈
                </button>
              </div>
              <p className="absolute bottom-6 left-6 right-6 text-center text-xs text-text-muted">
                Tap a state on the map (wired later)
              </p>
            </div>
            <QuizQuestionPanel
              prompt="Which state is highlighted?"
              helper="Use the map or pick an answer below."
              options={MOCK_OPTIONS}
              zones={["North Central", "North Central", "North Central", "North East"]}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        )}

        {(mode === "capitals" ||
          mode === "zones" ||
          mode === "civic" ||
          mode === "quick") && (
          <QuizQuestionPanel
            prompt="What is the capital of Kwara State?"
            helper="Pick the state capital. Hotkeys 1–4."
            options={["Ilorin", "Offa", "Lokoja", "Ogbomoso"]}
            showHotkeys
            selected={selected}
            onSelect={setSelected}
          />
        )}

        {mode === "features" && (
          <div className="space-y-6">
            <p className="text-label-caps text-text-muted">Zoomed feature helper</p>
            <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-300 bg-slate-200 text-text-secondary">
              Lake / river inset (mock)
            </div>
            <QuizQuestionPanel
              prompt="Where is Kainji Lake?"
              helper="Four state choices — map zoom TBD."
              options={["Niger", "Kebbi", "Kwara", "Kogi"]}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        )}

        {mode === "feedback" && <FeedbackFrame onNext={() => setMode("find-state")} />}

        {mode === "results" && <ResultsFrame />}

        {mode === "daily" && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-surface-card/80 px-3 py-1 text-label-caps text-label-caps text-primary">
                Daily challenge
              </span>
              <h2 className="mt-4 font-landing-display text-headline-lg font-bold text-text-primary">
                The 36 States &amp; FCT Geography Blitz
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-body-md text-text-secondary">
                One map question a day for a week. Keep the streak alive for bonus
                scholar XP.
              </p>
              <button
                type="button"
                onClick={() => setMode("find-state")}
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary-container px-8 font-label-md text-label-md text-white shadow-sm transition-colors hover:bg-primary"
              >
                Begin quiz
                <span aria-hidden>&rarr;</span>
              </button>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
              <p className="text-label-caps uppercase text-text-muted">
                Leaderboard preview
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <LeaderStat term="Top state" value={LEADERBOARD.topState} />
                <LeaderStat term="Citizens" value={LEADERBOARD.citizens} />
                <LeaderStat
                  term="Days running"
                  value={`${LEADERBOARD.daysRunning} days`}
                />
              </div>
            </div>
          </div>
        )}

        {showActionDeck && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-6">
            <button
              type="button"
              disabled
              className="h-10 rounded-xl border border-border-subtle px-4 text-sm text-slate-400"
            >
              Skip question (−10 XP)
            </button>
            <button
              type="button"
              className="h-10 rounded-xl bg-primary-container px-6 text-sm font-semibold text-white"
              onClick={() => setMode("feedback")}
            >
              Submit answer (mock)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function LeaderStat({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className="text-label-caps uppercase text-text-muted">{term}</p>
      <p className="mt-1 font-headline-sm text-headline-sm font-bold text-text-primary">
        {value}
      </p>
    </div>
  );
}

function FeedbackFrame({ onNext }: { onNext: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </span>
        <h2 className="font-landing-display text-headline-md font-bold text-text-primary">
          Answer verified
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-label-caps uppercase text-emerald-700">Correct</p>
          <p className="mt-1 font-headline-sm text-headline-sm font-bold text-text-primary">
            Plateau State
          </p>
          <p className="mt-1 text-body-sm text-text-secondary">
            North Central · Home of Peace and Tourism
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 opacity-70">
          <p className="text-label-caps uppercase text-rose-700">You chose</p>
          <p className="mt-1 font-headline-sm text-headline-sm font-bold text-text-primary">
            Nasarawa
          </p>
          <p className="mt-1 text-body-sm text-text-secondary">
            North Central · Karu, Lafia
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-tint-light px-2.5 py-1 text-label-caps text-label-caps text-primary">
          <span aria-hidden>◈</span> Verified Atlas Intel
        </span>
        <h3 className="mt-3 font-headline-sm text-headline-sm font-bold text-text-primary">
          Plateau: home of peace and tourism
        </h3>
        <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
          Plateau State sits on the Jos Plateau, bordered by Bauchi, Kaduna,
          Taraba and Nasarawa. Its rolling highland terrain makes it the
          country&apos;s best-known tourism belt, and its capital, Jos, was
          built as a hill station.
        </p>
        <Link
          href="/places/plateau"
          className="mt-4 inline-flex items-center gap-1 text-label-md text-label-md font-semibold text-primary hover:underline"
        >
          Learn more in Places
          <span aria-hidden>&rarr;</span>
        </Link>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="h-11 w-full rounded-xl bg-primary-container font-semibold text-white transition-colors hover:bg-primary"
      >
        Next question
      </button>
    </div>
  );
}

function ResultsFrame() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl border border-border-subtle bg-surface-card p-8 text-center shadow-sm">
        <p className="text-label-caps uppercase text-primary">Session complete</p>
        <p className="mt-2 font-mono text-6xl font-bold leading-none text-text-primary">
          {SESSION.finalScorePct}%
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultStat term="Final score" value={`${SESSION.finalScorePct}%`} />
          <ResultStat
            term="Accuracy"
            value={`${SESSION.correct}/${SESSION.totalQuestions}`}
          />
          <ResultStat term="XP earned" value={`+${SESSION.xpEarned}`} />
        </div>
        <p className="mt-3 text-xs font-medium text-emerald-700">
          +{SESSION.xpBonus} bonus streak
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/learn/play?mode=find-state"
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary-container font-semibold text-white transition-colors hover:bg-primary"
          >
            Play again
          </Link>
          <Link
            href="/learn"
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border-subtle font-semibold text-text-secondary transition-colors hover:bg-slate-50"
          >
            Try another quiz
          </Link>
          <button
            type="button"
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border-subtle font-semibold text-text-secondary transition-colors hover:bg-slate-50"
          >
            Share result
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
        <p className="text-label-caps uppercase text-text-muted">
          Missed questions
        </p>
        <ul className="mt-4 space-y-3">
          {MISSED.map((item) => (
            <li
              key={item.question}
              className="rounded-xl border border-border-subtle bg-slate-50 p-4"
            >
              <p className="text-sm font-bold text-text-primary">{item.question}</p>
              <p className="mt-1 text-xs text-text-secondary">
                You chose <span className="font-semibold text-rose-700">{item.chose}</span>
                {" · "}correct answer is{" "}
                <span className="font-semibold text-emerald-700">{item.correct}</span>
              </p>
              <Link
                href="/land"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Learn more
                <span aria-hidden>&rarr;</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary-tint-light px-6 py-5 text-center">
        <p className="text-label-caps uppercase text-primary">Next daily challenge</p>
        <p className="mt-1 font-mono text-headline-sm text-headline-sm font-bold text-text-primary">
          {SESSION.countdown}
        </p>
        <p className="mt-1 text-body-sm text-text-secondary">
          Come back tomorrow to keep your {SESSION.streak}-day streak alive.
        </p>
      </div>
    </div>
  );
}

function ResultStat({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-label-caps uppercase text-text-muted">{term}</p>
      <p className="mt-1 font-headline-sm text-headline-sm font-bold text-text-primary">
        {value}
      </p>
    </div>
  );
}

function QuizQuestionPanel({
  prompt,
  helper,
  options,
  zones,
  showHotkeys,
  selected,
  onSelect,
}: {
  prompt: string;
  helper: string;
  options: string[];
  zones?: string[];
  showHotkeys?: boolean;
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
      <p className="text-xs font-bold uppercase text-primary">
        Question {SESSION.questionNumber} of {SESSION.totalQuestions}
      </p>
      <h2 className="mt-3 font-landing-display text-headline-md font-bold text-text-primary">
        {prompt}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">{helper}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((opt, i) => (
          <li key={opt}>
            <button
              type="button"
              onClick={() => onSelect(opt)}
              aria-pressed={selected === opt}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-label-md font-medium transition-colors ${
                selected === opt
                  ? "border-primary-container bg-emerald-50 text-primary"
                  : "border-border-subtle bg-slate-50 text-text-primary hover:border-slate-300"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-xs font-bold text-text-secondary">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1">
                {opt}
                {zones?.[i] ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-text-muted">
                    {zones[i]}
                  </span>
                ) : null}
              </span>
              {showHotkeys ? (
                <span className="shrink-0 rounded border border-border-subtle bg-surface-card px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
                  {i + 1}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}