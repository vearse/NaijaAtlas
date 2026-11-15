import {
  DEFAULT_SPECULATION_PARTIES,
  LOCKED_SPECULATION_PARTIES,
  MAX_SPECULATION_PARTIES,
  MIN_SPECULATION_PARTIES,
} from "./constants";

export function lineupIncludesLocked(parties: string[]): boolean {
  return LOCKED_SPECULATION_PARTIES.every((party) => parties.includes(party));
}

export function isValidSpeculationLineup(parties: string[]): boolean {
  const unique = [...new Set(parties.filter(Boolean))];
  if (unique.length !== parties.length) return false;
  if (unique.length < MIN_SPECULATION_PARTIES) return false;
  if (unique.length > MAX_SPECULATION_PARTIES) return false;
  return lineupIncludesLocked(unique);
}

export function normalizeSpeculationLineup(parties: string[]): string[] {
  const unique = [...new Set(parties.filter(Boolean))];
  const locked = LOCKED_SPECULATION_PARTIES.filter((party) =>
    unique.includes(party)
  );
  const rest = unique.filter(
    (party) => !LOCKED_SPECULATION_PARTIES.includes(party)
  );
  const merged = [...locked, ...rest];
  return merged.slice(0, MAX_SPECULATION_PARTIES);
}

export function canRemovePartyFromLineup(
  party: string,
  lineup: string[]
): boolean {
  if ((LOCKED_SPECULATION_PARTIES as readonly string[]).includes(party)) {
    return false;
  }
  if (!lineup.includes(party)) return false;
  return lineup.length > MIN_SPECULATION_PARTIES;
}

export function defaultSpeculationLineup(): string[] {
  return [...DEFAULT_SPECULATION_PARTIES];
}

export function isSpeculationLineupActive(parties: string[]): boolean {
  return isValidSpeculationLineup(parties);
}