import {
  aggregatePresidentialByZone,
  formatShare,
  formatVotes,
} from "@/lib/election/zoneAggregate";
import type { ZoneBoardProps } from "@/components/zones/ZoneBoard";
import type { RegionLocation, StateLocation } from "@/types/location";
import type {
  PresidentialResultCandidate,
  PresidentialResultsBundle,
} from "@/types/politics";

/** Editorial notes exist only for the 2023 result; other years ship clean. */
const ZONE_NOTES_2023: Record<string, string> = {
  "NG-NW": "Tinubu's strongest zone — swept all seven states.",
  "NG-NE": "Atiku's only zone lead among the six.",
  "NG-NC": "Closest three-way northern zone on the map.",
  "NG-SE": "Obi's highest shares — all five states.",
  "NG-SS": "Mixed south-south: Obi led four, Tinubu two.",
  "NG-SW": "Tinubu home zone — won five of six states.",
};

function surname(candidate: PresidentialResultCandidate): string {
  return candidate.name.split(" ").filter(Boolean).pop() ?? candidate.party;
}

export function buildElectionZoneBoard(
  results: PresidentialResultsBundle,
  regions: RegionLocation[],
  states: StateLocation[],
  options?: { compact?: boolean }
): ZoneBoardProps {
  const compact = options?.compact ?? false;
  const zones = aggregatePresidentialByZone(
    results,
    regions,
    states,
    results.candidates
  );
  const candidateByParty = Object.fromEntries(
    results.candidates.map((c) => [c.party, c])
  ) as Record<string, PresidentialResultCandidate>;
  const parties = results.candidates.map((c) => c.party);

  const leaderCounts: Record<string, number> = {};
  for (const z of zones) {
    leaderCounts[z.leader] = (leaderCounts[z.leader] ?? 0) + 1;
  }

  const chips = parties
    .filter((p) => (leaderCounts[p] ?? 0) > 0)
    .map((p) => ({
      label: `${surname(candidateByParty[p]).toUpperCase()} ${
        leaderCounts[p]
      } zone${leaderCounts[p] === 1 ? "" : "s"}`,
      color: candidateByParty[p]?.color ?? "#126638",
    }));

  const winner = results.candidates.find(
    (c) => c.party === results.national.winner
  );

  const zoneNotes =
    results.election.year === 2023 ? ZONE_NOTES_2023 : undefined;

  return {
    kicker: `${results.election.year} PRESIDENTIAL ELECTION`,
    title: "How the six zones voted",
    subtitle: `Plurality in each geopolitical zone · ${results.candidates
      .slice(0, 3)
      .map((c) => surname(c))
      .join(", ")} and others.`,
    summaryChips: compact ? [] : chips,
    zones: zones.map((z) => {
      const rows = parties
        .map((party) => ({
          label: candidateByParty[party] ? surname(candidateByParty[party]) : party,
          sub: party,
          value: z.shares[party] ?? 0,
          display: formatShare(z.shares[party] ?? 0),
          color: candidateByParty[party]?.color ?? "#64748b",
        }))
        .sort((a, b) => b.value - a.value);

      const led = candidateByParty[z.leader]
        ? surname(candidateByParty[z.leader]).toUpperCase()
        : z.leader.toUpperCase();

      return {
        id: z.regionId,
        name: z.regionName,
        members: z.stateNames,
        badge: { label: `LED ${led}`, color: z.leaderColor },
        rows,
        note: zoneNotes?.[z.regionId],
        accent: z.leaderColor,
      };
    }),
    footer: compact
      ? undefined
      : {
          kicker: "NATIONAL RESULT · DECLARED BY INEC",
          headline: `${
            winner ? surname(winner) : "The winner"
          } won the presidency. The zones split ${chips.length} ways.`,
          stats: results.candidates.map((c) => {
            const votes = results.national.byParty[c.party] ?? 0;
            const share =
              results.national.validVotes > 0
                ? (votes / results.national.validVotes) * 100
                : 0;
            return {
              label: `${surname(c)} · ${c.party}`,
              value: `${formatVotes(votes)} · ${formatShare(share)}`,
              color: c.color,
            };
          }),
        },
  };
}
