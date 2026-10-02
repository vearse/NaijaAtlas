"use client";

import type { PoliticsBundle } from "@/types/politics";
import PresidentialTicketList from "./PresidentialTicketList";

interface PresidentialCandidatesDetailProps {
  politics: PoliticsBundle;
  onBack: () => void;
}

export default function PresidentialCandidatesDetail({
  politics,
  onBack,
}: PresidentialCandidatesDetailProps) {
  const { presidential } = politics;
  const count = presidential.candidates.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-slate-100 bg-surface-card px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              2027 Presidential election
            </p>
            <h2 className="text-lg font-bold text-text-primary truncate">
              Presidential candidates
            </h2>
            <p className="text-xs text-text-muted">
              {count} ticket{count === 1 ? "" : "s"} ·{" "}
              {presidential.election.election_date ?? "Election date TBA"}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 h-8 w-8 rounded-full border border-border-subtle text-text-muted hover:bg-slate-100 flex items-center justify-center"
            aria-label="Back to browse"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-3">
          <PresidentialTicketList presidential={presidential} />
          <p className="text-xs text-text-muted rounded-xl border border-dashed border-border-subtle bg-slate-50 p-3">
            Tap a party to see its presidential & vice presidential ticket.
          </p>
        </section>
      </div>
    </div>
  );
}