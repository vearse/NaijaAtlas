import type { RegionLocation, StateLocation } from "@/types/location";
import type {
  PresidentialResultCandidate,
  PresidentialResultParty,
  PresidentialResultsBundle,
  ZoneElectionAggregate,
} from "@/types/politics";

/** Every candidate party reported for this election, in ballot order. */
export function candidateParties(
  candidates: PresidentialResultCandidate[]
): string[] {
  return candidates.map((c) => c.party);
}

function emptyVotes(
  candidates: PresidentialResultCandidate[]
): Record<PresidentialResultParty, number> {
  const votes: Record<PresidentialResultParty, number> = { others: 0 };
  for (const c of candidates) votes[c.party] = 0;
  return votes;
}

export function aggregatePresidentialByZone(
  results: PresidentialResultsBundle,
  regions: RegionLocation[],
  states: StateLocation[],
  candidates: PresidentialResultCandidate[]
): ZoneElectionAggregate[] {
  const byStateId = new Map(results.states.map((s) => [s.stateId, s]));
  const nameById = new Map(states.map((s) => [s.id, s.name]));
  const candidateByParty = Object.fromEntries(
    candidates.map((c) => [c.party, c])
  ) as Record<string, PresidentialResultCandidate>;
  const parties = candidateParties(candidates);

  return regions.map((region) => {
    const votes = emptyVotes(candidates);
    let validVotes = 0;
    const stateNames = region.stateIds.map((id) => nameById.get(id) ?? id);

    for (const stateId of region.stateIds) {
      const row = byStateId.get(stateId);
      if (!row) continue;
      validVotes += row.validVotes;
      for (const key of Object.keys(votes)) {
        votes[key] += row.votes[key] ?? 0;
      }
    }

    const topTotals = parties
      .map((party) => ({ party, votes: votes[party] }))
      .sort((a, b) => b.votes - a.votes);
    const leader = topTotals[0]?.party ?? parties[0] ?? "others";
    const leaderMeta = candidateByParty[leader];

    const shares = Object.fromEntries(
      parties.map((p) => [
        p,
        validVotes > 0 ? (votes[p] / validVotes) * 100 : 0,
      ])
    ) as Record<string, number>;

    return {
      regionId: region.id,
      regionName: region.name,
      stateIds: region.stateIds,
      stateNames,
      votes,
      validVotes,
      shares,
      leader,
      leaderName: leaderMeta?.name ?? leader,
      leaderColor: leaderMeta?.color ?? "#126638",
    };
  });
}

/** Highest-polling candidate party in a state; `others` if none reported. */
export function stateWinnerParty(
  row: PresidentialResultsBundle["states"][0]
): string {
  let winner = "others";
  let max = -1;
  for (const [party, votes] of Object.entries(row.votes)) {
    if (party === "others") continue;
    if (votes > max) {
      max = votes;
      winner = party;
    }
  }
  return winner;
}

export function formatVotes(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatShare(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
