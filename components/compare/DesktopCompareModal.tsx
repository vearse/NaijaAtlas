"use client";

import { useEffect } from "react";
import type { CompareBundle } from "@/types/compare";
import type { LgaLocation, StateContent, StateLocation } from "@/types/location";
import StateCompareView from "@/components/compare/StateCompareView";

interface DesktopCompareModalProps {
  open: boolean;
  onClose: () => void;
  states: StateLocation[];
  contents: StateContent[];
  lgas: LgaLocation[];
  compareBundle: CompareBundle;
}

export default function DesktopCompareModal({
  open,
  onClose,
  states,
  contents,
  lgas,
  compareBundle,
}: DesktopCompareModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close comparison"
        className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm hidden lg:block"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 hidden lg:flex items-center justify-center p-6 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="Expanded state comparison"
      >
        <div className="pointer-events-auto w-full max-w-5xl max-h-[min(90vh,880px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in">
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-ng-green">
                Compare {states.length} states
              </p>
              <p className="text-lg font-bold text-slate-900 truncate">
                {states.map((s) => s.name).join(" · ")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 min-h-0">
            <StateCompareView
              states={states}
              contents={contents}
              lgas={lgas}
              bundle={compareBundle}
              compact
              hideHeader
            />
          </div>
        </div>
      </div>
    </>
  );
}
