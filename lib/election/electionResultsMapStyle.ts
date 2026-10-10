import {
  formatShare,
  formatVotes,
  stateWinnerParty,
} from "@/lib/election/zoneAggregate";
import {
  historicalGroupFor,
  memberIdsFor,
} from "@/lib/election/historicalStates";
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

  const year = results.election.year;
  for (const row of results.states) {
    const party = stateWinnerParty(row);
    const fill = colorByParty[party] ?? "#94a3b8";
    const votes = row.votes[party];
    const line = row.percentOnly ? formatShare(votes) : formatVotes(votes);
    const group = historicalGroupFor(year, row.stateId);
    for (const id of memberIdsFor(year, row.stateId)) {
      winnerPartyByStateId[id] = party;
      fillByStateId[id] = fill;
      labelLineByStateId[id] = group ? `${line} · ${group.name}` : line;
    }
  }

  return { fillByStateId, labelLineByStateId, winnerPartyByStateId };
}
