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

const RIVER_COORDS: Record<string, [number, number][]> = {
  "river-niger": [
    [4.35, 13.15], [4.85, 12.2], [5.4, 11.0], [5.9, 9.8], [6.15, 8.5],
    [6.35, 7.2], [6.45, 6.4], [6.35, 5.8], [6.0, 5.3], [5.5, 5.0], [5.0, 4.85],
  ],
  "river-benue": [
    [13.6, 7.9], [12.5, 8.1], [11.2, 8.3], [10.0, 8.35], [9.0, 8.2],
    [8.2, 8.0], [7.5, 7.85], [6.9, 7.6], [6.5, 7.2], [6.35, 6.75],
  ],
  "river-cross": [
    [8.85, 6.1], [8.55, 5.65], [8.35, 5.25], [8.15, 4.95],
  ],
  "river-imo": [
    [7.2, 5.8], [7.0, 5.5], [6.85, 5.2], [6.7, 4.95],
  ],
  "river-oshun": [
    [4.5, 7.8], [4.3, 7.2], [4.1, 6.6], [3.9, 6.2],
  ],
  "river-kaduna": [
    [7.4, 10.5], [7.2, 9.5], [7.0, 8.5], [6.8, 7.5],
  ],
  "river-sokoto": [
    [4.0, 13.0], [5.0, 12.0], [6.0, 11.0], [6.5, 10.0],
  ],
};

const CREEK_COORDS: Record<string, [number, number][]> = {
  "creek-nun": [[6.4, 4.9], [6.2, 4.7], [6.0, 4.55], [5.8, 4.45]],
  "creek-forcados": [[5.4, 5.2], [5.2, 5.0], [5.0, 4.85], [4.8, 4.75]],
  "creek-escravos": [[5.6, 5.4], [5.4, 5.2], [5.2, 5.0]],
  "creek-bonny": [[7.0, 4.7], [6.8, 4.55], [6.6, 4.45], [6.4, 4.35]],
  "creek-new-calabar": [[6.9, 4.85], [6.7, 4.75], [6.5, 4.65]],
};

const LANDFORM_RINGS: Record<string, [number, number][]> = {
  "landform-jos-plateau": [
    [8.5, 9.0], [9.8, 9.0], [9.8, 10.2], [8.5, 10.2], [8.5, 9.0],
  ],
  "landform-mambilla": [
    [10.5, 6.8], [11.5, 6.8], [11.5, 7.5], [10.5, 7.5], [10.5, 6.8],
  ],
  "landform-mandara": [
    [13.0, 10.5], [14.0, 10.5], [14.0, 11.2], [13.0, 11.2], [13.0, 10.5],
  ],
  "landform-niger-delta": [
    [5.0, 4.5], [7.0, 4.5], [7.0, 5.5], [5.0, 5.5], [5.0, 4.5],
  ],
  "landform-sokoto-basin": [
    [4.5, 12.0], [6.5, 12.0], [6.5, 13.5], [4.5, 13.5], [4.5, 12.0],
  ],
  "landform-guinea-savanna": [
    [3.5, 7.5], [8.0, 7.5], [8.0, 10.0], [3.5, 10.0], [3.5, 7.5],
  ],
};

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

function lineFromCatalog(catalog: CatalogRow[], coordsMap: Record<string, [number, number][]>): Feature[] {
  return catalog.map((row) => ({
    type: "Feature" as const,
    properties: { id: row.id, name: row.name },
    geometry: {
      type: "LineString" as const,
      coordinates: coordsMap[row.id] ?? [],
    },
  }));
}

function buildRivers(catalog: CatalogRow[]): Feature[] {
  return lineFromCatalog(catalog, RIVER_COORDS);
}

function buildCreeks(catalog: CatalogRow[]): Feature[] {
  return lineFromCatalog(catalog, CREEK_COORDS);
}

function buildLakes(catalog: CatalogRow[]): Feature[] {
  const geoms: Record<string, () => Feature> = {
    "lake-chad": () => {
      const center: [number, number] = [13.45, 13.1];
      return turf.feature(
        turf.buffer(turf.point(center), 70, { units: "kilometers" })!.geometry as Polygon,
        { id: "lake-chad", name: "Lake Chad" }
      );
    },
    "lake-kainji": () => ({
      type: "Feature",
      properties: { id: "lake-kainji", name: "Kainji Lake" },
      geometry: {
        type: "Polygon",
        coordinates: [[[4.2, 10.45], [5.05, 10.45], [5.05, 10.95], [4.2, 10.95], [4.2, 10.45]]],
      },
    }),
    "lake-lagos-lagoon": () => ({
      type: "Feature",
      properties: { id: "lake-lagos-lagoon", name: "Lagos Lagoon" },
      geometry: {
        type: "Polygon",
        coordinates: [[[3.2, 6.42], [3.55, 6.42], [3.55, 6.58], [3.2, 6.58], [3.2, 6.42]]],
      },
    }),
  };
  return catalog.map((row) => geoms[row.id]?.() ?? turf.feature(turf.point([0, 0]), { id: row.id }));
}

function buildLandforms(catalog: CatalogRow[]): Feature[] {
  return catalog.map((row) => ({
    type: "Feature" as const,
    properties: {
      id: row.id,
      name: row.name,
      tier: row.tier ?? "mid",
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [LANDFORM_RINGS[row.id] ?? []],
    },
  }));
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
  const riversCatalog = readCatalog("rivers");
  const lakesCatalog = readCatalog("lakes");
  const creeksCatalog = readCatalog("creeks");
  const landformsCatalog = readCatalog("landforms");
  const citiesCatalog = readCatalog("cities");
  const coastCatalog = readCatalog("coast");
  const portsCatalog = readCatalog("ports");

  const adm0 = readGeoJson("public/geo/nigeria-adm0.geojson");

  ensureDir(projectRoot("public/geo/overlays"));

  writeGeoJson(
    projectRoot("public/geo/overlays/rivers.geojson"),
    fc(buildRivers(riversCatalog), riversCatalog, "rivers")
  );
  writeGeoJson(
    projectRoot("public/geo/overlays/lakes.geojson"),
    fc(buildLakes(lakesCatalog), lakesCatalog, "lakes")
  );
  writeGeoJson(
    projectRoot("public/geo/overlays/creeks.geojson"),
    fc(buildCreeks(creeksCatalog), creeksCatalog, "creeks")
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
    `✓ Overlays: rivers(${riversCatalog.length}) lakes(${lakesCatalog.length}) creeks(${creeksCatalog.length}) landforms(${landformsCatalog.length}) cities(${citiesCatalog.length}) coast(${coastMerged.length})`
  );
}

if (require.main === module) {
  buildOverlays().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
