"use client";

import { useState, type ReactNode } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  OVERLAY_LAYER_IDS,
  OVERLAY_LAYER_LABELS,
  type OverlayLayerId,
} from "@/types/overlay";

const LAYER_ACTIVE: Record<OverlayLayerId, string> = {
  rivers: "bg-sky-100 text-sky-900 ring-1 ring-sky-300/80",
  lakes: "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300/80",
  coast: "bg-blue-100 text-blue-900 ring-1 ring-blue-300/80",
  creeks: "bg-teal-100 text-teal-900 ring-1 ring-teal-300/80",
  landforms: "bg-amber-100 text-amber-900 ring-1 ring-amber-300/80",
  cities: "bg-slate-200 text-slate-900 ring-1 ring-slate-300/80",
};

function LayerIcon({ id }: { id: OverlayLayerId }) {
  const cls = "h-4 w-4 shrink-0";
  switch (id) {
    case "rivers":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path
            d="M3 14c2-3 4-3 6-1s4 2 6-1 2-4 2-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "lakes":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cls} aria-hidden>
          <ellipse cx="10" cy="11" rx="7" ry="4.5" opacity="0.35" />
          <path
            d="M4 11c1.5-2 3-2.5 6-2.5s4.5.5 6 2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "coast":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path
            d="M2 14c2-2 4-1 6 0s5 1 8-2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path d="M2 16h16" stroke="currentColor" strokeWidth="1.25" opacity="0.4" />
        </svg>
      );
    case "creeks":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path
            d="M4 15c1-2 2-3 3-4s2-2 3-3 2-2 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M6 12c1-1 2-1 3 0"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      );
    case "landforms":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path
            d="M2 14l4-6 3 4 3-7 6 9H2z"
            fill="currentColor"
            opacity="0.25"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cities":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cls} aria-hidden>
          <rect x="4" y="10" width="3" height="6" rx="0.5" opacity="0.85" />
          <rect x="8.5" y="6" width="3.5" height="10" rx="0.5" />
          <rect x="13.5" y="9" width="2.5" height="7" rx="0.5" opacity="0.85" />
        </svg>
      );
  }
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-slate-700 shadow border border-slate-200/80 hover:bg-white transition-colors text-lg leading-none font-medium"
    >
      {children}
    </button>
  );
}

function LayersStackIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 text-ng-green shrink-0"
      aria-hidden
    >
      <path d="M3.25 3A2.25 2.25 0 001 5.25v9.5A2.25 2.25 0 003.25 17h13.5A2.25 2.25 0 0019 14.75v-9.5A2.25 2.25 0 0016.75 3H3.25zM2.25 5.25a1 1 0 011-1h13.5a1 1 0 011 1v9.5a1 1 0 01-1 1H3.25a1 1 0 01-1-1v-9.5zm4.47 2.47a.75.75 0 011.06 0l2.22 2.22 3.28-3.28a.75.75 0 111.06 1.06l-3.81 3.81a.75.75 0 01-1.06 0l-2.75-2.75a.75.75 0 010-1.06z" />
    </svg>
  );
}

export default function MapBottomToolbar() {
  const [layersOpen, setLayersOpen] = useState(false);
  const activeOverlays = useMapStore((s) => s.activeOverlays);
  const toggleOverlay = useMapStore((s) => s.toggleOverlay);
  const zoomIn = useMapStore((s) => s.zoomIn);
  const zoomOut = useMapStore((s) => s.zoomOut);

  const layerGrid = (
    <div className="grid grid-cols-2 gap-1 w-[11.5rem]">
      {OVERLAY_LAYER_IDS.map((id) => {
        const { label, short } = OVERLAY_LAYER_LABELS[id];
        const on = activeOverlays.has(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggleOverlay(id)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${
              on ? LAYER_ACTIVE[id] : "text-slate-600 hover:bg-slate-50"
            }`}
            aria-pressed={on}
            title={label}
          >
            <LayerIcon id={id} />
            <span className="truncate hidden sm:inline">{label}</span>
            <span className="truncate sm:hidden">{short}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="absolute bottom-4 right-3 z-10 flex flex-row items-end gap-2"
      role="group"
      aria-label="Map layers and zoom"
    >
      <div className="rounded-xl bg-white/90 backdrop-blur-md p-2 shadow-lg border border-slate-200/80">
        {!layersOpen ? (
          <button
            type="button"
            onClick={() => setLayersOpen(true)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors min-h-[36px]"
            aria-expanded={false}
            aria-label="Open map layers"
          >
            <LayersStackIcon />
            <span>Layers</span>
            {activeOverlays.size > 0 && (
              <span className="rounded-full bg-ng-green text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {activeOverlays.size}
              </span>
            )}
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-1 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Layers
              </span>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-sm"
                aria-label="Collapse layers"
              >
                ✕
              </button>
            </div>
            {layerGrid}
          </>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <ZoomButton label="Zoom in" onClick={zoomIn}>
          +
        </ZoomButton>
        <ZoomButton label="Zoom out" onClick={zoomOut}>
          −
        </ZoomButton>
      </div>
    </div>
  );
}
