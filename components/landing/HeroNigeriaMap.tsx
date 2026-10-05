"use client";

import { useState } from "react";
import Link from "next/link";
import NigeriaStateMap from "@/components/places/NigeriaStateMap";
import type { LandingStateCard } from "@/lib/landing/landingPageTypes";

function describe(s: LandingStateCard): string {
  const pop = s.population ? `${(s.population / 1_000_000).toFixed(1)}M people` : null;
  const parts = [
    `${s.name} sits in the ${s.regionName} zone`,
    s.capital ? `with ${s.capital} as its capital` : null,
  ].filter(Boolean);
  return `${parts.join(" ")}. ${s.lgaCount} LGAs${pop ? ` · ${pop}` : ""}.`;
}

/** The Places hub's state map, sized for the landing hero. Tapping a state shows a short note. */
export default function HeroNigeriaMap({
  states,
}: {
  states: LandingStateCard[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? states.find((s) => s.id === selectedId) : null;

  return (
    <div className="w-full">
      <NigeriaStateMap
        states={states}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
        mapClassName="h-[24rem] w-full sm:h-[28rem] lg:h-[32rem]"
      />

      <div className="mt-3 min-h-[3.25rem]">
        {selected ? (
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 text-body-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{selected.name}: </span>
              {describe(selected)}
            </p>
            <Link
              href={`/places/${selected.slug}`}
              className="shrink-0 text-label-md font-semibold text-primary hover:underline"
            >
              Profile →
            </Link>
          </div>
        ) : (
          <p className="text-body-sm text-text-muted">
            Tap any state for a quick introduction.
          </p>
        )}
      </div>

      {/* <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/places"
          className="inline-flex h-10 items-center rounded-xl border border-primary-container px-4 text-label-md font-semibold text-primary hover:bg-emerald-50"
        >
          Browse every state
        </Link>
        <Link
          href="/places/map"
          className="inline-flex h-10 items-center rounded-xl bg-primary-container px-4 text-label-md font-semibold text-white hover:bg-[#006d40]"
        >
          Open the live map
        </Link>
      </div> */}
    </div>
  );
}
