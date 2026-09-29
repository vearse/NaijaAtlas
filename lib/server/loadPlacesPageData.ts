import fs from "fs";
import path from "path";
import { loadLandingPageData } from "@/lib/server/loadLandingPageData";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { resolveStateContent } from "@/lib/location/stateContent";
import type { LandingStateCard } from "@/lib/landing/landingPageTypes";
import type { LgaLocation, StateLocation } from "@/types/location";

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export type PlacesDirectoryStateRow = LandingStateCard & {
  slug: string;
};

export type PlacesDirectoryData = {
  regions: ReturnType<typeof loadLandingPageData>["regions"];
  statesByRegion: Record<string, PlacesDirectoryStateRow[]>;
  allStates: PlacesDirectoryStateRow[];
  lgaCount: number;
  stateCount: number;
  lgas: Pick<LgaLocation, "id" | "slug" | "name" | "parentId" | "stateName">[];
};

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
  }));

  return {
    regions: landing.regions,
    statesByRegion,
    allStates,
    lgaCount: landing.lgaCount,
    stateCount: landing.stateCount,
    lgas,
  };
}

export type StateProfileData = {
  state: StateLocation;
  content: ReturnType<typeof resolveStateContent>;
  lgas: LgaLocation[];
  senateSeatCount: number;
  allStates: StateLocation[];
  regions: PlacesDirectoryData["regions"];
  slugByStateId: Record<string, string>;
};

export function loadStateProfileData(
  stateSlug: string,
  root = process.cwd()
): StateProfileData | null {
  const explorer = loadExplorerPageData(root);
  const state = explorer.states.find((s) => s.slug === stateSlug);
  if (!state) return null;

  const content = resolveStateContent(state, explorer.stateContent);
  const lgas = explorer.lgas
    .filter((l) => l.parentId === state.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const senateSeatCount =
    explorer.politics.lookups.districtsByStateId[state.id]?.length ?? 0;

  const slugByStateId = Object.fromEntries(
    explorer.states.map((s) => [s.id, s.slug])
  );

  return {
    state,
    content,
    lgas,
    senateSeatCount,
    allStates: explorer.states,
    regions: explorer.regions,
    slugByStateId,
  };
}

export function allStateSlugs(root = process.cwd()): string[] {
  const states = loadJson<StateLocation[]>(
    path.join(root, "data/locations/states.json")
  );
  return states.map((s) => s.slug);
}
