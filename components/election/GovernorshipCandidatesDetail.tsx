"use client";

import { useEffect, useMemo, useState } from "react";
import type { PoliticsBundle } from "@/types/politics";
import type { StateLocation } from "@/types/location";
import { useMapStore } from "@/lib/store/mapStore";
import GovernorshipTicketList from "./GovernorshipTicketList";
import { governorshipStateNotice } from "@/lib/election/stateElectionCandidates";

interface GovernorshipCandidatesDetailProps {
  politics: PoliticsBundle;
  states?: StateLocation[];
  onBack: () => void;
}

export default function GovernorshipCandidatesDetail({
  politics,
  states = [],
  onBack,
}: GovernorshipCandidatesDetailProps) {
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);

  const withData = useMemo(
    () => Object.keys(politics.lookups.governorshipByStateId),
    [politics.lookups.governorshipByStateId]
  );

  const firstSelected =
    selectedStateIds.size === 1
      ? (selectedStateIds.values().next().value ?? null)
      : null;

  const fallback = withData[0] ?? states[0]?.id ?? "NG-LA";
  const [stateId, setStateId] = useState<string>(() => firstSelected ?? fallback);

  useEffect(() => {
    if (firstSelected) setStateId(firstSelected);
  }, [firstSelected]);

  const race = politics.lookups.governorshipByStateId[stateId] ?? null;
  const stateName =
    states.find((s) => s.id === stateId)?.name ??
    race?.state ??
    stateId.replace("NG-", "");
  const count = race?.candidates.length ?? 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-slate-100 bg-surface-card px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              2027 Governorship election
            </p>
            <h2 className="text-lg font-bold text-text-primary truncate">
              Governorship candidates
            </h2>
            <p className="text-xs text-text-muted">
              {stateName} · {count} ticket{count === 1 ? "" : "s"}
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <label className="block text-xs font-semibold text-text-secondary">
          State
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border-subtle bg-surface-card px-3 text-sm font-semibold text-text-primary focus:border-primary-container focus:outline-none"
          >
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {states.length === 0 && race && (
              <option value={stateId}>{stateName}</option>
            )}
          </select>
        </label>

        <section className="space-y-3">
          {race && race.candidates.length > 0 ? (
            <>
              <GovernorshipTicketList race={race} />
              <p className="text-xs text-text-muted rounded-xl border border-dashed border-border-subtle bg-slate-50 p-3">
                Tap a party to see its governorship &amp; deputy governorship
                ticket. Source: INEC final list of candidates.
              </p>
            </>
          ) : (
            <p className="text-sm text-text-secondary rounded-xl border border-amber-200 bg-amber-50/80 p-3">
              {governorshipStateNotice(stateName, stateId)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
