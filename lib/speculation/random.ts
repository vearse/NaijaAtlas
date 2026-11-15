import {
  clamp,
  computeDefaultTurnout,
  round1,
  validateShares,
} from "./calc";
import type {
  PresidentialResultsByYear,
  RegisteredVotersByYear,
  SpeculationShares,
  SpeculationStateInput,
} from "./types";

/** Valid party shares (≤100%) with a random split among the scenario parties. */
export function randomSpeculationShares(
  parties: string[],
  random = Math.random
): SpeculationShares {
  if (parties.length === 0) return {};

  const weights = parties.map(() => 0.15 + random());
  const weightSum = weights.reduce((total, value) => total + value, 0);
  const targetSum = round1(62 + random() * 33);

  const shares: SpeculationShares = {};
  let running = 0;
  for (let index = 0; index < parties.length; index += 1) {
    const isLast = index === parties.length - 1;
    const value = isLast
      ? round1(clamp(targetSum - running, 0, 100))
      : round1((weights[index] / weightSum) * targetSum);
    shares[parties[index]] = value;
    running = round1(running + value);
  }

  const validation = validateShares(shares);
  if (validation.ok) return shares;

  const fallbackEach = round1(
    Math.min(100 / parties.length, 100 / (parties.length + 1))
  );
  return Object.fromEntries(parties.map((party) => [party, fallbackEach]));
}

export function randomTurnoutAround(
  defaultTurnout: number,
  random = Math.random
): number {
  const jitter = (random() - 0.5) * 30;
  return round1(clamp(defaultTurnout + jitter, 10, 90));
}

export interface RandomSentimentRule {
  party: string;
  region: string;
  min: number;
  max?: number;
}

export const DEFAULT_RANDOM_SENTIMENT: readonly RandomSentimentRule[] = [
  { party: "APC", region: "South West", min: 4 },
  { party: "ADC", region: "North East", min: 3 },
  { party: "NDC", region: "South East", min: 4 },
];

function randomSubset<T>(
  items: readonly T[],
  count: number,
  random: () => number
): T[] {
  const pool = [...items];
  const picked: T[] = [];
  const target = Math.min(count, pool.length);
  for (let index = 0; index < target; index += 1) {
    const pick = Math.floor(random() * pool.length);
    picked.push(pool.splice(pick, 1)[0]);
  }
  return picked;
}

function randomWinnerShares(
  parties: string[],
  winner: string,
  random: () => number
): SpeculationShares {
  const others = parties.filter((party) => party !== winner);
  if (others.length === 0) return randomSpeculationShares(parties, random);

  const winnerShare = round1(50 + random() * 15);
  const otherBudget = round1(
    Math.min(100 - winnerShare, 12 + random() * 23)
  );
  const weights = others.map(() => 0.2 + random());
  const weightSum = weights.reduce((total, value) => total + value, 0);
  const shares: SpeculationShares = { [winner]: winnerShare };

  let running = 0;
  for (let index = 0; index < others.length; index += 1) {
    const isLast = index === others.length - 1;
    const value = isLast
      ? round1(clamp(otherBudget - running, 0, 100 - winnerShare))
      : round1((weights[index] / weightSum) * otherBudget);
    shares[others[index]] = value;
    running = round1(running + value);
  }

  const validation = validateShares(shares);
  const maxOther = Math.max(0, ...others.map((party) => shares[party] ?? 0));
  if (validation.ok && (shares[winner] ?? 0) > maxOther) return shares;

  return Object.fromEntries(
    parties.map((party) => [party, party === winner ? 50 : 0])
  );
}

export function buildRandomStateInput(input: {
  stateId: string;
  parties: string[];
  resultsByYear: PresidentialResultsByYear;
  registeredVotersByYear: RegisteredVotersByYear;
  registeredYear: number;
  random?: () => number;
}): SpeculationStateInput | null {
  const registered =
    input.registeredVotersByYear[input.registeredYear]?.states[input.stateId];
  if (!registered) return null;

  const defaultTurnout =
    computeDefaultTurnout(
      input.stateId,
      input.resultsByYear,
      input.registeredVotersByYear
    ) ?? 32;
  const rand = input.random ?? Math.random;

  return {
    stateId: input.stateId,
    turnout: randomTurnoutAround(defaultTurnout, rand),
    shares: randomSpeculationShares(input.parties, rand),
  };
}

export function buildRandomStateInputsForAll(input: {
  stateIds: string[];
  parties: string[];
  resultsByYear: PresidentialResultsByYear;
  registeredVotersByYear: RegisteredVotersByYear;
  registeredYear: number;
  stateRegions?: Record<string, string>;
  sentimentRules?: readonly RandomSentimentRule[];
  random?: () => number;
}): SpeculationStateInput[] {
  const random = input.random ?? Math.random;
  const byId = new Map<string, SpeculationStateInput>();

  for (const stateId of input.stateIds) {
    const row = buildRandomStateInput({
      stateId,
      parties: input.parties,
      resultsByYear: input.resultsByYear,
      registeredVotersByYear: input.registeredVotersByYear,
      registeredYear: input.registeredYear,
      random,
    });
    if (row) byId.set(stateId, row);
  }

  if (input.stateRegions) {
    const rules = input.sentimentRules ?? DEFAULT_RANDOM_SENTIMENT;
    const applied = new Set<string>();
    for (const rule of rules) {
      if (!input.parties.includes(rule.party)) continue;
      const candidates = input.stateIds.filter(
        (stateId) =>
          input.stateRegions?.[stateId] === rule.region &&
          byId.has(stateId) &&
          !applied.has(stateId)
      );
      if (candidates.length === 0) continue;

      const upper = Math.min(
        candidates.length,
        rule.max ?? candidates.length
      );
      const lower = Math.min(Math.max(0, rule.min), upper);
      const count = lower + Math.floor(random() * (upper - lower + 1));

      for (const stateId of randomSubset(candidates, count, random)) {
        const row = byId.get(stateId);
        if (!row) continue;
        applied.add(stateId);
        byId.set(stateId, {
          ...row,
          shares: randomWinnerShares(input.parties, rule.party, random),
        });
      }
    }
  }

  return input.stateIds
    .map((stateId) => {
      let row = byId.get(stateId);
      if (!row) return null;
      if (stateId === APM_OYO_STATE && input.parties.includes("APM")) {
        row = {
          ...row,
          shares: softenApmOyoShares(input.parties, random),
        };
      }
      return row;
    })
    .filter((row): row is SpeculationStateInput => row != null);
}

const APM_OYO_STATE = "NG-OY";
const APM_OYO_MIN_SHARE = 15;

function trimExcessFromLargest(
  shares: SpeculationShares,
  parties: string[],
  excess: number
): SpeculationShares {
  if (excess <= 0) return shares;
  const next = { ...shares };
  const pool = [...parties].sort(
    (a, b) => (next[b] ?? 0) - (next[a] ?? 0)
  );
  let remaining = round1(excess);
  for (const party of pool) {
    if (party === "APM" && (next.APM ?? 0) <= APM_OYO_MIN_SHARE) continue;
    const take = Math.min(next[party] ?? 0, remaining);
    if (take <= 0) continue;
    next[party] = round1((next[party] ?? 0) - take);
    remaining = round1(remaining - take);
    if (remaining <= 0) break;
  }
  return next;
}

function ensureApmMinimum(
  shares: SpeculationShares,
  parties: string[],
  minimum: number
): SpeculationShares {
  if (!parties.includes("APM")) return shares;
  const current = shares.APM ?? 0;
  if (current >= minimum) return shares;
  const need = round1(minimum - current);
  let next = { ...shares, APM: round1(minimum) };
  next = trimExcessFromLargest(next, parties, need);
  return next;
}

/** Soft bias: APM ≥15% in Oyo; APC/NDC/ADC still win often. */
export function softenApmOyoShares(
  parties: string[],
  random: () => number = Math.random
): SpeculationShares {
  if (!parties.includes("APM")) return randomSpeculationShares(parties, random);

  const majors = ["APC", "NDC", "ADC"].filter((party) => parties.includes(party));
  let shares: SpeculationShares;
  if (majors.length > 0 && random() < 0.52) {
    const winner = majors[Math.floor(random() * majors.length)]!;
    shares = randomWinnerShares(parties, winner, random);
  } else {
    shares = randomWinnerShares(parties, "APM", random);
    if ((shares.APM ?? 0) < APM_OYO_MIN_SHARE) {
      shares = randomWinnerShares(parties, "APM", random);
    }
  }

  shares = ensureApmMinimum(shares, parties, APM_OYO_MIN_SHARE);

  const validation = validateShares(shares);
  if (!validation.ok) return randomSpeculationShares(parties, random);

  const apm = shares.APM ?? 0;
  const highest = Math.max(
    ...parties.map((party) => shares[party] ?? 0)
  );
  if (apm < highest && random() > 0.35) {
    return shares;
  }
  if (apm < highest) {
    shares = {
      ...shares,
      APM: round1(Math.min(100, apm + 2 + random() * 6)),
    };
    shares = trimExcessFromLargest(
      shares,
      parties,
      sumPartyShares(shares) - 100
    );
    shares = ensureApmMinimum(shares, parties, APM_OYO_MIN_SHARE);
  }

  return validateShares(shares).ok
    ? shares
    : randomSpeculationShares(parties, random);
}

function sumPartyShares(shares: SpeculationShares): number {
  return Object.values(shares).reduce(
    (total, value) => total + (Number.isFinite(value) ? value : 0),
    0
  );
}
