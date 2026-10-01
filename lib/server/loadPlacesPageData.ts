import fs from "fs";
import path from "path";
import { loadLandingPageData } from "@/lib/server/loadLandingPageData";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { resolveStateContent } from "@/lib/location/stateContent";
import { loadStateFacts, loadStateIgr } from "@/lib/server/stateFacts";
import { loadStateProfileInsights } from "@/lib/server/stateProfileInsights";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import { loadStateFestivals } from "@/lib/server/loadFestivalsCalendar";
import type { Festival } from "@/lib/server/loadFestivalsCalendar";
import type { LandingStateCard } from "@/lib/landing/landingPageTypes";
import type { LgaLocation, MetroGroup, StateLocation } from "@/types/location";

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export type PlacesDirectoryStateRow = LandingStateCard & {
  slug: string;
};

/** LGA fields the Places hub needs; `areaKm2` is nullable so absent areas sort last. */
export type PlacesLgaRow = Pick<
  LgaLocation,
  "id" | "slug" | "name" | "parentId" | "stateName" | "centroid"
> & {
  areaKm2: number | null;
};

/** A state, metro, LGA or geomorphic feature surfaced in Discover Today. */
export type PlacesSpotlightItem = {
  id: string;
  name: string;
  category: "STATE" | "METRO" | "LGA" | "LAND FEATURE";
  zoneLabel: string;
  summary: string;
  /** Provenance line shown under the summary, e.g. "Capital: Minna". */
  detail: string;
  href: string | null;
  exploreHref: string;
  /** Only set for rows that can be opened in the in-place dossier drawer. */
  dossier?: PlacesDossier;
};

export type PlacesDossier = {
  category: PlacesSpotlightItem["category"];
  title: string;
  subtitle: string;
  summary: string;
  facts: { label: string; value: string; note: string; tone: "primary" | "sky" | "amber" | "lime" | "neutral" }[];
  /** Cross-links into the other atlas hubs. */
  dossierLinks: { label: string; icon: string; href: string; tone: string }[];
  mapHref: string;
  profileHref: string | null;
};

/** A river, lake, plateau or coastline, for the Featured Land & Waters band. */
export type PlacesLandFeature = {
  id: string;
  name: string;
  badge: string;
  metric: string;
  summary: string;
  detail: string;
  tone: "sky" | "lime";
  exploreHref: string;
};

export type PlacesCompareMetric = {
  key: string;
  label: string;
  note: string;
  /** `higher` marks the larger value as the better one (the design's medal). */
  direction: "higher" | "lower";
  format: "naira" | "compact" | "count" | "int";
  unit?: string;
  values: Record<string, number | null>;
  /** 1-based rank per state id; ties share a rank. */
  ranks: Record<string, number>;
  /** Value of the median state, used for the "vs median" line. */
  median: number | null;
};

export type PlacesCompareGroup = {
  id: string;
  label: string;
  icon: string;
  metrics: PlacesCompareMetric[];
};

export type PlacesZoneCard = {
  regionId: string;
  name: string;
  character: string;
  blurb: string;
  memberNames: string[];
  /** FCT sits alongside the six North Central states, so it is called out. */
  memberLabel: string;
  accent: string;
};

export type PlacesDirectoryData = {
  regions: ReturnType<typeof loadLandingPageData>["regions"];
  statesByRegion: Record<string, PlacesDirectoryStateRow[]>;
  allStates: PlacesDirectoryStateRow[];
  lgaCount: number;
  stateCount: number;
  lgas: PlacesLgaRow[];
  zones: PlacesZoneCard[];
  spotlight: PlacesSpotlightItem[];
  landFeatures: PlacesLandFeature[];
  compareGroups: PlacesCompareGroup[];
  /** Default three-state comparison, matching the design's opening state. */
  defaultCompare: [string, string, string];
  /** Table rows for Browse Territories & Features. */
  browseRows: PlacesBrowseRow[];
};

export type PlacesBrowseRow = {
  id: string;
  name: string;
  category: PlacesSpotlightItem["category"];
  seat: string;
  zone: string;
  lgaCount: number | null;
  population: string;
  href: string | null;
  actionLabel: string;
  tone: "primary" | "sky" | "amber" | "lime";
  exploreHref: string;
};

// --- catalogue shapes -------------------------------------------------------

type LandformRow = {
  id: string;
  name: string;
  landformType: string;
  type: string;
  summary: string;
  elevationNote?: string;
  statesCrossed?: string[];
};

type LakeRow = {
  id: string;
  name: string;
  lakeCategory: string;
  type: string;
  summary: string;
  areaNote?: string;
  statesCrossed?: string[];
};

type WaterwayRow = {
  id: string;
  name: string;
  waterwayClass: string;
  type: string;
  summary: string;
  lengthKm?: number;
  statesCrossed?: string[];
};

type ZoneContentFile = {
  zones: { regionId: string; character: string; blurb: string }[];
};

// --- helpers ----------------------------------------------------------------

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Dense (1..n) competition ranking, so ties share the same rank. */
function rankValues(
  values: Record<string, number | null>,
  direction: "higher" | "lower"
): Record<string, number> {
  const present = Object.entries(values)
    .filter(([, v]) => v !== null)
    .sort((a, b) =>
      direction === "higher"
        ? (b[1] as number) - (a[1] as number)
        : (a[1] as number) - (b[1] as number)
    );

  const ranks: Record<string, number> = {};
  let lastValue: number | null = null;
  let lastRank = 0;
  present.forEach(([id, value], index) => {
    const rank = value === lastValue ? lastRank : index + 1;
    ranks[id] = rank;
    lastValue = value;
    lastRank = rank;
  });
  return ranks;
}

// --- loader -----------------------------------------------------------------

export function loadPlacesDirectoryData(root = process.cwd()): PlacesDirectoryData {
  const landing = loadLandingPageData(root);
  const lgasRaw = loadJson<LgaLocation[]>(
    path.join(root, "data/locations/lgas.json")
  );

  const allStates: PlacesDirectoryStateRow[] = Object.values(
    landing.statesByRegion
  )
    .flat()
    .sort((a, b) => a.name.localeCompare(b.name));

  const statesByRegion: Record<string, PlacesDirectoryStateRow[]> = {};
  for (const [regionId, cards] of Object.entries(landing.statesByRegion)) {
    statesByRegion[regionId] = cards.map((c) => ({ ...c, slug: c.slug }));
  }

  const lgas = lgasRaw.map((l) => ({
    id: l.id,
    slug: l.slug,
    name: l.name,
    parentId: l.parentId,
    stateName: l.stateName,
    areaKm2: typeof l.areaKm2 === "number" ? l.areaKm2 : null,
    centroid: l.centroid,
  }));

  const zones = buildZones(root, landing.regions);
  const landFeatures = buildLandFeatures(root);
  const spotlight = buildSpotlight(root, allStates, lgas, landFeatures);
  const compareGroups = buildCompareGroups(root, allStates);
  const browseRows = buildBrowseRows(allStates, spotlight, lgas);

  return {
    regions: landing.regions,
    statesByRegion,
    allStates,
    lgaCount: landing.lgaCount,
    stateCount: landing.stateCount,
    lgas,
    zones,
    spotlight,
    landFeatures,
    compareGroups,
    defaultCompare: defaultCompareIds(allStates),
    browseRows,
  };
}

function buildZones(
  root: string,
  regions: ReturnType<typeof loadLandingPageData>["regions"]
): PlacesZoneCard[] {
  const authored = loadJson<ZoneContentFile>(
    path.join(root, "data/content/places-zones.json")
  );
  const byId = new Map(authored.zones.map((z) => [z.regionId, z]));

  const order = ["NG-NC", "NG-NE", "NG-NW", "NG-SE", "NG-SS", "NG-SW"];

  return order
    .map((regionId) => regions.find((r) => r.id === regionId))
    .filter((r): r is (typeof regions)[number] => Boolean(r))
    .map((region) => {
      const entry = byId.get(region.id);
      const hasFct = region.id === "NG-NC";
      return {
        regionId: region.id,
        name: region.name,
        character: entry?.character ?? "Geopolitical zone",
        blurb: entry?.blurb ?? "",
        memberNames: [...region.stateNames].sort((a, b) => a.localeCompare(b)),
        memberLabel: hasFct
          ? `${region.stateNames.length} states + FCT`
          : `${region.stateNames.length} states`,
        accent: region.color,
      };
    });
}

function buildLandFeatures(root: string): PlacesLandFeature[] {
  const landforms = loadJson<LandformRow[]>(
    path.join(root, "data/overlays/catalog/landforms.json")
  );
  const lakes = loadJson<LakeRow[]>(
    path.join(root, "data/overlays/catalog/lakes.json")
  );
  const waterways = loadJson<WaterwayRow[]>(
    path.join(root, "data/overlays/catalog/waterways.json")
  );

  const pick = <T extends { id: string; name: string }>(
    rows: T[],
    wanted: string[]
  ) => wanted.map((w) => rows.find((r) => r.id === w)).filter(Boolean) as T[];

  // River Niger and the Benue, Kainji Lake, the Jos Plateau and the delta —
  // the four geomorphic anchors the design calls for, all from the catalogue.
  const chosen = [
    ...pick(waterways, ["river-niger"]),
    ...pick(lakes, ["lake-kainji"]),
    ...pick(landforms, ["landform-jos-plateau"]),
    ...pick(waterways, ["river-benue"]),
  ].slice(0, 4);

  return chosen.map((row) => {
    const states = "statesCrossed" in row ? (row.statesCrossed ?? []) : [];
    const where = states.length
      ? states.length > 3
        ? `${states.slice(0, 3).join(", ")} +${states.length - 3} more`
        : states.join(" & ")
      : "Nigeria";

    if ("lengthKm" in row && typeof row.lengthKm === "number") {
      return {
        id: row.id,
        name: row.name,
        badge: row.waterwayClass === "delta" ? "Delta estuary" : "River system",
        metric: `${row.lengthKm.toLocaleString("en-NG")} km course`,
        summary: row.summary,
        detail: where,
        tone: "sky" as const,
        exploreHref: "/explore?lens=waterways",
      };
    }
    if ("areaNote" in row) {
      return {
        id: row.id,
        name: row.name,
        badge:
          row.lakeCategory === "reservoir" ? "Reservoir & dam" : "Lake",
        metric: row.areaNote ?? "",
        summary: row.summary,
        detail: where,
        tone: "sky" as const,
        exploreHref: "/explore?lens=waterways",
      };
    }
    const landform = row as LandformRow;
    return {
      id: row.id,
      name: row.name,
      badge: "Highland plateau",
      metric: landform.elevationNote ?? "",
      summary: row.summary,
      detail: where,
      tone: "lime" as const,
      exploreHref: "/explore?lens=terrain",
    };
  });
}

function stateDossier(state: PlacesDirectoryStateRow): PlacesDossier {
  const pop = state.population;
  const popLabel = pop
    ? `${(pop / 1_000_000).toFixed(1)}M`
    : "—";
  const areaLabel = state.landAreaKm2
    ? `${Math.round(state.landAreaKm2).toLocaleString("en-NG")} km²`
    : "—";

  return {
    category: "STATE",
    title: `${state.name} State`,
    subtitle: `${state.regionName} geopolitical zone · ${
      state.landAreaKm2
        ? `${Math.round(state.landAreaKm2).toLocaleString("en-NG")} km² of territory`
        : "federated unit"
    }`,
    summary: `${state.name} is one of Nigeria's ${
      state.regionName
    } states, with ${state.lgaCount} local government areas and ${state.pollingUnitCount.toLocaleString(
      "en-NG"
    )} geocoded polling units. The state capital is ${state.capital ?? "not recorded in the source bundle"}.${
      state.populationYear
        ? ` Population figures are the ${state.populationYear} NPC/NBS projection.`
        : ""
    }`,
    facts: [
      {
        label: "Population",
        value: popLabel,
        note: state.populationYear ? `${state.populationYear} projection` : "not published",
        tone: "primary",
      },
      {
        label: "Land area",
        value: areaLabel,
        note: "UN SALB boundary",
        tone: "neutral",
      },
      {
        label: "LGAs",
        value: String(state.lgaCount),
        note: "Constitutional tier 3",
        tone: "sky",
      },
      {
        label: "Capital",
        value: state.capital ?? "—",
        note: "State secretariat",
        tone: "amber",
      },
    ],
    dossierLinks: [
      { label: "Elections & polling units", icon: "how_to_vote", href: "/civic", tone: "bg-emerald-50 text-[#008751]" },
      { label: "Land, terrain & waters", icon: "landscape", href: "/land", tone: "bg-sky-50 text-[#0284c7]" },
      { label: "People & languages", icon: "group", href: "/people", tone: "bg-amber-50 text-[#d97706]" },
      { label: "Economy & fiscal output", icon: "finance", href: "/economy", tone: "bg-lime-50 text-[#4d7c0f]" },
    ],
    mapHref: `/explore?map=minimal&states=${state.id}`,
    profileHref: `/places/${state.slug}`,
  };
}

function buildSpotlight(
  root: string,
  allStates: PlacesDirectoryStateRow[],
  lgas: PlacesLgaRow[],
  landFeatures: PlacesLandFeature[]
): PlacesSpotlightItem[] {
  const metros = loadJson<MetroGroup[]>(path.join(root, "data/content/metro.json"));
  // `isOfficial` is false across the whole metro bundle, so rank the conurbations
  // by how many LGAs they actually aggregate instead.
  const officialMetros = metros
    .filter((m) => m.groupType === "metro-area")
    .sort(
      (a, b) =>
        (b.memberIds?.length ?? 0) - (a.memberIds?.length ?? 0) ||
        a.name.localeCompare(b.name)
    );

  const items: PlacesSpotlightItem[] = [];

  // Two states, anchored on the largest LGAs and the highest populations.
  const statePicks = [
    allStates.find((s) => s.id === "NG-LA"),
    allStates.find((s) => s.id === "NG-NI"),
    allStates.find((s) => s.id === "NG-KN"),
    allStates.find((s) => s.id === "NG-RI"),
  ].filter((s): s is PlacesDirectoryStateRow => Boolean(s));

  for (const state of statePicks) {
    items.push({
      id: state.id,
      name: state.name,
      category: "STATE",
      zoneLabel: state.regionName,
      summary: `${state.capital ?? state.name} is the ${state.name} capital, anchoring a state of ${state.lgaCount} local government areas and ${Math.round(
        state.landAreaKm2 ?? 0
      ).toLocaleString("en-NG")} km² of territory.`,
      detail: `Capital: ${state.capital ?? "—"}`,
      href: `/places/${state.slug}`,
      exploreHref: `/explore?map=minimal&states=${state.id}`,
      dossier: stateDossier(state),
    });
  }

  // Metro areas get a drawer dossier too.
  for (const metro of officialMetros.slice(0, 2)) {
    const hostStates = allStates.filter((s) => metro.stateIds.includes(s.id));
    const pop = hostStates.reduce((sum, s) => sum + (s.population ?? 0), 0);
    items.push({
      id: metro.id,
      name: metro.name,
      category: "METRO",
      zoneLabel: hostStates[0]?.regionName ?? "Multi-zone",
      summary: metro.description,
      detail: `${metro.memberIds?.length ?? 0} component LGAs`,
      href: null,
      exploreHref: `/explore?map=minimal&states=${hostStates[0]?.id ?? ""}`,
      dossier: {
        category: "METRO",
        title: metro.name,
        subtitle: `${hostStates
          .map((s) => s.regionName)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(" · ")} · ${
          hostStates.some((s) => s.id === "NG-LA")
            ? "Atlantic littoral"
            : "urban conurbation"
        }`,
        summary: metro.description,
        facts: [
          {
            label: "Population",
            value: pop ? `${(pop / 1_000_000).toFixed(1)}M` : "—",
            note: "Sum of member states",
            tone: "primary",
          },
          {
            label: "Spans LGAs",
            value: String(metro.memberIds?.length ?? 0),
            note: "Contiguous urban core",
            tone: "sky",
          },
          {
            label: "Parent states",
            value: hostStates.length ? String(hostStates.length) : "—",
            note: hostStates.map((s) => s.name).join(", ") || "—",
            tone: "neutral",
          },
          {
            label: "Zone",
            value: hostStates[0]?.regionName ?? "—",
            note: "Geopolitical zone",
            tone: "amber",
          },
        ],
        dossierLinks: [
          { label: "Tours & heritage sites", icon: "flight", href: "/travel", tone: "bg-emerald-50 text-[#008751]" },
          { label: "Ports & fiscal output", icon: "finance", href: "/economy", tone: "bg-sky-50 text-[#0284c7]" },
          { label: "Demographics & languages", icon: "group", href: "/people", tone: "bg-amber-50 text-[#d97706]" },
        ],
        mapHref: `/explore?map=minimal&states=${hostStates[0]?.id ?? ""}`,
        profileHref: hostStates[0] ? `/places/${hostStates[0].slug}` : null,
      },
    });
  }

  // The largest documented LGAs by area.
  const bigLgas = [...lgas]
    .filter((l) => typeof l.areaKm2 === "number" && l.areaKm2 > 0)
    .sort((a, b) => (b.areaKm2 ?? 0) - (a.areaKm2 ?? 0))
    .slice(0, 2);

  for (const lga of bigLgas) {
    const host = allStates.find((s) => s.id === lga.parentId);
    items.push({
      id: lga.id,
      name: lga.name,
      category: "LGA",
      zoneLabel: lga.stateName,
      summary: `${lga.name} is the largest local government area in ${lga.stateName} by land area, covering ${Math.round(
        lga.areaKm2 ?? 0
      ).toLocaleString("en-NG")} km² of ${
        host?.regionName?.toLowerCase() ?? "the country"
      } terrain.`,
      detail: `Seat: ${lga.name}`,
      href: host ? `/places/${host.slug}` : null,
      exploreHref: `/explore?map=minimal&states=${lga.parentId}&lgas=1&lga=${lga.id}`,
    });
  }

  // Land features close out the grid.
  for (const feature of landFeatures.slice(0, 2)) {
    items.push({
      id: feature.id,
      name: feature.name,
      category: "LAND FEATURE",
      zoneLabel: feature.detail,
      summary: feature.summary,
      detail: feature.metric,
      href: null,
      exploreHref: feature.exploreHref,
    });
  }

  return items;
}

function buildCompareGroups(
  root: string,
  allStates: PlacesDirectoryStateRow[]
): PlacesCompareGroup[] {
  const igr = loadStateIgr(root);
  const demographics = loadJson<Record<string, { populationDensity?: number | null }>>(
    path.join(root, "data/compare/states/demographics/2023.json")
  );
  const wards = loadJson<{ stateName: string }[]>(
    path.join(root, "data/locations/wards.json")
  );
  const senate = loadJson<{ state: string }[]>(
    path.join(root, "data/politics/constituencies/senatorial-districts.json")
  );

  const senateByState = new Map<string, number>();
  for (const d of senate) {
    senateByState.set(d.state, (senateByState.get(d.state) ?? 0) + 1);
  }
  const wardsByState = new Map<string, number>();
  for (const w of wards) {
    wardsByState.set(w.stateName, (wardsByState.get(w.stateName) ?? 0) + 1);
  }

  const byState = (pick: (s: PlacesDirectoryStateRow) => number | null) =>
    Object.fromEntries(allStates.map((s) => [s.id, pick(s)]));
  const presentValues = (pick: (s: PlacesDirectoryStateRow) => number | null) =>
    allStates
      .map(pick)
      .filter((v): v is number => v !== null);

  const metric = (
    key: string,
    label: string,
    note: string,
    format: PlacesCompareMetric["format"],
    unit: string | undefined,
    direction: "higher" | "lower",
    values: Record<string, number | null>,
    allValues: number[]
  ): PlacesCompareMetric => ({
    key,
    label,
    note,
    direction,
    format,
    unit,
    values,
    ranks: rankValues(values, direction),
    median: median(allValues),
  });

  return [
    {
      id: "fiscal",
      label: "Group 1: fiscal & economic capacity",
      icon: "trending_up",
      metrics: [
        metric(
          "igr",
          "Annual IGR",
          "Internally generated revenue, 2024",
          "naira",
          undefined,
          "higher",
          byState((s) => igr[s.id] ?? null),
          presentValues((s) => igr[s.id] ?? null)
        ),
        metric(
          "population",
          "Estimated population",
          "NPC / NBS projection 2023",
          "compact",
          undefined,
          "higher",
          byState((s) => s.population),
          presentValues((s) => s.population)
        ),
        metric(
          "density",
          "Population density",
          "People per km², 2023",
          "int",
          "/km²",
          "higher",
          byState((s) => demographics[s.id]?.populationDensity ?? null),
          presentValues((s) => demographics[s.id]?.populationDensity ?? null)
        ),
      ],
    },
    {
      id: "territory",
      label: "Group 2: territory & representation",
      icon: "family_restroom",
      metrics: [
        metric(
          "landArea",
          "Land area",
          "UN SALB boundary",
          "int",
          "km²",
          "higher",
          byState((s) => s.landAreaKm2),
          presentValues((s) => s.landAreaKm2)
        ),
        metric(
          "lgas",
          "Local government areas",
          "Constitutional tier 3",
          "int",
          undefined,
          "higher",
          byState((s) => s.lgaCount),
          presentValues((s) => s.lgaCount)
        ),
        metric(
          "wards",
          "Wards",
          "INEC delimitation register",
          "int",
          undefined,
          "higher",
          byState((s) => wardsByState.get(s.name) ?? null),
          presentValues((s) => wardsByState.get(s.name) ?? null)
        ),
        metric(
          "senate",
          "Senate seats",
          "Of 109 senatorial districts",
          "int",
          undefined,
          "higher",
          byState((s) => senateByState.get(s.name) ?? null),
          presentValues((s) => senateByState.get(s.name) ?? null)
        ),
      ],
    },
  ];
}

function defaultCompareIds(allStates: PlacesDirectoryStateRow[]): [string, string, string] {
  const pick = (id: string) => allStates.find((s) => s.id === id)?.id;
  return [
    pick("NG-LA") ?? allStates[0]?.id ?? "",
    pick("NG-KN") ?? allStates[1]?.id ?? "",
    pick("NG-RI") ?? allStates[2]?.id ?? "",
  ];
}

function buildBrowseRows(
  allStates: PlacesDirectoryStateRow[],
  spotlight: PlacesSpotlightItem[],
  lgas: PlacesDirectoryData["lgas"]
): PlacesBrowseRow[] {
  const rows: PlacesBrowseRow[] = [];

  for (const state of allStates) {
    rows.push({
      id: state.id,
      name: `${state.name} State`,
      category: "STATE",
      seat: state.capital ?? "—",
      zone: state.regionName,
      lgaCount: state.lgaCount,
      population: state.population
        ? state.population.toLocaleString("en-NG")
        : "—",
      href: `/places/${state.slug}`,
      actionLabel: "Dossier",
      tone: "primary",
      exploreHref: `/explore?map=minimal&states=${state.id}`,
    });
  }

  for (const item of spotlight) {
    if (item.category === "STATE") continue;
    const zone =
      item.category === "METRO"
        ? item.zoneLabel
        : item.category === "LGA"
          ? (allStates.find((s) => s.name === item.zoneLabel)?.regionName ?? "—")
          : item.zoneLabel;
    rows.push({
      id: item.id,
      name: item.name,
      category: item.category,
      seat: item.category === "LGA" ? item.zoneLabel : item.detail,
      zone,
      lgaCount: item.category === "METRO" ? null : null,
      population: item.category === "METRO" ? item.detail : "—",
      href: item.href,
      actionLabel: item.dossier ? "Inspect" : "On map",
      tone:
        item.category === "METRO"
          ? "amber"
          : item.category === "LGA"
            ? "sky"
            : "lime",
      exploreHref: item.exploreHref,
    });
  }

  // Keep the largest LGAs visible in the directory too.
  for (const lga of [...lgas]
    .filter((l) => typeof l.areaKm2 === "number" && l.areaKm2 > 0)
    .sort((a, b) => (b.areaKm2 ?? 0) - (a.areaKm2 ?? 0))
    .slice(0, 4)) {
    if (rows.some((r) => r.id === lga.id)) continue;
    rows.push({
      id: lga.id,
      name: `${lga.name} LGA`,
      category: "LGA",
      seat: lga.stateName,
      zone: allStates.find((s) => s.id === lga.parentId)?.regionName ?? "—",
      lgaCount: 1,
      population: `${Math.round(lga.areaKm2 ?? 0).toLocaleString("en-NG")} km²`,
      href: null,
      actionLabel: "Inspect",
      tone: "sky",
      exploreHref: `/explore?map=minimal&states=${lga.parentId}&lgas=1&lga=${lga.id}`,
    });
  }

  return rows;
}

export type StateProfileData = {
  state: StateLocation;
  content: ReturnType<typeof resolveStateContent>;
  lgas: LgaLocation[];
  senateSeatCount: number;
  allStates: StateLocation[];
  regions: PlacesDirectoryData["regions"];
  slugByStateId: Record<string, string>;
  facts: ReturnType<typeof loadStateFacts>[string];
  igr: number | null;
  landFeatures: PlacesLandFeature[];
  insights: StateProfileInsights | null;
  compareGroups: PlacesCompareGroup[];
  festivals: Festival[];
};

export function loadStateProfileData(
  stateSlug: string,
  root = process.cwd()
): StateProfileData | null {
  const explorer = loadExplorerPageData(root);
  const state = explorer.states.find((s) => s.slug === stateSlug);
  if (!state) return null;

  const rawContent = resolveStateContent(state, explorer.stateContent);
  const facts = loadStateFacts(root)[state.id];
  // `data/content/states.json` lacks a capital for 28 of the 37 states; the
  // compare bundle has all of them, so the profile never shows a bare dash.
  const content =
    rawContent.capital || facts?.capital
      ? { ...rawContent, capital: rawContent.capital ?? facts?.capital ?? null }
      : rawContent;

  const lgas = explorer.lgas
    .filter((l) => l.parentId === state.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const senateSeatCount =
    explorer.politics.lookups.districtsByStateId[state.id]?.length ?? 0;

  const slugByStateId = Object.fromEntries(
    explorer.states.map((s) => [s.id, s.slug])
  );

  const directory = loadPlacesDirectoryData(root);
  // Only features actually located in this state: the registry is sparse (7 of 37
  // states have a charted landform), and borrowing another state's rivers or lakes
  // would put false geography on the profile. The profile renders an explicit
  // "none charted yet" state instead.
  const landFeatures = directory.landFeatures.filter((f) =>
    f.detail.includes(state.name)
  );

  const insights = loadStateProfileInsights(state.id, root);

  return {
    state,
    content,
    lgas,
    senateSeatCount,
    allStates: explorer.states,
    regions: explorer.regions,
    slugByStateId,
    facts: facts ?? {
      capital: null,
      population: null,
      populationYear: null,
      landAreaKm2: null,
    },
    igr: loadStateIgr(root)[state.id] ?? null,
    landFeatures,
    insights,
    compareGroups: directory.compareGroups,
    festivals: loadStateFestivals(state.name, root),
  };
}

export function allStateSlugs(root = process.cwd()): string[] {
  const states = loadJson<StateLocation[]>(
    path.join(root, "data/locations/states.json")
  );
  return states.map((s) => s.slug);
}
