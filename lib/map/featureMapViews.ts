import statesData from "@/data/locations/states.json";

/** Max simultaneous “view on map” coverage highlights (independent of compare selection). */
export const MAX_FEATURE_MAP_VIEWS = 10;

/** Fill colors for map state polygons (aligned with SelectedStatesBar chip palette). */
export const FEATURE_MAP_VIEW_FILL_COLORS = [
  "#059669",
  "#0284c7",
  "#7c3aed",
  "#d97706",
  "#e11d48",
  "#0d9488",
  "#4f46e5",
  "#ca8a04",
  "#db2777",
  "#2563eb",
] as const;

export const FEATURE_MAP_VIEW_BORDER_COLORS = [
  "#047857",
  "#0369a1",
  "#6d28d9",
  "#b45309",
  "#be123c",
  "#0f766e",
  "#4338ca",
  "#a16207",
  "#be185d",
  "#1d4ed8",
] as const;

export interface FeatureMapView {
  id: string;
  label: string;
  stateIds: string[];
  colorIndex: number;
}

export const FEATURE_MAP_VIEW_CHIP_CLASSES = [
  "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  "bg-sky-50 text-sky-800 border-sky-200/80",
  "bg-violet-50 text-violet-800 border-violet-200/80",
  "bg-amber-50 text-amber-900 border-amber-200/80",
  "bg-rose-50 text-rose-900 border-rose-200/80",
  "bg-teal-50 text-teal-900 border-teal-200/80",
  "bg-indigo-50 text-indigo-900 border-indigo-200/80",
  "bg-yellow-50 text-yellow-900 border-yellow-200/80",
  "bg-pink-50 text-pink-900 border-pink-200/80",
  "bg-blue-50 text-blue-900 border-blue-200/80",
] as const;

type StateRow = {
  id: string;
  name: string;
  bbox: [number, number, number, number];
};

const STATE_ROWS = statesData as unknown as StateRow[];

const STATE_BY_NORMALIZED_NAME = new Map<string, StateRow>();
for (const row of STATE_ROWS) {
  STATE_BY_NORMALIZED_NAME.set(normalizeStateToken(row.name), row);
}
const fctRow = STATE_ROWS.find((s) => s.id === "NG-FC");
if (fctRow) {
  STATE_BY_NORMALIZED_NAME.set("fct", fctRow);
  STATE_BY_NORMALIZED_NAME.set("abuja", fctRow);
}

export function normalizeStateToken(raw: string): string {
  let s = raw.trim().toLowerCase();
  const paren = s.indexOf("(");
  if (paren > 0) s = s.slice(0, paren).trim();
  if (s === "nasarawa") s = "nassarawa";
  if (s === "abuja" || s === "fct abuja") s = "federal capital territory";
  return s.replace(/\s+/g, " ");
}

export function resolveStateIdsFromNames(names: string[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    if (!name || typeof name !== "string") continue;
    const token = normalizeStateToken(name);
    if (
      token.includes("nationwide") ||
      token.includes("training cadre") ||
      token.includes("logistics chain")
    ) {
      continue;
    }
    const row = STATE_BY_NORMALIZED_NAME.get(token);
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      ids.push(row.id);
    }
  }
  return ids;
}

export function fitMapToStateIds(
  map: { fitBounds: (b: [[number, number], [number, number]], o?: object) => void },
  stateIds: string[]
): void {
  if (stateIds.length === 0) return;
  const rows = STATE_ROWS.filter((s) => stateIds.includes(s.id));
  if (rows.length === 0) return;
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const row of rows) {
    const [w, s, e, n] = row.bbox;
    minLon = Math.min(minLon, w);
    minLat = Math.min(minLat, s);
    maxLon = Math.max(maxLon, e);
    maxLat = Math.max(maxLat, n);
  }
  const dx = (maxLon - minLon) * 0.08 || 0.2;
  const dy = (maxLat - minLat) * 0.08 || 0.2;
  map.fitBounds(
    [
      [minLon - dx, minLat - dy],
      [maxLon + dx, maxLat + dy],
    ],
    { padding: 48, duration: 1200 }
  );
}
