"use client";

import { useMapStore } from "@/lib/store/mapStore";
import type { LgaContent, LgaLocation } from "@/types/location";

interface LgaDetailsProps {
  content: LgaContent;
  location: LgaLocation;
  regionName?: string;
  wards?: string[];
}

export default function LgaDetails({
  content,
  location,
  regionName,
  wards = [],
}: LgaDetailsProps) {
  const setSelectedLga = useMapStore((s) => s.setSelectedLga);
  const [lon, lat] = location.centroid;
  const wardList = wards.length > 0 ? wards : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {content.stateName} State · LGA
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{content.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => setSelectedLga(null)}
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close LGA details"
        >
          Close
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <dt className="text-slate-500">State</dt>
        <dd className="font-medium">{content.stateName}</dd>
        <dt className="text-slate-500">Wards</dt>
        <dd className="font-medium">{wardList.length || content.wardCount || "—"}</dd>
        <dt className="text-slate-500">Region</dt>
        <dd className="font-medium">{regionName ?? location.regionId}</dd>
        <dt className="text-slate-500">Code</dt>
        <dd className="font-mono text-xs font-medium text-slate-700">
          {location.id}
        </dd>
        <dt className="text-slate-500">Centroid</dt>
        <dd className="font-mono text-xs text-slate-600">
          {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
        </dd>
      </dl>

      <p className="text-sm text-slate-600 leading-relaxed">
        {content.description}
      </p>

      {wardList.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Wards ({wardList.length})
          </h3>
          <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
            {wardList.map((ward) => (
              <li
                key={ward}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {ward}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
