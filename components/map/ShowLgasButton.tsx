"use client";

import { useMapStore } from "@/lib/store/mapStore";

interface ShowLgasButtonProps {
  stateId: string;
  stateName: string;
  compact?: boolean;
}

function MapLayersIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      {active ? (
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clipRule="evenodd"
        />
      ) : (
        <path d="M3.25 3A2.25 2.25 0 001 5.25v9.5A2.25 2.25 0 003.25 17h13.5A2.25 2.25 0 0019 14.75v-9.5A2.25 2.25 0 0016.75 3H3.25zM2.25 5.25a1 1 0 011-1h13.5a1 1 0 011 1v9.5a1 1 0 01-1 1H3.25a1 1 0 01-1-1v-9.5zm4.47 2.47a.75.75 0 011.06 0l2.22 2.22 3.28-3.28a.75.75 0 111.06 1.06l-3.81 3.81a.75.75 0 01-1.06 0l-2.75-2.75a.75.75 0 010-1.06z" />
      )}
    </svg>
  );
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
        className={`shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${
          visible
            ? "bg-ng-green text-white shadow-sm"
            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-ng-green"
        }`}
        aria-pressed={visible}
        aria-label={
          visible
            ? `Hide ${stateName} LGAs on map`
            : `Show ${stateName} LGAs on map`
        }
        title={visible ? "LGAs on map" : "Show LGAs"}
      >
        <MapLayersIcon active={visible} />
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
