const KNOWN_PARTY_COLORS: Record<string, string> = {
  APC: "#126638",
  PDP: "#C1272D",
  LP: "#2E5DAC",
  NNPP: "#D97706",
  APGA: "#0E7490",
  AAC: "#DC2626",
  APM: "#2563EB",
  NDC: "#2E5DAC",
  ADC: "#7C3AED",
  SDP: "#BE123C",
  YPP: "#0F766E",
};

const FALLBACK_PARTY_COLORS = [
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#65A30D",
  "#EA580C",
  "#0D9488",
  "#4F46E5",
  "#B91C1C",
  "#A16207",
  "#475569",
];

export const OTHERS_PARTY = "others";
export const OTHERS_LABEL = "Others";
export const OTHERS_COLOR = "#94A3B8";
export const UNSET_FILL = "#F1F5F9";
export const SELECTED_OUTLINE = "#008751";
export const TOTAL_STATES = 37;
/** @deprecated Use MAX_SPECULATION_PARTIES */
export const REQUIRED_PARTIES = 6;
export const MIN_SPECULATION_PARTIES = 3;
export const MAX_SPECULATION_PARTIES = 6;
export const LOCKED_SPECULATION_PARTIES = ["APC", "NDC", "ADC"] as const;

/** Default 2027 tickets for the presidential speculation workspace. */
export const DEFAULT_SPECULATION_PARTIES = [
  "AAC",
  "ADC",
  "APC",
  "APM",
  "NDC",
  "PDP",
] as const;

/**
 * Older presidential results may use a different party key than the 2027 ticket.
 * NDC (Obi) should inherit Labour Party totals from 2023.
 */
export const HISTORICAL_VOTE_ALIASES: Record<string, readonly string[]> = {
  NDC: ["LP"],
};

export function historicalResultKeysForParties(parties: string[]): Set<string> {
  const keys = new Set<string>([OTHERS_PARTY, ...parties]);
  for (const party of parties) {
    for (const alias of HISTORICAL_VOTE_ALIASES[party] ?? []) {
      keys.add(alias);
    }
  }
  return keys;
}

export function historicalVotesForParty(
  votes: Record<string, number>,
  party: string
): number {
  let total = votes[party] ?? 0;
  for (const alias of HISTORICAL_VOTE_ALIASES[party] ?? []) {
    total += votes[alias] ?? 0;
  }
  return total;
}

export function colorForParty(party: string): string {
  if (party === OTHERS_PARTY) return OTHERS_COLOR;
  const known = KNOWN_PARTY_COLORS[party];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < party.length; i += 1) {
    hash = (hash * 31 + party.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PARTY_COLORS[hash % FALLBACK_PARTY_COLORS.length];
}

export function partyLabel(party: string): string {
  return party === OTHERS_PARTY ? OTHERS_LABEL : party;
}
