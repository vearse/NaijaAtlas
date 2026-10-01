import fs from "fs";
import path from "path";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { regionShortCode } from "@/lib/landing/regionShortCode";
import { resolveStateByName } from "@/lib/location/resolveStateByName";

type Row = Record<string, unknown>;

function readCatalog(name: string): Row[] {
  const file = path.join(process.cwd(), "data/overlays/catalog", `${name}.json`);
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Row[] | Record<string, Row>;
  return Array.isArray(parsed) ? parsed : Object.values(parsed);
}

type RegionRow = { id: string; name: string; color: string; stateIds: string[] };

function readRegions(): RegionRow[] {
  const file = path.join(process.cwd(), "data/locations/regions.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as
    | RegionRow[]
    | Record<string, RegionRow>;
  return Array.isArray(parsed) ? parsed : Object.values(parsed);
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export type HubLandform = {
  id: string;
  name: string;
  landformType: string;
  sizeTier: string;
  type: string;
  summary: string;
  elevationNote: string;
  states: string[];
  stateIds: string[];
  character: string;
};

export type HubLake = {
  id: string;
  name: string;
  lakeCategory: string;
  type: string;
  summary: string;
  areaNote: string;
  maxDepthNote: string;
  usage: string;
  states: string[];
  stateIds: string[];
  isPower: boolean;
};

export type HubWaterway = {
  id: string;
  name: string;
  class: string;
  type: string;
  summary: string;
  lengthKm: number | null;
  lengthNote: string;
  mouthNote: string;
  states: string[];
  stateIds: string[];
};

export type HubCoast = {
  id: string;
  name: string;
  type: string;
  summary: string;
  lengthNote: string;
  states: string[];
  lon: number | null;
  lat: number | null;
};

export type LandHubData = {
  landforms: HubLandform[];
  lakes: HubLake[];
  waterways: HubWaterway[];
  coast: HubCoast[];
  regions: { id: string; name: string; shortCode: string; states: string[] }[];
  counts: { landforms: number; lakes: number; rivers: number; coast: number; states: number };
  longestRiver: HubWaterway | null;
  powerStations: number;
  sources: string;
  /** State name → Places slug. */
  slugByStateName: Record<string, string>;
  /** State name → state id. */
  idByStateName: Record<string, string>;
};

let cache: LandHubData | null = null;

export function loadLandHubData(): LandHubData {
  if (cache) return cache;

  const { states } = loadExplorerPageData(process.cwd());
  const toIds = (names: string[]) =>
    names
      .map((n) => resolveStateByName(states, n)?.id)
      .filter((x): x is string => x != null);

  const landforms: HubLandform[] = readCatalog("landforms")
    .filter((r) => str(r.featureKind) === "area" || str(r.landformType))
    .map((r) => {
      const st = strList(r.statesCrossed);
      return {
        id: str(r.id),
        name: str(r.name),
        landformType: str(r.landformType),
        sizeTier: str(r.sizeTier),
        type: str(r.type),
        summary: str(r.summary),
        elevationNote: str(r.elevationNote),
        states: st,
        stateIds: toIds(st),
        character: str(r.character),
      };
    })
    .filter((r) => r.name);

  const lakes: HubLake[] = readCatalog("lakes")
    .filter((r) => str(r.featureKind) === "lake")
    .map((r) => {
    const st = strList(r.statesCrossed);
    const cat = str(r.lakeCategory);
    return {
      id: str(r.id),
      name: str(r.name),
      lakeCategory: cat,
      type: str(r.type),
      summary: str(r.summary),
      areaNote: str(r.areaNote),
      maxDepthNote: str(r.maxDepthNote),
      usage: str(r.usage),
      states: st,
      stateIds: toIds(st),
      isPower: false,
    };
  });

  const waterways: HubWaterway[] = readCatalog("waterways").map((r) => {
    const st = strList(r.statesCrossed);
    return {
      id: str(r.id),
      name: str(r.name),
      class: str(r.waterwayClass),
      type: str(r.type),
      summary: str(r.summary),
      lengthKm: num(r.lengthKm),
      lengthNote: str(r.lengthNote),
      mouthNote: str(r.mouthNote),
      states: st,
      stateIds: toIds(st),
    };
  });

  const coast: HubCoast[] = readCatalog("coast").map((r) => {
    const st = strList(r.coastalStates ?? r.statesCrossed);
    return {
      id: str(r.id),
      name: str(r.name),
      type: str(r.type),
      summary: str(r.summary),
      lengthNote: str(r.lengthNote),
      states: st,
      lon: num(r.lon),
      lat: num(r.lat),
    };
  });

  const regionRows = readRegions();
  const regions = regionRows.map((r) => ({
    id: r.id,
    name: r.name,
    shortCode: regionShortCode(r.id),
    states: states
      .filter((s) => s.regionId === r.id)
      .map((s) => s.name)
      .sort(),
  }));

  const longestRiver = waterways
    .filter((w) => w.lengthKm != null)
    .sort((a, b) => (b.lengthKm ?? 0) - (a.lengthKm ?? 0))[0];

  cache = {
    landforms,
    lakes,
    waterways,
    coast,
    regions,
    counts: {
      landforms: landforms.length,
      lakes: lakes.filter((l) => l.lakeCategory !== "power-distributor").length,
      rivers: waterways.length,
      coast: coast.length,
      states: states.length,
    },
    longestRiver,
    powerStations: lakes.filter((l) => l.isPower).length,
    sources: "Landform, lake, waterway and coast catalogues · NBS",
    slugByStateName: Object.fromEntries(states.map((s) => [s.name, s.slug])),
    idByStateName: Object.fromEntries(states.map((s) => [s.name, s.id])),
  };
  return cache;
}
