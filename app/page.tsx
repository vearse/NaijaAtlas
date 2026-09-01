import fs from "fs";
import path from "path";
import ExplorerShell from "@/components/ExplorerShell";
import { loadCompareBundle } from "@/lib/compare/loadCompareBundle";
import type {
  StateLocation,
  LgaLocation,
  RegionLocation,
  StateContent,
  LgaContent,
  WardsByLga,
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
  const stateContent = loadJson<StateContent[]>(
    path.join(root, "data/content/states.json")
  );
  const lgaContent = loadJson<LgaContent[]>(
    path.join(root, "data/content/lgas.json")
  );
  const wardsByLga = loadJson<WardsByLga>(
    path.join(root, "data/locations/wards-by-lga.json")
  );
  const compareBundle = loadCompareBundle(root);

  return (
    <ExplorerShell
      states={states}
      lgas={lgas}
      regions={regions}
      stateContent={stateContent}
      lgaContent={lgaContent}
      wardsByLga={wardsByLga}
      compareBundle={compareBundle}
    />
  );
}
