"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type {
  HubCandidate,
  HubOfficeholder,
  HubRepsRace,
  HubSenateRace,
  HubStateOffice,
} from "@/lib/server/loadCivicHubData";

export type RosterPosition = "president" | "governor" | "senate" | "reps";

const POSITIONS: { id: RosterPosition; label: string }[] = [
  { id: "president", label: "President" },
  { id: "governor", label: "Governor" },
  { id: "senate", label: "Senate" },
  { id: "reps", label: "House of Reps" },
];

const PAGE_SIZE = 12;

const PARTY_TINT: Record<string, string> = {
  APC: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PDP: "bg-slate-100 text-slate-700 border-slate-300",
  LP: "bg-sky-50 text-sky-800 border-sky-200",
  NNPP: "bg-rose-50 text-rose-800 border-rose-200",
  ADC: "bg-amber-50 text-amber-800 border-amber-200",
  SDP: "bg-indigo-50 text-indigo-800 border-indigo-200",
  YP: "bg-teal-50 text-teal-800 border-teal-200",
};

function partyClass(party: string): string {
  return (
    PARTY_TINT[party] ??
    "border-border-subtle bg-slate-50 text-text-secondary"
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type Race =
  | { kind: "senate"; race: HubSenateRace }
  | { kind: "reps"; race: HubRepsRace }
  | { kind: "president"; race: { id: string; name: string; ticketIndex: number } };

type Props = {
  senateRaces: HubSenateRace[];
  repsRaces: HubRepsRace[];
  presidential: {
    party: string;
    partyName: string;
    candidate: string;
    runningMate: string;
  }[];
  states: { id: string; name: string }[];
  offices: HubStateOffice[];
  electionYear: number;
  stateId: string;
  onStateIdChange: (id: string) => void;
  position: RosterPosition;
  onPositionChange: (p: RosterPosition) => void;
};

export default function CandidateRoster({
  senateRaces,
  repsRaces,
  presidential,
  states,
  offices,
  electionYear,
  stateId,
  onStateIdChange,
  position,
  onPositionChange,
}: Props) {
  const [party, setParty] = useState("all");
  const [query, setQuery] = useState("");
  const [senateRaceId, setSenateRaceId] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<{
    kind: "senate" | "reps" | "president";
    raceId: string;
  } | null>(null);

  const stateName =
    states.find((s) => s.id === stateId)?.name ?? stateId.replace("NG-", "");

  const senateInState = useMemo(
    () => senateRaces.filter((r) => r.stateId === stateId),
    [senateRaces, stateId]
  );

  const parties = useMemo(() => {
    const set = new Set<string>();
    for (const r of senateInState) for (const c of r.candidates) set.add(c.party);
    for (const r of repsRaces.filter((x) => x.stateId === stateId)) {
      for (const c of r.candidates) set.add(c.party);
    }
    for (const t of presidential) set.add(t.party);
    return [...set].sort();
  }, [presidential, repsRaces, senateInState, stateId]);

  const matchCandidate = useCallback(
    (c: HubCandidate): boolean => {
      if (party !== "all" && c.party !== party) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.party.toLowerCase().includes(q)
      );
    },
    [party, query]
  );

  const visible = useMemo(() => {
    const out: Race[] = [];
    if (position === "president") {
      presidential.forEach((t, i) => {
        if (party !== "all" && t.party !== party) return;
        const q = query.trim().toLowerCase();
        if (q && !`${t.candidate} ${t.partyName}`.toLowerCase().includes(q)) {
          return;
        }
        out.push({
          kind: "president",
          race: {
            id: `presidential-${t.party}`,
            name: `${t.partyName} presidential ticket`,
            ticketIndex: i,
          },
        });
      });
      return out;
    }
    if (position === "senate") {
      for (const race of senateInState) {
        if (senateRaceId !== "all" && race.id !== senateRaceId) continue;
        const candidates = race.candidates.filter(matchCandidate);
        if (candidates.length === 0) continue;
        out.push({ kind: "senate", race: { ...race, candidates } });
      }
    }
    if (position === "reps") {
      for (const race of repsRaces) {
        if (race.stateId !== stateId) continue;
        const candidates = race.candidates.filter(matchCandidate);
        if (candidates.length === 0) continue;
        out.push({ kind: "reps", race: { ...race, candidates } });
      }
    }
    return out;
  }, [
    matchCandidate,
    party,
    position,
    presidential,
    query,
    repsRaces,
    senateInState,
    senateRaceId,
    stateId,
  ]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const pageSlice = visible.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE
  );

  const stateOffice = useMemo(
    () => offices.find((o) => o.stateId === stateId),
    [offices, stateId]
  );

  const selectClass =
    "h-10 rounded-lg border border-border-subtle bg-surface-card px-3 text-xs font-semibold text-slate-800 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10";

  return (
    <div>
      <div className="mb-6 space-y-3 rounded-xl border border-border-subtle bg-surface-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPositionChange(p.id);
                  setPage(0);
                  setSelected(null);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-label-md ${
                  position === p.id
                    ? "border border-primary-container/20 bg-emerald-50 font-bold text-primary"
                    : "text-text-secondary hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="State"
              value={stateId}
              onChange={(e) => {
                onStateIdChange(e.target.value);
                setSenateRaceId("all");
                setPage(0);
                setSelected(null);
              }}
              className={selectClass}
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} State
                </option>
              ))}
            </select>
            {position === "senate" && senateInState.length > 0 && (
              <select
                aria-label="Senatorial district"
                value={senateRaceId}
                onChange={(e) => {
                  setSenateRaceId(e.target.value);
                  setPage(0);
                }}
                className={selectClass}
              >
                <option value="all">All districts in {stateName}</option>
                {senateInState.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search candidate…"
                className={`${selectClass} w-40 pl-8 sm:w-48`}
              />
              <span
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                aria-hidden
              >
                ⌕
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Parties:
          </span>
          <button
            type="button"
            onClick={() => setParty("all")}
            className={`rounded px-2.5 py-1 text-xs font-semibold ${
              party === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {parties.slice(0, 8).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParty(p)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                party === p
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {position === "governor" && (
        <GovernorPanel
          stateName={stateName}
          stateId={stateId}
          governor={stateOffice?.governor ?? null}
          deputy={stateOffice?.deputyGovernor ?? null}
          electionYear={electionYear}
        />
      )}

      {position !== "governor" && (
        <>
          <p className="mb-4 text-body-sm text-text-muted">
            {position === "president"
              ? `${visible.length} presidential ticket${visible.length === 1 ? "" : "s"} nationwide`
              : `${visible.length} race${visible.length === 1 ? "" : "s"} in ${stateName} · page ${pageSafe + 1} of ${pageCount}`}
          </p>

          {visible.length === 0 ? (
            <EmptyState title="No candidate matches those filters">
              Try another party chip or clear the search box. Data follows the
              INEC {electionYear} candidate list for {stateName}.
            </EmptyState>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pageSlice.map((row) => {
                  const isSelected =
                    selected?.kind === row.kind &&
                    selected.raceId === row.race.id;
                  const leadName =
                    row.kind === "president"
                      ? presidential[row.race.ticketIndex]?.candidate
                      : row.race.candidates[0]?.name;
                  return (
                    <button
                      key={`${row.kind}-${row.race.id}`}
                      type="button"
                      onClick={() =>
                        setSelected({ kind: row.kind, raceId: row.race.id })
                      }
                      className={`flex min-h-[180px] flex-col rounded-xl border bg-surface-card p-4 text-left shadow-sm transition-colors ${
                        isSelected
                          ? "border-2 border-primary-container ring-2 ring-emerald-500/20"
                          : "border-border-subtle hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-slate-50 text-label-md font-bold text-primary">
                          {initials(leadName ?? row.race.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold text-text-primary">
                            {leadName ?? "Ticket"}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {row.race.name}
                          </p>
                        </div>
                      </div>
                      {"candidates" in row.race && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {row.race.candidates.slice(0, 4).map((c) => (
                            <span
                              key={`${c.name}-${c.party}`}
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${partyClass(c.party)}`}
                            >
                              {c.party}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {pageCount > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={pageSafe <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="rounded-lg border border-border-subtle px-4 py-2 text-label-md disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pageSafe >= pageCount - 1}
                    onClick={() =>
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }
                    className="rounded-lg border border-border-subtle px-4 py-2 text-label-md disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {selected && position !== "governor" && (
        <DossierDrawer
          selected={selected}
          senateRaces={senateRaces}
          repsRaces={repsRaces}
          presidential={presidential}
          onClose={() => setSelected(null)}
        />
      )}

      <SourceNote
        className="mt-6"
        source="INEC final candidate list"
        updated="Sep 2026"
      />
    </div>
  );
}

function GovernorPanel({
  stateName,
  stateId,
  governor,
  deputy,
  electionYear,
}: {
  stateName: string;
  stateId: string;
  governor: HubOfficeholder | null;
  deputy: HubOfficeholder | null;
  electionYear: number;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border-subtle bg-slate-50 p-6">
        <p className="text-label-caps text-primary">State executive</p>
        <h3 className="mt-1 text-headline-sm font-bold text-text-primary">
          Governor · {stateName} State
        </h3>
        <p className="mt-2 text-body-sm text-text-secondary">
          The {electionYear} gubernatorial ballot follows INEC&apos;s published
          list when declarations are final. Until then, compare the current
          executive below with national assembly races for the same state.
        </p>
        {governor ? (
          <div className="mt-4 rounded-xl border border-border-subtle bg-surface-card p-4">
            <p className="text-body-md font-semibold text-text-primary">
              {governor.name}
            </p>
            <p className="text-body-sm text-text-secondary">
              Incumbent · {governor.party}
            </p>
            {deputy && (
              <p className="mt-2 text-body-sm text-text-muted">
                Deputy: {deputy.name}
              </p>
            )}
          </div>
        ) : (
          <EmptyState className="mt-4" title="No executive profile loaded">
            Officeholder data will appear when available for {stateName}.
          </EmptyState>
        )}
        <Link
          href="#representatives"
          className="mt-4 inline-flex text-label-md font-semibold text-primary hover:underline"
        >
          See who represents {stateName} →
        </Link>
      </div>
      <EmptyState
        title={`${electionYear} gubernatorial candidates`}
        badge="INEC roster"
      >
        Gubernatorial aspirants are not bundled in this hub snapshot yet. Use
        Senate and House tabs for declared legislative candidates in {stateName},
        or open the election map for ward-level context.
        <Link
          href={sectionMapHref("civic/elections", { stateIds: [stateId] })}
          className="mt-3 block font-semibold text-primary hover:underline"
        >
          Open {stateName} on election map →
        </Link>
      </EmptyState>
    </div>
  );
}

function DossierDrawer({
  selected,
  senateRaces,
  repsRaces,
  presidential,
  onClose,
}: {
  selected: { kind: "senate" | "reps" | "president"; raceId: string };
  senateRaces: HubSenateRace[];
  repsRaces: HubRepsRace[];
  presidential: Props["presidential"];
  onClose: () => void;
}) {
  const race = useMemo((): Race | null => {
    if (selected.kind === "president") {
      const ticket = presidential.find(
        (t) => `presidential-${t.party}` === selected.raceId
      );
      if (!ticket) return null;
      return {
        kind: "president",
        race: {
          id: selected.raceId,
          name: `${ticket.partyName} ticket`,
          ticketIndex: presidential.indexOf(ticket),
        },
      };
    }
    if (selected.kind === "senate") {
      const r = senateRaces.find((x) => x.id === selected.raceId);
      return r ? { kind: "senate", race: r } : null;
    }
    const r = repsRaces.find((x) => x.id === selected.raceId);
    return r ? { kind: "reps", race: r } : null;
  }, [presidential, repsRaces, selected, senateRaces]);

  if (!race) return null;

  const ticket =
    race.kind === "president"
      ? presidential[race.race.ticketIndex]
      : null;
  const candidates: HubCandidate[] =
    race.kind === "president" ? [] : race.race.candidates;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col overflow-y-auto border-l border-border-subtle bg-surface-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-5">
          <div>
            <p className="text-label-caps tracking-wider text-primary">
              {race.kind === "president"
                ? "Presidential ticket"
                : race.kind === "senate"
                  ? "Senate race"
                  : "House of Reps race"}
            </p>
            <h3 className="mt-1 text-headline-sm font-semibold text-text-primary">
              {race.race.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dossier"
            className="rounded-lg p-1.5 text-text-muted hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 p-5">
          {ticket && (
            <div className="rounded-xl border border-border-subtle p-4">
              <p className="text-body-md font-semibold text-text-primary">
                {ticket.candidate}
              </p>
              <p className="mt-1 text-body-sm text-text-secondary">
                Running mate: {ticket.runningMate}
              </p>
              <span
                className={`mt-3 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${partyClass(ticket.party)}`}
              >
                {ticket.party} · {ticket.partyName}
              </span>
            </div>
          )}

          {candidates.length > 0 && (
            <ul className="space-y-2">
              {candidates.map((c) => (
                <li
                  key={`${c.name}-${c.party}`}
                  className="rounded-xl border border-border-subtle p-4"
                >
                  <p className="text-body-md font-semibold text-text-primary">
                    {c.name}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${partyClass(c.party)}`}
                  >
                    {c.party}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={
              race.kind === "president"
                ? sectionMapHref("civic/elections")
                : sectionMapHref("civic/elections", {
                    senatorialDistrictId:
                      race.kind === "reps"
                        ? race.race.districtId
                        : race.race.id,
                    stateIds: [race.race.stateId],
                  })
            }
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary-container text-label-md text-white hover:bg-[#006d40]"
          >
            View on election map
          </Link>
        </div>
      </div>
    </div>
  );
}
