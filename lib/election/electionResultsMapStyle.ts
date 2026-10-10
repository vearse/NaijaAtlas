import {
  formatVotes,
  stateWinnerParty,
} from "@/lib/election/zoneAggregate";
import type { PresidentialResultsBundle } from "@/types/politics";

export type ElectionResultsMapStyle = {
  fillByStateId: Record<string, string>;
  /** Second line on state labels — winner vote total */
  labelLineByStateId: Record<string, string>;
  winnerPartyByStateId: Record<string, string>;
};

export function buildElectionResultsMapStyle(
  results: PresidentialResultsBundle
): ElectionResultsMapStyle {
  const colorByParty = Object.fromEntries(
    results.candidates.map((c) => [c.party, c.color])
  ) as Record<string, string>;

  const fillByStateId: Record<string, string> = {};
  const labelLineByStateId: Record<string, string> = {};
  const winnerPartyByStateId: Record<string, string> = {};

  for (const row of results.states) {
    const party = stateWinnerParty(row);
    winnerPartyByStateId[row.stateId] = party;
    fillByStateId[row.stateId] = colorByParty[party] ?? "#94a3b8";
    const votes = row.votes[party];
    labelLineByStateId[row.stateId] = formatVotes(votes);
  }

  return { fillByStateId, labelLineByStateId, winnerPartyByStateId };
}
