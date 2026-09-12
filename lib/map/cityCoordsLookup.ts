import citiesCatalog from "@/data/overlays/catalog/cities.json";

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
