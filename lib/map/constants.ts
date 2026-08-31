import type { SearchEntry } from "@/types/location";

/** Nigeria bounding box */
export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [
  [2.5, 4.0],
  [14.8, 14.2],
];

/** Nigeria + Benin, Niger, Chad, Cameroon */
export const WEST_AFRICA_BOUNDS: [[number, number], [number, number]] = [
  [0.8, 3.2],
  [16.2, 14.8],
];

export const MAP_MIN_ZOOM = 5;
export const MAP_MAX_ZOOM = 14;

export function bboxToLngLatBounds(
  bbox: [number, number, number, number]
): [[number, number], [number, number]] {
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
}

export function unionBboxes(
  bboxes: [number, number, number, number][]
): [[number, number], [number, number]] {
  if (!bboxes.length) return NIGERIA_BOUNDS;
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const [a, b, c, d] of bboxes) {
    minLon = Math.min(minLon, a);
    minLat = Math.min(minLat, b);
    maxLon = Math.max(maxLon, c);
    maxLat = Math.max(maxLat, d);
  }
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}

export function boundsKey(bounds: [[number, number], [number, number]]): string {
  return bounds.flat().map((n) => n.toFixed(3)).join(",");
}

export const REGION_COLORS: Record<string, string> = {
  "NG-NC": "#6366f1",
  "NG-NE": "#8b5cf6",
  "NG-NW": "#a855f7",
  "NG-SE": "#10b981",
  "NG-SS": "#06b6d4",
  "NG-SW": "#f59e0b",
};

export function getFeatureId(props: Record<string, unknown>): string | null {
  const id = props.id ?? props.ID;
  return id ? String(id) : null;
}

export function getFeatureName(props: Record<string, unknown>): string {
  return String(props.name ?? props.NAME ?? "");
}

export type SearchIndex = SearchEntry[];
