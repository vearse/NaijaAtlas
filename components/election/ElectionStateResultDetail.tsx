"use client";

import {
  formatShare,
  formatVotes,
  stateWinnerParty,
} from "@/lib/election/zoneAggregate";
import type { PresidentialResultsBundle } from "@/types/politics";
import type { StateLocation } from "@/types/location";

type Props = {
  results: PresidentialResultsBundle;
  state: StateLocation;
  onBack: () => void;
};

export default function ElectionStateResultDetail({
  results,
  state,
  onBack,
}: Props) {
  const row = results.states.find((s) => s.stateId === state.id);
  if (!row) {
    return (
      <p className="text-sm text-text-muted">No results for this state.</p>
    );
  }

  const winner = stateWinnerParty(row);
  const candidateByParty = Object.fromEntries(
    results.candidates.map((c) => [c.party, c])
  );
  const total = row.validVotes;

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
          {state.name}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {formatVotes(total)} valid votes ·{" "}
          <span style={{ color: candidateByParty[winner]?.color }}>
            {candidateByParty[winner]?.name} won
          </span>
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
              {r.party} · {formatVotes(r.votes)}
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
