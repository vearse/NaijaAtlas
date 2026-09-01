import fs from "fs";
import path from "path";
import * as turf from "@turf/turf";
import { estimateAreaKm2 } from "../../../lib/map/metrics";

type GeoFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

export interface StateRecord {
  id: string;
  name: string;
  regionName: string;
  lgaCount: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
}

export interface LgaRecord {
  id: string;
  name: string;
  parentId: string;
  bbox: [number, number, number, number];
}

const COASTAL_STATE_NAMES = new Set([
  "Lagos",
  "Ogun",
  "Ondo",
  "Delta",
  "Bayelsa",
  "Rivers",
  "Akwa Ibom",
  "Cross River",
]);

/** States sharing an international land border (approximate, verified via geo when possible). */
const INTL_BORDER_STATE_NAMES = new Set([
  "Adamawa",
  "Borno",
  "Jigawa",
  "Katsina",
  "Kebbi",
  "Kano",
  "Sokoto",
  "Zamfara",
  "Cross River",
  "Benue",
  "Taraba",
  "Niger",
  "Ogun",
  "Kwara",
]);

export function polygonAreaKm2(feature: GeoFeature): number {
  return Math.round(turf.area(feature) / 1_000_000);
}

export function loadStateLandAreas(
  root: string,
  states: StateRecord[]
): Map<string, number> {
  const adm1Path = path.join(root, "public/geo/nigeria-adm1.geojson");
  const map = new Map<string, number>();

  if (fs.existsSync(adm1Path)) {
    const fc = JSON.parse(
      fs.readFileSync(adm1Path, "utf-8")
    ) as GeoJSON.FeatureCollection;
    for (const f of fc.features as GeoFeature[]) {
      const id = (f.properties as { id?: string })?.id;
      if (id) map.set(id, polygonAreaKm2(f));
    }
  }

  for (const s of states) {
    if (!map.has(s.id)) {
      map.set(s.id, estimateAreaKm2(s.bbox));
    }
  }
  return map;
}

export function computeStateAdjacency(
  root: string,
  states: StateRecord[]
): Map<string, string[]> {
  const adm1Path = path.join(root, "public/geo/nigeria-adm1.geojson");
  const adj = new Map<string, Set<string>>();
  for (const s of states) adj.set(s.id, new Set());

  if (!fs.existsSync(adm1Path)) return new Map();

  const fc = JSON.parse(
    fs.readFileSync(adm1Path, "utf-8")
  ) as GeoJSON.FeatureCollection;
  const features = fc.features as GeoFeature[];
  const byId = new Map<string, GeoFeature>();
  for (const f of features) {
    const id = (f.properties as { id?: string })?.id;
    if (id) byId.set(id, f);
  }

  const ids = [...byId.keys()];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const fa = byId.get(a)!;
      const fb = byId.get(b)!;
      try {
        if (turf.booleanIntersects(fa, fb)) {
          adj.get(a)!.add(b);
          adj.get(b)!.add(a);
        }
      } catch {
        /* ignore topology errors */
      }
    }
  }

  const nameById = Object.fromEntries(states.map((s) => [s.id, s.name]));
  const result = new Map<string, string[]>();
  for (const [id, neighbors] of adj) {
    result.set(
      id,
      [...neighbors]
        .map((nid) => nameById[nid] ?? nid)
        .sort((x, y) => x.localeCompare(y))
    );
  }
  return result;
}

export function distanceKm(
  a: [number, number],
  b: [number, number]
): number {
  return Math.round(
    turf.distance(turf.point(a), turf.point(b), { units: "kilometers" })
  );
}

export function computeLgaExtremes(lgas: LgaRecord[]): Map<
  string,
  { largest: string; smallest: string }
> {
  const byState = new Map<string, LgaRecord[]>();
  for (const l of lgas) {
    const list = byState.get(l.parentId) ?? [];
    list.push(l);
    byState.set(l.parentId, list);
  }

  const result = new Map<string, { largest: string; smallest: string }>();
  for (const [stateId, list] of byState) {
    if (list.length === 0) {
      result.set(stateId, { largest: "—", smallest: "—" });
      continue;
    }
    let largest = list[0];
    let smallest = list[0];
    let maxA = estimateAreaKm2(largest.bbox);
    let minA = maxA;
    for (const l of list.slice(1)) {
      const a = estimateAreaKm2(l.bbox);
      if (a > maxA) {
        maxA = a;
        largest = l;
      }
      if (a < minA) {
        minA = a;
        smallest = l;
      }
    }
    result.set(stateId, { largest: largest.name, smallest: smallest.name });
  }
  return result;
}

export function buildGeographyRecords(
  root: string,
  states: StateRecord[],
  lgas: LgaRecord[],
  popRankByState: Map<string, number | null>
): Record<string, Record<string, unknown>> {
  const landAreas = loadStateLandAreas(root, states);
  const adjacency = computeStateAdjacency(root, states);
  const lgaExtremes = computeLgaExtremes(lgas);
  const fct = states.find((s) => s.id === "NG-FC");
  const abujaCentroid = fct?.centroid ?? ([7.49, 9.06] as [number, number]);

  const out: Record<string, Record<string, unknown>> = {};
  for (const s of states) {
    out[s.id] = {
      hasCoastline: COASTAL_STATE_NAMES.has(s.name) ? "Yes" : "No",
      hasIntlBorder: INTL_BORDER_STATE_NAMES.has(s.name) ? "Yes" : "No",
      borderingStates: (adjacency.get(s.id) ?? []).join(" · ") || "—",
      distanceToAbujaKm: distanceKm(
        [s.centroid[0], s.centroid[1]],
        abujaCentroid
      ),
      largestLga: lgaExtremes.get(s.id)?.largest ?? "—",
      smallestLga: lgaExtremes.get(s.id)?.smallest ?? "—",
      nationalPopRank: popRankByState.get(s.id) ?? null,
      landAreaKm2: landAreas.get(s.id) ?? null,
    };
  }
  return out;
}

export function populationRank(
  populations: Map<string, number | null>
): Map<string, number | null> {
  const sorted = [...populations.entries()]
    .filter(([, p]) => p != null && p > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number));
  const rank = new Map<string, number | null>();
  sorted.forEach(([id], i) => rank.set(id, i + 1));
  for (const [id] of populations) {
    if (!rank.has(id)) rank.set(id, null);
  }
  return rank;
}
