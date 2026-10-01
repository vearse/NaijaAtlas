import fs from "fs";
import path from "path";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { resolveStateByName } from "@/lib/location/resolveStateByName";

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export type HubPowerStation = {
  id: string;
  name: string;
  plantCategory: string;
  type: string;
  summary: string;
  description: string;
  capacityMw: number | null;
  commissioned: string;
  operator: string;
  riverName: string;
  states: string[];
  stateIds: string[];
  lon: number | null;
  lat: number | null;
  highlights: string[];
};

export type HubDistributor = {
  id: string;
  name: string;
  type: string;
  summary: string;
  operator: string;
  states: string[];
  stateIds: string[];
  lon: number | null;
  lat: number | null;
};

export type PowerData = {
  stations: HubPowerStation[];
  distributors: HubDistributor[];
  totalCapacityMw: number;
  /** Stations with a published MW figure, as opposed to dam-only entries. */
  ratedStations: number;
  stateIds: string[];
};

let cache: PowerData | null = null;

/**
 * Hydropower and grid distribution. The map's lakes overlay carries
 * `power-station` and `power-distributor` features, so this is the same data
 * the atlas already draws — there is no thermal generation inventory, and the
 * hub does not pretend otherwise.
 */
export function loadPowerData(): PowerData {
  if (cache) return cache;

  const file = path.join(
    process.cwd(),
    "data/overlays/catalog/lakes.json"
  );
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Row[] | Record<string, Row>;
  const rows = Array.isArray(parsed) ? parsed : Object.values(parsed);

  const { states } = loadExplorerPageData(process.cwd());
  const toIds = (names: string[]) =>
    names
      .map((n) => resolveStateByName(states, n)?.id)
      .filter((x): x is string => x != null);

  const stations: HubPowerStation[] = rows
    .filter((r) => str(r.featureKind) === "power-station")
    .map((r) => {
      const st = strList(r.statesCrossed);
      return {
        id: str(r.id),
        name: str(r.name),
        plantCategory: str(r.plantCategory),
        type: str(r.type),
        summary: str(r.summary),
        description: str(r.description),
        capacityMw: num(r.capacityMw),
        commissioned: str(r.commissioned),
        operator: str(r.operator),
        riverName: str(r.riverName),
        states: st,
        stateIds: toIds(st),
        lon: num(r.lon),
        lat: num(r.lat),
        highlights: strList(r.highlights),
      };
    })
    .sort((a, b) => (b.capacityMw ?? 0) - (a.capacityMw ?? 0));

  const distributors: HubDistributor[] = rows
    .filter((r) => str(r.featureKind) === "power-distributor")
    .map((r) => {
      const st = strList(r.statesCrossed);
      return {
        id: str(r.id),
        name: str(r.name),
        type: str(r.type),
        summary: str(r.summary),
        operator: str(r.operator),
        states: st,
        stateIds: toIds(st),
        lon: num(r.lon),
        lat: num(r.lat),
      };
    })
    .sort((a, b) => b.states.length - a.states.length);

  cache = {
    stations,
    distributors,
    totalCapacityMw: stations.reduce((s, x) => s + (x.capacityMw ?? 0), 0),
    ratedStations: stations.filter((s) => (s.capacityMw ?? 0) > 0).length,
    stateIds: [
      ...new Set([
        ...stations.flatMap((s) => s.stateIds),
        ...distributors.flatMap((d) => d.stateIds),
      ]),
    ],
  };
  return cache;
}
