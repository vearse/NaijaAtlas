"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PlacePicker from "@/components/travel/PlacePicker";
import { MODES, type Mode } from "@/components/travel/PlanARouteCard";
import { haversineKm, useRoutePlaces } from "@/hooks/useRoutePlaces";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubPlace } from "@/lib/server/loadTravelHubData";

/** True once the element has been scrolled fully past the top of the viewport. */
function useScrolledPast(id: string): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setPast(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  return past;
}

/** True while any part of the element is inside the viewport. */
function useInView(id: string): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;

    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
      // Treat the tall planner card as in view slightly early so the bar hands
      // over cleanly instead of overlapping it mid-scroll.
      rootMargin: "0px 0px -12% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  return visible;
}

type Props = {
  cities: HubPlace[];
  destinations: HubPlace[];
  fromId: string;
  toId: string;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  /** Section the bar waits for before it appears. */
  revealAfterId: string;
  /** Full planner card; the bar hides while it is on screen. */
  plannerId: string;
};

/**
 * Compact route bar pinned to the bottom of the viewport once the reader is
 * past the destinations section, so any pick made further down the page lands
 * in the planner without scrolling back up.
 */
export default function StickyRouteBar({
  cities,
  destinations,
  fromId,
  toId,
  onFromChange,
  onToChange,
  mode,
  onModeChange,
  revealAfterId,
  plannerId,
}: Props) {
  const revealed = useScrolledPast(revealAfterId);
  const plannerVisible = useInView(plannerId);
  const show = revealed && !plannerVisible;

  const { options, location, useMyLocation } = useRoutePlaces({
    cities,
    destinations,
    onPick: onFromChange,
  });

  const byId = useMemo(() => {
    const m = new Map<string, HubPlace>();
    for (const p of [...cities, ...destinations]) m.set(p.id, p);
    return m;
  }, [cities, destinations]);

  const from = byId.get(fromId);
  const to = byId.get(toId);
  const sameStop = fromId === toId;
  const straight = from && to ? haversineKm(from, to) : null;
  const roadKm = straight != null ? straight * 1.3 : null;

  const swap = () => {
    onFromChange(toId);
    onToChange(fromId);
  };

  const href =
    from && to && !sameStop
      ? sectionMapHref("travel/directions", {
          basemap: "osm",
          directions: { from: from.name, to: to.name },
        })
      : sectionMapHref("travel/directions", { basemap: "osm" });

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="pointer-events-auto mx-auto max-w-[1200px] animate-scale-in rounded-2xl border border-border-subtle bg-surface-card/95 p-3 shadow-2xl backdrop-blur-md sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="relative">
              <PlacePicker
                label="From"
                size="sm"
                value={fromId}
                onChange={onFromChange}
                options={options}
                placeholder="Search a start city"
                action={
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={location.status === "busy"}
                    title="Use my location"
                    aria-label="Use my location as the start"
                    className="mr-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-surface-card px-1.5 text-[10px] font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary disabled:opacity-50"
                  >
                    <span aria-hidden>◎</span>
                    {location.status === "busy" ? "Locating…" : "My location"}
                  </button>
                }
              />
              {location.status === "error" ? (
                <p className="mt-1 text-[11px] text-alert-coral">{location.message}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={swap}
              aria-label="Swap start and destination"
              className="hidden h-8 w-8 items-center justify-center self-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-transform duration-200 hover:rotate-180 hover:text-primary sm:inline-flex"
            >
              ⇄
            </button>

            <PlacePicker
              label="To"
              accent
              size="sm"
              value={toId}
              onChange={onToChange}
              options={options}
              placeholder="Search a destination"
            />
          </div>

          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <div
              className="inline-flex rounded-lg border border-border-subtle bg-surface-base p-0.5 font-label-md text-label-md"
              role="radiogroup"
              aria-label="Transit mode"
            >
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => onModeChange(m)}
                  className={`rounded px-2 py-1 text-[12px] transition-colors ${
                    mode === m
                      ? "bg-surface-card font-semibold text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <span className="hidden shrink-0 text-[11px] text-text-muted xl:inline">
              {sameStop
                ? "Pick two places"
                : roadKm != null
                  ? `~${Math.round(roadKm).toLocaleString("en-NG")} km`
                  : "—"}
            </span>

            <Link
              href={href}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 font-label-md text-label-md text-white shadow-sm transition-colors hover:bg-primary"
            >
              Get directions
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}