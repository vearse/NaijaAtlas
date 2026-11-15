"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PresidentialResultsBundle,
  RegisteredVotersBundle,
  SpeculationData,
} from "@/types/politics";
import type { StateLocation } from "@/types/location";
import { useMapStore } from "@/lib/store/mapStore";
import { formatShare, formatVotes } from "@/lib/election/zoneAggregate";
import {
  aggregateNational,
  clamp,
  computeDefaultTurnout,
  prefillSharesFrom2023,
  round1,
  unsetFallbackWinner,
  validateShares,
} from "@/lib/speculation/calc";
import {
  colorForParty,
  historicalVotesForParty,
  OTHERS_LABEL,
  MAX_SPECULATION_PARTIES,
  MIN_SPECULATION_PARTIES,
} from "@/lib/speculation/constants";
import {
  defaultSpeculationLineup,
  isSpeculationLineupActive,
  isValidSpeculationLineup,
} from "@/lib/speculation/parties";
import type { PresidentialBundle } from "@/types/politics";
import SpeculationDefaultTickets from "./SpeculationDefaultTickets";
import ShareScenarioModal from "./ShareScenarioModal";
import { encodeScenario } from "@/lib/speculation/codec";
import type {
  NationalAggregate,
  SpeculationScenario,
  SpeculationShares,
  SpeculationStateInput,
} from "@/lib/speculation/types";
import {
  readSpeculationDraft,
  useSpeculationStore,
} from "@/lib/store/speculationStore";
import { defaultPartiesFor2023 } from "@/lib/speculation/calc";
import {
  buildRandomStateInputsForAll,
  randomSpeculationShares,
  randomTurnoutAround,
  softenApmOyoShares,
} from "@/lib/speculation/random";
import SpeculationPartyLineupEditor from "./SpeculationPartyLineupEditor";

const REGION_ORDER = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West",
];

function currentRegisteredYear(
  registered: Record<number, RegisteredVotersBundle>
): number {
  return (
    Object.keys(registered)
      .map(Number)
      .sort((a, b) => b - a)[0] ?? 0
  );
}

function latestStateRow(
  results: PresidentialResultsBundle,
  stateId: string
) {
  return results.states.find((row) => row.stateId === stateId);
}

function actualWinnerLabel(
  row: ReturnType<typeof latestStateRow>,
  parties: string[]
): string | null {
  if (!row) return null;
  return unsetFallbackWinner(row, parties);
}

interface StateEditorProps {
  data: SpeculationData;
  states: StateLocation[];
  stateId: string;
  existing: SpeculationStateInput | null;
  onSave: (input: SpeculationStateInput) => void;
  onClear: () => void;
  onBack: () => void;
}

function StateEditor({
  data,
  states,
  stateId,
  existing,
  onSave,
  onClear,
  onBack,
}: StateEditorProps) {
  const parties = useSpeculationStore((s) => s.parties);
  const registeredYear = currentRegisteredYear(data.registeredVotersByYear);
  const registeredVoters =
    data.registeredVotersByYear[registeredYear]?.states[stateId] ?? null;
  const row = latestStateRow(data.latestResults, stateId);
  const defaultTurnout =
    computeDefaultTurnout(
      stateId,
      data.resultsByYear,
      data.registeredVotersByYear
    ) ?? 30;
  const [turnout, setTurnout] = useState<
    number | ""
  >(existing?.turnout ?? defaultTurnout);
  const [shares, setShares] = useState<SpeculationShares>(
    existing?.shares ?? prefillSharesFrom2023(row, parties)
  );

  const numericTurnout = typeof turnout === "number" ? turnout : 0;
  const validation = validateShares(shares);
  const totalVotes =
    registeredVoters != null
      ? Math.round((registeredVoters * numericTurnout) / 100)
      : 0;

  const save = () => {
    if (registeredVoters == null || validation.ok !== true) return;
    if (!Number.isFinite(numericTurnout) || numericTurnout < 1) return;
    onSave({
      stateId,
      turnout: round1(clamp(numericTurnout, 1, 100)),
      shares: Object.fromEntries(
        parties.map((party) => [party, round1(shares[party] ?? 0)])
      ),
    });
  };

  const resetTo2023 = () => {
    setShares(prefillSharesFrom2023(row, parties));
    setTurnout(defaultTurnout);
  };

  const applyRandomSplit = () => {
    setShares(
      stateId === "NG-OY" && parties.includes("APM")
        ? softenApmOyoShares(parties)
        : randomSpeculationShares(parties)
    );
    setTurnout(randomTurnoutAround(defaultTurnout));
  };

  const partiesByShare = useMemo(
    () =>
      [...parties].sort(
        (a, b) => (shares[b] ?? 0) - (shares[a] ?? 0)
      ),
    [parties, shares]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-border-subtle bg-surface-card shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Back to states
        </button>
        <h2 className="mt-2 text-lg font-bold text-text-primary">
          {states.find((state) => state.id === stateId)?.name ??
            data.latestResults.states.find((row) => row.stateId === stateId)
              ?.name ??
            stateId}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Tap the map or edit the projection for this state.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {registeredVoters == null ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            No registered-voter figure for this state, so turnout cannot be
            projected.
          </div>
        ) : (
          <section className="rounded-xl border border-border-subtle bg-slate-50 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                Current register · {registeredYear}
              </p>
              <p className="text-sm font-semibold tabular-nums text-text-primary">
                {formatVotes(registeredVoters)}
              </p>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                Projected valid votes
              </p>
              <p className="text-sm font-semibold tabular-nums text-primary">
                {formatVotes(totalVotes)}
              </p>
            </div>
          </section>
        )}

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="spec-turnout"
              className="text-label-caps text-text-muted"
            >
              Turnout
            </label>
            <div className="flex items-center gap-1">
              <input
                id="spec-turnout-number"
                type="number"
                min={1}
                max={100}
                step={0.1}
                value={turnout}
                disabled={registeredVoters == null}
                onChange={(event) =>
                  setTurnout(
                    event.target.value === ""
                      ? ""
                      : Number(event.target.value)
                  )
                }
                className="w-20 rounded-lg border border-border-subtle bg-white px-2 py-1 text-right text-sm tabular-nums text-text-primary disabled:bg-slate-100"
              />
              <span className="text-sm text-text-muted">%</span>
            </div>
          </div>
          <input
            id="spec-turnout"
            type="range"
            min={1}
            max={100}
            step={0.1}
            value={clamp(numericTurnout || 1, 1, 100)}
            disabled={registeredVoters == null}
            onChange={(event) => setTurnout(Number(event.target.value))}
            className="w-full accent-[#008751]"
          />
          <p className="text-[11px] text-text-muted">
            Default is this state&apos;s average turnout in the two most recent
            presidential elections ({formatShare(defaultTurnout)}).
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-label-caps text-text-muted">Vote share</p>
            <button
              type="button"
              onClick={resetTo2023}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Use 2023 shares
            </button>
          </div>
          <ul className="space-y-2">
            {partiesByShare.map((party) => {
              const baseShare = row?.validVotes
                ? (historicalVotesForParty(row.votes, party) / row.validVotes) *
                  100
                : null;
              return (
                <li
                  key={party}
                  className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-3 py-2"
                >
                  <span
                    className="h-7 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: colorForParty(party) }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {party}
                    </p>
                    {baseShare != null && (
                      <p className="text-[10px] text-text-muted">
                        2023: {formatShare(baseShare)}
                        {party === "NDC" && (row?.votes.LP ?? 0) > 0
                          ? " · from LP"
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={shares[party] ?? 0}
                      onChange={(event) =>
                        setShares((prev) => ({
                          ...prev,
                          [party]: Number(event.target.value),
                        }))
                      }
                      className="w-20 rounded-lg border border-border-subtle bg-white px-2 py-1 text-right text-sm tabular-nums text-text-primary"
                      aria-label={`${party} share`}
                    />
                    <span className="text-sm text-text-muted">%</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
              validation.ok
                ? "bg-slate-50 text-text-secondary"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>{validation.error ?? "Remainder goes to Others"}</span>
            <span className="font-semibold tabular-nums">
              {validation.ok
                ? `${OTHERS_LABEL} ${formatShare(validation.others)}`
                : `${formatShare(validation.sum)} used`}
            </span>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyRandomSplit}
            disabled={registeredVoters == null}
            className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 shadow-sm transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Random split
          </button>
          <button
            type="button"
            onClick={save}
            disabled={
              registeredVoters == null ||
              !validation.ok ||
              !Number.isFinite(numericTurnout) ||
              numericTurnout < 1
            }
            className="rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save state
          </button>
          {existing && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl border border-border-subtle px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-slate-50"
            >
              Clear state
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface NationalResultProps {
  aggregate: NationalAggregate;
  states: StateLocation[];
  scenario: SpeculationScenario;
  data: SpeculationData;
  use2023: boolean;
  allStatesComplete: boolean;
  onBack: () => void;
  onEditParties: () => void;
  onRandomizeAll: () => void;
  onToggleUse2023: (value: boolean) => void;
  onReset: () => void;
}

function NationalResult({
  aggregate,
  states,
  scenario,
  data,
  use2023,
  allStatesComplete,
  onBack,
  onEditParties,
  onRandomizeAll,
  onToggleUse2023,
  onReset,
}: NationalResultProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const parties = scenario.parties;
  const setCount = aggregate.setStateIds.length;
  const leader = aggregate.leader;
  const leaderName = leader?.party ?? "No votes";
  const registeredYear = currentRegisteredYear(data.registeredVotersByYear);
  const registeredByState =
    data.registeredVotersByYear[registeredYear]?.states ?? {};

  const projectionStateIds = allStatesComplete
    ? aggregate.setStateIds
    : use2023
      ? [
          ...aggregate.setStateIds,
          ...aggregate.unsetStateIds,
        ]
      : aggregate.setStateIds;

  const totalOnRegister = projectionStateIds.reduce(
    (total, stateId) => total + (registeredByState[stateId] ?? 0),
    0
  );
  const nationalTurnout =
    totalOnRegister > 0
      ? round1((aggregate.totalVotes / totalOnRegister) * 100)
      : 0;

  const stateBreakdown = projectionStateIds
    .map((stateId) => {
      const location = states.find((state) => state.id === stateId);
      const outcome = aggregate.outcomes[stateId];
      if (!outcome) return null;
      return {
        id: stateId,
        name: location?.name ?? stateId,
        registered: outcome.registeredVoters,
        turnout: outcome.turnout,
        validVotes: outcome.totalVotes,
        winner: outcome.winner,
        winnerShare: outcome.winnerShare,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const shareUrl = () => {
    const params = new URLSearchParams({
      map: "election",
      mode: "speculate",
      parties: parties.join(","),
      s: encodeScenario(scenario, use2023),
      use2023: use2023 ? "1" : "0",
    });
    return `${window.location.origin}/civic/map/elections?${params.toString()}`;
  };

  const partyRows = [
    ...parties.map((party) => ({
      key: party,
      label: party,
      color: colorForParty(party),
    })),
    {
      key: "others",
      label: OTHERS_LABEL,
      color: colorForParty("others"),
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-border-subtle bg-surface-card shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Back to states
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-white">
            Scenario result
          </span>
          <span className="text-label-caps text-primary">
            {setCount}/{states.length} states set
          </span>
        </div>
        <h2 className="text-lg font-bold text-text-primary mt-2">
          {leader ? `${leaderName} leads` : "Add states to see a result"}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          {leader
            ? `${formatShare(leader.share)} of projected votes · ${formatShare(
                leader.marginPoints
              )} margin over second`
            : "Set at least one state to project the national vote."}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section
          className={`grid gap-2 ${
            allStatesComplete ? "grid-cols-2" : "grid-cols-2"
          }`}
        >
          <div className="rounded-xl border border-border-subtle bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
              On register ({registeredYear})
            </p>
            <p className="text-lg font-bold tabular-nums text-text-primary">
              {formatVotes(totalOnRegister)}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
              National turnout
            </p>
            <p className="text-lg font-bold tabular-nums text-text-primary">
              {formatShare(nationalTurnout)}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Projected valid votes
            </p>
            <p className="text-lg font-bold tabular-nums text-text-primary">
              {formatVotes(aggregate.totalVotes)}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
              States won by leader
            </p>
            <p className="text-lg font-bold tabular-nums text-text-primary">
              {leader
                ? aggregate.statesWonByParty[leader.party]?.length ?? 0
                : 0}
              <span className="text-xs font-medium text-text-muted">
                {" "}
                / {projectionStateIds.length}
              </span>
            </p>
          </div>
        </section>

        <label className="flex items-start gap-2 rounded-xl border border-border-subtle bg-surface-card p-3 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={use2023}
            onChange={(event) => onToggleUse2023(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#008751]"
          />
          <span>
            Use 2023 shares and default turnout for unset states
            <span className="block text-text-muted">
              {aggregate.unsetStateIds.length} state(s) apply their 2023 shares
              and default turnout to the current register.
            </span>
          </span>
        </label>

        <section className="space-y-2">
          <h3 className="text-label-caps text-text-muted">National vote</h3>
          <div className="overflow-hidden rounded-xl border border-border-subtle">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-bold">Party</th>
                  <th className="px-2 py-2 text-right font-bold">Scenario</th>
                  <th className="px-2 py-2 text-right font-bold">2023</th>
                  <th className="px-2 py-2 text-right font-bold">States</th>
                </tr>
              </thead>
              <tbody>
                {partyRows.map((row) => {
                  const votes = aggregate.votesByParty[row.key] ?? 0;
                  const share = aggregate.shareByParty[row.key] ?? 0;
                  const actualVotes = aggregate.actual.votesByParty[row.key] ?? 0;
                  const actualShare = aggregate.actual.shareByParty[row.key] ?? 0;
                  const delta = round1(share - actualShare);
                  const won =
                    row.key === "others"
                      ? 0
                      : aggregate.statesWonByParty[row.key]?.length ?? 0;
                  const actualWon =
                    row.key === "others"
                      ? 0
                      : aggregate.actual.statesWonByParty[row.key]?.length ?? 0;
                  return (
                    <tr
                      key={row.key}
                      className={
                        row.key === leader?.party
                          ? "bg-emerald-50/70"
                          : "odd:bg-white even:bg-slate-50/60"
                      }
                    >
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: row.color }}
                            aria-hidden
                          />
                          {row.label}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-text-primary">
                        <span className="block font-semibold">
                          {formatVotes(votes)}
                        </span>
                        <span className="block text-[10px] text-text-muted">
                          {formatShare(share)}{" "}
                          <span
                            className={
                              delta > 0
                                ? "text-emerald-700"
                                : delta < 0
                                  ? "text-red-700"
                                  : ""
                            }
                          >
                            ({delta > 0 ? "+" : ""}
                            {delta.toFixed(1)})
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-text-secondary">
                        <span className="block">{formatVotes(actualVotes)}</span>
                        <span className="block text-[10px] text-text-muted">
                          {formatShare(actualShare)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-text-secondary">
                        <span className="block">{won}</span>
                        <span className="block text-[10px] text-text-muted">
                          2023: {actualWon}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {aggregate.tieStateIds.length > 0 && (
          <p className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950">
            {aggregate.tieStateIds.length} state(s) are exact ties. The 2023
            result breaks the tie; the map shows diagonal two-party stripes.
          </p>
        )}

        {allStatesComplete && stateBreakdown.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-label-caps text-text-muted">
              All states · turnout & votes
            </h3>
            <div className="max-h-72 overflow-y-auto overflow-x-auto rounded-xl border border-border-subtle">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                <thead className="sticky top-0 z-[1] bg-slate-50 text-[10px] uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-3 py-2 font-bold">State</th>
                    <th className="px-2 py-2 text-right font-bold">Register</th>
                    <th className="px-2 py-2 text-right font-bold">Turnout</th>
                    <th className="px-2 py-2 text-right font-bold">Valid votes</th>
                    <th className="px-2 py-2 text-right font-bold">Leader</th>
                  </tr>
                </thead>
                <tbody>
                  {stateBreakdown.map((row) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                      <td className="px-3 py-2 font-semibold text-text-primary">
                        {row.name}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-text-secondary">
                        {formatVotes(row.registered)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-text-secondary">
                        {formatShare(row.turnout)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-text-primary">
                        {formatVotes(row.validVotes)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        <span
                          className="font-semibold"
                          style={{ color: colorForParty(row.winner) }}
                        >
                          {row.winner}
                        </span>
                        <span className="block text-[10px] text-text-muted">
                          {formatShare(row.winnerShare)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border-subtle bg-emerald-50/50 text-xs font-semibold text-text-primary">
                  <tr>
                    <td className="px-3 py-2">National total</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatVotes(totalOnRegister)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatShare(nationalTurnout)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatVotes(aggregate.totalVotes)}
                    </td>
                    <td className="px-2 py-2 text-right text-text-muted">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary"
          >
            Share scenario
          </button>
          <button
            type="button"
            onClick={onEditParties}
            className="rounded-xl border border-border-subtle px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-slate-50"
          >
            Edit parties
          </button>
          <button
            type="button"
            onClick={onRandomizeAll}
            className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100"
          >
            Randomize all states
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Reset
          </button>
        </div>
      </div>
      <ShareScenarioModal
        open={shareOpen}
        url={shareOpen ? shareUrl() : ""}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}

interface SpeculationPanelProps {
  states: StateLocation[];
  data: SpeculationData;
  presidential: PresidentialBundle;
}

export default function SpeculationPanel({
  states,
  data,
  presidential,
}: SpeculationPanelProps) {
  const phase = useSpeculationStore((s) => s.phase);
  const parties = useSpeculationStore((s) => s.parties);
  const stateInputs = useSpeculationStore((s) => s.states);
  const selectedStateId = useSpeculationStore((s) => s.selectedStateId);
  const use2023 = useSpeculationStore((s) => s.use2023ForUnset);
  const start = useSpeculationStore((s) => s.start);
  const selectState = useSpeculationStore((s) => s.selectState);
  const saveState = useSpeculationStore((s) => s.saveState);
  const clearState = useSpeculationStore((s) => s.clearState);
  const backToList = useSpeculationStore((s) => s.backToList);
  const openSetup = useSpeculationStore((s) => s.openSetup);
  const showResult = useSpeculationStore((s) => s.showResult);
  const setUse2023ForUnset = useSpeculationStore((s) => s.setUse2023ForUnset);
  const resetAll = useSpeculationStore((s) => s.resetAll);
  const mergeStates = useSpeculationStore((s) => s.mergeStates);
  const restoreDraft = useSpeculationStore((s) => s.restoreDraft);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (isSpeculationLineupActive(parties)) return;
    const draft = readSpeculationDraft();
    if (draft) restoreDraft(draft);
  }, [parties.length, restoreDraft]);

  const defaultParties = useMemo(
    () =>
      defaultPartiesFor2023(data.latestResults, data.partyDirectory),
    [data.latestResults, data.partyDirectory]
  );
  const [picked, setPicked] = useState<string[]>(() =>
    isSpeculationLineupActive(parties)
      ? parties
      : defaultSpeculationLineup()
  );
  const selectStatesOnMap = useMapStore((s) => s.selectStates);

  useEffect(() => {
    if (!selectedStateId) return;
    selectStatesOnMap([selectedStateId]);
  }, [selectedStateId, selectStatesOnMap]);

  useEffect(() => {
    if (phase === "setup" && isSpeculationLineupActive(parties)) {
      setPicked(parties);
    }
  }, [phase, parties]);

  useEffect(() => {
    if (isSpeculationLineupActive(parties)) {
      setPicked(parties);
    } else if (parties.length === 0) {
      setPicked(defaultParties);
    }
  }, [parties, defaultParties]);

  const scenario = useMemo<SpeculationScenario>(
    () => ({
      parties: isSpeculationLineupActive(parties) ? parties : picked,
      states: stateInputs,
    }),
    [parties, picked, stateInputs]
  );

  const aggregate = useMemo(() => {
    if (!isSpeculationLineupActive(scenario.parties)) return null;
    return aggregateNational({
      scenario,
      results2023: data.latestResults,
      resultsByYear: data.resultsByYear,
      registeredVotersByYear: data.registeredVotersByYear,
      use2023ForUnset: use2023,
    });
  }, [scenario, data, use2023]);

  const registeredYear = currentRegisteredYear(data.registeredVotersByYear);
  const registeredTotal = data.registeredVotersByYear[registeredYear]
    ? Object.values(data.registeredVotersByYear[registeredYear].states).reduce(
        (total, value) => total + value,
        0
      )
    : 0;

  const stateInputList = Object.values(stateInputs);
  const setCount = stateInputList.length;
  const allStatesComplete =
    setCount >= states.length && states.length > 0;
  const allStatesCompleteRef = useRef(false);

  const randomizeAllStates = () => {
    if (!isSpeculationLineupActive(parties)) return;
    const inputs = buildRandomStateInputsForAll({
      stateIds: states.map((state) => state.id),
      parties,
      resultsByYear: data.resultsByYear,
      registeredVotersByYear: data.registeredVotersByYear,
      registeredYear,
      stateRegions: Object.fromEntries(
        states.map((state) => [state.id, state.regionName])
      ),
    });
    const openResult = inputs.length >= states.length;
    mergeStates(inputs, { openResult });
  };

  const resetScenario = () => {
    resetAll();
    useMapStore.getState().reset();
  };

  useEffect(() => {
    const complete = allStatesComplete;
    if (
      phase === "list" &&
      isSpeculationLineupActive(parties) &&
      complete &&
      !allStatesCompleteRef.current
    ) {
      showResult();
    }
    allStatesCompleteRef.current = complete;
  }, [
    phase,
    parties.length,
    allStatesComplete,
    showResult,
  ]);

  if (phase === "editor" && selectedStateId) {
    return (
      <StateEditor
        key={selectedStateId}
        data={data}
        states={states}
        stateId={selectedStateId}
        existing={stateInputs[selectedStateId] ?? null}
        onSave={saveState}
        onClear={() => clearState(selectedStateId)}
        onBack={backToList}
      />
    );
  }

  if (phase === "result" && aggregate) {
    return (
      <NationalResult
        aggregate={aggregate}
        states={states}
        scenario={scenario}
        data={data}
        use2023={use2023}
        allStatesComplete={allStatesComplete}
        onBack={backToList}
        onEditParties={openSetup}
        onRandomizeAll={randomizeAllStates}
        onToggleUse2023={setUse2023ForUnset}
        onReset={resetScenario}
      />
    );
  }

  if (phase === "setup" || !isSpeculationLineupActive(parties)) {
    const changed =
      isSpeculationLineupActive(parties) &&
      (parties.length !== picked.length ||
        parties.some((party) => !picked.includes(party)));
    const lineupValid = isValidSpeculationLineup(picked);
    const isCustomEdit =
      phase === "setup" && isSpeculationLineupActive(parties);

    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="p-4 border-b border-border-subtle bg-surface-card shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            Presidential speculation
          </p>
          <h2 className="text-lg font-bold text-text-primary">
            {isCustomEdit ? "Edit party lineup" : "2027 presidential tickets"}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            {isCustomEdit
              ? `Keep APC, NDC & ADC — add or remove others (${MIN_SPECULATION_PARTIES}–${MAX_SPECULATION_PARTIES} total).`
              : "Start with six tickets, then pick states on the map and set turnout and vote share."}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="rounded-xl border border-border-subtle bg-slate-50 p-3 text-xs text-text-secondary">
            <p className="flex items-center justify-between gap-2">
              <span className="font-semibold text-text-primary">
                Current register ({registeredYear})
              </span>
              <span className="font-semibold tabular-nums text-text-primary">
                {formatVotes(registeredTotal)}
              </span>
            </p>
            <p className="mt-1 text-text-muted">
              Vote projections use this register. Turnout defaults use the
              2019 and 2023 presidential elections.
            </p>
          </div>

          {isCustomEdit ? (
            <SpeculationPartyLineupEditor
              picked={picked}
              directory={data.partyDirectory}
              onChange={setPicked}
            />
          ) : (
            <SpeculationDefaultTickets presidential={presidential} />
          )}

          {changed && setCount > 0 && isCustomEdit && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              Changing the lineup clears the {setCount} state assumption(s)
              already set.
            </p>
          )}

          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
            <span className="font-semibold">Disclaimer:</span> This is a
            speculative what-if scenario, not a prediction or official result.
            Only INEC has the authority to announce actual election results.
          </p>

          <button
            type="button"
            onClick={() =>
              start(isCustomEdit ? picked : defaultSpeculationLineup())
            }
            disabled={isCustomEdit && !lineupValid}
            className="w-full rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {setCount > 0 && !changed && isCustomEdit
              ? `Continue · ${setCount} states set`
              : "Start scenario"}
          </button>
        </div>
      </div>
    );
  }

  const projected = aggregate?.totalVotes ?? 0;
  const stateGroups = new Map<string, StateLocation[]>();
  for (const state of states) {
    const region = state.regionName || "Other";
    const group = stateGroups.get(region) ?? [];
    group.push(state);
    stateGroups.set(region, group);
  }
  const regions = [...stateGroups.keys()].sort(
    (a, b) =>
      (REGION_ORDER.indexOf(a) + 1 || 99) -
      (REGION_ORDER.indexOf(b) + 1 || 99)
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-border-subtle bg-surface-card shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-white">
            Speculation
          </span>
          <span className="text-[11px] font-semibold text-text-muted">
            {setCount}/{states.length} states set
          </span>
        </div>
        <h2 className="text-lg font-bold text-text-primary mt-2">
          Build your scenario
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Projected valid votes:{" "}
          <span className="font-semibold text-text-primary">
            {formatVotes(projected)}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {parties.map((party) => (
            <span
              key={party}
              className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-white px-2 py-0.5 text-[10px] font-bold text-text-secondary"
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: colorForParty(party) }}
                aria-hidden
              />
              {party}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openSetup}
            className="rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-slate-50"
          >
            Edit parties
          </button>
          <button
            type="button"
            onClick={randomizeAllStates}
            className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-100"
          >
            Randomize all states
          </button>
          <button
            type="button"
            onClick={showResult}
            disabled={setCount === 0}
            className="rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            View result
          </button>
          <button
            type="button"
            onClick={resetScenario}
            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <label className="flex items-start gap-2 rounded-xl border border-border-subtle bg-slate-50 p-3 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={use2023}
            onChange={(event) => setUse2023ForUnset(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#008751]"
          />
          <span>
            Use 2023 shares and default turnout for unset states
            <span className="block text-text-muted">
              Off: only the states you set contribute to the projection.
            </span>
          </span>
        </label>

        {regions.map((region) => (
          <section key={region} className="space-y-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {region}
            </h3>
            <ul className="space-y-1.5">
              {(stateGroups.get(region) ?? []).map((state) => {
                const input = stateInputs[state.id];
                const outcome = aggregate?.outcomes[state.id];
                const row = latestStateRow(data.latestResults, state.id);
                const fallbackWinner = actualWinnerLabel(row, parties);
                const winner = outcome?.winner ?? (use2023 ? fallbackWinner : null);
                const detail = outcome
                  ? `${input ? "" : "2023 base · "}${
                      outcome.tie
                        ? `Tie · ${outcome.tieParties.join("/")}`
                        : winner
                    } · ${formatShare(outcome.winnerShare)} · turnout ${formatShare(
                      outcome.turnout
                    )}`
                  : use2023 && row
                    ? `Unset · 2023: ${fallbackWinner}`
                    : "Unset";
                return (
                  <li key={state.id}>
                    <button
                      type="button"
                      onClick={() => selectState(state.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                        selectedStateId === state.id
                          ? "border-primary-container bg-emerald-50/80"
                          : "border-border-subtle hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className="h-7 w-1 shrink-0 rounded-full"
                        style={{
                          backgroundColor: winner
                            ? colorForParty(winner)
                            : "#cbd5e1",
                        }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-text-primary">
                          {state.name}
                        </span>
                        <span className="block text-[11px] text-text-muted">
                          {detail}
                        </span>
                      </span>
                      {!input && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                          Unset
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
