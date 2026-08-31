"use client";

import PopulationBarChart from "@/components/charts/PopulationBarChart";
import type { StateLocation } from "@/types/location";

interface NigeriaOverviewProps {
  states: StateLocation[];
}

export default function NigeriaOverview({ states }: NigeriaOverviewProps) {
  const totalLgas = states.reduce((n, s) => n + s.lgaCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">NaijaAtlas</h2>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Map all 36 states, the Federal Capital Territory, and their local
          government areas. Click a state on the map, pick a region above, or use
          search to drill down.
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
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
            Regions
          </dt>
          <dd className="text-2xl font-bold text-ng-green mt-0.5">6</dd>
        </div>
      </dl>

      <PopulationBarChart states={states} />
    </div>
  );
}
