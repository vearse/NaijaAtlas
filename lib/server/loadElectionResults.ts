import fs from "fs";
import path from "path";
import type { PresidentialResultsBundle } from "@/types/politics";

export type PresidentialResultYear = number;

function resultsDir(root: string): string {
  return path.join(root, "data/politics/results");
}

function resultsFile(root: string, year: number): string {
  return path.join(resultsDir(root), String(year), "presidential_results.json");
}

/**
 * Years are discovered from disk (data/politics/results/<year>/...), so adding
 * a new result set is a data change, not a code change.
 */
export function availablePresidentialResultYears(
  root = process.cwd()
): number[] {
  const dir = resultsDir(root);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name))
    .map((entry) => Number(entry.name))
    .filter((year) => fs.existsSync(resultsFile(root, year)))
    .sort((a, b) => b - a);
}

export function loadPresidentialResults(
  year: number,
  root = process.cwd()
): PresidentialResultsBundle {
  const file = resultsFile(root, year);
  if (!fs.existsSync(file)) {
    throw new Error(`No presidential results for ${year}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8")) as PresidentialResultsBundle;
}

export function loadAllPresidentialResults(
  root = process.cwd()
): Record<number, PresidentialResultsBundle> {
  const bundles: Record<number, PresidentialResultsBundle> = {};
  for (const year of availablePresidentialResultYears(root)) {
    bundles[year] = loadPresidentialResults(year, root);
  }
  return bundles;
}
