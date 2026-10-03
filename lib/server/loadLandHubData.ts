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

/** Prose shared by every land catalogue entry. */
export type HubLandProse = {
  description: string;
  highlights: string[];
  significance: string;
  ecology: string;
  economy: string;
  wikiUrl: string;
};

function prose(r: Row): HubLandProse {
  return {
    description: str(r.description),
    highlights: strList(r.highlights),
    significance: str(r.significance),
    ecology: str(r.ecology),
    economy: str(r.economy),
    wikiUrl: str(r.wikiUrl),
  };
}

export type HubLandform = HubLandProse & {
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

export type HubLake = HubLandProse & {
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

export type HubWaterway = HubLandProse & {
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

export type HubCoast = HubLandProse & {
  id: string;
  name: string;
  type: string;
  summary: string;
  lengthNote: string;
  states: string[];
  stateIds: string[];
  lon: number | null;
  lat: number | null;
};

/** Country-level note, the same set the atlas overview shows as Highlights. */
export type HubCountryNote = {
  title: string;
  note: string;
  category: string;
  url: string;
};

export type LandHubData = {
  landforms: HubLandform[];
  lakes: HubLake[];
  waterways: HubWaterway[];
  coast: HubCoast[];
  highlights: HubCountryNote[];
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

  const { states, countryNotes } = loadExplorerPageData(process.cwd());
  const toIds = (names: string[]) =>
    names
      .map((n) => resolveStateByName(states, n)?.id)
      .filter((x): x is string => x != null);

  const landforms: HubLandform[] = readCatalog("landforms")
    .filter((r) => str(r.featureKind) === "area" || str(r.landformType))
    .map((r) => {
      const st = strList(r.statesCrossed);
      return {
        ...prose(r),
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
      ...prose(r),
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
      ...prose(r),
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
      ...prose(r),
      id: str(r.id),
      name: str(r.name),
      type: str(r.type),
      summary: str(r.summary),
      lengthNote: str(r.lengthNote),
      states: st,
      stateIds: toIds(st),
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

  const highlights: HubCountryNote[] = Object.values(countryNotes ?? {})
    .flat()
    .map((n) => ({
      title: n.title,
      note: n.note,
      category: n.category,
      url: n.url ?? "",
    }))
    .filter((n) => n.title && n.note);

  cache = {
    landforms,
    lakes,
    waterways,
    coast,
    highlights,
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
