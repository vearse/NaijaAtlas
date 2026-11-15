import type {
  ParliamentaryParty,
  PresidentialResultsBundle,
  PresidentialStateResult,
} from "@/types/politics";
import {
  DEFAULT_SPECULATION_PARTIES,
  historicalResultKeysForParties,
  historicalVotesForParty,
  OTHERS_PARTY,
  MAX_SPECULATION_PARTIES,
  REQUIRED_PARTIES,
} from "./constants";
import type {
  NationalAggregate,
  PresidentialResultsByYear,
  RegisteredVotersByYear,
  SpeculationScenario,
  SpeculationShares,
  SpeculationStateInput,
  StateOutcome,
} from "./types";

const EPSILON = 1e-6;

export function round1(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sumShares(shares: SpeculationShares): number {
  return Object.values(shares).reduce(
    (total, value) => total + (Number.isFinite(value) ? value : 0),
    0
  );
}

export interface ShareValidation {
  ok: boolean;
  sum: number;
  others: number;
  error: string | null;
}

export function validateShares(shares: SpeculationShares): ShareValidation {
  const values = Object.values(shares);
  if (values.some((value) => !Number.isFinite(value))) {
    return {
      ok: false,
      sum: 0,
      others: 0,
      error: "Shares must be numbers between 0 and 100.",
    };
  }
  if (values.some((value) => value < 0 || value > 100)) {
    return {
      ok: false,
      sum: sumShares(shares),
      others: 0,
      error: "Each party share must be between 0 and 100.",
    };
  }
  const sum = sumShares(shares);
  if (sum > 100 + EPSILON) {
    return {
      ok: false,
      sum: round1(sum),
      others: 0,
      error: `Party shares add up to ${round1(sum)}%. Reduce them to 100% or less.`,
    };
  }
  return {
    ok: true,
    sum: round1(sum),
    others: round1(Math.max(0, 100 - sum)),
    error: null,
  };
}

/**
 * Turnout default = mean of the state's turnout in the two most recent
 * presidential elections that have BOTH a state result and an official
 * registered-voter figure. Results are valid votes (not votes cast).
 */
export function computeDefaultTurnout(
  stateId: string,
  resultsByYear: PresidentialResultsByYear,
  registeredByYear: RegisteredVotersByYear
): number | null {
  const years = Object.keys(resultsByYear)
    .map(Number)
    .filter((year) => {
      const row = resultsByYear[year]?.states.find((s) => s.stateId === stateId);
      const registered = registeredByYear[year]?.states[stateId];
      return Boolean(row && !row.percentOnly && registered && registered > 0);
    })
    .sort((a, b) => b - a)
    .slice(0, 2);

  if (years.length === 0) return null;

  const turnouts = years.map((year) => {
    const row = resultsByYear[year].states.find((s) => s.stateId === stateId)!;
    const registered = registeredByYear[year].states[stateId];
    return (row.validVotes / registered) * 100;
  });
  const average =
    turnouts.reduce((total, value) => total + value, 0) / turnouts.length;
  return round1(clamp(average, 1, 100));
}

function partyVoteKeys(parties: string[]): string[] {
  return [...parties, OTHERS_PARTY];
}

function emptyVoteRecord(parties: string[]): Record<string, number> {
  return Object.fromEntries(partyVoteKeys(parties).map((p) => [p, 0]));
}

function actualWinner(row: PresidentialStateResult | undefined): string {
  if (!row) return OTHERS_PARTY;
  let winner = OTHERS_PARTY;
  let max = -1;
  for (const [party, votes] of Object.entries(row.votes)) {
    if (party === OTHERS_PARTY) continue;
    if (votes > max) {
      max = votes;
      winner = party;
    }
  }
  return winner;
}

/**
 * Winner of a 2023 state result once votes for parties outside the selected
 * five are rolled into Others, matching the national projection.
 */
export function unsetFallbackWinner(
  row: PresidentialStateResult,
  parties: string[]
): string {
  const votes = emptyVoteRecord(parties);
  for (const party of parties) {
    votes[party] = historicalVotesForParty(row.votes, party);
  }
  votes[OTHERS_PARTY] = row.votes[OTHERS_PARTY] ?? 0;
  const consumed = historicalResultKeysForParties(parties);
  for (const [party, count] of Object.entries(row.votes)) {
    if (consumed.has(party)) continue;
    votes[OTHERS_PARTY] += count;
  }
  let winner = OTHERS_PARTY;
  let max = votes[OTHERS_PARTY] ?? -1;
  for (const party of parties) {
    if ((votes[party] ?? 0) > max) {
      max = votes[party];
      winner = party;
    }
  }
  return winner;
}

export function computeStateOutcome(input: {
  stateId: string;
  registeredVoters: number;
  turnout: number;
  shares: SpeculationShares;
  parties: string[];
  actual2023?: PresidentialStateResult;
}): StateOutcome {
  const { stateId, parties, actual2023 } = input;
  const registeredVoters = Math.max(0, input.registeredVoters);
  const turnout = clamp(input.turnout, 0, 100);
  const totalVotes = Math.round((registeredVoters * turnout) / 100);
  const validation = validateShares(input.shares);
  const shares = input.shares;

  const votesByParty = emptyVoteRecord(parties);
  for (const party of parties) {
    const share = Math.max(0, shares[party] ?? 0);
    votesByParty[party] = Math.round((totalVotes * share) / 100);
  }
  votesByParty[OTHERS_PARTY] = Math.round(
    (totalVotes * validation.others) / 100
  );

  const sharesByParty: Record<string, number> = {};
  for (const key of partyVoteKeys(parties)) {
    sharesByParty[key] =
      totalVotes > 0 ? round1((votesByParty[key] / totalVotes) * 100) : 0;
  }

  const ranked = parties
    .map((party) => ({ party, votes: votesByParty[party] ?? 0 }))
    .sort((a, b) => b.votes - a.votes);
  const top = ranked[0] ?? { party: parties[0] ?? OTHERS_PARTY, votes: 0 };
  const second = ranked[1] ?? null;
  const topVotes = top.votes;
  const secondVotes = second?.votes ?? 0;

  const tieParties = ranked
    .filter((row) => row.votes === topVotes)
    .map((row) => row.party);
  const tie = tieParties.length > 1;

  let tieBreakWinner: string | null = null;
  let winner = top.party;
  if (tie) {
    let bestVotes = -1;
    for (const party of tieParties) {
      const votes = actual2023
        ? historicalVotesForParty(actual2023.votes, party)
        : 0;
      if (votes > bestVotes) {
        bestVotes = votes;
        tieBreakWinner = party;
      }
    }
    if (tieBreakWinner) winner = tieBreakWinner;
  }

  return {
    stateId,
    registeredVoters,
    turnout,
    totalVotes,
    sharesByParty,
    votesByParty,
    winner,
    runnerUp: second?.party ?? null,
    winnerShare: sharesByParty[winner] ?? 0,
    runnerUpShare: second
      ? totalVotes > 0
        ? round1((secondVotes / totalVotes) * 100)
        : 0
      : 0,
    marginPoints:
      second && totalVotes > 0
        ? round1(((topVotes - secondVotes) / totalVotes) * 100)
        : 0,
    tie,
    tieParties,
    tieBreakWinner,
  };
}

export function prefillSharesFrom2023(
  row: PresidentialStateResult | undefined,
  parties: string[]
): SpeculationShares {
  if (!row || row.validVotes <= 0) {
    return Object.fromEntries(parties.map((party) => [party, 0]));
  }
  const shares: SpeculationShares = {};
  for (const party of parties) {
    shares[party] = round1(
      clamp(
        (historicalVotesForParty(row.votes, party) / row.validVotes) * 100,
        0,
        100
      )
    );
  }
  let excess = round1(sumShares(shares) - 100);
  while (excess > 0) {
    const largest = parties.reduce(
      (best, party) => (shares[party] > shares[best] ? party : best),
      parties[0]
    );
    if (!largest || shares[largest] <= 0) break;
    shares[largest] = round1(shares[largest] - 0.1);
    excess = round1(excess - 0.1);
  }
  return shares;
}

export function defaultPartiesFor2023(
  results2023: PresidentialResultsBundle | null | undefined,
  directory: ParliamentaryParty[]
): string[] {
  const preferred = [...DEFAULT_SPECULATION_PARTIES];
  const directoryAbbrev = new Set(directory.map((p) => p.abbreviation));
  if (preferred.every((party) => directoryAbbrev.has(party))) {
    return preferred;
  }
  const selected: string[] = [];
  if (results2023) {
    const ranked = [...results2023.candidates].sort(
      (a, b) =>
        (results2023.national.byParty[b.party] ?? 0) -
        (results2023.national.byParty[a.party] ?? 0)
    );
    for (const candidate of ranked) {
      if (!selected.includes(candidate.party)) selected.push(candidate.party);
      if (selected.length === REQUIRED_PARTIES) break;
    }
  }
  for (const party of directory) {
    if (selected.length === REQUIRED_PARTIES) break;
    if (!selected.includes(party.abbreviation)) {
      selected.push(party.abbreviation);
    }
  }
  return selected.slice(0, REQUIRED_PARTIES);
}

function emptyStatesWon(parties: string[]): Record<string, string[]> {
  return Object.fromEntries(parties.map((party) => [party, []]));
}

export function aggregateNational(input: {
  scenario: SpeculationScenario;
  results2023: PresidentialResultsBundle;
  resultsByYear?: PresidentialResultsByYear;
  registeredVotersByYear: RegisteredVotersByYear;
  use2023ForUnset: boolean;
}): NationalAggregate {
  const {
    scenario,
    results2023,
    resultsByYear = { [results2023.election.year]: results2023 },
    registeredVotersByYear,
    use2023ForUnset,
  } = input;
  const parties = scenario.parties;
  const votesByParty = emptyVoteRecord(parties);
  const statesWonByParty = emptyStatesWon(parties);
  const outcomes: Record<string, StateOutcome> = {};
  const tieStateIds: string[] = [];
  const setStateIds: string[] = [];
  const unsetStateIds: string[] = [];
  let totalVotes = 0;

  const registered = Object.values(registeredVotersByYear).sort(
    (a, b) => b.election.year - a.election.year
  )[0];
  const registeredStates = registered?.states ?? {};

  for (const row of results2023.states) {
    const stateInput = scenario.states[row.stateId];
    if (stateInput) {
      const registeredVoters = registeredStates[row.stateId] ?? 0;
      if (registeredVoters <= 0) continue;
      setStateIds.push(row.stateId);
      const outcome = computeStateOutcome({
        stateId: row.stateId,
        registeredVoters,
        turnout: stateInput.turnout,
        shares: stateInput.shares,
        parties,
        actual2023: row,
      });
      totalVotes += outcome.totalVotes;
      outcomes[row.stateId] = outcome;
      for (const key of partyVoteKeys(parties)) {
        votesByParty[key] += outcome.votesByParty[key] ?? 0;
      }
      statesWonByParty[outcome.winner]?.push(row.stateId);
      if (outcome.tie) tieStateIds.push(row.stateId);
    } else {
      unsetStateIds.push(row.stateId);
      if (!use2023ForUnset) continue;
      const registeredVoters = registeredStates[row.stateId] ?? 0;
      if (registeredVoters <= 0) continue;
      const fallbackTurnout =
        computeDefaultTurnout(
          row.stateId,
          resultsByYear,
          registeredVotersByYear
        ) ??
        round1(clamp((row.validVotes / registeredVoters) * 100, 1, 100));
      const outcome = computeStateOutcome({
        stateId: row.stateId,
        registeredVoters,
        turnout: fallbackTurnout,
        shares: prefillSharesFrom2023(row, parties),
        parties,
        actual2023: row,
      });
      totalVotes += outcome.totalVotes;
      outcomes[row.stateId] = outcome;
      for (const key of partyVoteKeys(parties)) {
        votesByParty[key] += outcome.votesByParty[key] ?? 0;
      }
      statesWonByParty[outcome.winner]?.push(row.stateId);
      if (outcome.tie) tieStateIds.push(row.stateId);
    }
  }

  const shareByParty = Object.fromEntries(
    partyVoteKeys(parties).map((party) => [
      party,
      totalVotes > 0 ? round1((votesByParty[party] / totalVotes) * 100) : 0,
    ])
  );

  const rankedParties = parties
    .map((party) => ({ party, votes: votesByParty[party] ?? 0 }))
    .sort((a, b) => b.votes - a.votes);
  const leader =
    totalVotes > 0 && rankedParties[0]
      ? {
          party: rankedParties[0].party,
          share: shareByParty[rankedParties[0].party] ?? 0,
          marginPoints: round1(
            (shareByParty[rankedParties[0].party] ?? 0) -
              (shareByParty[rankedParties[1]?.party ?? rankedParties[0].party] ??
                0)
          ),
        }
      : null;

  const actualVotesByParty = emptyVoteRecord(parties);
  const actualTotal =
    results2023.national.validVotes ||
    results2023.states.reduce((total, row) => total + row.validVotes, 0);
  const actualNational = results2023.national.byParty;
  for (const [party, votes] of Object.entries(actualNational)) {
    if (party !== OTHERS_PARTY && parties.includes(party)) {
      actualVotesByParty[party] += votes;
    } else {
      actualVotesByParty[OTHERS_PARTY] += votes;
    }
  }
  const actualStatesWon = emptyStatesWon(parties);
  for (const row of results2023.states) {
    const winner = actualWinner(row);
    if (actualStatesWon[winner]) actualStatesWon[winner].push(row.stateId);
  }
  const actualShareByParty = Object.fromEntries(
    partyVoteKeys(parties).map((party) => [
      party,
      actualTotal > 0
        ? round1((actualVotesByParty[party] / actualTotal) * 100)
        : 0,
    ])
  );

  return {
    parties,
    votesByParty,
    shareByParty,
    totalVotes,
    statesWonByParty,
    outcomes,
    tieStateIds,
    setStateIds,
    unsetStateIds,
    leader,
    actual: {
      votesByParty: actualVotesByParty,
      shareByParty: actualShareByParty,
      totalVotes: actualTotal,
      statesWonByParty: actualStatesWon,
    },
  };
}

export function stateInputFromScenario(
  scenario: SpeculationScenario,
  stateId: string
): SpeculationStateInput | null {
  return scenario.states[stateId] ?? null;
}

export function registeredVotersForState(
  stateId: string,
  registeredVotersByYear: RegisteredVotersByYear,
  preferredYear?: number
): number | null {
  if (preferredYear != null) {
    const preferred = registeredVotersByYear[preferredYear]?.states[stateId];
    if (preferred) return preferred;
  }
  const years = Object.keys(registeredVotersByYear)
    .map(Number)
    .sort((a, b) => b - a);
  for (const year of years) {
    const value = registeredVotersByYear[year]?.states[stateId];
    if (value) return value;
  }
  return null;
}

export { actualWinner as actualStateWinner };
