"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconExplore } from "@/components/landing/icons";
import type { QuizFactBase } from "@/lib/learn/factBase";
import {
  buildQuizIndex,
  buildQuizSession,
  type QuizDifficulty,
  type QuizQuestion,
  type QuizTopic,
} from "@/lib/learn/questions";
import {
  DIFFICULTIES,
  filterForConfig,
  getQuizMode,
  type QuizConfig,
  type QuizModeId,
} from "@/lib/learn/quizModes";
import { createRng, todayKey } from "@/lib/learn/rng";
import { recordRun, setMuted, useLearnProgress } from "@/lib/learn/progress";
import { playSfx } from "@/lib/learn/sfx";
import QuizSetup from "@/components/learn/quiz/QuizSetup";
import QuizResults, { type AnswerLog } from "@/components/learn/quiz/QuizResults";
import { QuizLgaMap, QuizStateMap, prefetchLgaSvg } from "@/components/learn/quiz/QuizMaps";
import type { ShapeState } from "@/components/learn/quiz/PickMap";
import { ConfettiBurst, CountUp, ScorePop, StartCountdown, TimerRing } from "@/components/learn/quiz/Fx";

type Phase = "setup" | "countdown" | "play" | "results";
type Outcome = AnswerLog["outcome"];

const HELPERS = { fifty: 2, hint: 3, skip: 2 };
const PRAISE = ["Correct o!", "Oshey!", "You sabi!", "Sharp!", "Na you be this!", "Brilliant!", "Perfect!"];
const OOPS = ["Ah, not quite", "E no reach", "Close one!", "Almost!", "Nope — but now you know"];
const COMBO_AT = new Set([3, 5, 10, 15, 20, 30]);

function readConfig(params: URLSearchParams): QuizConfig {
  const mode = getQuizMode(params.get("mode"));
  const diff = params.get("diff") as QuizDifficulty | null;
  const len = Number(params.get("len"));
  const topics = (params.get("topics")?.split(",") ?? []).filter((t): t is QuizTopic =>
    ["nigeria", "state", "lga"].includes(t)
  );
  return {
    modeId: mode.id,
    length: [5, 10, 15, 20].includes(len) ? len : mode.defaultLength,
    difficulty: DIFFICULTIES.some((d) => d.id === diff) ? diff! : "standard",
    topics: topics.length ? topics : ["nigeria", "state", "lga"],
    stateId: params.get("state"),
  };
}

function writeConfig(c: QuizConfig) {
  const p = new URLSearchParams();
  p.set("mode", c.modeId);
  if (c.stateId) p.set("state", c.stateId);
  p.set("diff", c.difficulty);
  if (c.length <= 20) p.set("len", String(c.length));
  if (c.topics.length < 3) p.set("topics", c.topics.join(","));
  window.history.replaceState(null, "", `/learn/play?${p}`);
}

export default function QuizGameShellClient({ fb }: { fb: QuizFactBase }) {
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const ix = useMemo(() => buildQuizIndex(fb), [fb]);
  const names = useMemo(() => new Map(fb.states.map((s) => [s.id, s.name])), [fb.states]);
  const lgaById = useMemo(() => new Map(fb.lgas.map((l) => [l.id, l])), [fb.lgas]);
  const progress = useLearnProgress();
  const muted = progress.muted;

  const [config, setConfig] = useState<QuizConfig>(() => readConfig(new URLSearchParams(searchParams.toString())));
  const mode = getQuizMode(config.modeId);
  const diff = DIFFICULTIES.find((d) => d.id === (mode.daily ? "standard" : config.difficulty))!;
  const perQuestionLimit = mode.gameSeconds ? null : diff.seconds;

  const [phase, setPhase] = useState<Phase>(searchParams.get("autostart") ? "countdown" : "setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [hintOn, setHintOn] = useState(false);
  const [helpers, setHelpers] = useState(HELPERS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(0);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [gameLeft, setGameLeft] = useState(0);
  const [qLeft, setQLeft] = useState(0);
  const [fx, setFx] = useState<{ confetti: number | null; pop: number | null; popValue: number | null; shake: number; combo: string | null }>(
    { confetti: null, pop: null, popValue: null, shake: 0, combo: null }
  );
  const [result, setResult] = useState<{ xp: number; newBest: boolean } | null>(null);
  const qStart = useRef(0);
  const finished = useRef(false);
  const fxN = useRef(0);

  const q = questions[idx];
  const isBlitz = !!mode.gameSeconds;

  const updateConfig = (c: QuizConfig) => {
    setConfig(c);
    writeConfig(c);
  };

  /* ---------------------------- session lifecycle ---------------------------- */

  const beginRun = useCallback(() => {
    const seed = mode.daily ? `daily-${todayKey()}` : `${Date.now()}-${Math.random()}`;
    const count = mode.endless ? mode.defaultLength : mode.daily ? mode.defaultLength : config.length;
    const qs = buildQuizSession(ix, filterForConfig(mode, config), count, createRng(seed), mode.daily ? "standard" : config.difficulty);
    qs.forEach((x) => x.mapStateId && prefetchLgaSvg(x.mapStateId));
    setQuestions(qs);
    setIdx(0);
    setRevealed(false);
    setPicked(null);
    setOutcome(null);
    setRemoved(new Set());
    setHintOn(false);
    setHelpers(HELPERS);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLives(mode.lives ?? 0);
    setLog([]);
    setGameLeft(mode.gameSeconds ?? 0);
    setResult(null);
    finished.current = false;
    setPhase(qs.length ? "countdown" : "play");
  }, [ix, mode, config]);

  useEffect(() => {
    if (phase === "countdown" && questions.length === 0) beginRun();
  }, [phase, questions.length, beginRun]);

  const finish = useCallback(
    (finalLog: AnswerLog[], finalScore: number, finalBestStreak: number) => {
      if (finished.current) return;
      finished.current = true;
      const correct = finalLog.filter((l) => l.outcome === "correct").length;
      const xp = Math.round(finalScore / 10) + correct * 5 + (mode.daily ? 50 : 0);
      const { newBest } = recordRun(
        { modeId: mode.id, title: mode.title, correct, total: finalLog.length, score: finalScore, xp, bestStreak: finalBestStreak, at: Date.now() },
        !!mode.daily
      );
      setResult({ xp, newBest });
      playSfx("finish", muted);
      setPhase("results");
    },
    [mode, muted]
  );

  useEffect(() => {
    if (phase === "play" && q) qStart.current = performance.now();
    if (phase === "play" && perQuestionLimit) setQLeft(perQuestionLimit);
    if (q?.mapStateId) prefetchLgaSvg(questions[idx + 1]?.mapStateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  /* ---------------------------------- answer ---------------------------------- */

  const answer = useCallback(
    (id: string | null, forced?: Outcome) => {
      if (!q || revealed || phase !== "play") return;
      const elapsed = (performance.now() - qStart.current) / 1000;
      const result: Outcome = forced ?? (id === q.answerId ? "correct" : "wrong");
      const ok = result === "correct";
      const nextStreak = ok ? streak + 1 : result === "skipped" ? streak : 0;
      let points = 0;
      if (ok) {
        const window = perQuestionLimit ?? 20;
        const speed = Math.round(50 * Math.max(0, 1 - elapsed / window));
        const combo = 1 + Math.min(nextStreak - 1, 10) * 0.1;
        const helperFactor = (hintOn ? 0.7 : 1) * (removed.size ? 0.5 : 1);
        points = Math.round((100 * diff.multiplier + speed) * combo * helperFactor);
      }
      const label =
        id === null ? null : q.options.find((o) => o.id === id)?.label ?? names.get(id) ?? lgaById.get(id)?.name ?? id;
      const entry: AnswerLog = { question: q, pickedId: id, pickedLabel: label, outcome: result, points };
      const nextLog = [...log, entry];
      const nextScore = score + points;
      const nextBest = Math.max(bestStreak, nextStreak);
      const nextLives = mode.lives && (result === "wrong" || result === "timeout") ? lives - 1 : lives;

      setPicked(id);
      setOutcome(result);
      setRevealed(true);
      setLog(nextLog);
      setScore(nextScore);
      setStreak(nextStreak);
      setBestStreak(nextBest);
      setLives(mode.lives && ok && nextStreak > 0 && nextStreak % 5 === 0 ? Math.min(5, nextLives + 1) : nextLives);

      const n = ++fxN.current;
      if (ok) {
        const combo = COMBO_AT.has(nextStreak) ? `🔥 ${nextStreak} in a row!` : null;
        setFx((f) => ({ ...f, confetti: n, pop: n, popValue: points, combo }));
        playSfx(combo ? "combo" : "correct", muted);
      } else if (result !== "skipped") {
        setFx((f) => ({ ...f, shake: n, pop: null, popValue: null, combo: null }));
        playSfx("wrong", muted);
        if (!reduce && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(120);
      }

      const out = mode.lives ? nextLives <= 0 : false;
      if (!out && isBlitz) {
        setTimeout(() => advanceRef.current(), ok ? 550 : 1100);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, revealed, phase, streak, log, score, bestStreak, lives, hintOn, removed, diff, perQuestionLimit, mode, muted, isBlitz, finish]
  );

  const advance = useCallback(() => {
    if (phase !== "play" || finished.current) return;
    if (mode.lives && lives <= 0) return finish(log, score, bestStreak);
    if (idx + 1 >= questions.length || (isBlitz && gameLeft <= 0)) return finish(log, score, bestStreak);
    setIdx((i) => i + 1);
    setRevealed(false);
    setPicked(null);
    setOutcome(null);
    setRemoved(new Set());
    setHintOn(false);
    setFx((f) => ({ ...f, combo: null }));
  }, [phase, mode, lives, idx, questions.length, isBlitz, gameLeft, finish, log, score, bestStreak]);
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const answerRef = useRef(answer);
  answerRef.current = answer;

  /* ---------------------------------- helpers --------------------------------- */

  const applyFifty = () => {
    if (!q || revealed || helpers.fifty <= 0 || removed.size) return;
    const rng = createRng(q.key);
    let drop: string[];
    if (q.kind === "choice") {
      drop = q.options.filter((o) => o.id !== q.answerId).map((o) => o.id).sort(() => rng() - 0.5).slice(0, 2);
    } else if (q.kind === "map-state") {
      const answerZone = ix.stateById.get(q.answerId)?.zoneId;
      const otherZone = fb.zones.filter((z) => z.id !== answerZone).sort(() => rng() - 0.5)[0]?.id;
      drop = fb.states.filter((s) => s.zoneId !== answerZone && s.zoneId !== otherZone).map((s) => s.id);
    } else {
      const peers = (ix.lgasByState.get(q.mapStateId ?? "") ?? []).filter((l) => l.id !== q.answerId);
      drop = peers.sort(() => rng() - 0.5).slice(0, Math.floor(peers.length / 2)).map((l) => l.id);
    }
    setRemoved(new Set(drop));
    setHelpers((h) => ({ ...h, fifty: h.fifty - 1 }));
    playSfx("helper", muted);
  };

  const applyHint = () => {
    if (!q || revealed || helpers.hint <= 0 || hintOn) return;
    setHintOn(true);
    setHelpers((h) => ({ ...h, hint: h.hint - 1 }));
    playSfx("helper", muted);
  };

  const applySkip = () => {
    if (!q || revealed || helpers.skip <= 0) return;
    setHelpers((h) => ({ ...h, skip: h.skip - 1 }));
    answer(null, "skipped");
  };

  /* ---------------------------------- timers ---------------------------------- */

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => {
      if (isBlitz) {
        setGameLeft((g) => {
          const next = Math.max(0, g - 0.25);
          if (next <= 5 && Math.ceil(next) !== Math.ceil(g)) playSfx("tick", muted);
          return next;
        });
      } else if (perQuestionLimit && !revealed) {
        const left = perQuestionLimit - (performance.now() - qStart.current) / 1000;
        setQLeft((prev) => {
          if (left <= 5 && Math.ceil(left) !== Math.ceil(prev)) playSfx("tick", muted);
          return Math.max(0, left);
        });
        if (left <= 0) answerRef.current(null, "timeout");
      }
    }, 250);
    return () => clearInterval(t);
  }, [phase, isBlitz, perQuestionLimit, revealed, muted]);

  useEffect(() => {
    if (phase === "play" && isBlitz && gameLeft <= 0) finish(log, score, bestStreak);
  }, [gameLeft, phase, isBlitz, finish, log, score, bestStreak]);

  /* --------------------------------- keyboard --------------------------------- */

  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "SELECT") return;
      const k = e.key.toLowerCase();
      if (revealed && (k === "enter" || k === " ")) {
        e.preventDefault();
        advance();
        return;
      }
      if (!q || revealed) return;
      const n = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (q.kind === "choice" && n >= 0 && q.options[n] && !removed.has(q.options[n].id)) answer(q.options[n].id);
      else if (k === "h") applyHint();
      else if (k === "f") applyFifty();
      else if (k === "s") applySkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------------------------------- render ---------------------------------- */

  if (phase === "setup") {
    return (
      <Frame>
        <TopBar title="NaijaAtlas Quiz" subtitle="Generated from live atlas data" muted={muted} />
        <QuizSetup fb={fb} ix={ix} config={config} onChange={updateConfig} onStart={beginRun} />
      </Frame>
    );
  }

  if (phase === "results" && result) {
    return (
      <Frame>
        <TopBar title="Results" subtitle={mode.title} muted={muted} />
        <QuizResults
          mode={mode}
          log={log}
          score={score}
          xp={result.xp}
          bestStreak={bestStreak}
          newBest={result.newBest}
          onReplay={() => {
            if (mode.daily) updateConfig({ ...config, modeId: "classic" as QuizModeId, length: 10 });
            setQuestions([]);
            setPhase("countdown");
          }}
          onChangeMode={() => {
            setQuestions([]);
            setPhase("setup");
          }}
        />
      </Frame>
    );
  }

  if (phase === "countdown") {
    return (
      <Frame>
        <TopBar title={mode.title} subtitle="Get ready…" muted={muted} />
        {questions.length ? (
          <StartCountdown
            onTick={(n) => playSfx(n > 0 ? "tick" : "start", muted)}
            onDone={() => setPhase("play")}
          />
        ) : null}
        {questions.length === 0 ? <p className="p-8 text-center text-text-muted">Building your quiz…</p> : null}
      </Frame>
    );
  }

  if (!q) {
    return (
      <Frame>
        <TopBar title={mode.title} subtitle="" muted={muted} />
        <div className="mx-auto max-w-md p-10 text-center">
          <p className="text-text-secondary">No questions match these settings yet.</p>
          <button type="button" onClick={() => setPhase("setup")} className="mt-4 h-11 rounded-xl bg-primary-container px-6 font-semibold text-white">
            Back to setup
          </button>
        </div>
      </Frame>
    );
  }

  /* ------------------------------ visual panel ------------------------------ */

  const subject = q.key.slice(q.generatorId.length + 1).split("|")[0];
  const subjectLga = lgaById.get(subject) ?? (q.kind === "map-lga" ? lgaById.get(q.answerId) : undefined);
  const answerIsState = ix.stateById.has(q.answerId);
  const pickedIsState = picked ? ix.stateById.has(picked) : false;
  const showLgaMap = q.kind === "map-lga" || (q.topic === "lga" && !!subjectLga && (revealed || q.generatorId !== "lga-state"));
  const lgaStateId = q.mapStateId ?? subjectLga?.stateId ?? null;
  const preSpotlight = q.generatorId === "map-name-state";
  const revealStateId = answerIsState ? q.answerId : q.spotlightStateId ?? null;
  const hintZone = hintOn && q.hintZoneId ? ix.zoneById.get(q.hintZoneId) : null;

  const stateShape = (id: string): ShapeState => {
    if (revealed) {
      if (id === revealStateId) return "correct";
      if (pickedIsState && id === picked) return "wrong";
      return "muted";
    }
    if (removed.has(id)) return "disabled";
    if (preSpotlight) return id === q.spotlightStateId ? "spotlight" : "muted";
    if (hintZone?.stateIds.includes(id)) return "glow";
    return q.kind === "map-state" ? "idle" : "muted";
  };

  const lgaAnswerId = subjectLga?.id ?? null;
  const lgaShape = (id: string): ShapeState => {
    if (revealed) {
      if (id === lgaAnswerId) return "correct";
      if (id === picked) return "wrong";
      return "muted";
    }
    if (removed.has(id)) return "disabled";
    return q.kind === "map-lga" ? "idle" : "muted";
  };

  const visual = showLgaMap && lgaStateId ? (
    <QuizLgaMap
      key={`lga-${lgaStateId}`}
      stateId={lgaStateId}
      stateName={names.get(lgaStateId) ?? ""}
      className="h-full min-h-[300px]"
      interactive={q.kind === "map-lga" && !revealed}
      onPick={q.kind === "map-lga" ? (id) => answer(id) : undefined}
      stateOf={lgaShape}
      focusId={revealed ? lgaAnswerId : null}
      labels={revealed ? [lgaAnswerId, picked].filter((x): x is string => !!x && lgaById.has(x)) : []}
      pulseId={revealed && outcome === "correct" ? lgaAnswerId : null}
    />
  ) : (
    <QuizStateMap
      names={names}
      className="h-full min-h-[300px]"
      interactive={q.kind === "map-state" && !revealed}
      onPick={q.kind === "map-state" ? (id) => answer(id) : undefined}
      stateOf={stateShape}
      focusId={revealed ? revealStateId : preSpotlight ? q.spotlightStateId : null}
      labels={revealed ? [revealStateId, pickedIsState ? picked : null].filter((x): x is string => !!x) : []}
      pulseId={revealed && outcome === "correct" ? revealStateId : null}
    />
  );

  const total = mode.endless ? null : questions.length;
  const progressPct = isBlitz
    ? (gameLeft / (mode.gameSeconds ?? 1)) * 100
    : total
      ? ((idx + (revealed ? 1 : 0)) / total) * 100
      : 0;

  return (
    <Frame>
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={() => {
              setQuestions([]);
              setPhase("setup");
            }}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary-container"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base">✕</span>
            <span className="hidden sm:inline">Quit</span>
          </button>

          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-bold text-text-primary">
              {mode.emoji} {mode.title}
            </p>
            <p className="truncate text-[11px] text-text-muted">
              {isBlitz ? `${Math.ceil(gameLeft)}s left` : total ? `Question ${idx + 1} of ${total}` : `Question ${idx + 1}`}
              {mode.needsState && config.stateId ? ` · ${names.get(config.stateId)}` : ""}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {mode.lives ? (
              <div className="flex gap-0.5" aria-label={`${lives} lives`}>
                <AnimatePresence initial={false}>
                  {Array.from({ length: lives }, (_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0, rotate: 45, opacity: 0 }}
                      className="text-lg"
                    >
                      ❤️
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            ) : null}
            <motion.span
              key={`streak-${streak}`}
              initial={streak > 0 ? { scale: 1.4 } : false}
              animate={{ scale: 1 }}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                streak >= 3 ? "border-orange-300 bg-orange-50 text-orange-700" : "border-border-subtle bg-slate-50 text-text-secondary"
              }`}
              title="Correct streak"
            >
              🔥 {streak}
            </motion.span>
            <span className="relative inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
              ⚡ <CountUp value={score} />
              <ScorePop value={fx.popValue} popKey={fx.pop} />
            </span>
            <MuteButton muted={muted} />
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-100">
          <motion.div
            className={`h-full ${isBlitz && gameLeft <= 10 ? "bg-rose-500" : "bg-primary-container"}`}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </header>

      <main className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 ${revealed && !isBlitz ? "pb-72 md:pb-56" : ""}`}>
        <AnimatePresence>
          {fx.combo ? (
            <motion.div
              key={fx.combo + fx.pop}
              className="pointer-events-none fixed inset-x-0 top-28 z-50 flex justify-center"
              initial={{ opacity: 0, scale: 0.4, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <span className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 font-landing-display text-2xl font-black text-white shadow-xl">
                {fx.combo}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <motion.div
            key={`visual-${q.kind === "choice" ? "c" : q.key}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-slate-50 ${
              q.kind !== "choice" && !revealed ? "border-primary-container/40 ring-4 ring-primary-container/10" : "border-border-subtle"
            } ${q.kind === "choice" ? "order-2 lg:order-1" : ""}`}
          >
            <div className="h-[340px] md:h-[440px]">{visual}</div>
            {q.kind !== "choice" && !revealed ? (
              <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm">
                👆 Tap on the map · drag to pan
              </span>
            ) : null}
            {q.kind === "choice" && !revealed && !preSpotlight ? (
              <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-text-muted shadow-sm">
                Answer to reveal it on the map
              </span>
            ) : null}
            {hintZone ? (
              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow"
              >
                💡 {hintZone.name}
              </motion.span>
            ) : null}
          </motion.div>

          <div className={q.kind === "choice" ? "order-1 lg:order-2" : ""}>
            <AnimatePresence mode="wait">
              <motion.section
                key={q.key}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.28 }}
              >
                <motion.div
                  key={`shake-${fx.shake}`}
                  animate={fx.shake && !reduce ? { x: [0, -12, 12, -8, 8, -4, 0] } : {}}
                  transition={{ duration: 0.45 }}
                  className="relative rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm md:p-6"
                >
                  <ConfettiBurst fireKey={outcome === "correct" ? fx.confetti : null} />
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-primary-container">
                      {q.topic === "nigeria" ? "🇳🇬 Nigeria" : q.topic === "state" ? "🗺️ States" : "🏘️ LGAs"}
                    </span>
                    {perQuestionLimit && !revealed ? <TimerRing remaining={qLeft} total={perQuestionLimit} /> : null}
                  </div>
                  <h2 className="mt-3 font-landing-display text-headline-sm font-bold leading-snug text-text-primary md:text-headline-md">
                    {q.prompt}
                  </h2>

                  <AnimatePresence>
                    {hintOn && !revealed ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                      >
                        💡 {q.hint}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>

                  {q.kind === "choice" ? (
                    <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                      {q.options.map((opt, i) => (
                        <OptionButton
                          key={opt.id}
                          index={i}
                          label={opt.label}
                          sub={opt.sub}
                          state={
                            revealed
                              ? opt.id === q.answerId
                                ? "correct"
                                : opt.id === picked
                                  ? "wrong"
                                  : "dim"
                              : removed.has(opt.id)
                                ? "removed"
                                : "idle"
                          }
                          onClick={() => answer(opt.id)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-text-secondary">
                      {revealed ? null : q.kind === "map-lga" ? "Find it among the LGAs on the map." : "Tap the right state on the map."}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <HelperButton icon="½" label="50:50" left={helpers.fifty} disabled={revealed || removed.size > 0} onClick={applyFifty} hotkey="F" />
                    <HelperButton icon="💡" label="Hint" left={helpers.hint} disabled={revealed || hintOn} onClick={applyHint} hotkey="H" />
                    <HelperButton icon="⏭" label="Skip" left={helpers.skip} disabled={revealed} onClick={applySkip} hotkey="S" />
                  </div>
                </motion.div>
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {revealed && !isBlitz && outcome ? (
          <FeedbackSheet
            key={q.key}
            outcome={outcome}
            question={q}
            pickedLabel={log[log.length - 1]?.pickedLabel ?? null}
            points={log[log.length - 1]?.points ?? 0}
            gameOver={!!mode.lives && lives <= 0}
            last={!mode.endless && idx + 1 >= questions.length}
            onNext={advance}
          />
        ) : null}
      </AnimatePresence>
    </Frame>
  );
}

/* ----------------------------------------------------------------------------- */

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-surface-canvas font-landing text-text-primary">{children}</div>;
}

function TopBar({ title, subtitle, muted }: { title: string; subtitle: string; muted: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/learn" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-primary-container">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-white">
            <IconExplore className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Learn hub</span>
        </Link>
        <div className="min-w-0 text-center">
          <p className="truncate font-bold text-text-primary">{title}</p>
          <p className="truncate text-[11px] text-text-muted">{subtitle}</p>
        </div>
        <MuteButton muted={muted} />
      </div>
    </header>
  );
}

function MuteButton({ muted }: { muted: boolean }) {
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      title={muted ? "Unmute" : "Mute"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-sm hover:bg-slate-50"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

type OptionState = "idle" | "correct" | "wrong" | "dim" | "removed";

function OptionButton({
  index,
  label,
  sub,
  state,
  onClick,
}: {
  index: number;
  label: string;
  sub?: string;
  state: OptionState;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  const styles: Record<OptionState, string> = {
    idle: "border-border-subtle bg-slate-50 text-text-primary hover:border-primary-container hover:bg-emerald-50",
    correct: "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    wrong: "border-rose-500 bg-rose-500 text-white",
    dim: "border-border-subtle bg-slate-50 text-text-muted opacity-50",
    removed: "border-dashed border-border-subtle bg-white text-slate-300 line-through",
  };
  const anim =
    reduce
      ? {}
      : state === "correct"
        ? { scale: [1, 1.08, 1] }
        : state === "wrong"
          ? { x: [0, -8, 8, -6, 6, 0] }
          : state === "removed"
            ? { scale: 0.95, opacity: 0.5 }
            : { scale: 1, opacity: 1 };
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <motion.button
        type="button"
        disabled={state !== "idle"}
        onClick={onClick}
        animate={anim}
        whileHover={state === "idle" && !reduce ? { y: -2 } : undefined}
        whileTap={state === "idle" && !reduce ? { scale: 0.96 } : undefined}
        transition={{ duration: 0.4 }}
        className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left font-semibold transition-colors ${styles[state]}`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
            state === "correct" || state === "wrong" ? "bg-white/25 text-white" : "border border-border-subtle bg-white text-text-secondary"
          }`}
        >
          {state === "correct" ? "✓" : state === "wrong" ? "✕" : index + 1}
        </span>
        <span className="min-w-0 flex-1">
          {label}
          {sub ? <span className={`block text-[11px] font-normal ${state === "correct" || state === "wrong" ? "text-white/80" : "text-text-muted"}`}>{sub}</span> : null}
        </span>
      </motion.button>
    </motion.li>
  );
}

function HelperButton({
  icon,
  label,
  left,
  disabled,
  onClick,
  hotkey,
}: {
  icon: string;
  label: string;
  left: number;
  disabled: boolean;
  onClick: () => void;
  hotkey: string;
}) {
  const off = disabled || left <= 0;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={off}
      whileTap={off ? undefined : { scale: 0.9, rotate: -4 }}
      title={`${label} (${hotkey})`}
      className="relative inline-flex h-10 items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-text-secondary transition-colors hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="font-black">{icon}</span>
      {label}
      <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 text-[10px] font-black text-text-muted">{left}</span>
    </motion.button>
  );
}

function FeedbackSheet({
  outcome,
  question,
  pickedLabel,
  points,
  gameOver,
  last,
  onNext,
}: {
  outcome: Outcome;
  question: QuizQuestion;
  pickedLabel: string | null;
  points: number;
  gameOver: boolean;
  last: boolean;
  onNext: () => void;
}) {
  const ok = outcome === "correct";
  const line = useMemo(
    () =>
      ok
        ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
        : outcome === "timeout"
          ? "⏰ Time's up!"
          : outcome === "skipped"
            ? "Skipped"
            : OOPS[Math.floor(Math.random() * OOPS.length)],
    [ok, outcome]
  );
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={`fixed inset-x-0 bottom-0 z-40 border-t-4 ${ok ? "border-emerald-500 bg-emerald-50" : outcome === "skipped" ? "border-slate-300 bg-slate-50" : "border-rose-500 bg-rose-50"}`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center">
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.05 }}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white ${ok ? "bg-emerald-500" : outcome === "skipped" ? "bg-slate-400" : "bg-rose-500"}`}
        >
          {ok ? "✓" : outcome === "skipped" ? "⏭" : "✕"}
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className={`font-landing-display text-headline-sm font-black ${ok ? "text-emerald-700" : outcome === "skipped" ? "text-slate-700" : "text-rose-700"}`}>
            {line} {ok ? <span className="font-mono text-base text-emerald-600">+{points}</span> : null}
          </p>
          {!ok ? (
            <p className="text-sm text-text-secondary">
              {outcome === "wrong" && pickedLabel ? (
                <>
                  You picked <b className="text-rose-700">{pickedLabel}</b> ·{" "}
                </>
              ) : null}
              Answer: <b className="text-emerald-700">{question.answerLabel}</b>
            </p>
          ) : null}
          <p className="mt-1 line-clamp-3 text-sm text-text-secondary">{question.explanation}</p>
          {question.learnMoreHref ? (
            <Link href={question.learnMoreHref} target="_blank" className="mt-1 inline-flex text-xs font-semibold text-primary-container hover:underline">
              Learn more in Places →
            </Link>
          ) : null}
        </div>
        <motion.button
          type="button"
          autoFocus
          onClick={onNext}
          whileTap={{ scale: 0.95 }}
          className={`h-12 shrink-0 rounded-xl px-8 font-bold text-white shadow-md md:min-w-[180px] ${ok ? "bg-emerald-600 hover:bg-emerald-700" : outcome === "skipped" ? "bg-slate-600 hover:bg-slate-700" : "bg-rose-600 hover:bg-rose-700"}`}
        >
          {gameOver ? "Game over — results" : last ? "See results" : "Continue"} <span className="ml-1 text-xs font-normal opacity-80">Enter</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

