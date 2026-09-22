"use client";

import { useMemo } from "react";
import type { PoliticsBundle } from "@/types/politics";
import { useMapStore } from "@/lib/store/mapStore";
import { colorForDistrict } from "@/lib/politics/senatorialColors";
import { CandidateRow } from "./CandidateAvatar";

interface ElectionDistrictDetailProps {
  politics: PoliticsBundle;
}

export default function ElectionDistrictDetail({
  politics,
}: ElectionDistrictDetailProps) {
  const selectedSenatorialDistrictId = useMapStore(
    (s) => s.selectedSenatorialDistrictId
  );
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const setSelectedSenatorialDistrict = useMapStore(
    (s) => s.setSelectedSenatorialDistrict
  );

  const { lookups, presidential } = politics;

  const chipDistricts = useMemo(() => {
    if (selectedStateIds.size === 0) {
      return selectedSenatorialDistrictId &&
        lookups.districtById[selectedSenatorialDistrictId]
        ? [lookups.districtById[selectedSenatorialDistrictId]]
        : [];
    }
    return [...selectedStateIds].flatMap(
      (sid) => lookups.districtsByStateId[sid] ?? []
    );
  }, [lookups, selectedStateIds, selectedSenatorialDistrictId]);

  const district = selectedSenatorialDistrictId
    ? lookups.districtById[selectedSenatorialDistrictId]
    : null;
  const senateRace = selectedSenatorialDistrictId
    ? lookups.senateBySenatorialDistrictId[selectedSenatorialDistrictId]
    : null;
  const federalSeats = selectedSenatorialDistrictId
    ? (lookups.federalBySenatorialDistrictId[selectedSenatorialDistrictId] ??
      [])
    : [];

  if (!district) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-slate-100 bg-white px-3 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              District
            </p>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {district.name}
            </h2>
            <p className="text-xs text-slate-500">{district.state}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSenatorialDistrict(null)}
            className="shrink-0 h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Back to browse"
          >
            ×
          </button>
        </div>

        {chipDistricts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {chipDistricts.map((d) => {
              const active = d.id === selectedSenatorialDistrictId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedSenatorialDistrict(d.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-ng-green bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: colorForDistrict(lookups, d.id),
                    }}
                    aria-hidden
                  />
                  {d.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Presidential
          </h3>
          <ul className="space-y-2">
            {presidential.candidates.map((ticket) => (
              <CandidateRow
                key={ticket.party.abbreviation}
                name={ticket.presidential_candidate.name}
                party={ticket.party.abbreviation}
                subtitle={`VP: ${ticket.vice_presidential_candidate.name}`}
              />
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Senate candidates
          </h3>
          {senateRace && senateRace.candidates.length > 0 ? (
            <ul className="space-y-2">
              {senateRace.candidates.map((c) => (
                <CandidateRow
                  key={`${c.party}-${c.name}`}
                  name={c.name}
                  party={c.party}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No senate candidates loaded.</p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            House of Representatives
          </h3>
          <ul className="space-y-1.5">
            {federalSeats.map((fc) => (
              <li
                key={fc.id}
                className="text-sm rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                {fc.name}
                {fc.verify === false && (
                  <span className="ml-2 text-[10px] uppercase text-amber-600">
                    unverified
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-900">State elections</h3>
          <p className="mt-2 text-sm text-slate-600 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
            Governorship & State Assembly lists when INEC publishes them.
          </p>
        </section>
      </div>
    </div>
  );
}
