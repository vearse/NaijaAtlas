"use client";

import { useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/hub/EmptyState";
import PartyIcon from "@/components/election/PartyIcon";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  STATE_ELECTION_CANDIDATES_PUBLISHED,
  governorshipStateNotice,
  isOffCycleGovernorshipState,
} from "@/lib/election/stateElectionCandidates";
import type {
  HubGovernorshipRace,
  HubGovernorshipTicket,
  HubOfficeholder,
} from "@/lib/server/loadCivicHubData";

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
  return PARTY_TINT[party] ?? "border-border-subtle bg-slate-50 text-text-secondary";
}

function personMeta(person: { gender?: string; age?: number }): string {
  return [
    person.gender,
    person.age ? `Age ${person.age}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TicketRow({ ticket }: { ticket: HubGovernorshipTicket }) {
  const [open, setOpen] = useState(false);
  return (
    <li
      className={`overflow-hidden rounded-xl border bg-surface-card transition-colors ${
        open ? "border-ng-green/40" : "border-border-subtle hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
      >
        <PartyIcon
          icon={ticket.partyIcon}
          abbreviation={ticket.party}
          size="md"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-text-primary">
            {ticket.governor.name}
          </span>
          <span className="block truncate text-[11px] text-text-muted">
            Deputy: {ticket.deputyGovernor.name}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${partyClass(ticket.party)}`}
        >
          {ticket.party}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3 pt-1">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Governorship candidate
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {ticket.governor.name}
            </p>
            {personMeta(ticket.governor) && (
              <p className="text-xs text-text-muted">{personMeta(ticket.governor)}</p>
            )}
            {ticket.governor.qualification && (
              <p className="mt-1 text-[11px] text-slate-400">
                {ticket.governor.qualification}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Deputy governorship candidate
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {ticket.deputyGovernor.name}
            </p>
            {personMeta(ticket.deputyGovernor) && (
              <p className="text-xs text-text-muted">
                {personMeta(ticket.deputyGovernor)}
              </p>
            )}
            {ticket.deputyGovernor.qualification && (
              <p className="mt-1 text-[11px] text-slate-400">
                {ticket.deputyGovernor.qualification}
              </p>
            )}
          </div>
          <p className="text-[11px] text-text-muted">{ticket.partyName}</p>
        </div>
      )}
    </li>
  );
}

export default function GovernorCandidatesPanel({
  stateName,
  stateId,
  race,
  governor,
  deputy,
  electionYear,
  query,
}: {
  stateName: string;
  stateId: string;
  race: HubGovernorshipRace | null;
  governor: HubOfficeholder | null;
  deputy: HubOfficeholder | null;
  electionYear: number;
  query: string;
}) {
  const q = query.trim().toLowerCase();
  const tickets = (race?.candidates ?? []).filter((t) =>
    q
      ? `${t.governor.name} ${t.deputyGovernor.name} ${t.party} ${t.partyName}`
          .toLowerCase()
          .includes(q)
      : true
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="rounded-xl border border-border-subtle bg-slate-50 p-6">
        <p className="text-label-caps text-primary">State executive</p>
        <h3 className="mt-1 text-headline-sm font-bold text-text-primary">
          Governor · {stateName} State
        </h3>
        <p className="mt-2 text-body-sm text-text-secondary">
          Sitting officeholder. The {electionYear} INEC candidate roster appears
          alongside.
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

      <div>
        {race && race.candidates.length > 0 ? (
          <>
            <p className="mb-4 text-body-sm text-text-muted">
              {tickets.length} governorship ticket
              {tickets.length === 1 ? "" : "s"} in {stateName} · {race.region}
            </p>
            {tickets.length === 0 ? (
              <EmptyState title="No candidate matches that filter">
                Try another search. Data follows the INEC {electionYear}{" "}
                governorship list for {stateName}.
              </EmptyState>
            ) : (
              <ul className="space-y-2">
                {tickets.map((t) => (
                  <TicketRow key={t.party} ticket={t} />
                ))}
              </ul>
            )}
          </>
        ) : (
          <EmptyState
            title={
              isOffCycleGovernorshipState(stateId) ||
              isOffCycleGovernorshipState(stateName)
                ? `No ${electionYear} governorship election`
                : `${electionYear} gubernatorial candidates`
            }
            badge={
              isOffCycleGovernorshipState(stateId) ||
              isOffCycleGovernorshipState(stateName)
                ? "Off-cycle"
                : STATE_ELECTION_CANDIDATES_PUBLISHED
                  ? "Pending state"
                  : "Pending INEC"
            }
          >
            {governorshipStateNotice(stateName, stateId)}
            <Link
              href={sectionMapHref("civic/elections", { stateIds: [stateId] })}
              className="mt-3 block font-semibold text-primary hover:underline"
            >
              Open {stateName} on election map →
            </Link>
          </EmptyState>
        )}
        {race && race.candidates.length > 0 && (
          <Link
            href={sectionMapHref("civic/elections", { stateIds: [stateId] })}
            className="mt-5 inline-flex text-label-md font-semibold text-primary hover:underline"
          >
            Open {stateName} governorship on election map →
          </Link>
        )}
      </div>
    </div>
  );
}
