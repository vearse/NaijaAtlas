"use client";

import type { CompareBundle } from "@/types/compare";
import type { LgaLocation, StateContent, StateLocation } from "@/types/location";
import StateCompareView from "@/components/compare/StateCompareView";

interface MobileCompareModalProps {
  open: boolean;
  onClose: () => void;
  states: StateLocation[];
  contents: StateContent[];
  lgas: LgaLocation[];
  compareBundle: CompareBundle;
}

export default function MobileCompareModal({
  open,
  onClose,
  states,
  contents,
  lgas,
  compareBundle,
}: MobileCompareModalProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close compare"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-3 top-14 bottom-3 z-50 lg:hidden flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="State comparison"
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ng-green">
              Compare
            </p>
            <p className="text-sm font-bold text-slate-900">
              {states.map((s) => s.name).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 min-h-0">
          <StateCompareView
            states={states}
            contents={contents}
            lgas={lgas}
            bundle={compareBundle}
            compact
          />
        </div>
      </div>
    </>
  );
}
