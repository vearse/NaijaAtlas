"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import { resolveDefaultRankingMetric } from "@/lib/ranking/defaults";
import type { CompareBundle } from "@/types/compare";
import type { StateLocation } from "@/types/location";
import type { PresidentialBundle } from "@/types/politics";
import ElectionCountdownCard from "@/components/election/ElectionCountdownCard";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  countdownTo,
  formatElectionDate,
} from "@/lib/election/countdown";

const ROTATE_MS = 12_000;

const CARD_CLASS =
  "w-full text-left rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 to-white px-4 py-3.5 shadow-sm hover:border-emerald-300 transition-colors";

interface OverviewMapModesCarouselProps {
  states: StateLocation[];
  compareBundle: CompareBundle;
  presidential: PresidentialBundle;
}

export default function OverviewMapModesCarousel({
  states,
  compareBundle,
  presidential,
}: OverviewMapModesCarouselProps) {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const enterRankingMode = useMapStore((s) => s.enterRankingMode);
  const setMapType = useMapStore((s) => s.setMapType);
  const openMobileSheet = useMapStore((s) => s.openMobileSheet);
  const isMobile = useIsMobile();

  const election = presidential.election;
  const electionDate = election.election_date;
  const countdown = countdownTo(electionDate);
  const candidateCount = presidential.candidates.length;

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % 2);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const activateSlide = () => {
    if (slide === 0) {
      enterRankingMode(resolveDefaultRankingMetric(compareBundle, states));
      return;
    }
    setMapType("election");
    if (isMobile) openMobileSheet();
  };

  return (
    <div
      className="space-y-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        onClick={activateSlide}
        className={CARD_CLASS}
        aria-label={
          slide === 0 ? "Open ranking mode on the map" : "Open election mode"
        }
      >
        {slide === 0 ? (
          <>
            <p className="text-sm font-bold text-slate-900">
              Rank states on the map
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Color every state by Economy or Social indicators — IGR,
              literacy, poverty, and more.
            </p>
          </>
        ) : countdown ? (
          <>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              {countdown.past
                ? "Election day has arrived"
                : countdown.relative
                  ? `Election in ${countdown.relative}`
                  : "Election within 24 hours"}
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {formatElectionDate(electionDate)}
              {candidateCount > 0 ? ` · ${candidateCount} tickets` : ""}. Tap to
              open election mode — senatorial districts and candidates on the
              map.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-900">Election mode</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Tap to explore 2027 elections on the map.
            </p>
          </>
        )}
      </button>

      <div
        className="flex items-center justify-center gap-1.5"
        role="tablist"
        aria-label="Overview map modes"
      >
        {(["ranking", "election"] as const).map((key, i) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={slide === i}
            aria-label={key === "ranking" ? "Ranking" : "Election"}
            onClick={() => setSlide(i)}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              slide === i ? "bg-ng-green" : "bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
