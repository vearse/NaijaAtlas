"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import PartyIcon from "@/components/election/PartyIcon";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  STATE_ELECTION_CANDIDATES_PUBLISHED,
  STATE_ELECTION_INEC_NOTICE,
} from "@/lib/election/stateElectionCandidates";
import StateSenatorialDistrictMap from "@/components/civic/StateSenatorialDistrictMap";
import { colorForSenatorialIndex } from "@/lib/politics/senatorialColors";
import type {
  CivicSenatorialLookups,
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

export type Race =
  | { kind: "senate"; race: HubSenateRace }
  | { kind: "reps"; race: HubRepsRace }
  | { kind: "president"; race: { id: string; name: string; ticketIndex: number } };

type Props = {
  senateRaces: HubSenateRace[];
  repsRaces: HubRepsRace[];
  presidential: {
    party: string;
    partyName: string;
    partyIcon?: string | null;
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
  senatorialLookups: CivicSenatorialLookups;
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
  senatorialLookups,
}: Props) {
  const [query, setQuery] = useState("");
  const [senateRaceId, setSenateRaceId] = useState("all");
  const [page, setPage] = useState(0);
  const [hoverRegionId, setHoverRegionId] = useState<string | null>(null);
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

  const matchCandidate = useCallback(
    (c: HubCandidate): boolean => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.party.toLowerCase().includes(q)
      );
    },
    [query]
  );

  const visible = useMemo(() => {
    const out: Race[] = [];
    if (position === "president") {
      presidential.forEach((t, i) => {
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
        if (senateRaceId !== "all" && race.districtId !== senateRaceId) continue;
        const candidates = race.candidates.filter(matchCandidate);
        if (candidates.length === 0) continue;
        out.push({ kind: "reps", race: { ...race, candidates } });
      }
    }
    return out;
  }, [
    matchCandidate,
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
  const pageSlice =
    position === "president"
      ? visible
      : visible.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  const stateOffice = useMemo(
    () => offices.find((o) => o.stateId === stateId),
    [offices, stateId]
  );

  const selectedRegionId =
    selected?.kind === "senate" || selected?.kind === "reps"
      ? selected.raceId
      : null;
  const mapRegionMode = position === "reps" ? "constituency" : "senatorial";
  const mapHighlight =
    hoverRegionId ??
    selectedRegionId ??
    (position !== "reps" && senateRaceId !== "all" ? senateRaceId : null);

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
            {position !== "president" && position !== "governor" && senateInState.length > 0 && (
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
      </div>

      <div
        className={
          position === "president"
            ? ""
            : "grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]"
        }
      >
      {position !== "president" && (
        <aside className="space-y-3 lg:sticky lg:top-32">
          <StateSenatorialDistrictMap
            stateId={stateId}
            stateName={stateName}
            lookups={senatorialLookups}
            regionMode={mapRegionMode}
            highlightRegionId={mapHighlight}
            onHoverRegion={setHoverRegionId}
            className="aspect-square w-full"
          />
          {senateInState.length > 0 && (
            <div className="rounded-xl border border-border-subtle bg-surface-card p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {senateInState.length} senatorial districts
                {position === "governor" ? "" : " · tap to filter"}
              </p>
              <ul className="space-y-1">
                {senateInState.map((r) => {
                  const active = senateRaceId === r.id;
                  const seats = repsRaces.filter((x) => x.districtId === r.id).length;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        disabled={position === "governor"}
                        onClick={() => {
                          setSenateRaceId(active ? "all" : r.id);
                          setPage(0);
                        }}
                        onMouseEnter={() => setHoverRegionId(r.id)}
                        onMouseLeave={() => setHoverRegionId(null)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                          active
                            ? "bg-emerald-50 font-bold text-primary"
                            : "text-text-secondary hover:bg-slate-50 disabled:hover:bg-transparent"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: colorForSenatorialIndex(
                              senatorialLookups.districtColorIndex[r.id] ?? 0
                            ),
                          }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{r.name}</span>
                        <span className="shrink-0 tabular-nums text-text-muted">
                          {r.candidates.length} sen · {seats} reps
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      )}

      <div className="min-w-0">
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
              Try another search or switch office. Data follows the
              INEC {electionYear} candidate list for {stateName}.
            </EmptyState>
          ) : (
            <>
              <div
                className={`grid gap-3 sm:grid-cols-2 ${
                  position === "president" ? "lg:grid-cols-3" : ""
                }`}
              >
                {pageSlice.map((row) => {
                  const isSelected =
                    selected?.kind === row.kind &&
                    selected.raceId === row.race.id;
                  const key = `${row.kind}-${row.race.id}`;
                  if (row.kind === "president") {
                    const t = presidential[row.race.ticketIndex];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setSelected({ kind: row.kind, raceId: row.race.id })
                        }
                        className={`flex items-center gap-3 rounded-xl border bg-surface-card p-3 text-left shadow-sm transition-colors ${
                          isSelected
                            ? "border-primary-container ring-2 ring-emerald-500/20"
                            : "border-border-subtle hover:border-slate-300"
                        }`}
                      >
                        <PartyIcon
                          icon={t?.partyIcon}
                          abbreviation={t?.party ?? "—"}
                          size="md"
                          className="!h-10 !w-10 !rounded-full"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-text-primary">
                            {t?.candidate}
                          </p>
                          <p className="truncate text-[11px] text-text-muted">
                            VP: {t?.runningMate}
                          </p>
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-primary">
                            {t?.partyName}
                          </p>
                        </div>
                      </button>
                    );
                  }
                  const districtId =
                    row.kind === "senate" ? row.race.id : row.race.districtId;
                  const mapRegionForRow =
                    row.kind === "reps" ? row.race.id : row.race.id;
                  const lgaNames = row.race.lgaNames;
                  const cands = row.race.candidates;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelected({ kind: row.kind, raceId: row.race.id })
                      }
                      onMouseEnter={() => setHoverRegionId(mapRegionForRow)}
                      onMouseLeave={() => setHoverRegionId(null)}
                      onFocus={() => setHoverRegionId(mapRegionForRow)}
                      onBlur={() => setHoverRegionId(null)}
                      className={`flex flex-col rounded-xl border bg-surface-card p-3 text-left shadow-sm transition-colors ${
                        isSelected
                          ? "border-primary-container ring-2 ring-emerald-500/20"
                          : "border-border-subtle hover:border-primary-container/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: colorForSenatorialIndex(
                                senatorialLookups.districtColorIndex[districtId] ?? 0
                              ),
                            }}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-text-primary">
                              {row.race.name}
                            </p>
                            {row.kind === "reps" && row.race.districtName && (
                              <p className="truncate text-[11px] text-text-muted">
                                {row.race.districtName} Senatorial District
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-text-secondary">
                          {cands.length} candidate{cands.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {lgaNames.length > 0 && (
                        <p className="mt-2 line-clamp-1 text-[11px] text-text-secondary">
                          <span className="font-semibold text-text-muted">
                            {lgaNames.length} LGA{lgaNames.length === 1 ? "" : "s"}:
                          </span>{" "}
                          {lgaNames.slice(0, 3).join(", ")}
                          {lgaNames.length > 3 ? ` +${lgaNames.length - 3}` : ""}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex -space-x-1.5">
                          {cands.slice(0, 6).map((c) => (
                            <PartyIcon
                              key={`${c.name}-${c.party}`}
                              icon={c.partyIcon}
                              abbreviation={c.party}
                              size="sm"
                              className="!h-7 !w-7 !rounded-full ring-2 ring-white"
                            />
                          ))}
                          {cands.length > 6 && (
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-text-secondary ring-2 ring-white">
                              +{cands.length - 6}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-primary">
                          View roster →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {position !== "president" && pageCount > 1 && (
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
      </div>
      </div>

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
        {!STATE_ELECTION_CANDIDATES_PUBLISHED && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-body-sm text-amber-950">
            {STATE_ELECTION_INEC_NOTICE}
          </p>
        )}
        <p className="mt-2 text-body-sm text-text-secondary">
          {STATE_ELECTION_CANDIDATES_PUBLISHED
            ? `Declared gubernatorial candidates for ${electionYear} appear here when INEC publishes the state list.`
            : "Until INEC publishes state-election candidates, use the incumbent executive below and federal races for this state."}
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
        badge={STATE_ELECTION_CANDIDATES_PUBLISHED ? "INEC roster" : "Pending INEC"}
      >
        {STATE_ELECTION_CANDIDATES_PUBLISHED
          ? `No declared gubernatorial candidates are loaded for ${stateName} yet.`
          : STATE_ELECTION_INEC_NOTICE}
        {!STATE_ELECTION_CANDIDATES_PUBLISHED && (
          <>
            {" "}
            Use Senate and House tabs for declared legislative candidates in{" "}
            {stateName}.
          </>
        )}
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

/**
 * Side dossier for one race. Shared with the constituency rosters inside the
 * “Who represents me?” accordions so a race opens identically wherever it is
 * listed.
 */
export function DossierDrawer({
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
                  <div className="flex items-center gap-3">
                    <PartyIcon
                      icon={c.partyIcon}
                      abbreviation={c.party}
                      size="md"
                    />
                    <p className="text-body-md font-semibold text-text-primary">
                      {c.name}
                    </p>
                  </div>
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
