"use client";

import { useState } from "react";
import type { PresidentialBundle } from "@/types/politics";

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

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export default function PresidentialTicketList({
  presidential,
}: {
  presidential: PresidentialBundle;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  return (
    <ul className="space-y-2">
      {presidential.candidates.map((ticket) => {
        const id = ticket.party.abbreviation;
        const isOpen = open.has(id);
        return (
          <li
            key={id}
            className={`overflow-hidden rounded-xl border bg-white transition-colors ${
              isOpen ? "border-ng-green/40" : "border-slate-100"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen((s) => toggleInSet(s, id))}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                {ticket.party.abbreviation}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900 truncate">
                  {ticket.presidential_candidate.name}
                </span>
                <span className="block text-[10px] text-slate-400 truncate">
                  {ticket.party.name}
                </span>
              </span>
              <Chevron open={isOpen} />
            </button>
            {isOpen && (
              <div className="px-3 pb-3 pt-1">
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2 text-sm">
                  <p className="text-slate-500 text-xs">
                    Vice presidential candidate
                  </p>
                  <p className="font-semibold text-slate-900 truncate">
                    {ticket.vice_presidential_candidate.name}
                  </p>
                  {(ticket.vice_presidential_candidate.age ||
                    ticket.vice_presidential_candidate.gender) && (
                    <p className="text-xs text-slate-400">
                      {[
                        ticket.vice_presidential_candidate.gender,
                        ticket.vice_presidential_candidate.age
                          ? `Age ${ticket.vice_presidential_candidate.age}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                {(ticket.presidential_candidate.age ||
                  ticket.presidential_candidate.gender) && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    {[
                      ticket.presidential_candidate.gender,
                      ticket.presidential_candidate.age
                        ? `Age ${ticket.presidential_candidate.age}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}{" "}
                    · Presidential candidate
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}