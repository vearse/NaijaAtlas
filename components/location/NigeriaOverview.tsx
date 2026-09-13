"use client";

import PopulationBarChart from "@/components/charts/PopulationBarChart";
import CountryProfile from "@/components/compare/CountryProfile";
import { totalLandAreaKm2 } from "@/lib/compare/landArea";
import { formatAreaKm2 } from "@/lib/map/metrics";
import type { CompareBundle } from "@/types/compare";
import type { StateLocation } from "@/types/location";

interface NigeriaOverviewProps {
  states: StateLocation[];
  compareBundle: CompareBundle;
}

export default function NigeriaOverview({
  states,
  compareBundle,
}: NigeriaOverviewProps) {
  const totalLgas = states.reduce((n, s) => n + s.lgaCount, 0);
  const totalLand = totalLandAreaKm2(
    compareBundle,
    states.map((s) => s.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Nigeria</h2>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          The Federal Republic of Nigeria — 36 states, the Federal Capital
          Territory, 774 local government areas, and 6 geopolitical regions.
          Click a state on the map, pick a region above, or search to explore.
          Select up to 3 states to compare side by side.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            States
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">
            {states.length}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            LGAs
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">
            {totalLgas}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total land area
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">
            {totalLand != null ? formatAreaKm2(totalLand) : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center border border-slate-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Geopolitical regions
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">6</dd>
        </div>
      </dl>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Country profile
        </p>
        <CountryProfile bundle={compareBundle} />
      </div>

      <PopulationBarChart states={states} />
    </div>
  );
}
