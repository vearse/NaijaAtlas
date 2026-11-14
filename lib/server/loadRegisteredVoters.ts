import fs from "fs";
import path from "path";
import type { RegisteredVotersBundle } from "@/types/politics";

function registeredVotersDir(root: string): string {
  return path.join(root, "data/politics/registered-voters");
}

function registeredVotersFile(root: string, year: number): string {
  return path.join(registeredVotersDir(root), `${year}.json`);
}

export function availableRegisteredVoterYears(
  root = process.cwd()
): number[] {
  const dir = registeredVotersDir(root);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{4}\.json$/.test(entry.name))
    .map((entry) => Number(entry.name.replace(".json", "")))
    .sort((a, b) => b - a);
}

export function loadRegisteredVoters(
  year: number,
  root = process.cwd()
): RegisteredVotersBundle {
  const file = registeredVotersFile(root, year);
  if (!fs.existsSync(file)) {
    throw new Error(`No registered voters for ${year}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8")) as RegisteredVotersBundle;
}

export function loadAllRegisteredVoters(
  root = process.cwd()
): Record<number, RegisteredVotersBundle> {
  const bundles: Record<number, RegisteredVotersBundle> = {};
  for (const year of availableRegisteredVoterYears(root)) {
    bundles[year] = loadRegisteredVoters(year, root);
  }
  return bundles;
}
