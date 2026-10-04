"use client";

import { useEffect, useState } from "react";
import { todayKey } from "@/lib/learn/rng";

export type QuizRunRecord = {
  modeId: string;
  title: string;
  correct: number;
  total: number;
  score: number;
  xp: number;
  bestStreak: number;
  at: number;
};

export type LearnProgress = {
  xp: number;
  best: Record<string, number>;
  history: QuizRunRecord[];
  daily: { lastDate: string | null; streak: number; results: Record<string, number> };
  muted: boolean;
};

const KEY = "naija-atlas.learn.v1";
const EVENT = "naija-atlas:learn-progress";

const EMPTY: LearnProgress = {
  xp: 0,
  best: {},
  history: [],
  daily: { lastDate: null, streak: 0, results: {} },
  muted: false,
};

export function readProgress(): LearnProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<LearnProgress>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(p: LearnProgress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage full or disabled — progress is best-effort */
  }
}

export function setMuted(muted: boolean) {
  write({ ...readProgress(), muted });
}

/** Saves a finished run; returns whether it beat the previous best for the mode. */
export function recordRun(run: QuizRunRecord, isDaily: boolean): { newBest: boolean } {
  const p = readProgress();
  const pct = run.total ? Math.round((run.correct / run.total) * 100) : 0;
  const metric = run.modeId === "blitz" || run.modeId === "survival" ? run.score : pct;
  const newBest = metric > 0 && metric > (p.best[run.modeId] ?? 0);
  const next: LearnProgress = {
    ...p,
    xp: p.xp + run.xp,
    best: newBest ? { ...p.best, [run.modeId]: metric } : p.best,
    history: [run, ...p.history].slice(0, 20),
  };
  if (isDaily) {
    const today = todayKey();
    const yesterday = todayKey(new Date(Date.now() - 86_400_000));
    if (p.daily.lastDate !== today) {
      next.daily = {
        lastDate: today,
        streak: p.daily.lastDate === yesterday ? p.daily.streak + 1 : 1,
        results: { ...p.daily.results, [today]: pct },
      };
    }
  }
  write(next);
  return { newBest };
}

export function useLearnProgress(): LearnProgress {
  const [p, setP] = useState<LearnProgress>(EMPTY);
  useEffect(() => {
    const sync = () => setP(readProgress());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return p;
}

/** Atlas scholar level from lifetime XP (each level needs 500 more XP). */
export function levelFromXp(xp: number) {
  const level = Math.floor(xp / 500) + 1;
  return { level, into: xp % 500, next: 500 };
}
