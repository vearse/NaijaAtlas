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
  gasSupplyToPowerNote?: string;
  states: string[];
  stateIds: string[];
  products: string[];
  locations: string[];
  economy: string;
  highlights: string[];
  lon: number | null;
  lat: number | null;
  sourceUrl?: string;
  sourceAccessDate?: string;
  lastVerified?: string;
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

export type HubSource = {
  label: string;
  url: string;
};

export type HubBelt = {
  id: string;
  name: string;
  color: string;
  type: string;
  summary: string;
  description: string;
  rainfall: string;
  crops: string[];
  /** All states the belt touches (fully + partly). */
  states: string[];
  stateIds: string[];
  /** States largely inside the belt. */
  statesFully: string[];
  stateIdsFully: string[];
  /** States only partly inside the belt. */
  statesPartly: string[];
  stateIdsPartly: string[];
  agriculture: string;
  economy: string;
  /** True while the belt boundaries are drawn approximately. */
  approximate: boolean;
  sources: HubSource[];
  lastVerified: string;
};

export type HubCrop = {
  id: string;
  crop: string;
  color: string;
  summary: string;
  states: string[];
  stateIds: string[];
  statesFully: string[];
  stateIdsFully: string[];
  statesPartly: string[];
  stateIdsPartly: string[];
  leadingState: string | null;
  leadingNote: string;
  sources: HubSource[];
  lastVerified: string;
};

export type EconomyHubData = {
  resources: HubResource[];
  /** Distinct resourceType values in the minerals catalogue. */
  mineralTypesShown: number;
  ports: HubPort[];
  belts: HubBelt[];
  crops: HubCrop[];
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
  sources: {
    minerals: string;
    ports: string;
    power: string;
    lastVerified: string;
  };
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
  const bool = (v: unknown, fallback = false): boolean =>
    typeof v === "boolean" ? v : fallback;
  const sources = (v: unknown): HubSource[] =>
    Array.isArray(v)
      ? v
          .map((s) => {
            const row = (s ?? {}) as Record<string, unknown>;
            return { label: str(row.label), url: str(row.url) };
          })
          .filter((s) => s.url)
      : [];

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
      gasSupplyToPowerNote: str(r.gasSupplyToPowerNote) || undefined,
      lon,
      lat,
      sourceUrl: str(r.sourceUrl) || undefined,
      sourceAccessDate: str(r.sourceAccessDate) || undefined,
      lastVerified: str(r.lastVerified) || undefined,
    };
  });

  const mineralTypesShown = new Set(
    resources.map((r) => r.resourceType || r.type).filter(Boolean)
  ).size;

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

  const belts: HubBelt[] = readCatalog("farming-belts")
    .filter((e) => strList(e.crops).length > 0)
    .map((e) => {
      const states = strList(e.statesCrossed);
      const statesFully = strList(e.statesFully);
      const statesPartly = strList(e.statesPartly);
      return {
        id: str(e.id),
        name: str(e.name),
        color: str(e.color, "#d97706"),
        type: str(e.type),
        summary: str(e.summary),
        description: str(e.description),
        rainfall: str(e.rainfall),
        crops: strList(e.crops),
        states,
        stateIds: toIds(states),
        statesFully,
        stateIdsFully: toIds(statesFully),
        statesPartly,
        stateIdsPartly: toIds(statesPartly),
        agriculture: str(e.agriculture),
        economy: str(e.economy),
        approximate: bool(e.approximate),
        sources: sources(e.sources),
        lastVerified: str(e.lastVerified) || "2026-10-15",
      };
    });

  const crops: HubCrop[] = readCatalog("crops").map((c) => {
    const states = strList(c.statesCrossed);
    const statesFully = strList(c.statesFully);
    const statesPartly = strList(c.statesPartly);
    return {
      id: str(c.id),
      crop: str(c.crop),
      color: str(c.color, "#d97706"),
      summary: str(c.summary),
      states,
      stateIds: toIds(states),
      statesFully,
      stateIdsFully: toIds(statesFully),
      statesPartly,
      stateIdsPartly: toIds(statesPartly),
      leadingState: str(c.leadingState) || null,
      leadingNote: str(c.leadingNote),
      sources: sources(c.sources),
      lastVerified: str(c.lastVerified) || "2026-10-15",
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
    mineralTypesShown,
    ports,
    belts,
    crops,
    watch,
    stateCount: states.length,
    sources: {
      minerals:
        "Nigeria Ministry of Solid Minerals Development (MSMD) mineral inventory · NUPRC/Nigeria petroleum data",
      ports:
        "Nigerian Ports Authority (NPA) port handbook & berth characteristics",
      power: "NERC quarterly market operator reports (grid-connected fleet)",
      lastVerified: "2026-04-29",
    },
  };
  return cache;
}
