import fs from "fs";
import path from "path";
import type {
  LandingPageData,
  LandingStateCard,
} from "@/lib/landing/landingPageTypes";
import type {
  EthnicGroupsCatalog,
  EthnicSpotlightCard,
} from "@/lib/landing/ethnicGroupTypes";
import type { StateContent, StateLocation } from "@/types/location";
import { loadStateFacts, loadStateIgr } from "@/lib/server/stateFacts";

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export type { LandingPageData, LandingStateCard };

export function loadLandingPageData(root = process.cwd()): LandingPageData {
  const states = loadJson<StateLocation[]>(
    path.join(root, "data/locations/states.json")
  );
  const stateContent = loadJson<StateContent[]>(
    path.join(root, "data/content/states.json")
  );
  // `data/content/states.json` only has a capital for 9 of 37 states, so the
  // complete `compare` bundle wins whenever it has one.
  const facts = loadStateFacts(root);
  const igrById = loadStateIgr(root);
  const capitalById = new Map(
    stateContent.map((s) => [s.id, s.capital ?? facts[s.id]?.capital ?? null] as const)
  );
  const regions = loadJson(
    path.join(root, "data/locations/regions.json")
  ) as LandingPageData["regions"];

  const ethnicCatalog = loadJson<EthnicGroupsCatalog>(
    path.join(root, "data/content/ethnic-groups.json")
  );
  const spotlightRaw = loadJson<EthnicSpotlightCard[]>(
    path.join(root, "data/content/ethnic-groups-spotlight.json")
  );
  const catalogById = new Map(
    ethnicCatalog.groups.map((g) => [g.id, g] as const)
  );

  const ethnicSpotlight = spotlightRaw.map((card) => {
    const culture = catalogById.get(card.cultureId);
    const memberCount = culture?.memberIds.length;
    return {
      ...card,
      homelandLgaCount: card.homelandLgaCount ?? memberCount ?? 0,
      exploreHref:
        card.exploreHref ??
        (culture?.stateIds[0]
          ? `/places/map?states=${culture.stateIds[0]}`
          : "/places/map"),
    };
  });

  const ethnicGroupCount = ethnicCatalog.count ?? ethnicCatalog.groups.length;

  const totalPollingUnits = states.reduce(
    (sum, s) => sum + (s.pollingUnitCount ?? 0),
    0
  );

  const statesByRegion: Record<string, LandingStateCard[]> = {};
  for (const region of regions) {
    statesByRegion[region.id] = [];
  }

  for (const s of states) {
    const card: LandingStateCard = {
      id: s.id,
      name: s.name,
      slug: s.slug,
      regionId: s.regionId,
      regionName: s.regionName,
      lgaCount: s.lgaCount,
      capital: capitalById.get(s.id) ?? null,
      population: facts[s.id]?.population ?? null,
      populationYear: facts[s.id]?.populationYear ?? null,
      landAreaKm2: facts[s.id]?.landAreaKm2 ?? null,
      igr: igrById[s.id] ?? null,
      centroid: s.centroid,
      pollingUnitCount: s.pollingUnitCount ?? 0,
      code: s.id.replace("NG-", ""),
    };
    if (!statesByRegion[s.regionId]) statesByRegion[s.regionId] = [];
    statesByRegion[s.regionId].push(card);
  }

  for (const id of Object.keys(statesByRegion)) {
    statesByRegion[id].sort((a, b) => a.name.localeCompare(b.name));
  }

  const lgaCount = states.reduce((sum, s) => sum + s.lgaCount, 0);

  return {
    regions,
    statesByRegion,
    ethnicSpotlight,
    ethnicGroupCount,
    totalPollingUnits,
    stateCount: states.length,
    lgaCount,
  };
}
