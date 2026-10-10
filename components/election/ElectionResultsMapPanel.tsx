"use client";

import { useMemo } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  electionBreakdownUnavailableMessage,
  electionHasStateBreakdown,
} from "@/lib/election/electionAvailability";
import {
  formatShare,
  formatVotes,
  stateWinnerParty,
} from "@/lib/election/zoneAggregate";
import ElectionStateResultDetail from "@/components/election/ElectionStateResultDetail";
import { historicalGroupFor, memberIdsFor } from "@/lib/election/historicalStates";
import type { StateLocation } from "@/types/location";
import type { PresidentialResultsBundle } from "@/types/politics";

function surname(name: string): string {
  return name.split(" ").filter(Boolean).pop() ?? name;
}

function ElectionResultsContestants({
  results,
}: {
  results: PresidentialResultsBundle;
}) {
  const total = results.national.validVotes;
  const winnerParty = results.national.winner;
  const ranked = [...results.candidates].sort(
    (a, b) =>
      (results.national.byParty[b.party] ?? 0) -
      (results.national.byParty[a.party] ?? 0)
  );

  return (
    <section className="space-y-2" aria-labelledby="election-contestants-heading">
      <h3
        id="election-contestants-heading"
        className="text-label-caps text-text-muted"
      >
        Contestants
      </h3>
      <ul className="space-y-2">
        {ranked.map((c) => {
          const votes = results.national.byParty[c.party] ?? 0;
          const share = total > 0 ? (votes / total) * 100 : 0;
          const isWinner = c.party === winnerParty;
          return (
            <li
              key={c.party}
              className="rounded-xl border border-border-subtle bg-surface-card p-3"
              style={{ borderLeftWidth: 4, borderLeftColor: c.color }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                    {c.party}
                    {isWinner && (
                      <span className="ml-2 rounded-full bg-primary-container px-1.5 py-0.5 text-[9px] font-bold text-white normal-case">
                        Winner
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    {c.name}
                  </p>
                  {c.runningMate && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Running mate: {c.runningMate}
                    </p>
                  )}
                </div>
                <p className="text-right text-xs tabular-nums text-text-secondary shrink-0">
                  <span className="block font-semibold text-text-primary">
                    {formatVotes(votes)}
                  </span>
                  {formatShare(share)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type Props = {
  results: PresidentialResultsBundle;
  states: StateLocation[];
  onBackToCurrent?: () => void;
};

export default function ElectionResultsMapPanel({
  results,
  states,
  onBackToCurrent,
}: Props) {
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const selectedStateOrder = useMapStore((s) => s.selectedStateOrder);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const selectStates = useMapStore((s) => s.selectStates);
  const mapCanvasView = useMapStore((s) => s.mapCanvasView);

  const shortByParty = useMemo(
    () =>
      Object.fromEntries(
        results.candidates.map((c) => [c.party, surname(c.name)])
      ) as Record<string, string>,
    [results.candidates]
  );

  const focusStateId =
    selectedStateOrder[selectedStateOrder.length - 1] ??
    (selectedStateIds.size === 1 ? [...selectedStateIds][0] : null);

  const focusState = focusStateId
    ? states.find((s) => s.id === focusStateId)
    : null;

  const candidateColor = useMemo(
    () => Object.fromEntries(results.candidates.map((c) => [c.party, c.color])),
    [results.candidates]
  );

  const stateRows = useMemo(() => {
    const year = results.election.year;
    let rows = results.states.map((row) => {
      const winner = stateWinnerParty(row);
      const total = row.validVotes;
      const group = historicalGroupFor(year, row.stateId);
      const memberIds = memberIdsFor(year, row.stateId);
      const memberNames = memberIds.map(
        (id) => states.find((s) => s.id === id)?.name ?? id
      );
      return {
        stateId: row.stateId,
        memberIds,
        stateName: group
          ? `${group.name} (now ${memberNames.join(" & ")})`
          : states.find((s) => s.id === row.stateId)?.name ??
            row.name ??
            row.stateId,
        winner,
        winnerVotes: row.votes[winner],
        share: total ? (row.votes[winner] / total) * 100 : 0,
        percentOnly: row.percentOnly ?? false,
      };
    });
    if (activeRegionId) {
      const inZone = new Set(
        states.filter((s) => s.regionId === activeRegionId).map((s) => s.id)
      );
      rows = rows.filter((r) => r.memberIds.some((id) => inZone.has(id)));
    }
    rows.sort((a, b) => b.winnerVotes - a.winnerVotes);
    return rows;
  }, [results.states, results.election.year, states, activeRegionId]);

  const list = (
    <ul className="space-y-1.5">
      {stateRows.map((row) => {
        const active = row.memberIds.every((id) => selectedStateIds.has(id));
        return (
          <li key={row.stateId}>
            <button
              type="button"
              onClick={() => selectStates(row.memberIds)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active
                  ? "border-primary-container bg-emerald-50/80"
                  : "border-border-subtle hover:bg-slate-50"
              }`}
            >
              <span
                className="h-8 w-1 shrink-0 rounded-full"
                style={{
                  backgroundColor: candidateColor[row.winner] ?? "#94a3b8",
                }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-text-primary">
                  {row.stateName}
                </span>
                <span className="block text-[11px] text-text-muted">
                  {shortByParty[row.winner] ?? row.winner} ·{" "}
                  {row.percentOnly
                    ? formatShare(row.share)
                    : `${formatVotes(row.winnerVotes)} (${formatShare(row.share)})`}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-border-subtle bg-surface-card shrink-0">
        {onBackToCurrent && (
          <button
            type="button"
            onClick={onBackToCurrent}
            className="mb-2 text-xs font-semibold text-primary hover:underline"
          >
            ← Back to 2027 candidates
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-white">
            {results.election.year} presidential
          </span>
          <span className="text-label-caps text-primary">
            {results.election.declaredBy} results
          </span>
        </div>
        <h2 className="text-lg font-bold text-text-primary mt-2">
          {activeRegionId ? "States in selected zone" : "State-by-state"}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Tap a state on the map or pick from the list.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {results.election.description && (
          <p className="text-sm md:text-base leading-relaxed text-text-primary border-l-4 border-primary-container pl-3 pr-1">
            {results.election.description}
          </p>
        )}
        <ElectionResultsContestants results={results} />
        {!electionHasStateBreakdown(results) && (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950"
            role="status"
          >
            {electionBreakdownUnavailableMessage(results)}
          </div>
        )}
        {focusState && (
          <ElectionStateResultDetail
            results={results}
            state={focusState}
            states={states}
            onBack={() => selectStates([])}
          />
        )}
        {electionHasStateBreakdown(results) &&
          (mapCanvasView === "states" || !focusState) &&
          list}
      </div>
    </div>
  );
}
