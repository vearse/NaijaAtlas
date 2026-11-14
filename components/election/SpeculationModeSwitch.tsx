"use client";

import { useSpeculationStore } from "@/lib/store/speculationStore";

export default function SpeculationModeSwitch() {
  const active = useSpeculationStore((s) => s.active);
  const setActive = useSpeculationStore((s) => s.setActive);

  const tab = (isActive: boolean) =>
    `flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
      isActive
        ? "bg-primary-container text-white shadow-sm"
        : "text-text-secondary hover:bg-slate-100"
    }`;

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-border-subtle bg-slate-50 p-1"
      role="tablist"
      aria-label="Election map mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!active}
        onClick={() => setActive(false)}
        className={tab(!active)}
      >
        Actual results
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setActive(true)}
        className={tab(active)}
      >
        Speculate
      </button>
    </div>
  );
}
