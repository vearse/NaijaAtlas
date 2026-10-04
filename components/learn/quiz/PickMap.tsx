"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export type PickShape = { id: string; d: string; name: string };

export type ShapeState =
  | "idle"
  | "glow"
  | "spotlight"
  | "correct"
  | "wrong"
  | "muted"
  | "disabled";

type Box = { x: number; y: number; w: number; h: number };

const FILL: Record<ShapeState, string> = {
  idle: "#008751",
  glow: "#f59e0b",
  spotlight: "#f59e0b",
  correct: "#16a34a",
  wrong: "#e11d48",
  muted: "#cbd5e1",
  disabled: "#e2e8f0",
};

const OPACITY: Record<ShapeState, number> = {
  idle: 0.78,
  glow: 0.85,
  spotlight: 1,
  correct: 1,
  wrong: 0.95,
  muted: 0.8,
  disabled: 0.7,
};

function parseBox(viewBox: string): Box {
  const [x, y, w, h] = viewBox.split(/\s+/).map(Number);
  return { x, y, w, h };
}

/**
 * Pickable SVG map with zoom, drag-to-pan and auto-focus. Used for both the
 * country (states) and per-state (LGA) quiz maps.
 */
export default function PickMap({
  shapes,
  viewBox,
  stateOf,
  onPick,
  interactive = true,
  focusId = null,
  labels = [],
  pulseId = null,
  showHoverName = false,
  ariaLabel,
  className = "",
}: {
  shapes: PickShape[];
  viewBox: string;
  stateOf: (id: string) => ShapeState;
  onPick?: (id: string) => void;
  interactive?: boolean;
  /** Smoothly zooms to this shape (small states / LGAs). */
  focusId?: string | null;
  /** Shape names drawn on the map (only after answers are revealed). */
  labels?: string[];
  /** Shape that gets a celebratory pulse ring. */
  pulseId?: string | null;
  showHoverName?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const base = useMemo(() => parseBox(viewBox), [viewBox]);
  const [box, setBox] = useState<Box>(base);
  const [hover, setHover] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; box: Box; moved: boolean } | null>(null);
  const [centers, setCenters] = useState<Map<string, { x: number; y: number; w: number; h: number }>>(new Map());

  useEffect(() => setBox(base), [base]);

  useLayoutEffect(() => {
    const m = new Map<string, Box & { x: number; y: number }>();
    pathRefs.current.forEach((el, id) => {
      try {
        const b = el.getBBox();
        m.set(id, { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height });
      } catch {
        /* not rendered yet */
      }
    });
    setCenters(m);
  }, [shapes]);

  useEffect(() => {
    if (!focusId) {
      setBox(base);
      return;
    }
    const c = centers.get(focusId);
    if (!c) return;
    const minW = base.w * 0.38;
    const w = Math.min(base.w, Math.max(minW, c.w * 2.6, c.h * 2.6 * (base.w / base.h)));
    const h = w * (base.h / base.w);
    setBox({ x: c.x - w / 2, y: c.y - h / 2, w, h });
  }, [focusId, centers, base]);

  const zoom = useCallback(
    (factor: number) =>
      setBox((b) => {
        const w = Math.min(base.w * 1.1, Math.max(base.w / 8, b.w * factor));
        const h = w * (base.h / base.w);
        return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
      }),
    [base]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, box, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const svg = svgRef.current;
    if (!d || !svg) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
      svg.setPointerCapture(e.pointerId);
    }
    const rect = svg.getBoundingClientRect();
    const k = Math.max(d.box.w / rect.width, d.box.h / rect.height);
    setBox({ ...d.box, x: d.box.x - dx * k, y: d.box.y - dy * k });
  };
  const onPointerUp = () => {
    setTimeout(() => setDragging(false), 0);
    drag.current = null;
  };

  const zoomed = box.w < base.w * 0.98;
  const fontSize = box.w / 30;
  const hovered = shapes.find((s) => s.id === hover);
  const vb = `${box.x} ${box.y} ${box.w} ${box.h}`;

  return (
    <div className={`relative select-none ${className}`}>
      <motion.svg
        ref={svgRef}
        initial={false}
        animate={{ viewBox: vb }}
        transition={dragging || reduce ? { duration: 0 } : { duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        viewBox={vb}
        className={`h-full w-full touch-none ${dragging ? "cursor-grabbing" : ""}`}
        role="group"
        aria-label={ariaLabel}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <g stroke="#ffffff" strokeWidth={base.w / 600} strokeLinejoin="round">
          {shapes.map((s) => {
            const st = stateOf(s.id);
            const clickable = interactive && st !== "disabled" && !!onPick;
            const isHover = clickable && hover === s.id;
            return (
              <motion.path
                key={s.id}
                ref={(el) => {
                  if (el) pathRefs.current.set(s.id, el);
                  else pathRefs.current.delete(s.id);
                }}
                d={s.d}
                data-id={s.id}
                initial={false}
                animate={{
                  fill: isHover && st === "idle" ? "#043828" : FILL[st],
                  fillOpacity: OPACITY[st],
                  x: st === "wrong" && !reduce ? [0, -2, 2, -1.5, 1.5, 0] : 0,
                }}
                transition={{ duration: st === "wrong" ? 0.45 : 0.25 }}
                tabIndex={clickable ? 0 : -1}
                role={clickable ? "button" : undefined}
                aria-label={clickable ? (showHoverName ? s.name : "Map region") : undefined}
                className={clickable ? "cursor-pointer outline-none focus-visible:stroke-amber-400" : ""}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover((h) => (h === s.id ? null : h))}
                onClick={() => {
                  if (!clickable || drag.current?.moved || dragging) return;
                  onPick?.(s.id);
                }}
                onKeyDown={(e) => {
                  if (clickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onPick?.(s.id);
                  }
                }}
              />
            );
          })}
        </g>

        {pulseId && centers.get(pulseId) && !reduce ? (
          <motion.circle
            key={`pulse-${pulseId}`}
            cx={centers.get(pulseId)!.x}
            cy={centers.get(pulseId)!.y}
            fill="none"
            stroke="#16a34a"
            strokeWidth={box.w / 150}
            initial={{ r: 0, opacity: 0.9 }}
            animate={{ r: Math.max(centers.get(pulseId)!.w, box.w / 10), opacity: 0 }}
            transition={{ duration: 1.1, repeat: 2, ease: "easeOut" }}
            pointerEvents="none"
          />
        ) : null}

        <g pointerEvents="none">
          {[...new Set(labels)].map((id) => {
            const c = centers.get(id);
            const s = shapes.find((x) => x.id === id);
            if (!c || !s) return null;
            return (
              <motion.text
                key={`label-${id}`}
                x={c.x}
                y={c.y}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.35 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight={800}
                fill="#0c0a09"
                stroke="#ffffff"
                strokeWidth={fontSize / 4}
                paintOrder="stroke"
              >
                {s.name}
              </motion.text>
            );
          })}
        </g>
      </motion.svg>

      {showHoverName && hovered ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border-subtle bg-white/95 px-3 py-1.5 text-sm font-bold text-text-primary shadow-sm">
          {hovered.name}
        </div>
      ) : null}

      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <MapButton label="Zoom in" onClick={() => zoom(0.7)}>+</MapButton>
        <MapButton label="Zoom out" onClick={() => zoom(1 / 0.7)}>−</MapButton>
        {zoomed ? (
          <MapButton label="Reset view" onClick={() => setBox(base)}>⤢</MapButton>
        ) : null}
      </div>
    </div>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-white/95 text-base font-bold text-text-secondary shadow-sm transition-colors hover:bg-slate-50 hover:text-text-primary"
    >
      {children}
    </button>
  );
}
