import fs from "fs";
import path from "path";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { resolveStateByName } from "@/lib/location/resolveStateByName";
import {
  POWER_PLANT_CATEGORIES,
  isHydroCategory,
  type PowerPlantCategory,
} from "@/types/overlay";

type Row = Record<string, unknown>;

type NercUnitRow = {
  id?: string;
  capacityMw: number;
  plantCategory: PowerPlantCategory;
};

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export type PlantInventoryGroup =
  | "grid-connected"
  | "regional-off-grid"
  | "dam-non-power";

export type HubPowerPlant = {
  id: string;
  name: string;
  plantCategory: PowerPlantCategory;
  inventoryGroup: PlantInventoryGroup;
  type: string;
  summary: string;
  description: string;
  capacityMw: number | null;
  capacityUnverified: boolean;
  gridConnected: boolean;
  gridConnectedNote: string;
  units: string;
  commissioned: string;
  operator: string;
  riverName: string;
  linkedLakeId: string;
  states: string[];
  stateIds: string[];
  lon: number | null;
  lat: number | null;
  highlights: string[];
  wikiUrl: string;
  nercUnits?: NercUnitRow[];
  sourceUrl: string;
  sourceAccessDate: string;
  lastVerified: string;
};

export type HubDistributor = {
  id: string;
  name: string;
  type: string;
  summary: string;
  operator: string;
  shareholding: string;
  states: string[];
  stateIds: string[];
  lon: number | null;
  lat: number | null;
};

export type HubGridNode = {
  id: string;
  name: string;
  summary: string;
  voltageKv: number;
  voltageLabel: string;
  role: string;
  states: string[];
  stateIds: string[];
  lon: number | null;
  lat: number | null;
};

export type HubGridCorridor = {
  id: string;
  name: string;
  summary: string;
  voltageKv: number;
  fromNode: string;
  toNode: string;
  states: string[];
  stateIds: string[];
};

export type GenerationMixGroup = {
  category: PowerPlantCategory;
  capacityMw: number;
  sharePercent: number;
  stationCount: number;
};

export type PowerData = {
  stations: HubPowerPlant[];
  /** Grid-connected plants only (excludes off-grid hydro and non-power dams). */
  gridStations: HubPowerPlant[];
  offGridHydro: HubPowerPlant[];
  nonPowerDams: HubPowerPlant[];
  distributors: HubDistributor[];
  gridNodes: HubGridNode[];
  gridCorridors: HubGridCorridor[];
  /** NERC grid-connected installed capacity (28 reporting units). */
  totalCapacityMw: number;
  nercPlantCount: number;
  hydroCapacityMw: number;
  thermalCapacityMw: number;
  majorHydroCapacityMw: number;
  gasSharePercent: number;
  /** Site rows in the grid-connected inventory (may group several NERC units). */
  generationSiteCount: number;
  ratedGridSiteCount: number;
  majorCount: number;
  regionalOffGridCount: number;
  generationMix: GenerationMixGroup[];
  stateIds: string[];
  sources: {
    nerc: { label: string; url: string; accessed: string; lastVerified: string };
    tcn: { label: string; url: string; accessed: string; lastVerified: string };
  };
};

let cache: PowerData | null = null;

function parseNercUnits(r: Row, fallbackCategory: PowerPlantCategory): NercUnitRow[] {
  const raw = r.nercUnits;
  if (!Array.isArray(raw) || raw.length === 0) {
    const mw = num(r.capacityMw);
    if (mw == null || mw <= 0) return [];
    return [{ capacityMw: mw, plantCategory: fallbackCategory }];
  }
  return raw
    .map((u) => {
      const row = u as Record<string, unknown>;
      const cat = POWER_PLANT_CATEGORIES.includes(
        row.plantCategory as PowerPlantCategory
      )
        ? (row.plantCategory as PowerPlantCategory)
        : fallbackCategory;
      const mw = num(row.capacityMw);
      if (mw == null || mw <= 0) return null;
      return {
        id: str(row.id),
        capacityMw: mw,
        plantCategory: cat,
      };
    })
    .filter((x): x is NercUnitRow => x != null);
}

/** Largest-remainder method so mix shares sum to exactly 100%. */
function mixShares(
  byCategory: Map<PowerPlantCategory, { mw: number; count: number }>,
  totalMw: number
): GenerationMixGroup[] {
  if (totalMw <= 0) return [];
  const entries = [...byCategory.entries()].filter(([, v]) => v.mw > 0);
  const raw = entries.map(([category, v]) => ({
    category,
    capacityMw: v.mw,
    stationCount: v.count,
    exact: (100 * v.mw) / totalMw,
  }));
  const floors = raw.map((r) => ({
    ...r,
    sharePercent: Math.floor(r.exact),
    remainder: r.exact - Math.floor(r.exact),
  }));
  let assigned = floors.reduce((s, r) => s + r.sharePercent, 0);
  const sorted = [...floors].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; assigned < 100 && i < sorted.length; i++) {
    sorted[i].sharePercent += 1;
    assigned += 1;
  }
  return POWER_PLANT_CATEGORIES.map((category) => {
    const row = floors.find((f) => f.category === category);
    if (!row || row.capacityMw <= 0) return null;
    return {
      category,
      capacityMw: row.capacityMw,
      sharePercent: row.sharePercent,
      stationCount: row.stationCount,
    };
  }).filter((x): x is GenerationMixGroup => x != null);
}

export function loadPowerData(): PowerData {
  if (cache) return cache;

  const file = path.join(process.cwd(), "data/overlays/catalog/power.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Row[] | Record<string, Row>;
  const rows = Array.isArray(parsed) ? parsed : Object.values(parsed);

  const { states } = loadExplorerPageData(process.cwd());
  const toIds = (names: string[]) =>
    names
      .map((n) => resolveStateByName(states, n)?.id)
      .filter((x): x is string => x != null);

  const withStateIds = (r: Row) => {
    const st = strList(r.statesCrossed);
    return { states: st, stateIds: toIds(st) };
  };

  const stations: HubPowerPlant[] = rows
    .filter((r) => str(r.featureKind) === "power-plant")
    .map((r) => {
      const plantCategory = POWER_PLANT_CATEGORIES.includes(
        r.plantCategory as PowerPlantCategory
      )
        ? (r.plantCategory as PowerPlantCategory)
        : "gas-ocgt";
      const inventoryGroup = (str(r.inventoryGroup) ||
        (r.gridConnected === false ? "regional-off-grid" : "grid-connected")) as PlantInventoryGroup;
      return {
        id: str(r.id),
        name: str(r.name),
        plantCategory,
        inventoryGroup,
        type: str(r.type),
        summary: str(r.summary),
        description: str(r.description),
        capacityMw: num(r.capacityMw),
        capacityUnverified: r.capacityUnverified === true,
        gridConnected: r.gridConnected !== false,
        gridConnectedNote: str(r.gridConnectedNote),
        units: str(r.units),
        commissioned: str(r.commissioned),
        operator: str(r.operator),
        riverName: str(r.riverName),
        linkedLakeId: str(r.linkedLakeId),
        ...withStateIds(r),
        lon: num(r.lon),
        lat: num(r.lat),
        highlights: strList(r.highlights),
        wikiUrl: str(r.wikiUrl),
        nercUnits: parseNercUnits(r, plantCategory),
        sourceUrl: str(r.sourceUrl),
        sourceAccessDate: str(r.sourceAccessDate),
        lastVerified: str(r.lastVerified),
      };
    })
    .sort((a, b) => (b.capacityMw ?? 0) - (a.capacityMw ?? 0));

  const gridStations = stations.filter((s) => s.inventoryGroup === "grid-connected");
  const offGridHydro = stations.filter((s) => s.inventoryGroup === "regional-off-grid");
  const nonPowerDams = stations.filter((s) => s.inventoryGroup === "dam-non-power");

  const distributors: HubDistributor[] = rows
    .filter((r) => str(r.featureKind) === "power-distributor")
    .map((r) => ({
      id: str(r.id),
      name: str(r.name),
      type: str(r.type),
      summary: str(r.summary),
      operator: str(r.operator),
      shareholding: str(r.shareholding),
      ...withStateIds(r),
      lon: num(r.lon),
      lat: num(r.lat),
    }))
    .sort((a, b) => b.states.length - a.states.length);

  const gridNodes: HubGridNode[] = rows
    .filter((r) => str(r.featureKind) === "grid-substation")
    .map((r) => ({
      id: str(r.id),
      name: str(r.name),
      summary: str(r.summary),
      voltageKv: num(r.voltageKv) ?? 132,
      voltageLabel: str(r.voltageLabel),
      role: str(r.role),
      ...withStateIds(r),
      lon: num(r.lon),
      lat: num(r.lat),
    }))
    .sort((a, b) => b.voltageKv - a.voltageKv || a.name.localeCompare(b.name));

  const gridCorridors: HubGridCorridor[] = rows
    .filter((r) => str(r.featureKind) === "grid-corridor")
    .map((r) => ({
      id: str(r.id),
      name: str(r.name),
      summary: str(r.summary),
      voltageKv: num(r.voltageKv) ?? 132,
      fromNode: str(r.fromNode),
      toNode: str(r.toNode),
      ...withStateIds(r),
    }))
    .sort((a, b) => b.voltageKv - a.voltageKv || a.name.localeCompare(b.name));

  const mixByCategory = new Map<
    PowerPlantCategory,
    { mw: number; count: number }
  >();
  let totalCapacityMw = 0;
  let nercPlantCount = 0;
  let hydroCapacityMw = 0;

  for (const site of gridStations) {
    const units =
      site.nercUnits && site.nercUnits.length > 0
        ? site.nercUnits
        : site.capacityMw != null && site.capacityMw > 0
          ? [{ capacityMw: site.capacityMw, plantCategory: site.plantCategory }]
          : [];
    for (const unit of units) {
      nercPlantCount += 1;
      totalCapacityMw += unit.capacityMw;
      if (isHydroCategory(unit.plantCategory)) {
        hydroCapacityMw += unit.capacityMw;
      }
      const prev = mixByCategory.get(unit.plantCategory) ?? { mw: 0, count: 0 };
      mixByCategory.set(unit.plantCategory, {
        mw: prev.mw + unit.capacityMw,
        count: prev.count + 1,
      });
    }
  }

  const thermalCapacityMw = totalCapacityMw - hydroCapacityMw;
  const gasCapacityMw =
    (mixByCategory.get("gas-ccgt")?.mw ?? 0) +
    (mixByCategory.get("gas-ocgt")?.mw ?? 0);

  cache = {
    stations,
    gridStations,
    offGridHydro,
    nonPowerDams,
    distributors,
    gridNodes,
    gridCorridors,
    totalCapacityMw,
    nercPlantCount,
    hydroCapacityMw,
    thermalCapacityMw,
    majorHydroCapacityMw: gridStations
      .filter((s) => s.plantCategory === "major-hydro")
      .reduce((sum, s) => sum + (s.capacityMw ?? 0), 0),
    gasSharePercent:
      totalCapacityMw > 0 ? Math.round((100 * gasCapacityMw) / totalCapacityMw) : 0,
    generationSiteCount: gridStations.length,
    ratedGridSiteCount: gridStations.filter(
      (s) => s.capacityMw != null && s.capacityMw > 0
    ).length,
    majorCount: gridStations.filter((s) => s.plantCategory === "major-hydro").length,
    regionalOffGridCount: offGridHydro.length,
    generationMix: mixShares(mixByCategory, totalCapacityMw),
    stateIds: [
      ...new Set([
        ...gridStations.flatMap((s) => s.stateIds),
        ...distributors.flatMap((d) => d.stateIds),
        ...gridNodes.flatMap((n) => n.stateIds),
        ...gridCorridors.flatMap((c) => c.stateIds),
      ]),
    ],
    sources: {
      nerc: {
        label: "NERC quarterly market operator reports",
        url: "https://nerc.gov.ng/wp-content/uploads/2026/04/2025_Q4-Report.pdf",
        accessed: "2026-04-29",
        lastVerified: "2026-04-29",
      },
      tcn: {
        label: "TCN transmission project descriptions (schematic routing)",
        url: "https://tcn.gov.ng/",
        accessed: "2026-04-29",
        lastVerified: "2026-04-29",
      },
    },
  };
  return cache;
}
