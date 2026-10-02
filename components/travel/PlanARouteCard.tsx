"use client";

import { useMemo } from "react";
import Link from "next/link";
import PlacePicker from "@/components/travel/PlacePicker";
import { haversineKm, useRoutePlaces } from "@/hooks/useRoutePlaces";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubPlace } from "@/lib/server/loadTravelHubData";

export const MODES = ["Drive", "Fly + Drive", "Walk"] as const;
export type Mode = (typeof MODES)[number];

/** Straight-line distance stretched to approximate the road network. */
const ROAD_FACTOR = 1.3;
const DRIVE_KMH = 65;
const WALK_KMH = 5;

function formatHours(h: number): string {
  if (h >= 48) return `${Math.round(h / 24)} days`;
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return hours ? `${hours}h ${mins.toString().padStart(2, "0")}m` : `${mins}m`;
}

function estimate(km: number, mode: Mode): string {
  if (mode === "Walk") return formatHours(km / WALK_KMH);
  if (mode === "Fly + Drive" && km > 250) {
    // Flight time plus check-in and airport transfers at both ends.
    return formatHours(km / 650 + 2.5);
  }
  return formatHours(km / DRIVE_KMH);
}

export default function PlanARouteCard({
  cities,
  destinations,
  fromId,
  toId,
  onFromChange,
  onToChange,
  mode,
  onModeChange,
}: {
  cities: HubPlace[];
  destinations: HubPlace[];
  fromId: string;
  toId: string;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
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
  const straight = from && to ? haversineKm(from, to) : null;
  const roadKm = straight != null ? straight * ROAD_FACTOR : null;
  const sameStop = fromId === toId;

  const href =
    from && to && !sameStop
      ? sectionMapHref("travel/directions", {
          basemap: "osm",
          directions: { from: from.name, to: to.name },
        })
      : sectionMapHref("travel/directions", { basemap: "osm" });

  const swap = () => {
    onFromChange(toId);
    onToChange(fromId);
  };

  return (
    <section id="plan-a-route" className="scroll-mt-28">
      <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-6 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="relative">
              <PlacePicker
                label="From"
                value={fromId}
                onChange={onFromChange}
                options={options}
                placeholder="Search a start city or place"
                action={
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={location.status === "busy"}
                    title="Use my location"
                    aria-label="Use my location as the start"
                    className="mr-0.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-surface-card px-2 text-[11px] font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary disabled:opacity-50"
                  >
                    <span aria-hidden>◎</span>
                    <span className="hidden sm:inline">
                      {location.status === "busy" ? "Locating…" : "My location"}
                    </span>
                  </button>
                }
              />
              {location.status === "error" ? (
                <p className="mt-1 text-[11px] text-alert-coral">{location.message}</p>
              ) : location.status === "found" ? (
                <p className="mt-1 text-[11px] text-text-muted">
                  Start set to {location.placeName} ·{" "}
                  {location.distanceKm < 1
                    ? `${Math.round(location.distanceKm * 1000)} m away`
                    : `${location.distanceKm.toFixed(1)} km away`}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={swap}
              aria-label="Swap start and destination"
              className="mb-6 hidden h-10 w-10 items-center justify-center self-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-transform duration-200 hover:rotate-180 hover:text-primary md:inline-flex"
            >
              ⇄
            </button>

            <PlacePicker
              label="To"
              accent
              value={toId}
              onChange={onToChange}
              options={options}
              placeholder="Search a destination"
            />
          </div>

          <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="mb-1.5 block font-label-caps text-label-caps uppercase text-text-muted">
                Transit mode
              </span>
              <div
                className="inline-flex rounded-lg border border-border-subtle bg-surface-base p-1 font-label-md text-label-md"
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
                    className={`rounded px-3 py-1.5 transition-colors ${
                      mode === m
                        ? "bg-surface-card font-semibold text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Link
              href={href}
              className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 font-label-md text-label-md text-white shadow-sm transition-all duration-150 hover:bg-primary sm:w-auto"
            >
              Get directions
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-body-sm">
          {sameStop ? (
            <p className="text-text-muted">Pick two different places to estimate a trip.</p>
          ) : roadKm != null ? (
            <div className="flex flex-wrap items-center gap-6 text-text-secondary">
              <Metric term="Road distance" value={`~${Math.round(roadKm).toLocaleString("en-NG")} km`} />
              <Metric term="Est. time" value={estimate(roadKm, mode)} note={mode} />
              {from && to && (
                <Metric term="Route" value={`${from.stateName || "—"} → ${to.stateName || "—"}`} />
              )}
            </div>
          ) : (
            <p className="text-text-muted">No coordinates for one of these places.</p>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-heritage-amber-tint px-3 py-1 font-label-caps text-label-caps text-heritage-amber">
            Estimate only · exact route on the map
          </span>
        </div>
      </div>
    </section>
  );
}

function Metric({ term, value, note }: { term: string; value: string; note?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-text-secondary">
      <span className="font-medium text-text-muted">{term}:</span>
      <span className="font-semibold text-text-primary">{value}</span>
      {note ? <span className="text-text-muted">({note})</span> : null}
    </div>
  );
}