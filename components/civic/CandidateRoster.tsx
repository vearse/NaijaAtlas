"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type {
  HubCandidate,
  HubRepsRace,
  HubSenateRace,
} from "@/lib/server/loadCivicHubData";

type Position = "all" | "president" | "senate" | "reps";

const POSITIONS: { id: Position; label: string }[] = [
  { id: "all", label: "All" },
  { id: "president", label: "President" },
  { id: "senate", label: "Senate" },
  { id: "reps", label: "House of Reps" },
];

/** Muted party colours — chips, not logos, so the roster stays readable. */
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
  | { kind: "president"; race: { id: string; name: string } };

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
  lgas: { id: string; name: string; stateId: string }[];
  electionYear: number;
};

export default function CandidateRoster({
  senateRaces,
  repsRaces,
  presidential,
  states,
  lgas,
  electionYear,
}: Props) {
  const [position, setPosition] = useState<Position>("senate");
  const [stateId, setStateId] = useState("all");
  const [lgaId, setLgaId] = useState("all");
  const [party, setParty] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{
    kind: "senate" | "reps" | "president";
    raceId: string;
  } | null>(null);

  const lgasForState = useMemo(
    () =>
      stateId === "all"
        ? []
        : lgas
            .filter((l) => l.stateId === stateId)
            .sort((a, b) => a.name.localeCompare(b.name)),
    [lgas, stateId]
  );

  const parties = useMemo(() => {
    const set = new Set<string>();
    for (const r of senateRaces) for (const c of r.candidates) set.add(c.party);
    for (const r of repsRaces) for (const c of r.candidates) set.add(c.party);
    for (const t of presidential) set.add(t.party);
    return [...set].sort();
  }, [presidential, repsRaces, senateRaces]);

  const matchesLga = useCallback(
    (names: string[]): boolean => {
      if (lgaId === "all") return true;
      const target = lgas.find((l) => l.id === lgaId)?.name;
      if (!target) return true;
      const t = target.toLowerCase();
      return names.some((n) => n.toLowerCase() === t);
    },
    [lgaId, lgas]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchCandidate = (c: HubCandidate): boolean => {
      if (party !== "all" && c.party !== party) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.party.toLowerCase().includes(q)
      );
    };

    const out: Race[] = [];
    if (position === "all" || position === "senate") {
      for (const race of senateRaces) {
        if (stateId !== "all" && race.stateId !== stateId) continue;
        if (!matchesLga(race.lgaNames)) continue;
        const candidates = race.candidates.filter(matchCandidate);
        if (candidates.length === 0) continue;
        out.push({ kind: "senate", race: { ...race, candidates } });
      }
    }
    if (position === "all" || position === "reps") {
      for (const race of repsRaces) {
        if (stateId !== "all" && race.stateId !== stateId) continue;
        if (!matchesLga(race.lgaNames)) continue;
        const candidates = race.candidates.filter(matchCandidate);
        if (candidates.length === 0) continue;
        out.push({ kind: "reps", race: { ...race, candidates } });
      }
    }
    if (position === "all" || position === "president") {
      for (const t of presidential) {
        if (party !== "all" && t.party !== party) continue;
        if (q && !`${t.candidate} ${t.partyName}`.toLowerCase().includes(q)) {
          continue;
        }
        out.push({
          kind: "president",
          race: {
            id: `presidential-${t.party}`,
            name: `${t.partyName} presidential ticket`,
          },
        });
      }
    }
    return out;
  }, [
    matchesLga,
    party,
    position,
    presidential,
    query,
    repsRaces,
    senateRaces,
    stateId,
  ]);

  const selectedRace = useMemo((): Race | null => {
    if (!selected) return null;
    if (selected.kind === "president") {
      const ticket = presidential.find(
        (t) => `presidential-${t.party}` === selected.raceId
      );
      if (!ticket) return null;
      return {
        kind: "president",
        race: { id: selected.raceId, name: `${ticket.partyName} ticket` },
      };
    }
    if (selected.kind === "senate") {
      const race = senateRaces.find((r) => r.id === selected.raceId);
      return race ? { kind: "senate", race } : null;
    }
    const race = repsRaces.find((r) => r.id === selected.raceId);
    return race ? { kind: "reps", race } : null;
  }, [presidential, repsRaces, selected, senateRaces]);

  const selectClass =
    "h-10 rounded-xl border border-border-subtle bg-surface-card px-3 text-body-sm text-slate-700 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10";

  return (
    <div>
      <div className="sticky top-[104px] z-30 -mx-4 mb-6 border-y border-border-subtle bg-surface-card/95 px-4 py-3 shadow-sm backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPosition(p.id)}
              className={`rounded-full px-4 py-1.5 text-label-md ${
                position === p.id
                  ? "bg-primary-container font-semibold text-white"
                  : "border border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
          <select
            aria-label="State"
            value={stateId}
            onChange={(e) => {
              setStateId(e.target.value);
              setLgaId("all");
            }}
            className={selectClass}
          >
            <option value="all">All states</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="LGA"
            value={lgaId}
            onChange={(e) => setLgaId(e.target.value)}
            disabled={stateId === "all"}
            className={`${selectClass} disabled:opacity-50`}
          >
            <option value="all">All LGAs</option>
            {lgasForState.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Party"
            value={party}
            onChange={(e) => setParty(e.target.value)}
            className={selectClass}
          >
            <option value="all">All parties</option>
            {parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name…"
            className={`${selectClass} min-w-[180px] flex-1`}
          />
        </div>
      </div>

      <p className="mb-4 text-body-sm text-text-muted">
        {visible.length} race{visible.length === 1 ? "" : "s"} ·{" "}
        {visible.reduce(
          (sum, r) => sum + ("candidates" in r.race ? r.race.candidates.length : 0),
          0
        )}{" "}
        candidates
      </p>

      {visible.length === 0 ? (
        <EmptyState title="No candidate matches those filters">
          Clear the party or search box, or widen the state filter. The roster is
          the INEC {electionYear} final list — every declared candidate is in it.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => {
            const isSelected =
              selected?.kind === row.kind && selected.raceId === row.race.id;
            return (
              <button
                key={`${row.kind}-${row.race.id}`}
                type="button"
                onClick={() =>
                  setSelected({ kind: row.kind, raceId: row.race.id })
                }
                className={`flex h-[200px] flex-col rounded-2xl border bg-surface-card p-5 text-left shadow-sm transition-colors ${
                  isSelected
                    ? "border-primary-container ring-2 ring-emerald-500/20"
                    : "border-border-subtle hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-label-md font-bold text-primary">
                    {initials(
                      "candidates" in row.race
                        ? (row.race.candidates[0]?.name ?? row.race.name)
                        : row.race.name
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-body-md font-semibold text-text-primary">
                      {"candidates" in row.race
                        ? row.race.candidates[0]?.name
                        : "Presidential ticket"}
                    </p>
                    <p className="truncate text-body-sm text-text-muted">
                      {row.race.name}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {"candidates" in row.race
                    ? row.race.candidates
                        .slice(0, 4)
                        .map((c) => (
                          <span
                            key={`${c.name}-${c.party}`}
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${partyClass(c.party)}`}
                          >
                            {c.party}
                          </span>
                        ))
                    : []}
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">
                    {row.kind === "president"
                      ? "Federal"
                      : (("state" in row.race) as boolean
                          ? row.race.state
                          : "")}
                  </span>
                  <span className="text-label-md font-semibold text-primary">
                    {visible.length === 1 ? "View" : "Open dossier"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedRace && (
        <DossierDrawer
          race={selectedRace}
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

function DossierDrawer({
  race,
  presidential,
  onClose,
}: {
  race: Race;
  presidential: Props["presidential"];
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const candidates: HubCandidate[] =
    race.kind === "president" ? [] : race.race.candidates;
  const ticket = race.kind === "president" ? presidential[0] : null;

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

        <div className="flex-1 p-5">
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
              {candidates.map((c, i) => (
                <li key={`${c.name}-${c.party}`}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={`w-full rounded-xl border p-4 text-left ${
                      i === active
                        ? "border-primary-container bg-emerald-50/50"
                        : "border-border-subtle hover:border-slate-300"
                    }`}
                  >
                    <p className="text-body-md font-semibold text-text-primary">
                      {c.name}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${partyClass(c.party)}`}
                    >
                      {c.party}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {race.kind !== "president" && (
            <div className="mt-5 space-y-3">
              <div>
                <p className="text-label-caps tracking-wider text-text-muted">
                  Contested zone
                </p>
                <p className="mt-1 text-body-sm text-slate-700">
                  {race.race.state}
                  {race.kind === "reps" && race.race.districtName
                    ? ` · ${race.race.districtName} Senate district`
                    : ""}
                </p>
              </div>
              {race.race.lgaNames.length > 0 && (
                <div>
                  <p className="text-label-caps tracking-wider text-text-muted">
                    LGAs covered
                  </p>
                  <p className="mt-1 text-body-sm text-slate-700">
                    {race.race.lgaNames.join(" · ")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-label-caps tracking-wider text-text-muted">
                  Declared candidates
                </p>
                <p className="mt-1 text-body-sm text-slate-700">
                  {race.race.candidates.length}
                </p>
              </div>
            </div>
          )}

          <EmptyState
            className="mt-5"
            title="Manifesto and pledge tracking"
            badge="Not yet available"
          >
            We publish the INEC candidate roster, not campaign promises. Pledge
            scoring will land with the civic transparency dataset.
          </EmptyState>
        </div>

        <div className="space-y-2 border-t border-border-subtle p-5">
          <Link
            href={
              race.kind === "president"
                ? sectionMapHref("civic/elections")
                : sectionMapHref("civic/elections", {
                    senatorialDistrictId:
                      race.kind === "reps" ? race.race.districtId : race.race.id,
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
