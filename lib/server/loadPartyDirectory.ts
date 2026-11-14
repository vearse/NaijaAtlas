import fs from "fs";
import path from "path";
import type { ParliamentaryParty } from "@/types/politics";

type PartyDirectoryFile = {
  parties: Record<string, { abbreviation?: string; name?: string }>;
};

/** All INEC-registered parties, sorted by abbreviation for stable dropdowns. */
export function loadPartyDirectory(root = process.cwd()): ParliamentaryParty[] {
  const file = path.join(root, "data/politics/parties.json");
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(
    fs.readFileSync(file, "utf-8")
  ) as PartyDirectoryFile;
  return Object.entries(data.parties ?? {})
    .map(([key, value]) => ({
      abbreviation: value.abbreviation ?? key,
      name: value.name ?? key,
    }))
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
}
