"use client";

import { useState } from "react";
import type { PresidentialBundle } from "@/types/politics";
import PartyIcon from "@/components/election/PartyIcon";
import PresidentialTicketList from "./PresidentialTicketList";
import { DEFAULT_SPECULATION_PARTIES } from "@/lib/speculation/constants";
import { colorForParty } from "@/lib/speculation/constants";

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

export default function SpeculationDefaultTickets({
  presidential,
}: {
  presidential: PresidentialBundle;
}) {
  const [openTickets, setOpenTickets] = useState<Set<string>>(() => new Set());
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  const defaultTickets = DEFAULT_SPECULATION_PARTIES.map((abbrev) =>
    presidential.candidates.find((t) => t.party.abbreviation === abbrev)
  ).filter((ticket): ticket is NonNullable<typeof ticket> => Boolean(ticket));

  const toggleTicket = (abbrev: string) => {
    setOpenTickets((prev) => {
      const next = new Set(prev);
      if (next.has(abbrev)) next.delete(abbrev);
      else next.add(abbrev);
      return next;
    });
  };

  return (
    <section className="space-y-3">
      <p className="text-xs text-text-secondary">
        These six tickets are the default scenario. NDC inherits Labour Party
        (LP) vote shares from the 2023 presidential result for baselines and
        turnout hints.
      </p>
      <ul className="space-y-2">
        {defaultTickets.map((ticket) => {
          const abbrev = ticket.party.abbreviation;
          const isOpen = openTickets.has(abbrev);
          return (
            <li
              key={abbrev}
              className={`overflow-hidden rounded-xl border bg-surface-card transition-colors ${
                isOpen ? "border-ng-green/40" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTicket(abbrev)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <PartyIcon
                  icon={ticket.party.icon}
                  abbreviation={abbrev}
                  size="md"
                />
                <span
                  className="h-7 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: colorForParty(abbrev) }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {ticket.presidential_candidate.name}
                  </span>
                  <span className="block truncate text-[10px] text-slate-400">
                    {ticket.party.name}
                  </span>
                </span>
                <Chevron open={isOpen} />
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-sm">
                  <p className="text-xs text-text-muted">
                    Vice presidential candidate
                  </p>
                  <p className="font-semibold text-text-primary truncate">
                    {ticket.vice_presidential_candidate.name}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setShowAllCandidates((value) => !value)}
        className="w-full rounded-xl border border-border-subtle px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-slate-50"
        aria-expanded={showAllCandidates}
      >
        {showAllCandidates
          ? "Hide full candidate list"
          : `All ${presidential.candidates.length} presidential tickets`}
      </button>
      {showAllCandidates && (
        <PresidentialTicketList presidential={presidential} />
      )}
    </section>
  );
}
