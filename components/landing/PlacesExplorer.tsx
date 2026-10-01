"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RegionLocation } from "@/types/location";
import type { LandingStateCard } from "@/lib/landing/landingPageTypes";
import { regionShortCode } from "@/lib/landing/regionShortCode";
import { formatNumber, formatPopulation } from "@/lib/places/formatters";
import { IconArrow } from "@/components/landing/icons";
import NigeriaThumb from "@/components/hub/NigeriaThumb";

type Props = {
  regions: RegionLocation[];
  statesByRegion: Record<string, LandingStateCard[]>;
  totalPollingUnits: number;
};

/** Accent per category pill, so state / metro / land features stay distinguishable. */
const ZONE_ACCENT: Record<string, string> = {
  "NG-NC": "#6366f1",
  "NG-NE": "#8b5cf6",
  "NG-NW": "#a855f7",
  "NG-SE": "#10b981",
  "NG-SS": "#06b6d4",
  "NG-SW": "#f59e0b",
};

export default function PlacesExplorer({
  regions,
  statesByRegion,
  totalPollingUnits,
}: Props) {
  const [activeRegionId, setActiveRegionId] = useState(
    () => statesByRegion["NG-SW"] ? "NG-SW" : (regions[0]?.id ?? "")
  );
  const states = useMemo(
    () => statesByRegion[activeRegionId] ?? [],
    [statesByRegion, activeRegionId]
  );
  const [selectedId, setSelectedId] = useState<string | null>("NG-LA");

  const selected = useMemo(() => {
    const inZone = states.find((s) => s.id === selectedId);
    if (inZone) return inZone;
    // The remembered state lives in another zone — fall back to that zone's first
    // member so the map, the pills and the tooltip never disagree.
    return (
      states.find((s) => s.id === "NG-LA") ??
      states[0] ??
      null
    );
  }, [states, selectedId]);

  const zoneTitle = useMemo(() => {
    const region = regions.find((r) => r.id === activeRegionId);
    if (!region) return "";
    const count = statesByRegion[activeRegionId]?.length ?? 0;
    const extra = region.id === "NG-NC" ? " + FCT" : "";
    return `${region.name.toUpperCase()} (${count} STATES${extra})`;
  }, [activeRegionId, regions, statesByRegion]);

  const onRegionChange = (id: string) => {
    setActiveRegionId(id);
    setSelectedId((statesByRegion[id] ?? [])[0]?.id ?? null);
  };

  const accent = ZONE_ACCENT[activeRegionId] ?? "#10b981";

  return (
    <section
      id="geopolitical-directory"
      className="mt-28 -mx-4 md:-mx-6 px-4 md:px-6 py-16 bg-[#043828] text-white rounded-3xl relative overflow-hidden border border-emerald-900 shadow-2xl scroll-mt-24"
    >
      {/* Ambient contour wash so the dark band is not flat. */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[radial-gradient(circle_at_18%_22%,#34d399_0,transparent_45%),radial-gradient(circle_at_82%_78%,#0d9488_0,transparent_48%)]"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left: cartographic state preview drawn from the real UN SALB zones. */}
        <div className="lg:col-span-6 relative">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 relative shadow-2xl bg-emerald-950/40">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <NigeriaThumb
                source="regions"
                className="h-full w-full"
                highlight={activeRegionId ? [activeRegionId] : []}
                accent={accent}
                fillByKey={
                  selected ? { [activeRegionId]: accent } : undefined
                }
                markers={
                  selected?.centroid
                    ? [
                        {
                          lon: selected.centroid[0],
                          lat: selected.centroid[1],
                        },
                      ]
                    : []
                }
                title={`Map of Nigeria highlighting ${regions.find((r) => r.id === activeRegionId)?.name ?? "a geopolitical zone"}`}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#043828] via-transparent to-transparent pointer-events-none" />

            {selected && (
              <div className="absolute bottom-6 left-4 right-4 md:left-6 md:right-6 p-5 rounded-xl bg-surface-card/95 backdrop-blur-xl border border-emerald-300 shadow-2xl text-text-primary">
                <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-3">
                  <div className="min-w-0">
                    <span className="text-label-caps text-primary uppercase">
                      Selected state
                    </span>
                    <h4 className="font-landing-display text-headline-md text-text-primary truncate font-bold">
                      {selected.name} State
                    </h4>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded bg-emerald-50 text-primary text-label-caps border border-emerald-200">
                    {regionShortCode(selected.regionId)} ZONE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-body-sm">
                  <div>
                    <span className="text-slate-400 text-[11px] block font-semibold">
                      CAPITAL
                    </span>
                    <span className="text-text-primary font-bold block truncate">
                      {selected.capital ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block font-semibold">
                      POPULATION
                    </span>
                    <span className="text-text-primary font-bold block tabular-nums">
                      {formatPopulation(selected.population) ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block font-semibold">
                      LGAs
                    </span>
                    <span className="text-text-primary font-bold block tabular-nums">
                      {selected.lgaCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block font-semibold">
                      LAND AREA
                    </span>
                    <span className="text-text-primary font-bold block tabular-nums">
                      {selected.landAreaKm2
                        ? `${formatNumber(selected.landAreaKm2)} km²`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                  <span className="text-body-sm text-text-muted font-medium">
                    {selected.pollingUnitCount.toLocaleString("en-NG")}{" "}
                    polling units
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/explore?map=minimal&states=${selected.id}`}
                      className="text-label-md text-text-secondary font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Map</span>
                      <IconArrow className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/places/${selected.slug}`}
                      className="text-label-md text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Open {selected.name} profile</span>
                      <IconArrow className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: zone selector and the state directory. */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          <div>
            <span className="text-label-caps text-emerald-300 uppercase block mb-1">
              Geopolitical directory
            </span>
            <h2 className="font-landing-display text-headline-xl text-white font-extrabold">
              Every state has a story.
            </h2>
            <p className="text-body-md text-emerald-100/90 mt-2">
              Pick a zone to load its states, then open a full Places profile with
              its LGAs, land, people and civic governance. Places is the home of
              every state directory — pick any pill below to begin.
            </p>
            <Link
              href="/places"
              className="inline-flex mt-3 items-center gap-1.5 text-label-md font-bold text-emerald-200 hover:text-white hover:underline"
            >
              <span>Browse the full Places directory</span>
              <IconArrow className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-2" role="tablist" aria-label="Geopolitical zones">
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={activeRegionId === r.id}
                onClick={() => onRegionChange(r.id)}
                className={`px-4 py-2 rounded-full text-label-md transition-all ${
                  activeRegionId === r.id
                    ? "bg-surface-card text-[#043828] font-bold shadow-md"
                    : "bg-surface-card/10 text-white hover:bg-surface-card/20 font-semibold"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          <div className="bg-black/25 rounded-2xl p-6 border border-white/10">
            <div className="text-label-caps text-emerald-200 mb-3 flex items-center justify-between gap-2 font-semibold">
              <span>{zoneTitle}</span>
              <span className="hidden sm:inline">CLICK TO LOAD METRICS</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {states.map((s) => {
                const isSelected = selected?.id === s.id;
                return (
                  <Link
                    key={s.id}
                    href={`/places/${s.slug}`}
                    onClick={() => setSelectedId(s.id)}
                    onMouseEnter={() => setSelectedId(s.id)}
                    onFocus={() => setSelectedId(s.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-label-md transition-colors ${
                      isSelected
                        ? "bg-primary-container text-white font-bold shadow-sm"
                        : "bg-surface-card/10 hover:bg-surface-card/20 text-white"
                    }`}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    {s.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-body-sm text-emerald-200/90">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="text-emerald-300" aria-hidden>
                &#10003;
              </span>
              NPC 2023 projections verified
            </span>
            <span aria-hidden>&bull;</span>
            <span>
              {totalPollingUnits.toLocaleString("en-NG")} polling units geocoded
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
