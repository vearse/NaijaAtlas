import fs from "fs";
import path from "path";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";

type Row = Record<string, unknown>;

function readCatalog(name: string): Row[] {
  const file = path.join(process.cwd(), "data/overlays/catalog", `${name}.json`);
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Row[] | Record<string, Row>;
  return Array.isArray(parsed) ? parsed : Object.values(parsed);
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export type HubPlace = {
  id: string;
  name: string;
  category: string;
  stateName: string;
  stateId: string | null;
  slug: string | null;
  lon: number | null;
  lat: number | null;
  summary: string;
  note: string;
  landmarks: string[];
  highlights: string[];
};

export type TravelHubData = {
  destinations: HubPlace[];
  cities: HubPlace[];
  categoryCounts: { key: string; label: string; count: number }[];
  cityCategoryCounts: { key: string; label: string; count: number }[];
  topStates: { name: string; count: number }[];
  slugByStateName: Record<string, string>;
  counts: { destinations: number; cities: number; states: number; categories: number };
  sources: string;
  eventsAvailable: false;
};

const CATEGORY_LABELS: Record<string, string> = {
  "national-park": "National parks",
  "wildlife-reserve": "Wildlife reserves",
  waterfall: "Waterfalls",
  "natural-wonder": "Natural wonders",
  mountain: "Mountains",
  "rock-formation": "Rock formations",
  cave: "Caves",
  beach: "Beaches",
  lake: "Lakes",
  resort: "Resorts",
  "heritage-site": "Heritage sites",
  monument: "Monuments",
  museum: "Museums",
  dam: "Dams",
  bridge: "Bridges",
  stadium: "Stadiums",
  airport: "Airports",
  market: "Markets",
  "religious-site": "Religious sites",
};

const labelFor = (key: string) =>
  CATEGORY_LABELS[key] ??
  key
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

let cache: TravelHubData | null = null;

export function loadTravelHubData(): TravelHubData {
  if (cache) return cache;

  const { states } = loadExplorerPageData(process.cwd());
  const idByName = new Map(states.map((s) => [s.name, s.id]));
  const slugByName = new Map(states.map((s) => [s.name, s.slug]));

  const toPlace = (r: Row, noteKeys: string[]): HubPlace => {
    const crossed = Array.isArray(r.statesCrossed)
      ? r.statesCrossed.filter((x): x is string => typeof x === "string")
      : [];
    const stateName = str(r.stateName) || crossed[0] || "";
    return {
      id: str(r.id),
      name: str(r.name),
      category: str(r.category ?? r.type),
      stateName,
      stateId: idByName.get(stateName) ?? null,
      slug: slugByName.get(stateName) ?? null,
      lon: num(r.lon),
      lat: num(r.lat),
      summary: str(r.summary),
      note: noteKeys.map((k) => str(r[k])).find((v) => v !== "") ?? "",
      landmarks: strList(r.landmarks),
      highlights: strList(r.highlights),
    };
  };

  const destinations = readCatalog("tour")
    .map((r) => toPlace(r, ["visitorNote", "significance"]))
    .filter((p) => p.name);

  const cities = readCatalog("cities")
    .map((r) => toPlace(r, ["populationNote", "nickname"]))
    .filter((p) => p.name);

  const countBy = (rows: HubPlace[]) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return [...m.entries()]
      .map(([key, count]) => ({ key, label: labelFor(key), count }))
      .sort((a, b) => b.count - a.count);
  };

  const byState = new Map<string, number>();
  for (const d of destinations) {
    byState.set(d.stateName, (byState.get(d.stateName) ?? 0) + 1);
  }

  cache = {
    destinations,
    cities,
    categoryCounts: countBy(destinations),
    cityCategoryCounts: countBy(cities),
    topStates: [...byState.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    slugByStateName: Object.fromEntries(slugByName),
    counts: {
      destinations: destinations.length,
      cities: cities.length,
      states: byState.size,
      categories: new Set(destinations.map((d) => d.category)).size,
    },
    sources: "Destination & city catalogues · state and federal tourism boards",
    eventsAvailable: false,
  };
  return cache;
}
