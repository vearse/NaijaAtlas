import type { PresidentialResultsBundle } from "@/types/politics";
import { electionHasStateVoteCounts } from "@/lib/election/zoneAggregate";

export function electionHasStateBreakdown(
  results: PresidentialResultsBundle
): boolean {
  return results.states.length > 0;
}

export function electionBreakdownUnavailableMessage(
  results: PresidentialResultsBundle
): string | null {
  const year = results.election.year;
  if (!electionHasStateBreakdown(results)) {
    return `INEC did not publish state-by-state presidential figures for ${year}. Only the national totals below are shown — zone and map breakdowns are not available for this election.`;
  }
  if (!electionHasStateVoteCounts(results)) {
    return `For ${year}, only percentage shares by state are available (not raw vote counts), so zone totals cannot be summed. Use the state-by-state table for shares; the zone view is hidden.`;
  }
  return null;
}
