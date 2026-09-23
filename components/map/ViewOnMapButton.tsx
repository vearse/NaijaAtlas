"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { MAX_FEATURE_MAP_VIEWS } from "@/lib/map/featureMapViews";

interface ViewOnMapButtonProps {
  featureId: string;
  label: string;
  stateIds: string[];
  className?: string;
}

export default function ViewOnMapButton({
  featureId,
  label,
  stateIds,
  className = "",
}: ViewOnMapButtonProps) {
  const views = useMapStore((s) => s.featureMapViews);
  const toggleFeatureMapView = useMapStore((s) => s.toggleFeatureMapView);
  const active = views.some((v) => v.id === featureId);
  const atCap = views.length >= MAX_FEATURE_MAP_VIEWS && !active;
  const disabled = stateIds.length === 0 || atCap;

  return (
    <button
      type="button"
      disabled={disabled}
      title={
        atCap
          ? `Remove a map highlight first (max ${MAX_FEATURE_MAP_VIEWS})`
          : stateIds.length === 0
            ? "No states to highlight"
            : active
              ? "Remove state highlight from map"
              : "Highlight covered states on the map"
      }
      onClick={(e) => {
        e.stopPropagation();
        toggleFeatureMapView({ id: featureId, label, stateIds });
      }}
      className={`text-[11px] font-semibold underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed ${
        active ? "text-ng-green" : "text-violet-700 hover:text-violet-900"
      } ${className}`}
    >
      {active ? "On map" : "View on map"}
    </button>
  );
}
