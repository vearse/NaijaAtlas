/**
 * Central lens classification — one source of truth for Learn / Tourist / Invest.
 * Edit the arrays below to change membership; data JSON files stay unchanged.
 */
import type { OverlayLayerId } from "@/types/overlay";
import type { CountryNote, SearchEntry, WikiNote } from "@/types/location";

export const LENS_IDS = ["learn", "tourist", "invest"] as const;
export type LensId = (typeof LENS_IDS)[number];

/** @deprecated use LensId */
export type FocusLens = LensId;

export const LENS_META: Record<LensId, { label: string }> = {
  learn: { label: "Learn" },
  tourist: { label: "Tourist" },
  invest: { label: "Invest" },
};

export const LENSES = LENS_IDS;
export const LENS_LABELS: Record<LensId, string> = {
  learn: LENS_META.learn.label,
  tourist: LENS_META.tourist.label,
  invest: LENS_META.invest.label,
};

/** Note `category` values → Tourist lens (state-notes, country-notes). */
export const NOTE_TOURIST_CATEGORIES: string[] = [
  "festival",
  "culture",
  "history",
  "geography",
];

/** Note `category` values → Invest lens. */
export const NOTE_INVEST_CATEGORIES: string[] = ["economy"];

/** Note `type` values → Tourist lens. */
export const NOTE_TOURIST_TYPES: string[] = [
  "festival",
  "carnival",
  "masquerade",
  "masquerade-society",
  "site",
  "performance",
  "rite",
  "tradition",
  "craft",
  "music",
];

/** City / overlay category values → Tourist. */
export const TOURIST_TYPES: string[] = [
  "city",
  "federal-capital",
  "state-capital",
  "mega-city",
  "port-city",
  "historic",
  "university",
  "commercial",
  "university-town",
  "regional",
  "national-park",
  "wildlife-reserve",
  "natural-wonder",
  "waterfall",
  "mountain",
  "mountain-range",
  "hill",
  "rock-formation",
  "cave",
  "resort",
  "heritage-site",
  "beach",
  "museum",
  "monument",
  "religious-site",
  "lagoon",
  "coast",
  "seaport",
  "estuary",
  "coast-zone",
  "ecotourism",
  "environment",
  "natural",
  "reserve",
  "peak",
  "inselberg",
  "forest",
  "plateau",
];

/** City / overlay category values → Invest. */
export const INVEST_TYPES: string[] = [
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
  "commercial",
  "mega-city",
  "port-city",
  "oil-terminal",
  "major-hydro",
  "regional-hydro",
  "reservoir",
];

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
  "carnival",
  "ecotourism",
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
  "mining",
  "refinery",
  "lng",
  "petroleum",
];

export interface LensInput {
  layerId?: OverlayLayerId | null;
  category?: string | null;
  type?: string | null;
  landformType?: string | null;
  resourceType?: string | null;
  name?: string | null;
  title?: string | null;
  summary?: string | null;
  note?: string | null;
  economy?: string | null;
  character?: string | null;
  locations?: Array<{ name?: string | null }> | null;
  /** Curator override (optional on JSON rows). */
  lenses?: LensId[] | null;
  searchLevel?: SearchEntry["level"] | null;
}

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function tokenInHaystack(haystack: string, token: string): boolean {
  const t = norm(token);
  if (!t) return false;
  if (haystack === t) return true;
  return haystack.split(/\s+/).includes(t);
}

function anyTokenMatch(haystack: string, tokens: string[]): boolean {
  return tokens.some((t) => tokenInHaystack(haystack, t));
}

function buildHaystack(input: LensInput): string {
  return [
    input.category,
    input.type,
    input.landformType,
    input.resourceType,
    input.name,
    input.title,
    input.summary,
    input.note,
    input.economy,
    input.character,
    ...(input.locations ?? []).map((loc) => loc.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function layerDefaultLenses(layerId: OverlayLayerId): LensId[] {
  switch (layerId) {
    case "resources":
      return ["learn", "invest"];
    case "cities":
      return ["learn", "tourist", "invest"];
    case "landforms":
    case "coast":
    case "lakes":
      return ["learn", "tourist"];
    case "waterways":
      return ["learn"];
    default:
      return ["learn"];
  }
}

function inferExtraLenses(input: LensInput): LensId[] {
  const extra = new Set<LensId>();
  const haystack = buildHaystack(input);
  const cat = norm(input.category);
  const typ = norm(input.type);

  if (NOTE_TOURIST_CATEGORIES.includes(cat)) extra.add("tourist");
  if (NOTE_INVEST_CATEGORIES.includes(cat)) extra.add("invest");
  if (NOTE_TOURIST_TYPES.includes(typ)) extra.add("tourist");

  if (input.layerId === "resources") extra.add("invest");

  if (anyTokenMatch(haystack, TOURIST_TYPES)) extra.add("tourist");
  if (anyTokenMatch(haystack, INVEST_TYPES)) extra.add("invest");

  if (TOURIST_KEYWORDS.some((k) => haystack.includes(k))) extra.add("tourist");
  if (INVEST_KEYWORDS.some((k) => haystack.includes(k))) extra.add("invest");

  if (input.layerId === "landforms" && input.economy) {
    const econ = input.economy.toLowerCase();
    if (INVEST_KEYWORDS.some((k) => econ.includes(k))) extra.add("invest");
  }

  return [...extra];
}

/** All lenses an item belongs to — always includes `learn`. */
export function lensesFor(input: LensInput): LensId[] {
  if (input.lenses?.length) {
    const set = new Set<LensId>(["learn", ...input.lenses]);
    return LENS_IDS.filter((id) => set.has(id));
  }

  const set = new Set<LensId>(["learn"]);
  if (input.layerId) {
    for (const id of layerDefaultLenses(input.layerId)) set.add(id);
  }
  for (const id of inferExtraLenses(input)) set.add(id);

  return LENS_IDS.filter((id) => set.has(id));
}

export function matchesActiveLens(input: LensInput, activeLens: LensId): boolean {
  if (activeLens === "learn") return true;
  return lensesFor(input).includes(activeLens);
}

export function lensesForOverlayLayer(layerId: OverlayLayerId): LensId[] {
  return layerDefaultLenses(layerId);
}

export function parseLensId(raw: string | null | undefined): LensId {
  const v = norm(raw);
  if (v === "tourist" || v === "invest") return v;
  return "learn";
}

export function isValidLensParam(raw: string | null): raw is LensId {
  return raw === "tourist" || raw === "invest" || raw === "learn";
}

export function lensInputFromWikiNote(note: WikiNote): LensInput {
  return {
    category: note.category,
    type: note.type,
    title: note.title,
    note: note.note,
    locations: note.locations,
    lenses: (note as WikiNote & { lenses?: LensId[] }).lenses,
  };
}

export function lensInputFromCountryNote(note: CountryNote): LensInput {
  return {
    category: note.category,
    title: note.title,
    note: note.note,
    lenses: (note as CountryNote & { lenses?: LensId[] }).lenses,
  };
}

export function lensInputFromGeoProperties(
  layerId: OverlayLayerId,
  properties: Record<string, unknown>
): LensInput {
  return {
    layerId,
    category: String(properties.category ?? properties.militaryCategory ?? ""),
    type: String(properties.type ?? ""),
    landformType: String(properties.landformType ?? ""),
    resourceType: String(properties.resourceType ?? properties.type ?? ""),
    name: String(properties.name ?? ""),
    summary: String(properties.summary ?? ""),
    economy: String(properties.economy ?? ""),
    character: String(properties.character ?? ""),
  };
}

export function lensInputFromSearchEntry(entry: SearchEntry): LensInput {
  const overlayLayers = new Set([
    "landform",
    "resource",
    "city",
    "lake",
    "waterway",
    "coast",
  ]);
  const layerId = entry.layerId ?? undefined;
  return {
    layerId,
    category: entry.category,
    name: entry.name,
    summary: entry.summary,
    searchLevel: entry.level,
    type:
      overlayLayers.has(entry.level) && entry.category
        ? entry.category
        : entry.level === "state-note"
          ? "state-note"
          : undefined,
  };
}

/** @deprecated exclusive single lens — use lensesFor / matchesActiveLens */
export function lensFor(item: LensInput): LensId {
  const all = lensesFor(item);
  if (all.includes("invest") && !all.includes("tourist")) return "invest";
  if (all.includes("tourist") && all.length === 2) return "tourist";
  if (all.includes("invest")) return "invest";
  if (all.includes("tourist")) return "tourist";
  return "learn";
}

export function groupByLens<T extends LensInput>(
  items: T[]
): Record<LensId, T[]> {
  const out: Record<LensId, T[]> = { learn: [], tourist: [], invest: [] };
  for (const it of items) {
    for (const lens of lensesFor(it)) out[lens].push(it);
  }
  return out;
}

export type LensItem = LensInput;
