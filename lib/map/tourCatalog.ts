import tourCatalog from "@/data/overlays/catalog/tour.json";

export interface TourCatalogEntry {
  id?: string;
  name: string;
  category?: string;
  stateName?: string;
  stateId?: string;
  lon?: number;
  lat?: number;
  nickname?: string;
  established?: string;
  summary?: string;
  description?: string;
  visitorNote?: string;
  significance?: string;
  climate?: string;
  landmarks?: string[];
  highlights?: string[];
  wikiUrl?: string;
}

/** Convert the tour catalog into point features matching the cities layer schema. */
export function buildTourGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const e of tourCatalog as TourCatalogEntry[]) {
    if (typeof e?.name !== "string" || !e.name) continue;
    if (typeof e.lon !== "number" || !Number.isFinite(e.lon)) continue;
    if (typeof e.lat !== "number" || !Number.isFinite(e.lat)) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [e.lon, e.lat] },
      properties: {
        layerId: "cities",
        kind: "cities",
        isTour: true,
        id: e.id ?? `tour-${e.name}`,
        name: e.name,
        category: e.category ?? "tour",
        stateName: e.stateName,
        stateId: e.stateId,
        lon: e.lon,
        lat: e.lat,
        nickname: e.nickname,
        founded: e.established,
        summary: e.summary,
        description: e.description,
        populationNote: e.visitorNote,
        significance: e.significance,
        climate: e.climate,
        landmarks: e.landmarks?.length ? JSON.stringify(e.landmarks) : undefined,
        highlights: e.highlights?.length
          ? JSON.stringify(e.highlights)
          : undefined,
        wikiUrl: e.wikiUrl,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

let cachedTourGeoJSON: GeoJSON.FeatureCollection | null = null;

export function getTourGeoJSON(): GeoJSON.FeatureCollection {
  if (!cachedTourGeoJSON) cachedTourGeoJSON = buildTourGeoJSON();
  return cachedTourGeoJSON;
}

export const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function findTourByName(
  name: string | null | undefined
): { name: string; lonLat: [number, number] } | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  const entry = (tourCatalog as TourCatalogEntry[]).find(
    (e) => e?.name?.trim().toLowerCase() === key
  );
  if (
    !entry ||
    typeof entry.lon !== "number" ||
    typeof entry.lat !== "number"
  ) {
    return null;
  }
  return { name: entry.name, lonLat: [entry.lon, entry.lat] };
}