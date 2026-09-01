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

  const searchIndex = [
    { id: "NG", name: "Nigeria", level: "country", parentId: null },
    ...states.map((s) => ({
      id: s.id,
      name: s.name,
      level: "state",
      parentId: "NG",
      regionId: s.regionId,
      regionName: s.regionName,
      bbox: s.bbox,
    })),
    ...lgas.map((l) => ({
      id: l.id,
      name: l.name,
      level: "lga",
      parentId: l.parentId,
      stateName: l.stateName,
      regionId: l.regionId,
      bbox: l.bbox,
    })),
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
