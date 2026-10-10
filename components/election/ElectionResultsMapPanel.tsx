"use client";

import { useMemo } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  formatShare,
  formatVotes,
  stateWinnerParty,
} from "@/lib/election/zoneAggregate";
import ElectionStateResultDetail from "@/components/election/ElectionStateResultDetail";
import type { StateLocation } from "@/types/location";
import type { PresidentialResultsBundle } from "@/types/politics";

function surname(name: string): string {
  return name.split(" ").filter(Boolean).pop() ?? name;
}

type Props = {
  results: PresidentialResultsBundle;
  states: StateLocation[];
};

export default function ElectionResultsMapPanel({ results, states }: Props) {
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
    let rows = results.states.map((row) => {
      const winner = stateWinnerParty(row);
      const total = row.validVotes;
      return {
        stateId: row.stateId,
        stateName:
          states.find((s) => s.id === row.stateId)?.name ?? row.stateId,
        winner,
        winnerVotes: row.votes[winner],
        share: total ? (row.votes[winner] / total) * 100 : 0,
      };
    });
    if (activeRegionId) {
      const inZone = new Set(
        states.filter((s) => s.regionId === activeRegionId).map((s) => s.id)
      );
      rows = rows.filter((r) => inZone.has(r.stateId));
    }
    rows.sort((a, b) => b.winnerVotes - a.winnerVotes);
    return rows;
  }, [results.states, states, activeRegionId]);

  const list = (
    <ul className="space-y-1.5">
      {stateRows.map((row) => {
        const active = row.stateId === focusStateId;
        return (
          <li key={row.stateId}>
            <button
              type="button"
              onClick={() => selectStates([row.stateId])}
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
                  {formatVotes(row.winnerVotes)} ({formatShare(row.share)})
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
        <p className="text-label-caps text-primary">
          {results.election.year} presidential results
        </p>
        <h2 className="text-lg font-bold text-text-primary mt-1">
          {activeRegionId ? "States in selected zone" : "State-by-state"}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Tap a state on the map or pick from the list.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {focusState && (
          <ElectionStateResultDetail
            results={results}
            state={focusState}
            onBack={() => selectStates([])}
          />
        )}
        {(mapCanvasView === "states" || !focusState) && list}
      </div>
    </div>
  );
}
