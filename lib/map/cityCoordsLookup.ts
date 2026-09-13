import citiesCatalog from "@/data/overlays/catalog/cities.json";
import { useMapStore } from "@/lib/store/mapStore";
import type { SelectedOverlayFeature } from "@/types/overlay";

export interface CityCatalogEntry {
  id?: string;
  name: string;
  lon?: number;
  lat?: number;
  category?: string;
  stateName?: string;
  stateId?: string;
  nickname?: string;
  founded?: string;
  summary?: string;
  description?: string;
  populationNote?: string;
  economy?: string;
  climate?: string;
  landmarks?: string[];
  highlights?: string[];
  wikiUrl?: string;
}

const NORMALIZED: Array<{ key: string; lon: number; lat: number; entry: CityCatalogEntry }> =
  (citiesCatalog as CityCatalogEntry[])
    .filter(
      (e) =>
        typeof e?.name === "string" &&
        typeof e.lon === "number" &&
        Number.isFinite(e.lon) &&
        typeof e.lat === "number" &&
        Number.isFinite(e.lat)
    )
    .map((e) => ({
      key: e.name.trim().toLowerCase(),
      lon: e.lon as number,
      lat: e.lat as number,
      entry: e,
    }));

export function findCityCoordsByName(
  name: string | null | undefined
): [number, number] | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;

  const exact = NORMALIZED.find((c) => c.key === key);
  if (exact) return [exact.lon, exact.lat];

  const includes = NORMALIZED.find(
    (c) => c.key.includes(key) || key.includes(c.key)
  );
  if (includes) return [includes.lon, includes.lat];

  return null;
}

export interface CitySuggestion {
  name: string;
  lonLat: [number, number];
  stateName?: string;
}

export function searchCitySuggestions(
  query: string | null | undefined,
  limit = 8
): CitySuggestion[] {
  if (!query) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const out: CitySuggestion[] = [];
  for (const c of NORMALIZED) {
    const match =
      c.key.startsWith(q) ||
      c.key.includes(q) ||
      (c.entry.stateName ?? "").toLowerCase().includes(q);
    if (!match) continue;
    out.push({
      name: c.entry.name,
      lonLat: [c.lon, c.lat],
      stateName: c.entry.stateName,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function findCatalogEntryByName(
  name: string | null | undefined
): CityCatalogEntry | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  const exact = NORMALIZED.find((c) => c.key === key);
  if (exact) return exact.entry;
  const includes = NORMALIZED.find(
    (c) => c.key.includes(key) || key.includes(c.key)
  );
  return includes?.entry ?? null;
}

function flattenCatalogEntry(entry: CityCatalogEntry): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    props[key] = Array.isArray(value) ? JSON.stringify(value) : value;
  }
  return props;
}

/** Build a Cities-layer overlay feature for a city name, for opening in the map detail panel. */
export function buildCityOverlayFeature(
  name: string
): SelectedOverlayFeature | null {
  const clean = name.trim();
  if (!clean) return null;

  const entry = findCatalogEntryByName(clean);
  const lon = typeof entry?.lon === "number" ? entry.lon : null;
  const lat = typeof entry?.lat === "number" ? entry.lat : null;
  const id =
    entry?.id ??
    `city-${clean.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const properties: Record<string, unknown> = {
    layerId: "cities",
    kind: "cities",
    ...(entry ? flattenCatalogEntry(entry) : {}),
    id,
    name: entry?.name ?? clean,
    category: entry?.category ?? "regional",
  };
  if (entry?.stateName) properties.stateName = entry.stateName;
  if (entry?.wikiUrl) properties.wikiUrl = entry.wikiUrl;

  const geometry: GeoJSON.Point | null =
    lon != null && lat != null
      ? { type: "Point", coordinates: [lon, lat] }
      : null;

  return {
    id,
    layerId: "cities",
    name: (entry?.name ?? clean) as string,
    properties,
    geometry,
  };
}

/** Open a city on the map exactly like a map click: overlay on, feature panel, fly-to. */
export function openCityOnMap(name: string): boolean {
  const feature = buildCityOverlayFeature(name);
  if (!feature) return false;

  const store = useMapStore.getState();
  if (!store.activeOverlays.has("cities")) store.toggleOverlay("cities");
  store.setSelectedOverlay(feature);

  const map = store.mapInstance;
  const coords =
    feature.geometry?.type === "Point"
      ? (feature.geometry.coordinates as [number, number])
      : null;
  if (map && coords) {
    map.flyTo({
      center: coords,
      zoom: Math.max(map.getZoom() ?? 5, 7),
      speed: 0.9,
    });
  }
  return true;
}
