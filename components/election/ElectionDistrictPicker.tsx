"use client";

import type { PoliticsBundle } from "@/types/politics";
import { useMapStore } from "@/lib/store/mapStore";
import { colorForDistrict } from "@/lib/politics/senatorialColors";

interface ElectionDistrictPickerProps {
  politics: PoliticsBundle;
}

export default function ElectionDistrictPicker({
  politics,
}: ElectionDistrictPickerProps) {
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const setSelectedSenatorialDistrict = useMapStore(
    (s) => s.setSelectedSenatorialDistrict
  );
  const { lookups } = politics;

  const districts =
    selectedStateIds.size === 0
      ? []
      : [...selectedStateIds].flatMap(
          (sid) => lookups.districtsByStateId[sid] ?? []
        );

  return (
    <section className="space-y-3">
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
          {districts.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelectedSenatorialDistrict(d.id)}
                className="w-full text-left rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm hover:border-ng-green/40 hover:shadow transition flex items-center gap-3"
              >
                <span
                  className="h-4 w-4 rounded-md shrink-0 ring-1 ring-black/5"
                  style={{
                    backgroundColor: colorForDistrict(lookups, d.id),
                  }}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-900 block truncate">
                    {d.name}
                  </span>
                  <span className="text-xs text-slate-500">{d.state}</span>
                </span>
              </button>
            </li>
          ))}
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
