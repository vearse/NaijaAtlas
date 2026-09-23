"use client";

import { useMemo, useState } from "react";
import type { PoliticsBundle } from "@/types/politics";
import { useMapStore } from "@/lib/store/mapStore";
import { colorForDistrict } from "@/lib/politics/senatorialColors";
import { CandidateRow } from "./CandidateAvatar";
import PresidentialTicketList from "./PresidentialTicketList";

interface ElectionDistrictDetailProps {
  politics: PoliticsBundle;
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

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
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

  const [openReps, setOpenReps] = useState<Set<string>>(() => new Set());

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

        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            House of Representatives
          </h3>
          {federalSeats.length > 0 ? (
            <ul className="space-y-2">
              {federalSeats.map((fc) => {
                const race = lookups.repsByFederalConstituencyId[fc.id];
                const open = openReps.has(fc.id);
                const candidateCount = race?.candidates.length ?? 0;
                return (
                  <li
                    key={fc.id}
                    className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenReps((s) => toggleInSet(s, fc.id))}
                      aria-expanded={open}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900 truncate">
                          {fc.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {candidateCount > 0
                            ? `${candidateCount} candidate${candidateCount === 1 ? "" : "s"}`
                            : "No candidates loaded"}
                          {fc.verify === false && (
                            <span className="ml-1.5 text-[10px] uppercase text-amber-600">
                              unverified
                            </span>
                          )}
                        </span>
                      </span>
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <ul className="px-2 pb-2 space-y-1.5">
                        {race && race.candidates.length > 0 ? (
                          race.candidates.map((c, i) => (
                            <li
                              key={`${fc.id}-${c.party}-${c.name}-${i}`}
                              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {c.name}
                                </p>
                                {(c.gender || c.age) && (
                                  <p className="text-[10px] text-slate-400">
                                    {[
                                      c.gender,
                                      c.age ? `Age ${c.age}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                )}
                                {c.qualification && (
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {c.qualification}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                                {c.party}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500 px-2 py-1">
                            No candidates loaded for this constituency.
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No federal constituencies for this district.
            </p>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Presidential
          </h3>
          <PresidentialTicketList presidential={presidential} />
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