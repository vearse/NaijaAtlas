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
export function randomSpeculationShares(parties: string[]): SpeculationShares {
  if (parties.length === 0) return {};

  const weights = parties.map(() => 0.15 + Math.random());
  const weightSum = weights.reduce((total, value) => total + value, 0);
  const targetSum = round1(62 + Math.random() * 33);

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
    shares: randomSpeculationShares(input.parties),
  };
}

export function buildRandomStateInputsForAll(input: {
  stateIds: string[];
  parties: string[];
  resultsByYear: PresidentialResultsByYear;
  registeredVotersByYear: RegisteredVotersByYear;
  registeredYear: number;
}): SpeculationStateInput[] {
  return input.stateIds
    .map((stateId) => buildRandomStateInput({ ...input, stateId }))
    .filter((row): row is SpeculationStateInput => row != null);
}
