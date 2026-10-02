import fs from "fs";
import path from "path";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { loadCompareBundle } from "@/lib/compare/loadCompareBundle";
import { getCategoryData } from "@/lib/compare/compareUtils";
import { parseMetricValue } from "@/lib/ranking/parseMetricValue";
import { resolveStateByName } from "@/lib/location/resolveStateByName";

type CatalogEntry = Record<string, unknown>;

function readCatalog(name: string): CatalogEntry[] {
  const file = path.join(process.cwd(), "data/overlays/catalog", `${name}.json`);
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as
    | CatalogEntry[]
    | Record<string, CatalogEntry>;
  return Array.isArray(parsed) ? parsed : Object.values(parsed);
}

export type HubResource = {
  id: string;
  name: string;
  resourceType: string;
  summary: string;
  type: string;
  reserveNote: string;
  productionNote: string;
  states: string[];
  stateIds: string[];
  products: string[];
  locations: string[];
  economy: string;
  highlights: string[];
  lon: number | null;
  lat: number | null;
};

export type HubPort = {
  id: string;
  name: string;
  status: "active" | "proposed";
  type: string;
  summary: string;
  cargoNote: string;
  significance: string;
  states: string[];
  stateIds: string[];
  highlights: string[];
};

export type HubBelt = {
  id: string;
  name: string;
  states: string[];
  stateIds: string[];
  crops: string[];
  agriculture: string;
  economy: string;
  summary: string;
};

export type EconomyHubData = {
  resources: HubResource[];
  ports: HubPort[];
  belts: HubBelt[];
  /** Per-state commercial signal, derived from the catalogues. */
  watch: {
    stateId: string;
    name: string;
    slug: string;
    region: string;
    resources: number;
    ports: number;
    igr: number | null;
    igrRank: number | null;
  }[];
  stateCount: number;
  sources: string;
};

let cache: EconomyHubData | null = null;

export function loadEconomyHubData(): EconomyHubData {
  if (cache) return cache;

  const { states } = loadExplorerPageData(process.cwd());
  const toIds = (names: string[]) =>
    names
      .map((n) => resolveStateByName(states, n)?.id)
      .filter((x): x is string => x != null);

  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;
  const strList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const resources: HubResource[] = readCatalog("resources").map((r) => {
    const states = strList(r.statesCrossed);
    const lon = typeof r.lon === "number" ? r.lon : null;
    const lat = typeof r.lat === "number" ? r.lat : null;
    return {
      id: str(r.id),
      name: str(r.name),
      resourceType: str(r.resourceType),
      summary: str(r.summary),
      type: str(r.type),
      reserveNote: str(r.reserveNote),
      productionNote: str(r.productionNote),
      states,
      stateIds: toIds(states),
      products: strList(r.products),
      locations: strList(r.locations),
      economy: str(r.economy),
      highlights: strList(r.highlights),
      lon,
      lat,
    };
  });

  const ports: HubPort[] = [
    ...readCatalog("ports").map((p) => {
      const states = strList(p.statesCrossed);
      return {
        id: str(p.id),
        name: str(p.name),
        status: "active" as const,
        type: str(p.type),
        summary: str(p.summary),
        cargoNote: str(p.cargoNote),
        significance: str(p.significance),
        states,
        stateIds: toIds(states),
        highlights: strList(p.highlights),
      };
    }),
    ...readCatalog("ports-proposed").map((p) => {
      const states = strList(p.statesCrossed);
      return {
        id: str(p.id),
        name: str(p.name),
        status: "proposed" as const,
        type: str(p.type),
        summary: str(p.summary),
        cargoNote: str(p.cargoNote),
        significance: str(p.significance),
        states,
        stateIds: toIds(states),
        highlights: strList(p.highlights),
      };
    }),
  ];

  const belts: HubBelt[] = readCatalog("ecology")
    .filter((e) => strList(e.crops).length > 0)
    .map((e) => {
      const states = strList(e.statesCrossed);
      return {
        id: str(e.id),
        name: str(e.name),
        states,
        stateIds: toIds(states),
        crops: strList(e.crops),
        agriculture: str(e.agriculture),
        economy: str(e.economy),
        summary: str(e.summary),
      };
    });

  // Commercial signal per state: catalogue counts plus the IGR ranking.
  const bundle = loadCompareBundle(process.cwd());
  const igrData = getCategoryData(bundle, "state", "economy", "2024");
  const igrByState: Record<string, number> = {};
  for (const s of states) {
    const raw = (igrData[s.id] as Record<string, unknown> | undefined)?.igr;
    const v = parseMetricValue(raw);
    if (v != null) igrByState[s.id] = v;
  }
  const igrRanked = Object.entries(igrByState).sort((a, b) => b[1] - a[1]);
  const igrRankById = new Map(igrRanked.map(([id], i) => [id, i + 1]));

  const watch = states
    .map((s) => ({
      stateId: s.id,
      name: s.name,
      slug: s.slug,
      region: s.regionName,
      resources: resources.filter((r) => r.stateIds.includes(s.id)).length,
      ports: ports.filter((p) => p.stateIds.includes(s.id)).length,
      igr: igrByState[s.id] ?? null,
      igrRank: igrRankById.get(s.id) ?? null,
    }))
    .sort((a, b) => {
      const signal =
        (b.ports - a.ports) || (b.resources - a.resources) || (b.igr ?? 0) - (a.igr ?? 0);
      return signal;
    });

  cache = {
    resources,
    ports,
    belts,
    watch,
    stateCount: states.length,
    sources: "MSMD mineral catalogue · Nigerian Ports Authority · NPA concession list",
  };
  return cache;
}
