"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RegionLocation } from "@/types/location";
import type { LandingStateCard } from "@/lib/landing/landingPageTypes";
import { regionShortCode } from "@/lib/landing/regionShortCode";
import { IconArrow } from "@/components/landing/icons";

type Props = {
  regions: RegionLocation[];
  statesByRegion: Record<string, LandingStateCard[]>;
};

export default function PlacesExplorer({ regions, statesByRegion }: Props) {
  const [activeRegionId, setActiveRegionId] = useState(regions[0]?.id ?? "");
  const states = useMemo(
    () => statesByRegion[activeRegionId] ?? [],
    [statesByRegion, activeRegionId]
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    states.find((s) => s.id === "NG-LA")?.id ?? states[0]?.id ?? null
  );

  const selected = useMemo(
    () => states.find((s) => s.id === selectedId) ?? states[0],
    [states, selectedId]
  );

  const zoneTitle = useMemo(() => {
    const region = regions.find((r) => r.id === activeRegionId);
    if (!region) return "";
    const count = statesByRegion[activeRegionId]?.length ?? 0;
    const extra = region.id === "NG-NC" ? " + FCT" : "";
    return `${region.name.toUpperCase()} (${count} STATES${extra})`;
  }, [activeRegionId, regions, statesByRegion]);

  const onRegionChange = (id: string) => {
    setActiveRegionId(id);
    const list = statesByRegion[id] ?? [];
    setSelectedId(list[0]?.id ?? null);
  };

  return (
    <section className="mt-28 -mx-4 md:-mx-6 px-4 md:px-6 py-16 bg-white text-slate-900 rounded-3xl relative overflow-hidden border border-slate-200 shadow-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 relative">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl bg-gradient-to-br from-primary-container/30 to-surface-dim landing-topo-grid">
            <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] via-transparent to-transparent" />
            {selected && (
              <div className="absolute bottom-6 left-4 right-4 p-5 rounded-xl bg-surface-container-lowest/85 backdrop-blur-xl border border-primary/40 shadow-2xl">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-3">
                  <div>
                    <span className="text-label-caps text-primary uppercase">
                      Selected state
                    </span>
                    <h4 className="font-landing-display text-headline-md text-on-surface">
                      {selected.name}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-primary/20 text-primary text-label-caps">
                    {regionShortCode(selected.regionId)} ZONE
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-body-sm">
                  <div>
                    <span className="text-outline text-[11px] block">CAPITAL</span>
                    <span className="text-on-surface font-semibold">
                      {selected.capital ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline text-[11px] block">LGAs</span>
                    <span className="text-on-surface font-semibold tabular-nums">
                      {selected.lgaCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline text-[11px] block">
                      POLLING UNITS
                    </span>
                    <span className="text-on-surface font-semibold tabular-nums">
                      {selected.pollingUnitCount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline text-[11px] block">CODE</span>
                    <span className="text-on-surface font-semibold">
                      {selected.code}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                  <span className="text-body-sm text-outline">
                    Electoral code: {selected.code}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/places/${selected.slug}`}
                      className="text-label-md text-[#008751] font-bold hover:underline"
                    >
                      State profile
                    </Link>
                    <Link
                      href={`/explore?map=minimal&states=${selected.id}`}
                      className="text-label-md text-slate-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Map</span>
                      <IconArrow className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col space-y-6">
          <div>
            <span className="text-label-caps text-secondary-fixed tracking-widest uppercase block mb-1">
              Geopolitical directory
            </span>
            <h2 className="font-landing-display text-headline-xl text-slate-900">
              Every state has a story.
            </h2>
            <p className="text-body-md text-slate-600 mt-2">
              Select any geopolitical zone to examine constitutional history,
              natural endowment, and local governments — then open the state
              profile or map.
            </p>
            <Link
              href="/places"
              className="inline-flex mt-3 text-label-md font-semibold text-[#008751] hover:underline"
            >
              Browse full places directory →
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onRegionChange(r.id)}
                className={`px-4 py-2 rounded-full text-label-md transition-all ${
                  activeRegionId === r.id
                    ? "bg-[#008751] text-white font-bold shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <div className="text-label-caps text-slate-500 mb-3 flex items-center justify-between gap-2">
              <span>{zoneTitle}</span>
              <span className="hidden sm:inline">CLICK TO PREVIEW</span>
            </div>
            <div className="flex flex-wrap gap-2.5 max-h-52 overflow-y-auto">
              {states.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-label-md transition-colors ${
                    selectedId === s.id
                      ? "bg-[#008751] text-white font-bold shadow-sm"
                      : "bg-white border border-slate-200 hover:border-[#008751]/40 text-slate-800"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-body-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="text-primary" aria-hidden>✓</span>
              NPC projections on state cards
            </span>
            <span aria-hidden>•</span>
            <span>All 774 LGAs geocoded</span>
          </div>
        </div>
      </div>
    </section>
  );
}
