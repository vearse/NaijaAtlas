"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ZoneBoard from "@/components/zones/ZoneBoard";
import { buildElectionZoneBoard } from "@/lib/election/buildElectionZoneBoard";
import {
  formatShare,
  formatVotes,
  stateWinnerParty,
} from "@/lib/election/zoneAggregate";
import SourceNote from "@/components/hub/SourceNote";
import type { RegionLocation, StateLocation } from "@/types/location";
import type { PresidentialResultsBundle } from "@/types/politics";

function surname(name: string): string {
  return name.split(" ").filter(Boolean).pop() ?? name;
}

type Props = {
  resultsByYear: Record<number, PresidentialResultsBundle>;
  regions: RegionLocation[];
  states: StateLocation[];
  availableYears: number[];
};

export default function ElectionResults({
  resultsByYear,
  regions,
  states,
  availableYears,
}: Props) {
  const years = availableYears.length
    ? availableYears
    : Object.keys(resultsByYear)
        .map(Number)
        .sort((a, b) => b - a);

  const [year, setYear] = useState(years[0]);
  const [sort, setSort] = useState<"state" | "winner">("state");
  const [breakdownView, setBreakdownView] = useState<"zones" | "states">(
    "zones"
  );

  const results = resultsByYear[year] ?? resultsByYear[years[0]];

  const board = useMemo(
    () =>
      results
        ? buildElectionZoneBoard(results, regions, states, { compact: true })
        : null,
    [results, regions, states]
  );

  const nameById = useMemo(
    () => new Map(states.map((s) => [s.id, s.name])),
    [states]
  );

  const candidateColor = useMemo(
    () =>
      Object.fromEntries(
        (results?.candidates ?? []).map((c) => [c.party, c.color])
      ),
    [results?.candidates]
  );

  const shortByParty = useMemo(
    () =>
      Object.fromEntries(
        (results?.candidates ?? []).map((c) => [c.party, surname(c.name)])
      ),
    [results?.candidates]
  );

  const stateRows = useMemo(() => {
    if (!results) return [];
    const rows = results.states.map((row) => {
      const winner = stateWinnerParty(row);
      const total = row.validVotes;
      const shares = Object.fromEntries(
        results.candidates.map((c) => [
          c.party,
          total ? ((row.votes[c.party] ?? 0) / total) * 100 : 0,
        ])
      ) as Record<string, number>;
      return {
        stateId: row.stateId,
        stateName: nameById.get(row.stateId) ?? row.stateId,
        winner,
        shares,
      };
    });
    if (sort === "winner") {
      rows.sort(
        (a, b) =>
          a.winner.localeCompare(b.winner) ||
          a.stateName.localeCompare(b.stateName)
      );
    } else {
      rows.sort((a, b) => a.stateName.localeCompare(b.stateName));
    }
    return rows;
  }, [results, nameById, sort]);

  if (!results || !board) {
    return (
      <p className="text-sm text-text-muted">
        No presidential results available.
      </p>
    );
  }

  const winner = results.candidates.find(
    (c) => c.party === results.national.winner
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-label-caps tracking-wider text-text-muted">
            Election year
          </span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-2 h-11 rounded-xl border border-border-subtle bg-surface-card px-3 text-body-md"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-label-caps tracking-wider text-text-muted">
            Office
          </span>
          <select
            disabled
            value="president"
            className="mt-2 h-11 rounded-xl border border-border-subtle bg-slate-50 px-3 text-body-md text-text-muted"
          >
            <option value="president">President</option>
          </select>
        </label>
        <Link
          href="/civic/map/elections?view=zones"
          className="ml-auto inline-flex h-11 items-center rounded-xl bg-primary-container px-4 text-label-md font-semibold text-white hover:opacity-90"
        >
          View on election map
        </Link>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 md:p-6">
        <p className="text-label-caps uppercase text-text-muted">
          National result · {results.election.declaredBy}
        </p>
        <p className="mt-2 font-landing-display text-headline-md text-text-primary">
          {winner?.name} ({winner?.party}) declared winner
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {results.candidates.map((c) => {
            const votes = results.national.byParty[c.party] ?? 0;
            const share =
              results.national.validVotes > 0
                ? (votes / results.national.validVotes) * 100
                : 0;
            return (
              <div
                key={c.party}
                className="rounded-xl border border-border-subtle p-3"
                style={{ borderLeftWidth: 4, borderLeftColor: c.color }}
              >
                <p className="text-xs font-bold uppercase text-text-muted">
                  {c.party}
                </p>
                <p className="font-semibold text-text-primary">{c.name}</p>
                <p className="mt-1 text-sm tabular-nums text-text-secondary">
                  {formatVotes(votes)} · {formatShare(share)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "zones" as const, label: "By zone" },
            { id: "states" as const, label: "State-by-state" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setBreakdownView(opt.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              breakdownView === opt.id
                ? "bg-primary-container text-white shadow-sm"
                : "border border-border-subtle bg-surface-card text-text-secondary hover:border-primary-container/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {breakdownView === "zones" && <ZoneBoard {...board} />}

      {breakdownView === "states" && (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-landing-display text-lg font-bold text-text-primary">
            State-by-state
          </h3>
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "state" | "winner")}
              className="rounded-lg border border-border-subtle px-2 py-1 text-sm"
            >
              <option value="state">State name</option>
              <option value="winner">Winner</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border-subtle">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-lime-50/70 text-left text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">Winner</th>
                {results.candidates.map((c) => (
                  <th key={c.party} className="px-3 py-2 text-right">
                    {c.party}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stateRows.map((row) => (
                <tr
                  key={row.stateId}
                  className="border-t border-border-subtle even:bg-slate-50/40"
                >
                  <td className="px-3 py-2 font-medium">{row.stateName}</td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                      style={{
                        backgroundColor:
                          candidateColor[row.winner] ?? "#64748b",
                      }}
                    >
                      {shortByParty[row.winner] ?? row.winner}
                    </span>
                  </td>
                  {results.candidates.map((c) => (
                    <td
                      key={c.party}
                      className="px-3 py-2 text-right tabular-nums"
                    >
                      {formatShare(row.shares[c.party] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <SourceNote
        source={`${results.election.declaredBy} · ${results.election.sourceUrl}`}
        updated={results.election.date}
      />
    </div>
  );
}
