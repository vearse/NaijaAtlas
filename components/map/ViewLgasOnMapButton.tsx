"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { sameLgaFocus } from "@/lib/map/lgaMapFocus";
import type { LgaFocusPlan } from "@/lib/map/lgaMapFocus";

interface ViewLgasOnMapButtonProps {
  plan: LgaFocusPlan;
  className?: string;
}

/**
 * "View on map" toggle for an LGA-based focus (metro area, LGA group, …).
 * Highlights the plan's member LGAs, loads their state LGA layers, and
 * flies to the union bounds. Toggling again clears the highlight.
 */
export default function ViewLgasOnMapButton({
  plan,
  className = "",
}: ViewLgasOnMapButtonProps) {
  const lgaFocus = useMapStore((s) => s.lgaFocus);
  const focusLgas = useMapStore((s) => s.focusLgas);
  const clearLgaFocus = useMapStore((s) => s.clearLgaFocus);

  const active = sameLgaFocus(lgaFocus, plan);
  const disabled = plan.stateIds.length === 0;

  return (
    <button
      type="button"
      disabled={disabled}
      title={
        disabled
          ? "Member LGAs could not be resolved for this place"
          : active
            ? "Remove LGA highlight from map"
            : "Show covered LGAs on the map"
      }
      onClick={(e) => {
        e.stopPropagation();
        if (active) clearLgaFocus();
        else focusLgas(plan);
      }}
      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-ng-green text-white shadow-sm"
          : "bg-white text-ng-green border border-ng-green/40 hover:border-ng-green hover:bg-ng-green/5"
      } ${className}`}
      aria-pressed={active}
    >
      {active ? "✓ On map" : "🗺️ View on map"}
    </button>
  );
}