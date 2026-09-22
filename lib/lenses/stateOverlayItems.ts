/**
 * Collect overlay-catalog items for a state under Tourist / Invest lenses.
 * Source of truth remains data/overlays/catalog/* — no duplicated lens datasets.
 */
import citiesCatalog from "@/data/overlays/catalog/cities.json";
import tourCatalog from "@/data/overlays/catalog/tour.json";
import landformsCatalog from "@/data/overlays/catalog/landforms.json";
import resourcesCatalog from "@/data/overlays/catalog/resources.json";
import lakesCatalog from "@/data/overlays/catalog/lakes.json";
import {
  lensesFor,
  type LensId,
  type LensInput,
} from "@/lib/lenses/lensHelper";
import type { OverlayLayerId } from "@/types/overlay";

export interface StateOverlayItem {
  id: string;
  name: string;
  layerId: OverlayLayerId;
  category: string;
  summary: string;
  wikiUrl: string | null;
  lon: number | null;
  lat: number | null;
  section: "cities" | "places" | "landforms" | "lakes" | "resources" | "agriculture";
}

interface CatalogRow {
  id?: string;
  name?: string;
  category?: string;
  type?: string;
  landformType?: string;
  resourceType?: string;
  stateId?: string;
  stateName?: string;
  statesCrossed?: string[];
  summary?: string;
  description?: string;
  economy?: string;
  character?: string;
  agriculture?: string;
  crops?: string[] | string;
  planting?: string[] | string;
  wikiUrl?: string;
  lon?: number;
  lat?: number;
}

function asRows(data: unknown): CatalogRow[] {
  return Array.isArray(data) ? (data as CatalogRow[]) : [];
}

/** Match without layer-level defaults — category/type/keywords only. */
function matchesLensByType(input: LensInput, lens: LensId): boolean {
  if (lens === "learn") return true;
  const { layerId: _ignored, ...rest } = input;
  return lensesFor(rest).includes(lens);
}

function stateNameMatches(
  row: CatalogRow,
  stateId: string,
  stateName: string
): boolean {
  if (row.stateId && row.stateId === stateId) return true;
  const name = stateName.trim().toLowerCase();
  if (!name) return false;
  if (row.stateName && row.stateName.trim().toLowerCase() === name) return true;
  if (Array.isArray(row.statesCrossed)) {
    return row.statesCrossed.some(
      (s) => typeof s === "string" && s.trim().toLowerCase() === name
    );
  }
  return false;
}

function hasAgriFields(row: CatalogRow): boolean {
  if (typeof row.agriculture === "string" && row.agriculture.trim()) return true;
  if (Array.isArray(row.crops) && row.crops.length > 0) return true;
  if (typeof row.crops === "string" && row.crops.trim()) return true;
  if (Array.isArray(row.planting) && row.planting.length > 0) return true;
  if (typeof row.planting === "string" && row.planting.trim()) return true;
  return false;
}

function toItem(
  row: CatalogRow,
  layerId: OverlayLayerId,
  section: StateOverlayItem["section"],
  fallbackId: string
): StateOverlayItem | null {
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name) return null;
  const category =
    row.category ??
    row.landformType ??
    row.resourceType ??
    row.type ??
    layerId;
  return {
    id: typeof row.id === "string" && row.id ? row.id : fallbackId,
    name,
    layerId,
    category: String(category),
    summary:
      (typeof row.summary === "string" && row.summary) ||
      (typeof row.description === "string" && row.description) ||
      "",
    wikiUrl: typeof row.wikiUrl === "string" && row.wikiUrl ? row.wikiUrl : null,
    lon: typeof row.lon === "number" && Number.isFinite(row.lon) ? row.lon : null,
    lat: typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : null,
    section,
  };
}

function lensInputFromRow(row: CatalogRow, layerId?: OverlayLayerId): LensInput {
  return {
    layerId,
    category: row.category,
    type: row.type,
    landformType: row.landformType,
    resourceType: row.resourceType,
    name: row.name,
    summary: row.summary,
    economy: row.economy,
    character: row.character,
  };
}

export interface StateOverlayBundle {
  cities: StateOverlayItem[];
  places: StateOverlayItem[];
  landforms: StateOverlayItem[];
  lakes: StateOverlayItem[];
  resources: StateOverlayItem[];
  agriculture: StateOverlayItem[];
}

export function getStateOverlayItems(
  stateId: string,
  stateName: string,
  lens: LensId
): StateOverlayBundle {
  const empty: StateOverlayBundle = {
    cities: [],
    places: [],
    landforms: [],
    lakes: [],
    resources: [],
    agriculture: [],
  };

  if (lens === "learn") return empty;

  const inState = (row: CatalogRow) =>
    stateNameMatches(row, stateId, stateName);

  if (lens === "tourist") {
    const cities = asRows(citiesCatalog)
      .filter(inState)
      .map((row, i) => toItem(row, "cities", "cities", `city-${stateId}-${i}`))
      .filter((x): x is StateOverlayItem => x != null);

    // Tour catalog is visit-oriented; include all in-state rows that match tourist types,
    // or fall back to including the row when category is empty.
    const places = asRows(tourCatalog)
      .filter(inState)
      .filter((row) => {
        const input = lensInputFromRow(row);
        if (!row.category && !row.type) return true;
        return matchesLensByType(input, "tourist");
      })
      .map((row, i) => toItem(row, "cities", "places", `tour-${stateId}-${i}`))
      .filter((x): x is StateOverlayItem => x != null);

    const landforms = asRows(landformsCatalog)
      .filter(inState)
      .filter((row) =>
        matchesLensByType(lensInputFromRow(row, "landforms"), "tourist")
      )
      .map((row, i) =>
        toItem(row, "landforms", "landforms", `landform-${stateId}-${i}`)
      )
      .filter((x): x is StateOverlayItem => x != null);

    const lakes = asRows(lakesCatalog)
      .filter(inState)
      .map((row, i) => toItem(row, "lakes", "lakes", `lake-${stateId}-${i}`))
      .filter((x): x is StateOverlayItem => x != null);

    return { ...empty, cities, places, landforms, lakes };
  }

  // invest
  const resources = asRows(resourcesCatalog)
    .filter(inState)
    .map((row, i) =>
      toItem(row, "resources", "resources", `resource-${stateId}-${i}`)
    )
    .filter((x): x is StateOverlayItem => x != null);

  const agriculture = asRows(landformsCatalog)
    .filter(inState)
    .filter((row) => {
      if (hasAgriFields(row)) return true;
      return matchesLensByType(lensInputFromRow(row, "landforms"), "invest");
    })
    .map((row, i) =>
      toItem(row, "landforms", "agriculture", `agri-${stateId}-${i}`)
    )
    .filter((x): x is StateOverlayItem => x != null);

  // Industrial / commercial cities in this state for invest lens
  const cities = asRows(citiesCatalog)
    .filter(inState)
    .filter((row) =>
      matchesLensByType(lensInputFromRow(row, undefined), "invest")
    )
    .map((row, i) => toItem(row, "cities", "cities", `city-inv-${stateId}-${i}`))
    .filter((x): x is StateOverlayItem => x != null);

  return { ...empty, resources, agriculture, cities };
}

/**
 * Aggregate a lens's overlay catalog across every state, deduped per section by id.
 * Used by the country overview to auto-pick Tourist / Invest highlights when the
 * active lens is not Learn.
 */
export function aggregateCountryOverlayItems(
  states: Array<{ id: string; name: string }>,
  lens: LensId
): StateOverlayBundle {
  const bundle: StateOverlayBundle = {
    cities: [],
    places: [],
    landforms: [],
    lakes: [],
    resources: [],
    agriculture: [],
  };
  if (lens === "learn") return bundle;
  const seen: Record<keyof StateOverlayBundle, Set<string>> = {
    cities: new Set(),
    places: new Set(),
    landforms: new Set(),
    lakes: new Set(),
    resources: new Set(),
    agriculture: new Set(),
  };
  for (const state of states) {
    const perState = getStateOverlayItems(state.id, state.name, lens);
    for (const section of Object.keys(bundle) as (keyof StateOverlayBundle)[]) {
      for (const item of perState[section]) {
        if (seen[section].has(item.id)) continue;
        seen[section].add(item.id);
        bundle[section].push(item);
      }
    }
  }
  return bundle;
}

/** Shuffle then take `count` items — used for randomized overview picks. */
export function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, count));
}
