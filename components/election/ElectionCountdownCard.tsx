"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  countdownTo,
  formatElectionDate,
  type Countdown,
} from "@/lib/election/countdown";
import type { PresidentialBundle } from "@/types/politics";

interface ElectionCountdownCardProps {
  presidential: PresidentialBundle;
}

/** Re-check the countdown hourly; the phrasing only changes on day boundaries. */
function useCountdown(isoDate: string | undefined): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(() =>
    countdownTo(isoDate)
  );

  useEffect(() => {
    setCountdown(countdownTo(isoDate));
    const id = window.setInterval(
      () => setCountdown(countdownTo(isoDate)),
      60 * 60 * 1000
    );
    return () => window.clearInterval(id);
  }, [isoDate]);

  return countdown;
}

interface ElectionCountdownCardProps {
  presidential: PresidentialBundle;
  /** Reported so the shared map slot can skip this card when it has nothing to show. */
  onVisibleChange?: (visible: boolean) => void;
}

export default function ElectionCountdownCard({
  presidential,
  onVisibleChange,
}: ElectionCountdownCardProps) {
  const isMobile = useIsMobile();
  const setMapType = useMapStore((s) => s.setMapType);
  const setElectionView = useMapStore((s) => s.setElectionView);
  const openMobileSheet = useMapStore((s) => s.openMobileSheet);

  const electionDate = presidential.election.election_date;
  const countdown = useCountdown(electionDate);
  const candidateCount = presidential.candidates.length;
  const visible = countdown != null;

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [onVisibleChange, visible]);

  if (!countdown) return null;

  const open = () => {
    setMapType("election");
    setElectionView("presidential");
    if (isMobile) openMobileSheet();
  };

  return (
    <div className="rounded-xl border border-emerald-200/90 bg-white/95 backdrop-blur px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
        {presidential.election.type ?? "Election"} ·{" "}
        {presidential.election.year ?? ""}
      </p>

      <p className="text-sm font-bold text-slate-900 mt-1 leading-snug">
        {countdown.past
          ? "Election day has arrived"
          : countdown.relative
            ? `Election in ${countdown.relative}`
            : "Election within 24 hours"}
      </p>

      <p className="text-[11px] text-slate-500 mt-0.5">
        {formatElectionDate(electionDate)}
        {candidateCount > 0 ? ` · ${candidateCount} tickets` : ""}
      </p>

      <button
        type="button"
        onClick={open}
        className="mt-2 w-full rounded-lg bg-ng-green px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
      >
        Click here to view candidate
      </button>
    </div>
  );
}
