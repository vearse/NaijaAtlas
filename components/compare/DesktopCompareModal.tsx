"use client";

import { useEffect } from "react";
import type { CompareBundle } from "@/types/compare";
import type { LgaLocation, StateContent, StateLocation } from "@/types/location";
import StateCompareView from "@/components/compare/StateCompareView";
import {
  explorerKickerClass,
  explorerPanelHeaderClass,
  explorerTitleClass,
} from "@/components/location/explorerPanelStyles";

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
        <div className="pointer-events-auto w-full max-w-5xl max-h-[min(90vh,880px)] flex flex-col bg-surface-card rounded-2xl shadow-2xl border border-border-subtle/80 overflow-hidden animate-scale-in">
          <div className={`shrink-0 flex items-center justify-between gap-4 ${explorerPanelHeaderClass}`}>
            <div className="min-w-0">
              <span className={explorerKickerClass}>
                Compare {states.length} states
              </span>
              <p className={`${explorerTitleClass} text-lg mt-2 truncate`}>
                {states.map((s) => s.name).join(" · ")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full border border-border-subtle bg-lime-50 text-text-secondary hover:bg-lime-100 transition-colors text-xl leading-none"
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
