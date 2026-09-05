"use client";

import PopulationBarChart from "@/components/charts/PopulationBarChart";
import CountryProfile from "@/components/compare/CountryProfile";
import { totalLandAreaKm2 } from "@/lib/compare/landArea";
import { formatAreaKm2 } from "@/lib/map/metrics";
import { useMapStore } from "@/lib/store/mapStore";
import type { CompareBundle } from "@/types/compare";
import type { StateLocation } from "@/types/location";
import generalData from "@/data/compare/country/general.json";

interface LanguageEntry {
  name: string;
  role: string;
  wikiUrl: string;
}

const ngGeneral = (generalData as { NG: { languagesList?: LanguageEntry[] } }).NG;
const languagesList = ngGeneral.languagesList ?? [];

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
  const openWikiModal = useMapStore((s) => s.openWikiModal);

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
        <label
          htmlFor="country-language-select"
          className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between"
        >
          <span>Languages</span>
          <span className="text-slate-400/80 font-normal normal-case tracking-normal text-[10px]">
            Select a language to read more
          </span>
        </label>
        <div className="flex gap-2 items-stretch">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden>
              🗣️
            </span>
            <select
              id="country-language-select"
              onChange={(e) => {
                const url = e.target.value;
                if (!url) return;
                const entry = languagesList.find((l) => l.wikiUrl === url);
                openWikiModal(
                  url,
                  entry ? `${entry.name} language` : "Language"
                );
                e.target.value = "";
              }}
              defaultValue=""
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm shadow-sm min-h-[42px] focus:outline-none focus:ring-2 focus:ring-ng-green/40 appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select a language…
              </option>
              {languagesList.map((lang) => (
                <option key={lang.wikiUrl} value={lang.wikiUrl}>
                  {lang.name} — {lang.role}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" aria-hidden>
              ▾
            </span>
          </div>
        </div>
      </div>

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
