import fs from "fs";
import path from "path";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { loadCompareBundle } from "@/lib/compare/loadCompareBundle";
import { getCategoryData } from "@/lib/compare/compareUtils";

type Row = Record<string, unknown>;

type EthnicCatalog = {
  count?: number;
  source?: string;
  groupType?: string;
  groups: {
    id: string;
    name: string;
    groupType: string;
    isOfficial: boolean;
    stateIds: string[];
    memberIds: string[];
    description: string;
    ethnicMakeup: { name: string; role: string }[];
    confidence: string;
  }[];
};

type Spotlight = {
  id: string;
  name: string;
  cultureId: string;
  motifLabel: string;
  description: string;
  homelandLgaCount: number;
  zonesLabel: string;
  exploreHref: string;
};

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

export type HubEthnicGroup = {
  id: string;
  name: string;
  stateIds: string[];
  stateNames: string[];
  memberCount: number;
  description: string;
  makeup: { name: string; role: string }[];
  confidence: string;
};

export type PeopleHubData = {
  groups: HubEthnicGroup[];
  spotlight: Spotlight[];
  languages: { stateId: string; name: string; languages: string[] }[];
  /** Distinct language names across the country. */
  languageCount: number;
  slugByStateId: Record<string, string>;
  stateIdByName: Record<string, string>;
  counts: { groups: number; states: number; languages: number; lgaAreas: number };
  /** The map has no homelands layer, so we say so rather than faking one. */
  homelandsLayerAvailable: false;
  sources: string;
};

let cache: PeopleHubData | null = null;

export function loadPeopleHubData(): PeopleHubData {
  if (cache) return cache;

  const { states } = loadExplorerPageData(process.cwd());
  const nameById = new Map(states.map((s) => [s.id, s.name]));

  const catalog = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "data/content/ethnic-groups.json"),
      "utf8"
    )
  ) as EthnicCatalog;

  const spotlight = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "data/content/ethnic-groups-spotlight.json"),
      "utf8"
    )
  ) as Spotlight[];

  const groups: HubEthnicGroup[] = catalog.groups
    .map((g) => ({
      id: g.id,
      name: g.name,
      stateIds: g.stateIds ?? [],
      stateNames: (g.stateIds ?? [])
        .map((id) => nameById.get(id))
        .filter((x): x is string => x != null),
      memberCount: g.memberIds?.length ?? 0,
      description: str(g.description),
      makeup: Array.isArray(g.ethnicMakeup) ? g.ethnicMakeup : [],
      confidence: str(g.confidence, "medium"),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const bundle = loadCompareBundle(process.cwd());
  const general = getCategoryData(bundle, "state", "general", "default");
  const languages = states
    .map((s) => {
      const row = general[s.id] as Record<string, string> | undefined;
      const raw = str(row?.languages);
      return {
        stateId: s.id,
        name: s.name,
        languages: raw
          .split(/[,;/]/)
          .map((x) => x.trim())
          .filter(Boolean),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const languageSet = new Set(languages.flatMap((l) => l.languages));

  cache = {
    groups,
    spotlight,
    languages,
    languageCount: languageSet.size,
    slugByStateId: Object.fromEntries(states.map((s) => [s.id, s.slug])),
    stateIdByName: Object.fromEntries(states.map((s) => [s.name, s.id])),
    counts: {
      groups: groups.length,
      states: new Set(groups.flatMap((g) => g.stateIds)).size,
      languages: languageSet.size,
      lgaAreas: new Set(catalog.groups.flatMap((g) => g.memberIds ?? [])).size,
    },
    homelandsLayerAvailable: false,
    sources: "Cultural group catalogue · state general profiles",
  };
  return cache;
}
