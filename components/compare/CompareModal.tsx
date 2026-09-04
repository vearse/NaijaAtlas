"use client";

import { useEffect } from "react";
import type { CompareBundle } from "@/types/compare";
import type { LgaLocation, StateContent, StateLocation } from "@/types/location";
import StateCompareView from "@/components/compare/StateCompareView";

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  states: StateLocation[];
  contents: StateContent[];
  lgas: LgaLocation[];
  compareBundle: CompareBundle;
}

function CompareModalHeader({
  states,
  onClose,
}: {
  states: StateLocation[];
  onClose: () => void;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-ng-green">
          Compare {states.length} states
        </p>
        <p className="text-sm lg:text-lg font-bold text-slate-900 truncate">
          {states.map((s) => s.name).join(" · ")}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 h-9 w-9 lg:h-10 lg:w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xl leading-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

/** Responsive compare modal — one component for mobile and desktop. */
export default function CompareModal({
  open,
  onClose,
  states,
  contents,
  lgas,
  compareBundle,
}: CompareModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const body = (
    <StateCompareView
      states={states}
      contents={contents}
      lgas={lgas}
      bundle={compareBundle}
      compact
      hideHeader
    />
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close compare"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:bg-black/45"
        onClick={onClose}
      />

      <div
        className="fixed inset-x-2 top-[3vh] sm:inset-x-3 sm:top-[4vh] z-50 lg:hidden flex flex-col h-[min(94dvh,880px)] min-h-[85dvh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="State comparison"
      >
        <CompareModalHeader states={states} onClose={onClose} />
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 min-h-0">
          {body}
        </div>
      </div>

      <div
        className="fixed inset-0 z-50 hidden lg:flex items-center justify-center p-6 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="State comparison"
      >
        <div className="pointer-events-auto w-full max-w-5xl h-[min(92vh,880px)] min-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in">
          <CompareModalHeader states={states} onClose={onClose} />
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 min-h-0">
            {body}
          </div>
        </div>
      </div>
    </>
  );
}
