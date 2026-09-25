"use client";

import { useMapStore } from "@/lib/store/mapStore";
import type { LgaFocusPlan } from "@/lib/map/lgaMapFocus";
import { MAX_METRO_MAP_VIEWS } from "@/lib/map/metroMapViews";

interface ViewLgasOnMapButtonProps {
  plan: LgaFocusPlan;
  className?: string;
}

/**
 * Toggle a metro / LGA group on the map (independent of state selection).
 */
export default function ViewLgasOnMapButton({
  plan,
  className = "",
}: ViewLgasOnMapButtonProps) {
  const views = useMapStore((s) => s.metroMapViews);
  const toggleMetroMapView = useMapStore((s) => s.toggleMetroMapView);

  const active = views.some((v) => v.id === plan.id);
  const atCap = views.length >= MAX_METRO_MAP_VIEWS && !active;
  const disabled = plan.stateIds.length === 0 || atCap;

  return (
    <button
      type="button"
      disabled={disabled}
      title={
        atCap
          ? `Remove a metro from the map first (max ${MAX_METRO_MAP_VIEWS})`
          : disabled
            ? "Member LGAs could not be resolved for this place"
            : active
              ? "Remove metro from map"
              : "Show metro LGAs on the map"
      }
      onClick={(e) => {
        e.stopPropagation();
        toggleMetroMapView(plan);
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
