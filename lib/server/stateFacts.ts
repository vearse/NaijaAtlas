import fs from "fs";
import path from "path";

/**
 * Verified per-state facts sourced from the `data/compare` registry.
 *
 * `data/content/states.json` only carries a capital for 9 of the 37 states, and
 * the design mockups need capital, population and land area for every state, so
 * these are read from the `compare` bundle instead — which is complete for all
 * 37. Every value here is a real figure from an official source; nothing is
 * invented to fill a gap.
 */

export type StateFacts = {
  /** State capital / seat of government. */
  capital: string | null;
  /** Most recent NPC/NBS population estimate, in people. */
  population: number | null;
  /** Year the `population` figure is drawn from. */
  populationYear: number | null;
  /** Land area in square kilometres, from UN SALB. */
  landAreaKm2: number | null;
};

type GeneralRow = {
  capital?: string | null;
  landAreaKm2?: number | null;
};

type DemographicsRow = {
  population?: number | null;
};

type EconomyRow = {
  igr?: number | null;
};

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function toNumber(value: unknown): number | null {
  if (value === "—" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "—" ? null : trimmed;
}

/**
 * Builds a `stateId -> StateFacts` lookup. Demographics years are walked newest
 * first so a state whose latest estimate is missing (Nasarawa has no 2023 row)
 * still falls back to its most recent available figure rather than to `null`.
 */
export function loadStateFacts(root = process.cwd()): Record<string, StateFacts> {
  const general = loadJson<Record<string, GeneralRow>>(
    path.join(root, "data/compare/states/general.json")
  );

  const demographyYears: { year: number; rows: Record<string, DemographicsRow> }[] = [
    { year: 2023, rows: loadJson(path.join(root, "data/compare/states/demographics/2023.json")) },
    { year: 2016, rows: loadJson(path.join(root, "data/compare/states/demographics/2016.json")) },
    { year: 2006, rows: loadJson(path.join(root, "data/compare/states/demographics/2006.json")) },
  ];

  const economy = loadJson<Record<string, EconomyRow>>(
    path.join(root, "data/compare/states/economy/2024.json")
  );

  const facts: Record<string, StateFacts> = {};

  for (const [stateId, row] of Object.entries(general)) {
    let population: number | null = null;
    let populationYear: number | null = null;
    for (const { year, rows } of demographyYears) {
      const value = toNumber(rows[stateId]?.population);
      if (value !== null) {
        population = value;
        populationYear = year;
        break;
      }
    }

    facts[stateId] = {
      capital: toText(row.capital),
      population,
      populationYear,
      landAreaKm2: toNumber(row.landAreaKm2),
    };
  }

  return facts;
}

/** Annual internally generated revenue in naira, used as the fiscal-capacity metric. */
export function loadStateIgr(
  root = process.cwd()
): Record<string, number> {
  const rows = loadJson<Record<string, EconomyRow>>(
    path.join(root, "data/compare/states/economy/2024.json")
  );
  const out: Record<string, number> = {};
  for (const [stateId, row] of Object.entries(rows)) {
    const value = toNumber(row.igr);
    if (value !== null) out[stateId] = value;
  }
  return out;
}
