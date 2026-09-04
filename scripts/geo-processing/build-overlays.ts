/**
 * Generates per-layer overlay GeoJSON from catalog + geometry sources.
 * Run via build-geo / build-all — never hand-edit public/geo/overlays/.
 */
import fs from "fs";
import https from "https";
import * as turf from "@turf/turf";
import { projectRoot, ensureDir, writeGeoJson } from "./shp-utils";
import type {
  FeatureCollection,
  Feature,
  LineString,
  Polygon,
  MultiLineString,
  Point,
} from "geojson";

const NIGERIA_BBOX: [number, number, number, number] = [2.5, 4.0, 14.8, 13.9];

type CatalogRow = Record<string, unknown> & { id: string; name: string };

function readCatalog(name: string): CatalogRow[] {
  const p = projectRoot(`data/overlays/catalog/${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf-8")) as CatalogRow[];
}

function readGeoJson(rel: string): FeatureCollection {
  return JSON.parse(
    fs.readFileSync(projectRoot(rel), "utf-8")
  ) as FeatureCollection;
}

function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          fetchJson(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function clipToNigeria(feature: Feature): Feature | null {
  try {
    const clipped = turf.bboxClip(feature, NIGERIA_BBOX);
    if (!clipped.geometry) return null;
    return clipped as Feature;
  } catch {
    return null;
  }
}

function mergeCatalog(
  feature: Feature,
  catalog: CatalogRow[],
  layerId: string
): Feature {
  const id = String(feature.properties?.id ?? "");
  const row = catalog.find((c) => c.id === id);
  const base = {
    layerId,
    kind: layerId,
    ...(feature.properties ?? {}),
  };
  if (!row) return { ...feature, properties: base };
  const flattened: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    flattened[key] = Array.isArray(value) ? JSON.stringify(value) : value;
  }
  return {
    ...feature,
    properties: {
      ...base,
      ...flattened,
    },
  };
}

function fc(
  features: Feature[],
  catalog: CatalogRow[],
  layerId: string
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((f) => mergeCatalog(f, catalog, layerId)),
  };
}

const NE_RIVERS_SOURCE = "data/overlays/sources/ne_10m_rivers_lake_centerlines.geojson";

/** Hand-traced paths where Natural Earth 10m lacks geometry (delta creeks, Cross, Imo, Osun, Anambra). */
const MANUAL_WATERWAY_COORDS: Record<string, [number, number][]> = {
  "river-cross": [
    [9.35, 6.25], [9.15, 6.05], [8.95, 5.85], [8.75, 5.65], [8.55, 5.45],
    [8.38, 5.25], [8.22, 5.05], [8.12, 4.92], [8.05, 4.85],
  ],
  "river-imo": [
    [7.35, 5.95], [7.22, 5.75], [7.08, 5.55], [6.95, 5.35], [6.82, 5.15],
    [6.72, 4.98], [6.65, 4.88],
  ],
  "river-oshun": [
    [4.65, 7.85], [4.52, 7.55], [4.38, 7.25], [4.22, 6.95], [4.05, 6.65],
    [3.88, 6.38], [3.72, 6.18], [3.55, 6.02],
  ],
  "waterway-anambra": [
    [7.15, 6.55], [7.05, 6.42], [6.92, 6.28], [6.78, 6.15], [6.62, 6.05],
    [6.48, 5.95], [6.38, 5.88], [6.32, 5.82],
  ],
  "creek-nun": [
    [6.45, 5.52], [6.38, 5.35], [6.28, 5.15], [6.15, 4.98], [6.02, 4.82],
    [5.88, 4.68], [5.75, 4.55], [5.62, 4.45],
  ],
  "creek-forcados": [
    [5.55, 5.35], [5.42, 5.18], [5.28, 5.02], [5.12, 4.88], [4.95, 4.78],
    [4.78, 4.68], [4.62, 4.58],
  ],
  "creek-escravos": [
    [5.72, 5.48], [5.58, 5.32], [5.45, 5.15], [5.32, 4.98], [5.18, 4.82],
    [5.05, 4.68],
  ],
  "creek-bonny": [
    [6.95, 4.92], [6.82, 4.78], [6.68, 4.62], [6.55, 4.48], [6.42, 4.38],
    [6.28, 4.32],
  ],
  "creek-new-calabar": [
    [6.88, 4.88], [6.78, 4.78], [6.68, 4.68], [6.58, 4.58], [6.48, 4.52],
  ],
};

const LANDFORM_POLYGONS: Record<string, [number, number][]> = {
  "landform-jos-plateau": [
    [8.5, 9.0], [9.85, 9.05], [9.9, 10.25], [8.55, 10.2], [8.5, 9.0],
  ],
  "landform-mambilla": [
    [10.45, 6.75], [11.55, 6.78], [11.58, 7.55], [10.48, 7.52], [10.45, 6.75],
  ],
  "landform-mandara": [
    [13.0, 10.45], [14.05, 10.48], [14.08, 11.25], [13.02, 11.22], [13.0, 10.45],
  ],
  "landform-niger-delta": [
    [5.0, 4.45], [7.05, 4.48], [7.08, 5.55], [5.02, 5.52], [5.0, 4.45],
  ],
  "landform-sokoto-basin": [
    [4.45, 11.95], [6.55, 12.0], [6.58, 13.55], [4.48, 13.5], [4.45, 11.95],
  ],
  "landform-guinea-savanna": [
    [3.45, 7.45], [8.05, 7.5], [8.08, 10.05], [3.48, 10.0], [3.45, 7.45],
  ],
  "landform-idanre": [
    [4.68, 7.02], [4.82, 7.04], [4.84, 7.14], [4.78, 7.18], [4.66, 7.16], [4.68, 7.02],
  ],
  "landform-shere-hills": [
    [8.82, 9.82], [8.98, 9.84], [9.0, 9.98], [8.88, 10.02], [8.78, 9.94], [8.82, 9.82],
  ],
  "landform-udi-escarpment": [
    [7.35, 6.28], [7.62, 6.3], [7.65, 6.58], [7.38, 6.56], [7.35, 6.28],
  ],
  "landform-oban-hills": [
    [8.55, 5.15], [9.05, 5.18], [9.08, 5.65], [8.58, 5.62], [8.55, 5.15],
  ],
};

function landformAreaFeature(row: CatalogRow): Feature | null {
  const ring = LANDFORM_POLYGONS[row.id];
  if (!ring?.length) return null;
  return {
    type: "Feature",
    properties: {
      id: row.id,
      name: row.name,
      featureKind: "area",
      landformType: row.landformType ?? "hill",
      sizeTier: row.sizeTier ?? "medium",
    },
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

function landformPointFeature(row: CatalogRow): Feature | null {
  const lon = Number(row.lon);
  const lat = Number(row.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    type: "Feature",
    properties: {
      id: row.id,
      name: row.name,
      featureKind: "point",
      landformType: row.landformType ?? "peak",
      sizeTier: row.sizeTier ?? "minor",
    },
    geometry: { type: "Point", coordinates: [lon, lat] },
  };
}

function buildLandforms(catalog: CatalogRow[]): Feature[] {
  const features: Feature[] = [];
  const missing: string[] = [];

  for (const row of catalog) {
    const kind = String(row.featureKind ?? "area");
    const feature =
      kind === "point" ? landformPointFeature(row) : landformAreaFeature(row);
    if (feature) features.push(feature);
    else missing.push(row.id);
  }

  if (missing.length > 0) {
    console.warn(`⚠ Landforms missing geometry: ${missing.join(", ")}`);
  }

  return features;
}

const CITY_COORDS: Record<string, [number, number]> = {
  "city-lagos": [3.39, 6.45],
  "city-kano": [8.52, 12.0],
  "city-ibadan": [3.9, 7.4],
  "city-port-harcourt": [7.01, 4.78],
  "city-abuja": [7.49, 9.06],
  "city-benin-city": [5.6, 6.34],
  "city-kaduna": [7.44, 10.52],
  "city-enugu": [7.5, 6.44],
};

const PORT_COORDS: Record<string, [number, number]> = {
  "port-lagos-apapa": [3.37, 6.44],
  "port-port-harcourt": [7.0, 4.77],
  "port-calabar": [8.34, 4.96],
  "port-warri": [5.52, 5.52],
  "port-onne": [7.08, 4.72],
};

function normalizeWaterwayName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buildNeNameIndex(catalog: CatalogRow[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const row of catalog) {
    const aliases = [
      String(row.name ?? ""),
      ...(Array.isArray(row.neNames) ? row.neNames.map(String) : []),
    ];
    for (const alias of aliases) {
      const key = normalizeWaterwayName(alias);
      if (key) index.set(key, row.id);
    }
  }
  return index;
}

function featureLineLengthKm(feature: Feature): number {
  try {
    return turf.length(feature, { units: "kilometers" });
  } catch {
    return 0;
  }
}

function manualWaterwayFeature(row: CatalogRow): Feature | null {
  const coords = MANUAL_WATERWAY_COORDS[row.id];
  if (!coords?.length) return null;
  return {
    type: "Feature",
    properties: { id: row.id, name: row.name },
    geometry: { type: "LineString", coordinates: coords },
  };
}

function buildWaterways(catalog: CatalogRow[]): Feature[] {
  const nePath = projectRoot(NE_RIVERS_SOURCE);
  if (!fs.existsSync(nePath)) {
    throw new Error(`Missing Natural Earth rivers source: ${NE_RIVERS_SOURCE}`);
  }
  const ne = JSON.parse(fs.readFileSync(nePath, "utf-8")) as FeatureCollection;
  const nameIndex = buildNeNameIndex(catalog);
  const byCatalogId = new Map<string, Feature>();

  for (const raw of ne.features) {
    if (raw.properties?.featurecla !== "River") continue;
    const clipped = clipToNigeria(raw);
    if (!clipped?.geometry) continue;
    if (featureLineLengthKm(clipped) < 8) continue;

    const rawName = String(raw.properties?.name ?? raw.properties?.name_en ?? "");
    const catalogId = rawName ? nameIndex.get(normalizeWaterwayName(rawName)) : undefined;
    if (!catalogId) continue;

    const row = catalog.find((c) => c.id === catalogId);
    const candidate: Feature = {
      ...clipped,
      properties: {
        id: catalogId,
        name: row?.name ?? rawName,
        waterwayClass: row?.waterwayClass ?? "tributary",
      },
    };

    const existing = byCatalogId.get(catalogId);
    if (!existing || featureLineLengthKm(candidate) > featureLineLengthKm(existing)) {
      byCatalogId.set(catalogId, candidate);
    }
  }

  for (const row of catalog) {
    if (byCatalogId.has(row.id)) continue;
    const manual = manualWaterwayFeature(row);
    if (manual) byCatalogId.set(row.id, manual);
  }

  const missing = catalog.filter((row) => !byCatalogId.has(row.id));
  if (missing.length > 0) {
    console.warn(
      `⚠ Waterways missing geometry: ${missing.map((r) => r.id).join(", ")}`
    );
  }

  return catalog
    .map((row) => byCatalogId.get(row.id))
    .filter((f): f is Feature => f != null);
}

const LAKE_POLYGONS: Record<string, [number, number][]> = {
  "lake-chad": [
    [13.05, 13.45], [13.35, 13.55], [13.85, 13.48], [14.25, 13.25], [14.35, 13.0],
    [14.15, 12.85], [13.65, 12.88], [13.25, 12.95], [13.05, 13.15], [13.05, 13.45],
  ],
  "lake-kainji": [
    [4.45, 10.35], [4.75, 10.32], [4.95, 10.38], [4.98, 10.62], [4.92, 10.88],
    [4.78, 11.0], [4.55, 10.98], [4.38, 10.82], [4.35, 10.58], [4.42, 10.42], [4.45, 10.35],
  ],
  "lake-lagos-lagoon": [
    [3.05, 6.48], [3.25, 6.52], [3.45, 6.54], [3.65, 6.52], [3.85, 6.48], [4.05, 6.44],
    [4.15, 6.4], [4.05, 6.36], [3.85, 6.38], [3.65, 6.4], [3.45, 6.42], [3.25, 6.4],
    [3.05, 6.42], [3.05, 6.48],
  ],
  "lake-oguta": [
    [6.68, 5.74], [6.74, 5.76], [6.76, 5.72], [6.74, 5.68], [6.68, 5.67], [6.64, 5.69],
    [6.63, 5.72], [6.68, 5.74],
  ],
  "lake-goronyo": [
    [5.62, 13.0], [5.72, 13.02], [5.74, 13.06], [5.7, 13.1], [5.64, 13.11], [5.58, 13.08],
    [5.58, 13.03], [5.62, 13.0],
  ],
  "lake-dadin-kowa": [
    [11.42, 10.22], [11.52, 10.24], [11.54, 10.3], [11.5, 10.34], [11.44, 10.33], [11.4, 10.28],
    [11.42, 10.22],
  ],
  "lake-asejire": [
    [3.95, 7.42], [4.08, 7.43], [4.1, 7.5], [4.05, 7.53], [3.96, 7.52], [3.93, 7.46], [3.95, 7.42],
  ],
  "lake-challawa": [
    [8.48, 11.38], [8.56, 11.4], [8.58, 11.46], [8.54, 11.5], [8.48, 11.49], [8.45, 11.43],
    [8.48, 11.38],
  ],
};

function lakePolygonFeature(row: CatalogRow): Feature | null {
  const ring = LAKE_POLYGONS[row.id];
  if (!ring?.length) return null;
  return {
    type: "Feature",
    properties: {
      id: row.id,
      name: row.name,
      featureKind: "lake",
      lakeCategory: row.lakeCategory ?? "natural",
    },
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

function powerStationFeature(row: CatalogRow): Feature | null {
  const lon = Number(row.lon);
  const lat = Number(row.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    type: "Feature",
    properties: {
      id: row.id,
      name: row.name,
      featureKind: "power-station",
      plantCategory: row.plantCategory ?? "regional-hydro",
    },
    geometry: { type: "Point", coordinates: [lon, lat] },
  };
}

function buildLakes(catalog: CatalogRow[]): Feature[] {
  const features: Feature[] = [];
  const missing: string[] = [];

  for (const row of catalog) {
    const kind = String(row.featureKind ?? "lake");
    const feature =
      kind === "power-station" ? powerStationFeature(row) : lakePolygonFeature(row);
    if (feature) features.push(feature);
    else missing.push(row.id);
  }

  if (missing.length > 0) {
    console.warn(`⚠ Lakes layer missing geometry: ${missing.join(", ")}`);
  }

  return features;
}


function buildCities(catalog: CatalogRow[]): Feature[] {
  return catalog.map((row) => {
    const fallback = CITY_COORDS[row.id];
    const lon = Number(row.lon);
    const lat = Number(row.lat);
    return {
      type: "Feature" as const,
      properties: { id: row.id, name: row.name, category: row.category ?? "regional" },
      geometry: {
        type: "Point" as const,
        coordinates: [
          Number.isFinite(lon) ? lon : fallback?.[0] ?? 0,
          Number.isFinite(lat) ? lat : fallback?.[1] ?? 0,
        ],
      },
    };
  });
}

function atlanticOcean(): Feature {
  return {
    type: "Feature",
    properties: { id: "ocean-atlantic", kind: "ocean", name: "Atlantic Ocean", interactive: false },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [0.8, 3.0], [9.0, 3.0], [9.0, 6.9], [3.2, 6.9], [2.4, 5.4], [0.8, 4.8], [0.8, 3.0],
      ]],
    },
  };
}

function coastlineFromAdm0(adm0: FeatureCollection): Feature | null {
  const f = adm0.features[0];
  if (!f?.geometry) return null;
  try {
    const line = turf.polygonToLine(f as Feature<Polygon>);
    return {
      type: "Feature",
      properties: { id: "coastline-ng", name: "Nigeria Coastline" },
      geometry: line.geometry as LineString | MultiLineString,
    };
  } catch {
    return null;
  }
}

function buildCoast(
  coastCatalog: CatalogRow[],
  portsCatalog: CatalogRow[],
  adm0: FeatureCollection
): Feature[] {
  const features: Feature[] = [atlanticOcean()];
  const coast = coastlineFromAdm0(adm0);
  if (coast) {
    const row = coastCatalog.find((c) => c.id === "coastline-ng");
    coast.properties = {
      ...coast.properties,
      id: "coastline-ng",
      name: row?.name ?? "Nigeria Coastline",
    };
    features.push(coast);
  }
  for (const port of portsCatalog) {
    features.push({
      type: "Feature",
      properties: { id: port.id, name: port.name, subkind: "port" },
      geometry: {
        type: "Point",
        coordinates: PORT_COORDS[port.id] ?? [0, 0],
      } as Point,
    });
  }
  return features;
}

export async function buildOverlays(): Promise<void> {
  const waterwaysCatalog = readCatalog("waterways");
  const lakesCatalog = readCatalog("lakes");
  const landformsCatalog = readCatalog("landforms");
  const citiesCatalog = readCatalog("cities");
  const coastCatalog = readCatalog("coast");
  const portsCatalog = readCatalog("ports");

  const adm0 = readGeoJson("public/geo/nigeria-adm0.geojson");

  ensureDir(projectRoot("public/geo/overlays"));

  writeGeoJson(
    projectRoot("public/geo/overlays/waterways.geojson"),
    fc(buildWaterways(waterwaysCatalog), waterwaysCatalog, "waterways")
  );
  writeGeoJson(
    projectRoot("public/geo/overlays/lakes.geojson"),
    fc(buildLakes(lakesCatalog), lakesCatalog, "lakes")
  );
  writeGeoJson(
    projectRoot("public/geo/overlays/landforms.geojson"),
    fc(buildLandforms(landformsCatalog), landformsCatalog, "landforms")
  );
  writeGeoJson(
    projectRoot("public/geo/overlays/cities.geojson"),
    fc(buildCities(citiesCatalog), citiesCatalog, "cities")
  );

  const coastFeatures = buildCoast(coastCatalog, portsCatalog, adm0);
  const coastMerged = coastFeatures.map((f) => {
    if (f.properties?.subkind === "port") {
      const row = portsCatalog.find((c) => c.id === f.properties?.id);
      return mergeCatalog(f, portsCatalog, "coast");
    }
    if (f.properties?.id === "coastline-ng") {
      return mergeCatalog(f, coastCatalog, "coast");
    }
    return { ...f, properties: { ...f.properties, layerId: "coast", kind: "ocean" } };
  });
  writeGeoJson(projectRoot("public/geo/overlays/coast.geojson"), {
    type: "FeatureCollection",
    features: coastMerged,
  });

  console.log(
    `✓ Overlays: waterways(${waterwaysCatalog.length}) lakes(${lakesCatalog.length}) landforms(${landformsCatalog.length}) cities(${citiesCatalog.length}) coast(${coastMerged.length})`
  );
}

if (require.main === module) {
  buildOverlays().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
