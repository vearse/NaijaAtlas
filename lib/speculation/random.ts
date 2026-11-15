import {
  clamp,
  computeDefaultTurnout,
  round1,
  validateShares,
} from "./calc";
import {
  isLockedSpeculationParty,
  LOCKED_COALITION_SHARE,
  SCENARIO_SHARE_TOTAL,
} from "./constants";
import type {
  PresidentialResultsByYear,
  RegisteredVotersByYear,
  SpeculationShares,
  SpeculationStateInput,
} from "./types";

function sumPartyShares(shares: SpeculationShares): number {
  return Object.values(shares).reduce(
    (total, value) => total + (Number.isFinite(value) ? value : 0),
    0
  );
}

function splitBudget(
  partyIds: string[],
  budget: number,
  random: () => number
): SpeculationShares {
  if (partyIds.length === 0) return {};
  const weights = partyIds.map(() => 0.2 + random());
  const weightSum = weights.reduce((total, value) => total + value, 0);
  const shares: SpeculationShares = {};
  let running = 0;
  for (let index = 0; index < partyIds.length; index += 1) {
    const isLast = index === partyIds.length - 1;
    const value = isLast
      ? round1(clamp(budget - running, 0, 100))
      : round1((weights[index] / weightSum) * budget);
    shares[partyIds[index]] = value;
    running = round1(running + value);
  }
  return shares;
}

/**
 * Realistic split: locked trio ≥65%, selected parties ≥85% (Others shrinks when totals run higher).
 */
export function realisticScenarioShares(
  parties: string[],
  random: () => number = Math.random
): SpeculationShares {
  if (parties.length === 0) return {};

  const scenarioTotal = round1(
    clamp(
      SCENARIO_SHARE_TOTAL + random() * (100 - SCENARIO_SHARE_TOTAL),
      SCENARIO_SHARE_TOTAL,
      99.5
    )
  );
  const locked = parties.filter((party) => isLockedSpeculationParty(party));
  const optional = parties.filter((party) => !isLockedSpeculationParty(party));

  let shares: SpeculationShares = {};

  if (optional.length === 0 || locked.length === 0) {
    shares = splitBudget(parties, scenarioTotal, random);
  } else {
    const minOptionalEach = 1.5;
    const reservedOptional = round1(optional.length * minOptionalEach);
    const lockedCeil = round1(
      clamp(scenarioTotal - reservedOptional, LOCKED_COALITION_SHARE, scenarioTotal)
    );
    const lockedBudget = round1(
      clamp(
        LOCKED_COALITION_SHARE + random() * (lockedCeil - LOCKED_COALITION_SHARE),
        LOCKED_COALITION_SHARE,
        lockedCeil
      )
    );
    const optionalBudget = round1(scenarioTotal - lockedBudget);
    shares = {
      ...splitBudget(locked, lockedBudget, random),
      ...splitBudget(optional, optionalBudget, random),
    };
  }

  const validation = validateShares(shares);
  if (validation.ok) return shares;

  const each = round1(scenarioTotal / parties.length);
  return Object.fromEntries(parties.map((party) => [party, each]));
}

/** @deprecated alias — use realisticScenarioShares */
export function randomSpeculationShares(
  parties: string[],
  random = Math.random
): SpeculationShares {
  return realisticScenarioShares(parties, random);
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
  const base = realisticScenarioShares(parties, random);
  const others = parties.filter((party) => party !== winner);
  if (others.length === 0) return base;

  const targetWinner = round1(
    clamp((base[winner] ?? 30) + 8 + random() * 22, 5, 78)
  );
  const baseTotal = sumPartyShares(base);
  const budget = round1(
    clamp(
      baseTotal + random() * (100 - baseTotal),
      Math.max(baseTotal, SCENARIO_SHARE_TOTAL),
      99.5
    )
  );
  const pool = budget - targetWinner;
  const weights = others.map(() => 0.2 + random());
  const weightSum = weights.reduce((total, value) => total + value, 0);
  const shares: SpeculationShares = { [winner]: targetWinner };
  let running = 0;
  for (let index = 0; index < others.length; index += 1) {
    const isLast = index === others.length - 1;
    const value = isLast
      ? round1(clamp(pool - running, 0, 100 - targetWinner))
      : round1((weights[index] / weightSum) * pool);
    shares[others[index]] = value;
    running = round1(running + value);
  }

  if (validateShares(shares).ok) return shares;
  return realisticScenarioShares(parties, random);
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
    shares: realisticScenarioShares(input.parties, rand),
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
  let next: SpeculationShares = { ...shares, APM: round1(minimum) };
  next = trimExcessFromLargest(next, parties, need);
  return next;
}

/** Soft bias: APM ≥15% in Oyo; APC/NDC/ADC still win often. */
export function softenApmOyoShares(
  parties: string[],
  random: () => number = Math.random
): SpeculationShares {
  if (!parties.includes("APM")) return realisticScenarioShares(parties, random);

  const majors = ["APC", "NDC", "ADC"].filter((party) => parties.includes(party));
  let shares: SpeculationShares;
  if (majors.length > 0 && random() < 0.52) {
    const winner = majors[Math.floor(random() * majors.length)]!;
    shares = randomWinnerShares(parties, winner, random);
  } else {
    shares = randomWinnerShares(parties, "APM", random);
  }

  shares = ensureApmMinimum(shares, parties, APM_OYO_MIN_SHARE);
  const maxTotal = 99.5;
  const over = sumPartyShares(shares) - maxTotal;
  if (over > 0) shares = trimExcessFromLargest(shares, parties, over);

  const validation = validateShares(shares);
  return validation.ok
    ? shares
    : realisticScenarioShares(parties, random);
}