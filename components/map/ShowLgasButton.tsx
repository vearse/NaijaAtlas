"use client";

import { useMapStore } from "@/lib/store/mapStore";

interface ShowLgasButtonProps {
  stateId: string;
  stateName: string;
  compact?: boolean;
}

export default function ShowLgasButton({
  stateId,
  stateName,
  compact = false,
}: ShowLgasButtonProps) {
  const { lgaVisibleStateIds, showLgas, hideLgas } = useMapStore();
  const visible = lgaVisibleStateIds.has(stateId);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => (visible ? hideLgas(stateId) : showLgas(stateId))}
        className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
          visible
            ? "bg-ng-green text-white"
            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-ng-green"
        }`}
        aria-pressed={visible}
      >
        {visible ? "On map" : "Map"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (visible ? hideLgas(stateId) : showLgas(stateId))}
      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
        visible
          ? "bg-ng-green text-white hover:bg-emerald-700"
          : "bg-emerald-50 text-ng-green border border-emerald-200 hover:bg-emerald-100"
      }`}
      aria-pressed={visible}
    >
      <span aria-hidden>{visible ? "✓" : "🗺️"}</span>
      {visible
        ? `LGAs visible for ${stateName}`
        : `Show ${stateName} LGAs on map`}
    </button>
  );
}
