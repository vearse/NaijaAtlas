"use client";

import { motion, useReducedMotion } from "motion/react";

const BADGES = [
  { label: "Lagos Island · Polling Unit 042", className: "top-6 left-6 -rotate-1", dot: true },
  { label: "Argungu Fishing Festival", className: "top-12 right-6 rotate-2", emoji: "🎣" },
  { label: "Jos Plateau Columbite & Tin", className: "top-1/2 left-8 -translate-y-1/2", emoji: "⛏️" },
  { label: "Enugu Coal Mines", className: "bottom-16 left-10 -rotate-2", emoji: "⚡" },
  { label: "Yankari Game Reserve", className: "bottom-6 right-8 rotate-1", emoji: "🌿" },
];

export default function HeroMapHud() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-[540px] aspect-[5/4] rounded-2xl p-1 border border-outline-variant/40 bg-surface-container-low/70 backdrop-blur-xl shadow-2xl overflow-hidden mx-auto">
      <div
        className="absolute inset-1 rounded-xl bg-gradient-to-br from-secondary-container/40 via-surface-container to-surface-dim"
        aria-hidden
      />
      <div
        className="absolute inset-1 rounded-xl landing-topo-grid opacity-60"
        aria-hidden
      />
      <div
        className="absolute inset-1 rounded-xl bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,135,81,0.35),transparent_55%),radial-gradient(ellipse_at_70%_80%,rgba(79,219,200,0.15),transparent_50%)]"
        aria-hidden
      />
      <svg
        viewBox="0 0 200 220"
        className="absolute inset-0 m-auto w-[55%] h-[70%] text-primary/25 fill-primary/10 stroke-primary/50"
        aria-hidden
      >
        <path
          d="M95 15 C120 18 145 35 155 55 C165 75 168 95 160 115 C150 140 130 165 105 185 C85 200 65 205 50 195 C35 185 30 165 35 145 C40 120 55 95 70 75 C80 60 88 45 95 15 Z"
          strokeWidth="1.5"
          fill="currentColor"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-surface-dim/40 rounded-xl pointer-events-none" />

      {BADGES.map((b, i) => (
        <motion.div
          key={b.label}
          className={`absolute px-3 py-1.5 rounded-full bg-surface-container-highest/90 border border-outline-variant/80 backdrop-blur-md shadow-lg flex items-center gap-2 text-label-caps text-on-surface ${b.className}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }}
        >
          {b.dot && (
            <span className="w-2 h-2 rounded-full bg-primary landing-pulse-radar" />
          )}
          {b.emoji && <span className="text-sm">{b.emoji}</span>}
          <span>{b.label}</span>
        </motion.div>
      ))}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] px-4 py-2 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/40 backdrop-blur-md flex items-center justify-between text-label-caps text-on-surface-variant">
        <span>GRID: WGS84</span>
        <span className="text-primary flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          36 STATES + FCT LIVE
        </span>
        <span className="hidden sm:inline">SCALE: 1:2.5M</span>
      </div>
    </div>
  );
}
