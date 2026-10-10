import type {
  PresidentialResultsBundle,
  PresidentialStateResult,
} from "@/types/politics";

export type HistoricalStateGroup = {
  /** `stateId` as it appears in the result bundle. */
  resultStateId: string;
  name: string;
  /** Modern (post-1996) states the old state's territory now covers. */
  memberIds: string[];
  note: string;
};

type GroupDef = Omit<HistoricalStateGroup, "resultStateId">;

/** Pre-1976 IDs that have no modern polygon; valid for any year they appear. */
const HISTORICAL_IDS: Record<string, GroupDef> = {
  "NG-HIST-GONGOLA": {
    name: "Gongola",
    memberIds: ["NG-AD", "NG-TA"],
    note: "Gongola State (1976–1991) was split into Adamawa and Taraba in 1991.",
  },
  "NG-HIST-BENDEL": {
    name: "Bendel",
    memberIds: ["NG-ED", "NG-DE"],
    note: "Bendel State (1976–1991) was split into Edo and Delta in 1991.",
  },
};

/**
 * 19-state federation (1976–1987). A modern ID here stands for the larger old
 * state. Where a later state was carved from two parents (Ebonyi, Kogi), it is
 * assigned to the parent that contributed most of its territory.
 */
const NINETEEN_STATES: Record<string, GroupDef> = {
  "NG-AN": {
    name: "Anambra",
    memberIds: ["NG-AN", "NG-EN", "NG-EB"],
    note: "Old Anambra State covered today's Anambra, Enugu and most of Ebonyi.",
  },
  "NG-BA": {
    name: "Bauchi",
    memberIds: ["NG-BA", "NG-GO"],
    note: "Old Bauchi State covered today's Bauchi and Gombe (created 1996).",
  },
  "NG-BE": {
    name: "Benue",
    memberIds: ["NG-BE", "NG-KO"],
    note: "Old Benue State covered today's Benue and the eastern (Igala) part of Kogi.",
  },
  "NG-BO": {
    name: "Borno",
    memberIds: ["NG-BO", "NG-YO"],
    note: "Old Borno State covered today's Borno and Yobe (created 1991).",
  },
  "NG-CR": {
    name: "Cross River",
    memberIds: ["NG-CR", "NG-AK"],
    note: "Old Cross River State covered today's Cross River and Akwa Ibom (created 1987).",
  },
  "NG-IM": {
    name: "Imo",
    memberIds: ["NG-IM", "NG-AB"],
    note: "Old Imo State covered today's Imo and Abia (created 1991).",
  },
  "NG-KD": {
    name: "Kaduna",
    memberIds: ["NG-KD", "NG-KT"],
    note: "Old Kaduna State covered today's Kaduna and Katsina (created 1987).",
  },
  "NG-KN": {
    name: "Kano",
    memberIds: ["NG-KN", "NG-JI"],
    note: "Old Kano State covered today's Kano and Jigawa (created 1991).",
  },
  "NG-ON": {
    name: "Ondo",
    memberIds: ["NG-ON", "NG-EK"],
    note: "Old Ondo State covered today's Ondo and Ekiti (created 1996).",
  },
  "NG-OY": {
    name: "Oyo",
    memberIds: ["NG-OY", "NG-OS"],
    note: "Old Oyo State covered today's Oyo and Osun (created 1991).",
  },
  "NG-PL": {
    name: "Plateau",
    memberIds: ["NG-PL", "NG-NA"],
    note: "Old Plateau State covered today's Plateau and Nasarawa (created 1996).",
  },
  "NG-RI": {
    name: "Rivers",
    memberIds: ["NG-RI", "NG-BY"],
    note: "Old Rivers State covered today's Rivers and Bayelsa (created 1996).",
  },
  "NG-SO": {
    name: "Sokoto",
    memberIds: ["NG-SO", "NG-KE", "NG-ZA"],
    note: "Old Sokoto State covered today's Sokoto, Kebbi (1991) and Zamfara (1996).",
  },
};

/** 30-state federation (1991–1996): only the 1996 splits are still pending. */
const THIRTY_STATES: Record<string, GroupDef> = {
  "NG-BA": {
    name: "Bauchi",
    memberIds: ["NG-BA", "NG-GO"],
    note: "Bauchi then still included Gombe (created 1996).",
  },
  "NG-EN": {
    name: "Enugu",
    memberIds: ["NG-EN", "NG-EB"],
    note: "Enugu then still included most of Ebonyi (created 1996).",
  },
  "NG-ON": {
    name: "Ondo",
    memberIds: ["NG-ON", "NG-EK"],
    note: "Ondo then still included Ekiti (created 1996).",
  },
  "NG-PL": {
    name: "Plateau",
    memberIds: ["NG-PL", "NG-NA"],
    note: "Plateau then still included Nasarawa (created 1996).",
  },
  "NG-RI": {
    name: "Rivers",
    memberIds: ["NG-RI", "NG-BY"],
    note: "Rivers then still included Bayelsa (created 1996).",
  },
  "NG-SO": {
    name: "Sokoto",
    memberIds: ["NG-SO", "NG-ZA"],
    note: "Sokoto then still included Zamfara (created 1996).",
  },
};

function eraGroups(year: number): Record<string, GroupDef> {
  if (year < 1987) return NINETEEN_STATES;
  if (year < 1996) return THIRTY_STATES;
  return {};
}

/** Historical grouping for one result row, or null for a modern 1:1 state. */
export function historicalGroupFor(
  year: number,
  resultStateId: string
): HistoricalStateGroup | null {
  const def =
    HISTORICAL_IDS[resultStateId] ?? eraGroups(year)[resultStateId];
  return def ? { resultStateId, ...def } : null;
}

/** Modern state polygons a result row should paint and select. */
export function memberIdsFor(year: number, resultStateId: string): string[] {
  return historicalGroupFor(year, resultStateId)?.memberIds ?? [resultStateId];
}

/** Find the result row covering a modern state (direct match or via old state). */
export function resolveResultForState(
  results: PresidentialResultsBundle,
  modernStateId: string
): { row: PresidentialStateResult; group: HistoricalStateGroup | null } | null {
  const year = results.election.year;
  for (const row of results.states) {
    if (memberIdsFor(year, row.stateId).includes(modernStateId)) {
      return { row, group: historicalGroupFor(year, row.stateId) };
    }
  }
  return null;
}
