import fs from "fs";
import * as turf from "@turf/turf";
import {
  REGIONS,
  normalizeName,
  slugify,
  stateId,
  getRegionForState,
} from "./constants";
import {
  extractZip,
  readShapefile,
  getProp,
  writeJson,
  writeGeoJson,
  projectRoot,
  ensureDir,
  type GeoFeature,
} from "./shp-utils";
import type { FeatureCollection } from "geojson";
import { REGION_FILL, assignLgaPaletteColors } from "../../lib/map/colors";

interface TemiWard {
  State: string;
  LGA: string;
  Ward: string;
  Latitude: number;
  Longitude: number;
}

interface StateRecord {
  id: string;
  slug: string;
  name: string;
  regionId: string;
  regionName: string;
  lgaCount: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
}

interface LgaRecord {
  id: string;
  slug: string;
  name: string;
  level: "lga";
  parentId: string;
  stateName: string;
  regionId: string;
  wardCount: number;
  areaKm2: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
}

function lgaIdFrom(stateName: string, lgaName: string): string {
  return `${stateId(stateName)}-${slugify(lgaName).toUpperCase()}`;
}

function simplifyFc(fc: FeatureCollection, tolerance = 0.005): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => {
      if (!f.geometry) return f;
      try {
        const simplified = turf.simplify(f, { tolerance, highQuality: false });
        return { ...f, geometry: simplified.geometry };
      } catch {
        return f;
      }
    }),
  };
}

function attachProps(
  f: GeoFeature,
  props: Record<string, string | number>
): GeoFeature {
  return { ...f, properties: { ...f.properties, ...props } };
}

function bboxOf(f: GeoFeature): [number, number, number, number] {
  const [minX, minY, maxX, maxY] = turf.bbox(f);
  return [minX, minY, maxX, maxY];
}

async function loadSalb(level: 0 | 1 | 2): Promise<FeatureCollection> {
  const zipName = `nigeria_polbnda_admin_${level}_unsalb.zip`;
  const zipPath = projectRoot("data/geo/source/salb", zipName);
  const extractDir = projectRoot("data/geo/source/salb", `extracted_${level}`);
  const shp = extractZip(zipPath, extractDir);
  return readShapefile(shp);
}

function matchStateName(salbName: string, temiStates: string[]): string | null {
  const norm = normalizeName(salbName);
  for (const s of temiStates) {
    if (normalizeName(s) === norm) return s;
  }
  return null;
}

function getCapital(state: string): string | null {
  const caps: Record<string, string> = {
    Lagos: "Ikeja",
    "Federal Capital Territory": "Abuja",
    Kano: "Kano",
    Rivers: "Port Harcourt",
    Oyo: "Ibadan",
    Kaduna: "Kaduna",
    Enugu: "Enugu",
    Delta: "Asaba",
    Edo: "Benin City",
  };
  return caps[state] ?? null;
}

function getStateDescription(state: string): string {
  const region = getRegionForState(state)?.name ?? "";
  if (state === "Federal Capital Territory") {
    return "The Federal Capital Territory (FCT) hosts Nigeria's capital, Abuja, in the North Central geopolitical zone.";
  }
  return `${state} is a state in Nigeria's ${region} geopolitical zone.`;
}

export async function buildGeo() {
  const temiStates: string[] = JSON.parse(
    fs.readFileSync(
      projectRoot("data/locations/source/temikeezy/states.json"),
      "utf-8"
    )
  );
  const temiLgas: TemiLgas = JSON.parse(
    fs.readFileSync(
      projectRoot("data/locations/source/temikeezy/lgas.json"),
      "utf-8"
    )
  );
  const temiWards: TemiWard[] = JSON.parse(
    fs.readFileSync(
      projectRoot("data/locations/source/temikeezy/wards.json"),
      "utf-8"
    )
  );

  console.log("Loading SALB shapefiles...");
  const adm0 = await loadSalb(0);
  const adm1Raw = await loadSalb(1);
  const adm2Raw = await loadSalb(2);

  const states: StateRecord[] = [];
  const stateFeatures: GeoFeature[] = [];

  for (const f of adm1Raw.features as GeoFeature[]) {
    const salbName = getProp(f.properties, [
      "ADM1_NAME",
      "area_name",
      "name",
      "adm1_name",
      "NAME",
      "state_name",
    ]);
    const matched = matchStateName(salbName, temiStates);
    if (!matched) {
      console.warn(`Unmatched state: ${salbName}`);
      continue;
    }
    const id = stateId(matched);
    const region = getRegionForState(matched)!;
    const feat = attachProps(f, {
      id,
      name: matched,
      regionId: region.id,
      regionName: region.name,
      regionColor: REGION_FILL[region.id] ?? "#f1f5f9",
    });
    stateFeatures.push(feat);
    states.push({
      id,
      slug: slugify(matched),
      name: matched,
      regionId: region.id,
      regionName: region.name,
      lgaCount: temiLgas[matched]?.length ?? 0,
      bbox: bboxOf(feat),
      centroid: turf.centroid(feat).geometry.coordinates as [number, number],
    });
  }

  states.sort((a, b) => a.name.localeCompare(b.name));

  const lgas: LgaRecord[] = [];
  const lgasByState = new Map<string, GeoFeature[]>();
  const unmatchedLgas: string[] = [];

  for (const f of adm2Raw.features as GeoFeature[]) {
    const lgaName = getProp(f.properties, [
      "ADM2_NAME",
      "area_name",
      "name",
      "adm2_name",
      "NAME",
      "lga_name",
    ]);
    const parentSalb = getProp(f.properties, [
      "ADM1_NAME",
      "HRparent",
      "hrparent",
      "adm1_name",
      "parent",
      "state_name",
    ]);
    let stateName: string | null = matchStateName(parentSalb, temiStates);
    if (!stateName) {
      for (const s of temiStates) {
        const lgList = temiLgas[s] ?? [];
        if (lgList.some((l) => normalizeName(l) === normalizeName(lgaName))) {
          stateName = s;
          break;
        }
      }
    }
    if (!stateName) {
      unmatchedLgas.push(`${parentSalb} / ${lgaName}`);
      continue;
    }
    const sid = stateId(stateName);
    const region = getRegionForState(stateName)!;
    const id = lgaIdFrom(stateName, lgaName);
    const wardCount = temiWards.filter(
      (w) =>
        normalizeName(w.State) === normalizeName(stateName!) &&
        normalizeName(w.LGA) === normalizeName(lgaName)
    ).length;
    if (!lgasByState.has(sid)) lgasByState.set(sid, []);
    const feat = attachProps(f, {
      id,
      name: lgaName,
      parentId: sid,
      stateName,
      regionId: region.id,
    });
    lgasByState.get(sid)!.push(feat);
    lgas.push({
      id,
      slug: slugify(lgaName),
      name: lgaName,
      level: "lga",
      parentId: sid,
      stateName,
      regionId: region.id,
      wardCount,
      areaKm2: Math.round((turf.area(feat) / 1e6) * 10) / 10,
      bbox: bboxOf(feat),
      centroid: turf.centroid(feat).geometry.coordinates as [number, number],
    });
  }

  lgas.sort((a, b) => a.name.localeCompare(b.name));

  const wardRecords = temiWards.map((w) => ({
    stateName: w.State,
    lgaName: w.LGA,
    ward: w.Ward,
    centroid: [w.Longitude, w.Latitude] as [number, number],
    parentLgaId: lgaIdFrom(w.State, w.LGA),
  }));

  const regionFeatures: GeoFeature[] = [];
  const regionRecords = REGIONS.map((r) => {
    const memberStates = states.filter((s) => s.regionId === r.id);
    const memberFeats = stateFeatures.filter(
      (f) => f.properties.regionId === r.id
    );
    let unionGeom: GeoFeature | null = memberFeats[0] ?? null;
    for (let i = 1; i < memberFeats.length; i++) {
      try {
        if (unionGeom) {
          unionGeom = turf.union(
            turf.featureCollection([unionGeom, memberFeats[i]])
          ) as GeoFeature;
        }
      } catch {
        /* skip */
      }
    }
    if (unionGeom) {
      regionFeatures.push(
        attachProps(unionGeom, {
          id: r.id,
          name: r.name,
          color: r.color,
        })
      );
    }
    return {
      id: r.id,
      name: r.name,
      color: r.color,
      stateIds: memberStates.map((s) => s.id),
      stateNames: memberStates.map((s) => s.name),
    };
  });

  const validation = {
    timestamp: new Date().toISOString(),
    stateCount: states.length,
    lgaCount: lgas.length,
    wardCount: wardRecords.length,
    expectedStates: 37,
    expectedLgas: 774,
    unmatchedLgaCount: unmatchedLgas.length,
    pass: states.length === 37 && lgas.length >= 770,
  };

  ensureDir(projectRoot("scripts/geo-processing/reports"));
  writeJson(
    projectRoot("scripts/geo-processing/reports/validation-report.json"),
    { ...validation, unmatchedLgas: unmatchedLgas.slice(0, 30) }
  );

  console.log("Writing geo assets...");
  ensureDir(projectRoot("public/geo/lgas"));

  writeGeoJson(
    projectRoot("public/geo/nigeria-adm0.geojson"),
    simplifyFc(adm0, 0.01)
  );
  writeGeoJson(
    projectRoot("public/geo/nigeria-adm1.geojson"),
    simplifyFc({ type: "FeatureCollection", features: stateFeatures }, 0.008)
  );
  writeGeoJson(
    projectRoot("public/geo/regions.geojson"),
    simplifyFc({ type: "FeatureCollection", features: regionFeatures }, 0.01)
  );

  for (const [sid, feats] of lgasByState) {
    const colorById = assignLgaPaletteColors(feats);
    const colored = feats.map((feature, index) => {
      const id = String(feature.properties?.id ?? `idx-${index}`);
      return attachProps(feature, {
        fillColor: colorById.get(id),
      });
    });
    writeGeoJson(
      projectRoot(`public/geo/lgas/${sid}.geojson`),
      simplifyFc({ type: "FeatureCollection", features: colored }, 0.003)
    );
  }

  ensureDir(projectRoot("data/locations"));
  writeJson(projectRoot("data/locations/states.json"), states);
  writeJson(projectRoot("data/locations/lgas.json"), lgas);
  writeJson(projectRoot("data/locations/wards.json"), wardRecords);

  const wardsByLga: Record<string, string[]> = {};
  for (const w of wardRecords) {
    if (!wardsByLga[w.parentLgaId]) wardsByLga[w.parentLgaId] = [];
    wardsByLga[w.parentLgaId].push(w.ward);
  }
  for (const id of Object.keys(wardsByLga)) {
    wardsByLga[id].sort((a, b) => a.localeCompare(b));
  }
  writeJson(projectRoot("data/locations/wards-by-lga.json"), wardsByLga);

  writeJson(projectRoot("data/locations/regions.json"), regionRecords);
  writeJson(projectRoot("data/locations/hierarchy.json"), {
    country: { id: "NG", name: "Nigeria" },
    regions: regionRecords,
    states,
  });

  interface CatalogRow {
    id: string;
    name: string;
    lon?: number;
    lat?: number;
    summary?: string;
    resourceType?: string;
    landformType?: string;
    category?: string;
    lakeCategory?: string;
    type?: string;
    statesCrossed?: string[];
    landformLabel?: string;
    resourceLabel?: string;
  }

  function readCatalog<T extends CatalogRow>(name: string): T[] {
    const p = projectRoot(`data/overlays/catalog/${name}.json`);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T[];
  }

  function centroidOf(
    row: CatalogRow,
    fallback?: [number, number]
  ): [number, number] | undefined {
    if (typeof row.lon === "number" && typeof row.lat === "number") {
      return [row.lon, row.lat];
    }
    return fallback;
  }

  const landformsCatalog = readCatalog<CatalogRow>("landforms");
  const resourcesCatalog = readCatalog<CatalogRow>("resources");
  const citiesCatalog = readCatalog<CatalogRow>("cities");
  const lakesCatalog = readCatalog<CatalogRow>("lakes");

  const landformTypeLabels: Record<string, string> = {
    plateau: "Plateau",
    "mountain-range": "Mountain range",
    hill: "Hills",
    escarpment: "Escarpment",
    inselberg: "Monolith",
    peak: "Peak",
    delta: "Delta",
    basin: "Basin",
    savanna: "Savanna",
    forest: "Forest",
    reserve: "Game reserve / Park",
  };

  const resourceTypeLabels: Record<string, string> = {
    "crude-oil": "Crude oil",
    "natural-gas": "Natural gas",
    coal: "Coal",
    "tin-columbite": "Tin & columbite",
    "iron-ore": "Iron ore",
    gold: "Gold",
    limestone: "Limestone",
    bitumen: "Bitumen",
    "lead-zinc": "Lead & zinc",
    "lithium-rare": "Lithium / rare earths",
    marble: "Marble",
    "salt-potash": "Salt & potash",
  };

  const cityCategoryLabels: Record<string, string> = {
    "federal-capital": "Federal capital",
    "mega-city": "Megacity",
    "state-capital": "State capital",
    commercial: "Commercial hub",
    historic: "Historic city",
    "port-city": "Port city",
    industrial: "Industrial centre",
    university: "University town",
    regional: "Regional city",
  };

  const lakeCategoryLabels: Record<string, string> = {
    natural: "Natural lake",
    reservoir: "Reservoir / dam",
    lagoon: "Coastal lagoon",
    "power-station": "Hydro power station",
  };

  const landformCentroids: Record<string, [number, number]> = {
    "landform-jos-plateau": [8.9, 9.6],
    "landform-mambilla": [11.0, 7.0],
    "landform-mandara": [13.55, 10.9],
    "landform-niger-delta": [6.0, 5.0],
    "landform-sokoto-basin": [5.5, 12.8],
    "landform-guinea-savanna": [5.8, 8.8],
    "landform-sudan-savanna": [8.0, 11.3],
    "landform-sahel-savanna": [9.5, 13.2],
    "landform-idanre": [4.75, 7.15],
    "landform-shere-hills": [8.9, 9.95],
    "landform-udi-escarpment": [7.5, 6.45],
    "landform-oban-hills": [8.8, 5.4],
    "landform-obudu-plateau": [9.6, 6.7],
    "landform-gashaka-highlands": [11.6, 7.6],
    "landform-shebshi": [9.6, 8.6],
    "landform-alantika": [13.5, 10.2],
    "landform-bauchi-plateau": [9.9, 10.4],
    "landform-gotels": [12.15, 9.85],
    "landform-kabwir": [9.72, 9.02],
    "landform-kufena-hills": [7.48, 10.38],
    "landform-erin-ijesha": [4.85, 7.58],
    "landform-ezeagu-hills": [7.22, 6.38],
    "landform-farin-ruwa": [8.72, 9.42],
    "landform-sambisa-forest": [12.5, 11.0],
    "landform-cross-river-np": [8.9, 5.8],
    "landform-yankari-reserve": [9.95, 9.9],
    "landform-okomu-forest": [5.4, 6.35],
    "landform-kamuku-forest": [7.05, 10.75],
    "landform-old-oyo-park": [4.05, 8.3],
    "landform-kainji-park": [4.45, 9.9],
    "landform-chad-basin-park": [13.0, 12.85],
    "landform-edumanom-forest": [6.6, 5.05],
  };

  const searchIndex = [
    { id: "NG", name: "Nigeria", level: "country" as const, parentId: null },
    ...states.map((s) => ({
      id: s.id,
      name: s.name,
      level: "state" as const,
      parentId: "NG",
      regionId: s.regionId,
      regionName: s.regionName,
      bbox: s.bbox,
    })),
    ...lgas.map((l) => ({
      id: l.id,
      name: l.name,
      level: "lga" as const,
      parentId: l.parentId,
      stateName: l.stateName,
      regionId: l.regionId,
      bbox: l.bbox,
    })),
    ...landformsCatalog.map((row) => {
      const lfType = String(row.landformType ?? "hill");
      return {
        id: row.id,
        name: row.name,
        level: "landform" as const,
        parentId: null,
        layerId: "landforms" as const,
        typeLabel: landformTypeLabels[lfType] ?? lfType,
        stateName: row.statesCrossed?.[0],
        centroid: centroidOf(row, landformCentroids[row.id]),
        summary: row.summary,
      };
    }),
    ...resourcesCatalog.map((row) => ({
      id: row.id,
      name: row.name,
      level: "resource" as const,
      parentId: null,
      layerId: "resources" as const,
      typeLabel: resourceTypeLabels[String(row.resourceType ?? "")] ?? "Mineral",
      stateName: row.statesCrossed?.[0],
      centroid: centroidOf(row),
      summary: row.summary,
    })),
    ...citiesCatalog.map((row) => ({
      id: row.id,
      name: row.name,
      level: "city" as const,
      parentId: null,
      layerId: "cities" as const,
      typeLabel: cityCategoryLabels[String(row.category ?? "regional")] ?? "City",
      centroid: centroidOf(row),
      summary: row.summary,
    })),
    ...lakesCatalog.map((row) => {
      const kind = row.type === "power-station" ? "power-station" : String(row.lakeCategory ?? "natural");
      return {
        id: row.id,
        name: row.name,
        level: "lake" as const,
        parentId: null,
        layerId: "lakes" as const,
        typeLabel: lakeCategoryLabels[kind] ?? "Lake / hydro",
        stateName: row.statesCrossed?.[0],
        centroid: centroidOf(row),
        summary: row.summary,
      };
    }),
  ];
  writeJson(projectRoot("public/search-index.json"), searchIndex);

  ensureDir(projectRoot("data/content"));
  writeJson(
    projectRoot("data/content/states.json"),
    states.map((s) => ({
      id: s.id,
      name: s.name,
      region: s.regionName,
      capital: getCapital(s.name),
      lgaCount: s.lgaCount,
      description: getStateDescription(s.name),
    }))
  );
  writeJson(
    projectRoot("data/content/lgas.json"),
    lgas.map((l) => ({
      id: l.id,
      name: l.name,
      stateName: l.stateName,
      wardCount: l.wardCount,
      areaKm2: l.areaKm2,
      description: `${l.name} is a Local Government Area in ${l.stateName} State.`,
    }))
  );
  writeJson(projectRoot("data/content/sources.json"), {
    boundaries: {
      name: "UN SALB Nigeria (OSGoF)",
      url: "https://salb.un.org/en/data/nga",
    },
    hierarchy: {
      name: "temikeezy/nigeria-geojson-data",
      url: "https://github.com/temikeezy/nigeria-geojson-data",
      license: "MIT",
    },
  });

  console.log(`Built: ${states.length} states, ${lgas.length} LGAs`);
  return validation;
}
