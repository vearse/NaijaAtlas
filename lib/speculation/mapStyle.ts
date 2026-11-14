import {
  formatShare,
  formatVotes,
} from "@/lib/election/zoneAggregate";
import {
  colorForParty,
  historicalVotesForParty,
  OTHERS_PARTY,
  UNSET_FILL,
} from "./constants";
import { unsetFallbackWinner } from "./calc";
import type {
  NationalAggregate,
  SpeculationScenario,
} from "./types";
import type { PresidentialResultsBundle } from "@/types/politics";

export interface SpeculationTiePair {
  stateId: string;
  partyA: string;
  partyB: string;
}

export interface SpeculationMapStyle {
  fillByStateId: Record<string, string>;
  labelLineByStateId: Record<string, string>;
  detailByStateId: Record<string, string>;
  winnerPartyByStateId: Record<string, string>;
  ties: SpeculationTiePair[];
}

export function buildSpeculationMapStyle(input: {
  aggregate: NationalAggregate;
  scenario: SpeculationScenario;
  latestResults: PresidentialResultsBundle;
  use2023ForUnset: boolean;
  /** When true, only states the user saved are colored (browse/edit modes). */
  savedStatesOnly?: boolean;
}): SpeculationMapStyle {
  const {
    aggregate,
    scenario,
    latestResults,
    use2023ForUnset,
    savedStatesOnly = false,
  } = input;
  const fillByStateId: Record<string, string> = {};
  const labelLineByStateId: Record<string, string> = {};
  const detailByStateId: Record<string, string> = {};
  const winnerPartyByStateId: Record<string, string> = {};
  const ties: SpeculationTiePair[] = [];
  const setStateIds = new Set(Object.keys(scenario.states));

  for (const outcome of Object.values(aggregate.outcomes)) {
    const isSet = setStateIds.has(outcome.stateId);
    if (savedStatesOnly && !isSet) {
      fillByStateId[outcome.stateId] = UNSET_FILL;
      continue;
    }
    fillByStateId[outcome.stateId] = colorForParty(outcome.winner);
    winnerPartyByStateId[outcome.stateId] = outcome.winner;
    const winnerLabel =
      outcome.winner === OTHERS_PARTY ? "Others" : outcome.winner;
    if (outcome.tie && outcome.tieParties.length >= 2) {
      labelLineByStateId[outcome.stateId] =
        `${isSet ? "" : "2023 · "}Tie · ${outcome.tieParties.join("/")}`;
      ties.push({
        stateId: outcome.stateId,
        partyA: outcome.tieParties[0],
        partyB: outcome.tieParties[1],
      });
    } else {
      labelLineByStateId[outcome.stateId] = `${
        isSet ? "" : "2023 · "
      }${winnerLabel} ${formatShare(outcome.winnerShare)}`;
    }
    detailByStateId[outcome.stateId] = isSet
      ? `${winnerLabel} ${formatShare(outcome.winnerShare)} · ${formatVotes(
          outcome.votesByParty[outcome.winner] ?? 0
        )} votes`
      : `2023 base · ${winnerLabel} ${formatShare(
          outcome.winnerShare
        )} · turnout ${formatShare(outcome.turnout)} · ${formatVotes(
          outcome.votesByParty[outcome.winner] ?? 0
        )} projected votes`;
  }

  for (const row of latestResults.states) {
    if (aggregate.outcomes[row.stateId]) continue;
    const isSet = Boolean(scenario.states[row.stateId]);
    if (savedStatesOnly || !use2023ForUnset || isSet) {
      fillByStateId[row.stateId] = UNSET_FILL;
      labelLineByStateId[row.stateId] = isSet ? "No register" : "Not set";
      detailByStateId[row.stateId] = isSet
        ? "No registered-voter figure — this state cannot be projected"
        : "Not set — tap to add this state";
      continue;
    }
    const party = unsetFallbackWinner(row, scenario.parties);
    const votes = historicalVotesForParty(row.votes, party);
    fillByStateId[row.stateId] = colorForParty(party);
    winnerPartyByStateId[row.stateId] = party;
    labelLineByStateId[row.stateId] = `2023 · ${
      party === OTHERS_PARTY ? "Others" : party
    }`;
    detailByStateId[row.stateId] = `2023 result: ${
      party === OTHERS_PARTY ? "Others" : party
    } · ${formatVotes(votes)} votes`;
  }

  return {
    fillByStateId,
    labelLineByStateId,
    detailByStateId,
    winnerPartyByStateId,
    ties,
  };
}
