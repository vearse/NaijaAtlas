"use client";

import type { PoliticsBundle } from "@/types/politics";
import { useMapStore } from "@/lib/store/mapStore";
import { colorForDistrict } from "@/lib/politics/senatorialColors";

interface ElectionDistrictPickerProps {
  politics: PoliticsBundle;
  onShowPresidential: () => void;
}

export default function ElectionDistrictPicker({
  politics,
  onShowPresidential,
}: ElectionDistrictPickerProps) {
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const setSelectedSenatorialDistrict = useMapStore(
    (s) => s.setSelectedSenatorialDistrict
  );
  const confirmedPollingUnit = useMapStore((s) => s.confirmedPollingUnit);
  const { lookups, presidential } = politics;

  const yourDistrictId = confirmedPollingUnit
    ? (lookups.lgaToSenatorialDistrictId[confirmedPollingUnit.lgaId] ?? null)
    : null;

  const yourDistrict =
    yourDistrictId != null
      ? (lookups.districtById[yourDistrictId] ?? null)
      : null;

  const selectedDistricts =
    selectedStateIds.size === 0
      ? []
      : [...selectedStateIds].flatMap(
          (sid) => lookups.districtsByStateId[sid] ?? []
        );

  const districts = yourDistrict
    ? [
        yourDistrict,
        ...selectedDistricts.filter((d) => d.id !== yourDistrictId),
      ]
    : selectedDistricts;

  const ticketCount = presidential.candidates.length;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={onShowPresidential}
        className="w-full text-left rounded-xl border border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-3 py-3 shadow-sm hover:border-ng-green/40 hover:shadow transition flex items-center gap-3"
      >
        <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-ng-green text-lg text-white shadow-sm">
          🗳️
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-bold text-slate-900 block">
            Presidential candidates
          </span>
          <span className="text-xs text-slate-500 block">
            All {ticketCount} tickets · 2027
          </span>
        </span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          →
        </span>
      </button>

      <div>
        <h2 className="text-sm font-bold text-slate-900">Senatorial districts</h2>
        <p className="text-xs text-slate-500 mt-1">
          {selectedStateIds.size === 0
            ? "Select one or more states on the map to list districts."
            : "Tap a district for candidates, or click an LGA on the map."}
        </p>
      </div>

      {districts.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-1">
          {districts.map((d) => {
            const isYour = d.id === yourDistrictId;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setSelectedSenatorialDistrict(d.id)}
                  className={`w-full text-left rounded-xl border bg-white px-3 py-3 shadow-sm hover:shadow transition flex items-center gap-3 ${
                    isYour
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : "border-slate-100 hover:border-ng-green/40"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-md shrink-0 ring-1 ring-black/5"
                    style={{
                      backgroundColor: colorForDistrict(lookups, d.id),
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 block truncate">
                      {d.name}
                    </span>
                    <span className="text-xs text-slate-500">{d.state}</span>
                  </span>
                  {isYour && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                      Your constituency
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
          Map states appear here with distinct district colors from a shared
          palette.
        </div>
      )}
    </section>
  );
}