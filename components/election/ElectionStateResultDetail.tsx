"use client";

import {
  formatShare,
  formatVotes,
  stateWinnerParty,
} from "@/lib/election/zoneAggregate";
import { resolveResultForState } from "@/lib/election/historicalStates";
import type { PresidentialResultsBundle } from "@/types/politics";
import type { StateLocation } from "@/types/location";

type Props = {
  results: PresidentialResultsBundle;
  state: StateLocation;
  states?: StateLocation[];
  onBack: () => void;
};

export default function ElectionStateResultDetail({
  results,
  state,
  states = [],
  onBack,
}: Props) {
  const match = resolveResultForState(results, state.id);
  if (!match) {
    return (
      <p className="text-sm text-text-muted">No results for this state.</p>
    );
  }
  const { row, group } = match;
  const memberNames = group
    ? group.memberIds.map((id) => states.find((s) => s.id === id)?.name ?? id)
    : [];

  const winner = stateWinnerParty(row);
  const candidateByParty = Object.fromEntries(
    results.candidates.map((c) => [c.party, c])
  );
  const total = row.validVotes;
  const percentOnly = row.percentOnly ?? false;
  const winnerShare = total ? ((row.votes[winner] ?? 0) / total) * 100 : 0;

  const ranked = results.candidates
    .map((c) => ({
      party: c.party,
      votes: row.votes[c.party] ?? 0,
      share: row.validVotes ? ((row.votes[c.party] ?? 0) / row.validVotes) * 100 : 0,
      color: c.color,
      name: c.name,
    }))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-primary hover:underline"
      >
        ← All states
      </button>
      <div>
        <p className="text-label-caps text-text-muted">
          {results.election.year} presidential
        </p>
        <h2 className="font-landing-display text-xl font-bold text-text-primary">
          {group ? `${group.name} State` : state.name}
        </h2>
        {group && (
          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">
            <p className="font-semibold">
              Now {memberNames.join(" & ")}
            </p>
            <p className="mt-0.5">
              {group.note} Results below are for the whole former state, so
              they are shown on all of its successor states.
            </p>
          </div>
        )}
        <p className="text-sm text-text-secondary mt-1">
          {percentOnly ? (
            <>
              {formatShare(winnerShare)} share ·{" "}
              <span style={{ color: candidateByParty[winner]?.color }}>
                {candidateByParty[winner]?.name} won
              </span>
            </>
          ) : (
            <>
              {formatVotes(total)} valid votes ·{" "}
              <span style={{ color: candidateByParty[winner]?.color }}>
                {candidateByParty[winner]?.name} won
              </span>
            </>
          )}
        </p>
      </div>
      <ul className="space-y-2">
        {ranked.map((r) => (
          <li
            key={r.party}
            className="rounded-xl border border-border-subtle p-3"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: r.color,
            }}
          >
            <div className="flex justify-between gap-2 text-sm">
              <span className="font-semibold text-text-primary">{r.name}</span>
              <span className="tabular-nums text-text-secondary">
                {formatShare(r.share)}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {percentOnly ? r.party : `${r.party} · ${formatVotes(r.votes)}`}
            </p>
          </li>
        ))}
        {row.votes.others > 0 && (
          <li className="rounded-xl border border-border-subtle p-3 text-sm text-text-muted">
            Other candidates · {formatVotes(row.votes.others)}
          </li>
        )}
      </ul>
    </div>
  );
}
