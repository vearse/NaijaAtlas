import fs from "fs";
import path from "path";

import type { WikiNote } from "@/types/location";

/**
 * Verified per-state insights for the Places state profile, assembled from the
 * `data/compare` bundle. Nothing here is invented: every value is read from the
 * registry and the profile only renders the indicators a state actually has
 * figures for (the bundle is deliberately incomplete, e.g. the social sheet
 * only carries literacy and enrolment for all 37 states).
 */

export type InsightMetric = {
  key: string;
  label: string;
  note: string;
  value: string;
  /** 1-based national rank, when the metric is published for every state. */
  rank?: number;
  /** Out of how many states carry the metric. */
  rankOf?: number;
  direction: "higher" | "lower";
  /** Formatted delta against the national median. */
  vsMedian?: string;
};

export type StateProfileInsights = {
  general: {
    capital: string | null;
    nickname: string | null;
    yearCreated: string | null;
    languages: string[];
    majorCities: string[];
    landAreaKm2: number | null;
  };
  geography: {
    borderingStates: string[];
    hasCoastline: boolean;
    hasIntlBorder: boolean;
    largestLga: string | null;
    smallestLga: string | null;
    distanceToAbujaKm: number | null;
    nationalPopRank: number | null;
  };
  demographics: {
    population: number | null;
    populationYear: number | null;
    populationDensity: number | null;
    urbanPercent: number | null;
    medianAge: number | null;
  };
  economy: {
    igr: number | null;
    stateGdp: number | null;
    stateGdpPerCapita: number | null;
    povertyRate: number | null;
    unemploymentRate: number | null;
    underemploymentRate: number | null;
    /** Two-page lens into which the design's economy cards point. */
    topIndustries: string[];
  };
  social: {
    literacyRate: number | null;
    infantMortality: number | null;
    primaryEnrollment: number | null;
    secondaryEnrollment: number | null;
  };
  governance: {
    governor: { name: string; party: string; imageUrl: string | null; role: string } | null;
    deputyGovernor: {
      name: string;
      party: string;
      imageUrl: string | null;
      role: string;
    } | null;
    assemblySpeaker: { name: string; party: string } | null;
    senators: { name: string; party: string; role: string }[];
    houseSeats: number | null;
    housePartySplit: string | null;
    stateAssemblySeats: number | null;
  };
  notes: WikiNote[];
  metrics: InsightMetric[];
};

type Row = Record<string, unknown>;

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function num(value: unknown): number | null {
  if (value === "—" || value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "—" ? null : trimmed;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => text(v)).filter((v): v is string => v !== null);
  }
  const joined = text(value);
  if (!joined) return [];
  return joined
    .split(/[,;/\u00b7|]|\band\b/i)
    .map((v) => v.trim())
    .filter(Boolean);
}

function rankOf(values: Record<string, number>, key: string, direction: "higher" | "lower") {
  const entries = Object.entries(values).filter(([, v]) => Number.isFinite(v));
  const sorted = entries
    .slice()
    .sort((a, b) => (direction === "higher" ? b[1] - a[1] : a[1] - b[1]));
  const place = sorted.findIndex(([k]) => k === key);
  return place === -1 ? null : { rank: place + 1, of: sorted.length };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n);
}

function fmtNaira(n: number): string {
  if (n >= 1_000_000_000_000) return `₦${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  return `₦${fmtInt(n)}`;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return fmtInt(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function pctDelta(value: number, mid: number, direction: "higher" | "lower"): string {
  if (!Number.isFinite(mid) || mid === 0) return `${delta(value, mid)} vs median`;
  const pct = ((value - mid) / Math.abs(mid)) * 100;
  const sign = pct >= 0 ? "+" : "−";
  return `${sign}${Math.abs(pct).toFixed(0)}% vs median`;
}

function delta(value: number, mid: number): string {
  const d = value - mid;
  return `${d >= 0 ? "+" : "−"}${fmtInt(Math.abs(d))}`;
}

/**
 * Builds the insight bundle for one state. Year-specific sheets are walked newest
 * first so a state whose latest row is missing still falls back to its most
 * recent published figure rather than to `null`.
 */
export function loadStateProfileInsights(
  stateId: string,
  root = process.cwd()
): StateProfileInsights | null {
  const general = loadJson<Record<string, Row>>(path.join(root, "data/compare/states/general.json"));
  const geo = loadJson<Record<string, Row>>(path.join(root, "data/compare/states/geography.json"));
  const governance = loadJson<Record<string, Row>>(
    path.join(root, "data/compare/states/governance/2023-2027.json")
  );

  const generalRow = general[stateId];
  if (!generalRow) return null;

  const years = {
    demographics: [2023, 2016, 2006].map((year) => ({
      year,
      rows: loadJson<Record<string, Row>>(
        path.join(root, `data/compare/states/demographics/${year}.json`)
      ),
    })),
    economy: [2024, 2023, 2022].map((year) => ({
      year,
      rows: loadJson<Record<string, Row>>(
        path.join(root, `data/compare/states/economy/${year}.json`)
      ),
    })),
    social: [2023, 2021].map((year) => ({
      year,
      rows: loadJson<Record<string, Row>>(path.join(root, `data/compare/states/social/${year}.json`)),
    })),
  };

  /** First non-empty reading for a key, newest sheet first. */
  const first = (group: keyof typeof years, key: string) => {
    for (const { rows } of years[group]) {
      const value = num(rows[stateId]?.[key]);
      if (value !== null) return value;
    }
    return null;
  };

  const demographicsYear = years.demographics.find(({ rows }) => num(rows[stateId]?.population) !== null);
  const population = first("demographics", "population");
  const populationDensity = first("demographics", "populationDensity");
  const urbanPercent = first("demographics", "urbanPercent");
  const medianAge = first("demographics", "medianAge");

  const igr = first("economy", "igr");
  const stateGdp = first("economy", "stateGdp");
  const stateGdpPerCapita = first("economy", "stateGdpPerCapita");
  const povertyRate = first("economy", "povertyRate") ?? first("economy", "multidimensionalPoverty");
  const unemploymentRate = first("economy", "unemploymentRate");
  const underemploymentRate = first("economy", "underemploymentRate");

  const literacyRate = first("social", "literacyRate");
  const infantMortality = first("social", "infantMortality");
  const primaryEnrollment = first("social", "primaryEnrollment");
  const secondaryEnrollment = first("social", "secondaryEnrollment");

  const geoRow = geo[stateId] ?? {};
  const govRow = governance[stateId] ?? {};
  const notesMap = loadJson<Record<string, WikiNote[]>>(path.join(root, "data/content/state-notes.json"));

  const office = (value: unknown) => {
    if (!value || typeof value !== "object") return null;
    const o = value as Row;
    const name = text(o.name);
    if (!name) return null;
    return {
      name,
      party: text(o.party) ?? "—",
      imageUrl: text(o.imageUrl),
      role: text(o.role) ?? "Office holder",
    };
  };

  /* National ranking context for every indicator this state actually has. */
  const all = (rows: Record<string, Row>, key: string): Record<string, number> =>
    Object.fromEntries(
      Object.entries(rows)
        .map(([id, row]) => [id, num(row?.[key])] as const)
        .filter((entry): entry is [string, number] => entry[1] !== null)
    );

  const ranked: Array<{
    key: string;
    label: string;
    note: string;
    value: number;
    format: (n: number) => string;
    direction: "higher" | "lower";
    rows: Record<string, Row>;
  }> = [
    {
      key: "population",
      label: "Total population",
      note: demographicsYear ? `NPC / NBS projection ${demographicsYear.year}` : "NPC / NBS projection",
      value: population ?? -1,
      format: fmtCompact,
      direction: "higher",
      rows: years.demographics[0].rows,
    },
    {
      key: "igr",
      label: "Internally generated revenue",
      note: "State internal revenue service, 2024",
      value: igr ?? -1,
      format: fmtNaira,
      direction: "higher",
      rows: years.economy[0].rows,
    },
    {
      key: "populationDensity",
      label: "Population density",
      note: "People per km²",
      value: populationDensity ?? -1,
      format: (n) => `${fmtInt(n)}/km²`,
      direction: "higher",
      rows: years.demographics[0].rows,
    },
    {
      key: "literacyRate",
      label: "Adult literacy rate",
      note: "UNESCO / NBS standard",
      value: literacyRate ?? -1,
      format: fmtPct,
      direction: "higher",
      rows: years.social[1].rows,
    },
    {
      key: "povertyRate",
      label: "Poverty headcount",
      note: "Multidimensional poverty index",
      value: povertyRate ?? -1,
      format: fmtPct,
      direction: "lower",
      rows: years.economy[0].rows,
    },
    {
      key: "infantMortality",
      label: "Infant mortality",
      note: "Deaths per 1,000 live births",
      value: infantMortality ?? -1,
      format: (n) => `${fmtInt(n)} / 1,000`,
      direction: "lower",
      rows: years.social[0].rows,
    },
    {
      key: "stateGdp",
      label: "State GDP",
      note: "Nominal, most recent published year",
      value: stateGdp ?? -1,
      format: fmtNaira,
      direction: "higher",
      rows: years.economy[0].rows,
    },
    {
      key: "secondaryEnrollment",
      label: "Secondary enrolment",
      note: "Secondary school enrolment rate",
      value: secondaryEnrollment ?? -1,
      format: fmtPct,
      direction: "higher",
      rows: years.social[1].rows,
    },
  ];

  const metrics: InsightMetric[] = [];
  for (const entry of ranked) {
    if (!Number.isFinite(entry.value) || entry.value < 0) continue;
    const column = all(entry.rows, entry.key);
    const place = rankOf(column, stateId, entry.direction);
    const mid = median(Object.values(column));
    metrics.push({
      key: entry.key,
      label: entry.label,
      note: entry.note,
      value: entry.format(entry.value),
      rank: place?.rank,
      rankOf: place?.of,
      direction: entry.direction,
      vsMedian:
        mid === null
          ? undefined
          : entry.format === fmtPct
            ? pctDelta(entry.value, mid, entry.direction)
            : `${delta(entry.value, mid)} vs median`,
    });
  }

  return {
    general: {
      capital: text(generalRow.capital),
      nickname: text(generalRow.nickname),
      yearCreated: text(generalRow.yearCreated),
      languages: list(generalRow.languages),
      majorCities: list(generalRow.majorCities),
      landAreaKm2: num(generalRow.landAreaKm2),
    },
    geography: {
      borderingStates: list(geoRow.borderingStates),
      hasCoastline: (text(geoRow.hasCoastline) ?? "No").toLowerCase() === "yes",
      hasIntlBorder: (text(geoRow.hasIntlBorder) ?? "No").toLowerCase() === "yes",
      largestLga: text(geoRow.largestLga),
      smallestLga: text(geoRow.smallestLga),
      distanceToAbujaKm: num(geoRow.distanceToAbujaKm),
      nationalPopRank: num(geoRow.nationalPopRank),
    },
    demographics: {
      population,
      populationYear: demographicsYear?.year ?? null,
      populationDensity,
      urbanPercent,
      medianAge,
    },
    economy: {
      igr,
      stateGdp,
      stateGdpPerCapita,
      povertyRate,
      unemploymentRate,
      underemploymentRate,
      topIndustries: [],
    },
    social: { literacyRate, infantMortality, primaryEnrollment, secondaryEnrollment },
    governance: {
      governor: office(govRow.governor),
      deputyGovernor: office(govRow.deputyGovernor),
      assemblySpeaker: (() => {
        const speaker = govRow.assemblySpeaker;
        const parsed = office(speaker);
        return parsed ? { name: parsed.name, party: parsed.party } : null;
      })(),
      senators: Array.isArray(govRow.senators)
        ? govRow.senators
            .map((s) => {
              const parsed = office(s);
              return parsed ? { name: parsed.name, party: parsed.party, role: parsed.role } : null;
            })
            .filter((s): s is { name: string; party: string; role: string } => s !== null)
        : [],
      houseSeats: num(govRow.houseSeats),
      housePartySplit: text(govRow.housePartySplit),
      stateAssemblySeats: num(govRow.stateAssemblySeats),
    },
    notes: notesMap[stateId] ?? [],
    metrics,
  };
}