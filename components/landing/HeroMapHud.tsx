"use client";

import { motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";

const BADGES = [
  {
    label: "Lagos Island · Victoria Island",
    className: "top-6 left-6 -rotate-1",
    dot: true,
  },
  {
    label: "Argungu Fishing Festival",
    className: "top-12 right-6 rotate-2",
    emoji: "🎣",
  },
  {
    label: "Jos Plateau Columbite & Tin",
    className: "top-1/2 left-8 -translate-y-1/2",
    emoji: "⛏️",
  },
  {
    label: "Enugu Coal Mines",
    className: "bottom-16 left-10 -rotate-2",
    emoji: "⚡",
  },
  {
    label: "Yankari Game Reserve",
    className: "bottom-6 right-8 rotate-1",
    emoji: "🌿",
  },
];

/**
 * Decorative cartographic HUD. The landmass is drawn from the real UN SALB
 * outlines in `data/geo/hubThumbs.ts` rather than a hand-approximated path, so
 * the silhouette in the hero is the country itself.
 */
export default function HeroMapHud() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-[540px] aspect-[5/4] rounded-2xl p-1 border border-border-subtle bg-surface-card/90 backdrop-blur-xl shadow-xl overflow-hidden mx-auto">
      <div
        className="absolute inset-1 rounded-xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 landing-topo-grid"
        aria-hidden
      />
      <div
        className="absolute inset-1 rounded-xl bg-[radial-gradient(ellipse_at_30%_18%,rgba(16,185,129,0.28),transparent_58%),radial-gradient(ellipse_at_72%_84%,rgba(217,119,6,0.16),transparent_55%)]"
        aria-hidden
      />

      {/* Graticule + elevation contours, drawn under the landmass. */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 m-auto w-[92%] h-[92%] text-emerald-400/25"
        aria-hidden
      >
        <g stroke="currentColor" strokeWidth="0.3" fill="none">
          {[26, 52, 78, 104, 130, 156, 182].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y} strokeDasharray="2 4" />
          ))}
          {[24, 50, 76, 102, 128, 154, 180].map((x) => (
            <line key={`v${x}`} y1="0" x1={x} x2={x} y2="200" strokeDasharray="2 4" />
          ))}
        </g>
        {/* Niger and Benue, as traced through the confluence at Lokoja. */}
        <path
          d="M40 22 C 66 52, 86 74, 104 104 C 116 124, 132 140, 154 156"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M168 60 C 142 70, 122 86, 104 104 C 96 114, 92 126, 92 142"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Niger Delta coastline emphasis. */}
        <path
          d="M150 150 q 12 6 18 16 q 10 6 4 16"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center p-[7%]">
        <NigeriaThumb
          source="regions"
          className="h-full w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          accent="#10b981"
          title="Map of Nigeria's six geopolitical zones"
        />
      </div>

      {/* Translucent vignette so the floating chips stay legible. */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-slate-900/30 rounded-xl pointer-events-none" />

      {BADGES.map((b, i) => (
        <motion.div
          key={b.label}
          className={`absolute px-3 py-1.5 rounded-full bg-surface-card/95 border border-border-subtle shadow-md flex items-center gap-2 text-label-caps text-slate-800 font-semibold ${b.className}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }}
        >
          {b.dot && (
            <span className="w-2 h-2 rounded-full bg-primary-container landing-pulse-radar" />
          )}
          {b.emoji && <span className="text-sm">{b.emoji}</span>}
          <span>{b.label}</span>
        </motion.div>
      ))}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] px-4 py-2 rounded-xl bg-surface-card/95 border border-border-subtle backdrop-blur-md flex items-center justify-between text-label-caps text-text-secondary shadow-sm">
        <span>GRID: WGS84</span>
        <span className="text-primary font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
          36 STATES + FCT LIVE
        </span>
        <span className="hidden sm:inline">SCALE: 1:2.5M</span>
      </div>
    </div>
  );
}
