"use client";

import type { DirectionsTarget } from "@/lib/store/mapStore";
import { useMapStore } from "@/lib/store/mapStore";

type FeatureKind = DirectionsTarget["kind"] | "mapFeature";

interface GetDirectionsButtonProps {
  name: string;
  lonLat?: [number, number] | null;
  kind?: FeatureKind;
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

export default function GetDirectionsButton({
  name,
  lonLat,
  kind = "overlay",
  className = "",
  label = "Get directions",
  size = "sm",
}: GetDirectionsButtonProps) {
  const openDirectionsModal = useMapStore((s) => s.openDirectionsModal);

  const resolvedKind: DirectionsTarget["kind"] =
    kind === "mapFeature" ? "overlay" : kind;

  return (
    <button
      type="button"
      disabled={!lonLat}
      title={!lonLat ? "No map location for directions" : undefined}
      onClick={() => {
        if (!lonLat) return;
        openDirectionsModal({
          name,
          lonLat,
          kind: resolvedKind,
        });
      }}
      className={[
        "inline-flex items-center gap-1 rounded-full border font-semibold transition-colors",
        size === "sm"
          ? "px-2.5 py-1 text-[11px]"
          : "px-3 py-1.5 text-xs",
        lonLat
          ? "border-slate-200 bg-white text-slate-700 hover:border-ng-green/50 hover:text-ng-green"
          : "border-slate-100 text-slate-300 cursor-not-allowed",
        className,
      ].join(" ")}
    >
      <span aria-hidden>🧭</span>
      {label}
    </button>
  );
}
