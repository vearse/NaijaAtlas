import fs from "fs";
import path from "path";
import ExplorerShell from "@/components/ExplorerShell";
import { loadCompareBundle } from "@/lib/compare/loadCompareBundle";
import type {
  StateLocation,
  LgaLocation,
  RegionLocation,
  StateContent,
  StateLanguage,
  LgaContent,
  WardsByLga,
  MetroGroup,
  StateNotesMap,
  CountryNotesMap,
  PeopleNotesMap,
  LgaGeneral,
} from "@/types/location";

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export default function HomePage() {
  const root = process.cwd();
  const states = loadJson<StateLocation[]>(
    path.join(root, "data/locations/states.json")
  );
  const lgas = loadJson<LgaLocation[]>(
    path.join(root, "data/locations/lgas.json")
  );
  const regions = loadJson<RegionLocation[]>(
    path.join(root, "data/locations/regions.json")
  );
  const stateContentRaw = loadJson<StateContent[]>(
    path.join(root, "data/content/states.json")
  );
  const stateLanguages = loadJson<Record<string, StateLanguage[]>>(
    path.join(root, "data/content/state-languages.json")
  );
  const stateContent = stateContentRaw.map((c) => ({
    ...c,
    languages: c.languages ?? stateLanguages[c.id] ?? [],
  }));
  const lgaContent = loadJson<LgaContent[]>(
    path.join(root, "data/content/lgas.json")
  );
  const wardsByLga = loadJson<WardsByLga>(
    path.join(root, "data/locations/wards-by-lga.json")
  );
  const compareBundle = loadCompareBundle(root);
  const metroGroups = loadJson<MetroGroup[]>(
    path.join(root, "data/content/metro.json")
  );
  const stateNotes = loadJson<StateNotesMap>(
    path.join(root, "data/content/state-notes.json")
  );
  const countryNotes = loadJson<CountryNotesMap>(
    path.join(root, "data/compare/country/country-notes.json")
  );
  const peopleNotes = loadJson<PeopleNotesMap>(
    path.join(root, "data/content/people-notes.json")
  );
  const lgaGeneral = loadJson<Record<string, LgaGeneral>>(
    path.join(root, "data/compare/lgas/general.json")
  );

  return (
    <ExplorerShell
      states={states}
      lgas={lgas}
      regions={regions}
      stateContent={stateContent}
      lgaContent={lgaContent}
      wardsByLga={wardsByLga}
      compareBundle={compareBundle}
      metroGroups={metroGroups}
      stateNotes={stateNotes}
      countryNotes={countryNotes}
      peopleNotes={peopleNotes}
      lgaGeneral={lgaGeneral}
    />
  );
}
