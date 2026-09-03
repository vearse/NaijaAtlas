/** Individual overlay layer toggles in the map UI. */
export type OverlayLayerId =
  | "rivers"
  | "lakes"
  | "coast"
  | "creeks"
  | "landforms"
  | "cities";

export const OVERLAY_LAYER_IDS: OverlayLayerId[] = [
  "rivers",
  "lakes",
  "coast",
  "creeks",
  "landforms",
  "cities",
];

export const OVERLAY_LAYER_LABELS: Record<
  OverlayLayerId,
  { label: string; short: string; category: string }
> = {
  rivers: { label: "Rivers", short: "Rivers", category: "River" },
  lakes: { label: "Lakes", short: "Lakes", category: "Lake" },
  coast: { label: "Coast", short: "Coast", category: "Coast" },
  creeks: { label: "Creeks", short: "Creeks", category: "Creek" },
  landforms: { label: "Landforms", short: "Relief", category: "Landform" },
  cities: { label: "Cities", short: "Cities", category: "City" },
};

export const CITY_CATEGORIES = [
  "federal-capital",
  "mega-city",
  "state-capital",
  "commercial",
  "historic",
  "port-city",
  "industrial",
  "university",
  "regional",
] as const;

export type CityCategory = (typeof CITY_CATEGORIES)[number];

export const CITY_CATEGORY_LABELS: Record<
  CityCategory,
  { label: string; color: string }
> = {
  "federal-capital": { label: "Federal capital", color: "#7c3aed" },
  "mega-city": { label: "Megacity", color: "#dc2626" },
  "state-capital": { label: "State capital", color: "#008751" },
  commercial: { label: "Commercial hub", color: "#ea580c" },
  historic: { label: "Historic city", color: "#92400e" },
  "port-city": { label: "Port city", color: "#1d4ed8" },
  industrial: { label: "Industrial centre", color: "#475569" },
  university: { label: "University town", color: "#0f766e" },
  regional: { label: "Regional city", color: "#64748b" },
};

/** Selected overlay feature shown in the detail panel. */
export interface SelectedOverlayFeature {
  id: string;
  layerId: OverlayLayerId;
  name: string;
  properties: Record<string, unknown>;
}
