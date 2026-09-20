/**
 * "Focus lenses" — a small, editable classifier shared between the state and
 * (future) country explorers.
 *
 * Every note/item lives in exactly one of three lenses, defaulting to LEARN:
 *   - LEARN   = everything not otherwise classified (default, matches today's view)
 *   - TOURIST = cities/heritage/landscape experiences worth visiting
 *   - INVEST  = economic opportunities (minerals, landforms used industrially)
 *
 * EDITING: the `TOURIST_TYPES` and `INVEST_TYPES` arrays below are the single
 * source of truth. Add or remove values freely — they align 1:1 with the map
 * overlay labels in types/overlay.ts, so whatever you drop in here drives both
 * the state AND country lenses identically.
 */

export const LENSES = ["learn", "tourist", "invest"] as const;
export type FocusLens = (typeof LENSES)[number];

export const LENS_LABELS: Record<FocusLens, string> = {
  learn: "Learn",
  tourist: "Tourist",
  invest: "Invest",
};

/** Valid `category` / `type` values that belong to the TOURIST lens (editable). */
export const TOURIST_TYPES: string[] = [
  // overlay cities layer
  "city",
  "federal-capital",
  "state-capital",
  "mega-city",
  "port-city",
  "historic",
  "university",
  "commercial",
  "university-town",
  // overlay tour categories  (data/content/theme overlays)
  "national-park",
  "wildlife-reserve",
  "natural-wonder",
  "waterfall",
  "mountain",
  "rock-formation",
  "cave",
  "resort",
  "heritage-site",
  "beach",
  "museum",
  "monument",
  "lagoon",
  "coast",
  "seaport",
  "estuary",
  "coast-zone",
  "ecotourism",
];

/** Valid `category` / `type` values that belong to the INVEST lens (editable). */
export const INVEST_TYPES: string[] = [
  // overlay resources / minerals layer
  "crude-oil",
  "natural-gas",
  "coal",
  "tin-columbite",
  "iron-ore",
  "gold",
  "limestone",
  "bitumen",
  "lead-zinc",
  "lithium-rare",
  "marble",
  "salt-potash",
  "bauxite",
  "gemstones",
  "kaolin",
  "phosphate",
  "gypsum",
  "graphite",
  "tungsten",
  "feldspar-mica",
  "barite",
  "talc",
  "manganese",
  "chromite",
  "copper",
  "uranium",
  "diatomite",
  "bentonite",
  "heavy-mineral-sands",
  "dolomite",
  "granite-dimension-stone",
  "fluorspar",
  "resource",
  "mineral",
  "industrial",
  "manufacturing",
  "petroleum",
  "energy",
  "power-plant",
  "hydro",
  "aggro-industrial",
  "farm",
  "plantation",
  "livestock",
  "fishery",
  "trade-hub",
  "logistics",
  "economy",
];

/** Fallback keyword scan if exact `type`/`category` misses (case-insensitive). */
const TOURIST_KEYWORDS = [
  "tour",
  "visit",
  "park",
  "reserve",
  "waterfall",
  "beach",
  "museum",
  "monument",
  "festival",
  "resort",
  "heritage",
];

const INVEST_KEYWORDS = [
  "oil",
  "gas",
  "mineral",
  "coal",
  "gold",
  "iron",
  "limestone",
  "cement",
  "invest",
  "industrial",
  "economy",
  "power",
  "hydro",
  "trade",
];

export interface LensItem {
  category?: string | null;
  type?: string | null;
  /** e.g. a note's `locations[].name` or an item's own name. */
  name?: string | null;
  /** note title — also scanned for keyword matches. */
  title?: string | null;
  /** named locations / attached sites on a note (their names are scanned). */
  locations?: Array<{ name?: string | null }> | null;
}

/** Categorise any note/item into exactly one lens (defaults to Learn). */
export function lensFor(item: LensItem): FocusLens {
  const haystack = [
    item.category,
    item.type,
    item.name,
    item.title,
    ...(item.locations ?? []).map((loc) => loc.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Exact config-driven match wins (cheap, unambiguous).
  if (INVEST_TYPES.some((t) => haystack === t || haystack.includes(` ${t} `))) {
    return "invest";
  }
  if (TOURIST_TYPES.some((t) => haystack === t || haystack.includes(` ${t} `))) {
    return "tourist";
  }

  // Loose keyword fallback for free-form values not in the arrays above.
  if (INVEST_KEYWORDS.some((k) => haystack.includes(k))) return "invest";
  if (TOURIST_KEYWORDS.some((k) => haystack.includes(k))) return "tourist";

  return "learn";
}

/** Convenience: count items already grouped per lens. */
export function groupByLens<T extends LensItem>(items: T[]): Record<FocusLens, T[]> {
  const out: Record<FocusLens, T[]> = { learn: [], tourist: [], invest: [] };
  for (const it of items) out[lensFor(it)].push(it);
  return out;
}
