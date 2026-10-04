"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";

const CONFETTI_COLORS = ["#008751", "#16a34a", "#f59e0b", "#0d9488", "#ffffff", "#e11d48", "#7c3aed"];

/** Radial confetti burst. Re-fires whenever `fireKey` changes. */
export function ConfettiBurst({ fireKey, count = 28, big = false }: { fireKey: string | number | null; count?: number; big?: boolean }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(() => {
    if (fireKey === null) return [];
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = (big ? 220 : 120) + Math.random() * (big ? 200 : 90);
      return {
        id: `${fireKey}-${i}`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - (big ? 80 : 40),
        rot: Math.random() * 720 - 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 6 + Math.random() * 6,
        round: Math.random() > 0.6,
      };
    });
  }, [fireKey, count, big]);
  if (reduce || fireKey === null) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{ width: p.w, height: p.round ? p.w : p.w * 0.45, background: p.color, borderRadius: p.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 140], opacity: [1, 1, 0], rotate: p.rot, scale: 1 }}
          transition={{ duration: big ? 1.8 : 1.1, ease: "easeOut", times: [0, 0.55, 1] }}
        />
      ))}
    </div>
  );
}

/** "+150" style score pop that floats up and fades. */
export function ScorePop({ value, popKey }: { value: number | null; popKey: string | number | null }) {
  return (
    <AnimatePresence>
      {value !== null && popKey !== null ? (
        <motion.span
          key={popKey}
          className={`pointer-events-none absolute -top-2 right-0 z-20 font-mono text-lg font-black ${value > 0 ? "text-emerald-600" : "text-rose-600"}`}
          initial={{ opacity: 0, y: 8, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], y: -36, scale: [0.6, 1.2, 1, 1] }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        >
          {value > 0 ? `+${value}` : value}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

/** Smoothly counts up to `value`. */
export function CountUp({ value, className = "", duration = 0.6 }: { value: number; className?: string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(shown, value, { duration, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className={className}>{shown.toLocaleString("en-NG")}</span>;
}

/** Full-screen 3-2-1-Go before a run starts. */
export function StartCountdown({ onDone, onTick }: { onDone: () => void; onTick?: (n: number) => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    onTick?.(n);
    const t = setTimeout(() => (n > 0 ? setN(n - 1) : onDone()), n > 0 ? 650 : 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#043828]/85 backdrop-blur-sm">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={n}
          className="font-landing-display text-[9rem] font-black leading-none text-white drop-shadow-xl"
          initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
        >
          {n > 0 ? n : "Go!"}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/** Circular per-question timer. */
export function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, remaining / total);
  const danger = remaining <= 5;
  return (
    <motion.div
      className="relative h-11 w-11"
      animate={danger ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={danger ? { duration: 0.5, repeat: Infinity } : undefined}
      aria-label={`${Math.ceil(remaining)} seconds left`}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={danger ? "#e11d48" : pct < 0.5 ? "#f59e0b" : "#008751"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.3s" }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-mono text-xs font-bold ${danger ? "text-rose-600" : "text-text-primary"}`}>
        {Math.ceil(remaining)}
      </span>
    </motion.div>
  );
}
