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
  wikiUrl: string | null;
};

export type MetroVibe =
  | "capital"
  | "heritage"
  | "trade"
  | "port"
  | "campus"
  | "rising";

export type HubMetro = {
  id: string;
  name: string;
  /** City the route planner resolves, when the cities catalogue has it. */
  cityName: string | null;
  vibe: MetroVibe;
  stateIds: string[];
  stateNames: string[];
  slug: string | null;
  lon: number | null;
  lat: number | null;
  description: string;
  peoples: string[];
  notes: { title: string; note: string; category: string; url: string }[];
  /** Article for the seat city, used by the in-site "Read more" reader. */
  wikiUrl: string | null;
};

export type TravelHubData = {
  destinations: HubPlace[];
  cities: HubPlace[];
  metros: HubMetro[];
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

const VIBE_BY_CITY_CATEGORY: Record<string, MetroVibe> = {
  "federal-capital": "capital",
  "mega-city": "capital",
  historic: "heritage",
  commercial: "trade",
  industrial: "trade",
  "port-city": "port",
  university: "campus",
};

/** Metro ids whose seat city is named differently from the metro itself. */
const METRO_CITY_OVERRIDES: Record<string, string> = {
  "group-ife-ijesa-cluster": "city-ile-ife",
  "group-egbaland": "city-abeokuta",
  "group-ijebuland": "city-ijebu-ode",
};

const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function metroSeatName(name: string): string {
  return name
    .replace(/\(.*\)/g, "")
    .replace(/\b(Metropolis|Metro|Cluster|Axis)\b/g, "")
    .split(/[\/-]/)[0]
    .trim();
}

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
      wikiUrl: str(r.wikiUrl) || null,
    };
  };

  const destinations = readCatalog("tour")
    .map((r) => toPlace(r, ["visitorNote", "significance"]))
    .filter((p) => p.name);

  const cities = readCatalog("cities")
    .map((r) => toPlace(r, ["populationNote", "nickname"]))
    .filter((p) => p.name);

  const nameById = new Map(states.map((s) => [s.id, s.name]));
  const slugById = new Map(states.map((s) => [s.id, s.slug]));
  const cityRows = readCatalog("cities");
  const metroFile = path.join(process.cwd(), "data/content/metro.json");
  const metroRows: Row[] = fs.existsSync(metroFile)
    ? (JSON.parse(fs.readFileSync(metroFile, "utf8")) as Row[])
    : [];

  const metros: HubMetro[] = metroRows
    .filter((m) => m.groupType === "metro-area")
    .map((m) => {
      const id = str(m.id);
      const name = str(m.name);
      const seat = normName(metroSeatName(name));
      const city =
        cityRows.find((c) => c.id === METRO_CITY_OVERRIDES[id]) ??
        cityRows.find((c) => normName(str(c.name)) === seat) ??
        (seat.length >= 3
          ? cityRows.find((c) => normName(str(c.name)).startsWith(seat))
          : undefined);
      const stateIds = strList(m.stateIds);
      const rawNotes = Array.isArray(m.wikiNotes) ? (m.wikiNotes as Row[]) : [];
      const notes = rawNotes.map((n) => ({
        title: str(n.title),
        note: str(n.note),
        category: str(n.category),
        url: str(n.url),
      }));
      const peoples = Array.isArray(m.ethnicMakeup)
        ? (m.ethnicMakeup as Row[]).map((e) => str(e.name)).filter(Boolean)
        : [];
      return {
        id,
        name,
        cityName: city ? str(city.name) : null,
        vibe: VIBE_BY_CITY_CATEGORY[str(city?.category)] ?? "rising",
        stateIds,
        stateNames: stateIds
          .map((s) => nameById.get(s))
          .filter((x): x is string => x != null),
        slug: slugById.get(stateIds[0] ?? "") ?? null,
        lon: num(city?.lon),
        lat: num(city?.lat),
        description: str(m.description),
        peoples,
        notes,
        wikiUrl: notes.find((n) => n.url)?.url || str(city?.wikiUrl) || null,
      };
    });

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
    metros,
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
