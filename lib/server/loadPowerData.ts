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

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export type HubPowerPlant = {
  id: string;
  name: string;
  plantCategory: PowerPlantCategory;
  type: string;
  summary: string;
  description: string;
  capacityMw: number | null;
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

export type PowerData = {
  stations: HubPowerPlant[];
  distributors: HubDistributor[];
  gridNodes: HubGridNode[];
  gridCorridors: HubGridCorridor[];
  /** Installed capacity across every plant in the catalogue. */
  totalCapacityMw: number;
  hydroCapacityMw: number;
  thermalCapacityMw: number;
  majorHydroCapacityMw: number;
  /** Share of installed capacity that is gas-fired, 0-100. */
  gasSharePercent: number;
  generationCount: number;
  majorCount: number;
  regionalCount: number;
  /** Capacity of plants that actually feed the national grid. */
  gridCapacityMw: number;
  stateIds: string[];
};

let cache: PowerData | null = null;

/**
 * Generation, distribution and transmission for the Energy hub and the Power
 * grid map layer. All three read from the same `power` catalogue, so the hub
 * and the map can never disagree about what counts as a station, a DisCo or a
 * transmission node.
 *
 * Scope is the major grid-connected fleet. Installed capacities follow NERC's
 * quarterly reporting; smaller captive, solar and mini-grid installations are
 * not in the catalogue and are not claimed here.
 */
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
    .map((r) => ({
      id: str(r.id),
      name: str(r.name),
      plantCategory: POWER_PLANT_CATEGORIES.includes(r.plantCategory as PowerPlantCategory)
        ? (r.plantCategory as PowerPlantCategory)
        : "gas-ocgt",
      type: str(r.type),
      summary: str(r.summary),
      description: str(r.description),
      capacityMw: num(r.capacityMw),
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
    }))
    .sort((a, b) => (b.capacityMw ?? 0) - (a.capacityMw ?? 0));

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

  const hydroStations = stations.filter((s) => isHydroCategory(s.plantCategory));
  const hydroCapacityMw = hydroStations.reduce(
    (sum, s) => sum + (s.capacityMw ?? 0),
    0
  );
  const majorHydroCapacityMw = stations
    .filter((s) => s.plantCategory === "major-hydro")
    .reduce((sum, s) => sum + (s.capacityMw ?? 0), 0);
  const totalCapacityMw = stations.reduce(
    (sum, s) => sum + (s.capacityMw ?? 0),
    0
  );
  const gridCapacityMw = stations
    .filter((s) => s.gridConnected)
    .reduce((sum, s) => sum + (s.capacityMw ?? 0), 0);

  cache = {
    stations,
    distributors,
    gridNodes,
    gridCorridors,
    totalCapacityMw,
    hydroCapacityMw,
    thermalCapacityMw: totalCapacityMw - hydroCapacityMw,
    majorHydroCapacityMw,
    gridCapacityMw,
    majorCount: stations.filter((s) => s.plantCategory === "major-hydro").length,
    regionalCount: stations.filter((s) => s.plantCategory === "regional-hydro")
      .length,
    gasSharePercent:
      totalCapacityMw > 0
        ? Math.round(((totalCapacityMw - hydroCapacityMw) / totalCapacityMw) * 100)
        : 0,
    generationCount: stations.length,
    stateIds: [
      ...new Set([
        ...stations.flatMap((s) => s.stateIds),
        ...distributors.flatMap((d) => d.stateIds),
        ...gridNodes.flatMap((n) => n.stateIds),
        ...gridCorridors.flatMap((c) => c.stateIds),
      ]),
    ],
  };
  return cache;
}