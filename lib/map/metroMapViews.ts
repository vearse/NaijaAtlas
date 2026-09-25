import type { LgaFocusPlan } from "@/lib/map/lgaMapFocus";
import { LGA_PALETTE } from "@/lib/map/colors";

/** Max simultaneous metro “view on map” highlights (LGA-level). */
export const MAX_METRO_MAP_VIEWS = 5;

/** Step through {@link LGA_PALETTE} so concurrent metros stay visually distinct. */
export const METRO_MAP_COLOR_STEP = 4;

/** Pick an unused index in the shared LGA fill palette. */
export function assignMetroColorIndex(usedIndices: Set<number>): number {
  const len = LGA_PALETTE.length;
  const slot = usedIndices.size;
  const preferred = (slot * METRO_MAP_COLOR_STEP) % len;
  if (!usedIndices.has(preferred)) return preferred;
  for (let i = 0; i < len; i += 1) {
    if (!usedIndices.has(i)) return i;
  }
  return preferred;
}

export interface MetroMapView {
  id: string;
  label: string;
  lgaIds: string[];
  stateIds: string[];
  bounds: LgaFocusPlan["bounds"];
  colorIndex: number;
}

export const METRO_MAP_VIEW_CHIP_CLASSES = [
  "bg-teal-50 text-teal-900 border-teal-200/80",
  "bg-indigo-50 text-indigo-900 border-indigo-200/80",
  "bg-orange-50 text-orange-900 border-orange-200/80",
  "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200/80",
  "bg-cyan-50 text-cyan-900 border-cyan-200/80",
] as const;

export function planToMetroView(
  plan: LgaFocusPlan,
  colorIndex: number
): MetroMapView {
  return {
    id: plan.id,
    label: plan.label ?? plan.id,
    lgaIds: plan.lgaIds,
    stateIds: plan.stateIds,
    bounds: plan.bounds,
    colorIndex,
  };
}

export function unionMetroBounds(
  views: MetroMapView[]
): [[number, number], [number, number]] | null {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const v of views) {
    if (!v.bounds) continue;
    const [[w, s], [e, n]] = v.bounds;
    minLon = Math.min(minLon, w);
    minLat = Math.min(minLat, s);
    maxLon = Math.max(maxLon, e);
    maxLat = Math.max(maxLat, n);
  }
  if (!Number.isFinite(minLon)) return null;
  return [[minLon, minLat], [maxLon, maxLat]];
}
