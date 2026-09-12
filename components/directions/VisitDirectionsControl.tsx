"use client";

import { useEffect, useState } from "react";
import {
  useMapStore,
  type DirectionsTarget,
} from "@/lib/store/mapStore";
import {
  fetchDrivingRoute,
  geodesicLine,
  type DrivingRouteResult,
} from "@/lib/map/directionsApi";
import { findCityCoordsByName } from "@/lib/map/cityCoordsLookup";

interface VisitDirectionsControlProps {
  feature: {
    name: string;
    lonLat?: [number, number] | null | undefined;
    kind: "state" | "lga" | "overlay" | "mapFeature";
  };
}

function formatDuration(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `~${m} min`;
  if (m === 0) return `~${h} h`;
  return `~${h} h ${m} m`;
}

export default function VisitDirectionsControl({
  feature,
}: VisitDirectionsControlProps) {
  const directions = useMapStore((s) => s.directions);
  const setDirectionsFrom = useMapStore((s) => s.setDirectionsFrom);
  const setDirectionsTo = useMapStore((s) => s.setDirectionsTo);
  const setDirectionsRoute = useMapStore((s) => s.setDirectionsRoute);
  const toggleDirections = useMapStore((s) => s.toggleDirections);
  const clearDirections = useMapStore((s) => s.clearDirections);
  const setMapActionHint = useMapStore((s) => s.setMapActionHint);
  const setMapType = useMapStore((s) => s.setMapType);

  const [fetching, setFetching] = useState(false);
  const [routeStats, setRouteStats] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const toLonLat: [number, number] | null =
    feature.lonLat ?? findCityCoordsByName(feature.name);

  useEffect(() => {
    if (!toLonLat) return;
    setDirectionsTo({
      name: feature.name,
      lonLat: toLonLat,
      kind:
        feature.kind === "mapFeature"
          ? "overlay"
          : feature.kind === "state" || feature.kind === "lga"
            ? feature.kind
            : "overlay",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature.name, toLonLat?.[0], toLonLat?.[1], feature.kind, setDirectionsTo]);

  useEffect(() => {
    if (!directions.routeGeoJSON || !directions.active) {
      setRouteStats(null);
      setFallbackUsed(false);
    }
  }, [directions.routeGeoJSON, directions.active]);

  if (!toLonLat) return null;

  const fromSet = directions.from != null;
  const toSet = directions.to != null;
  const canVisit = fromSet && toSet && !fetching;

  function handleUseMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMapActionHint("Geolocation is not available in this browser.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLoading(false);
        const lon = pos.coords.longitude;
        const lat = pos.coords.latitude;
        const name = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
        const target: DirectionsTarget = {
          name: "Your location",
          lonLat: [lon, lat],
          kind: "custom",
        };
        setDirectionsFrom(target);
        void name;
      },
      (err) => {
        setLocationLoading(false);
        const msg =
          err.code === 1
            ? "Location access denied. Enable permissions to use auto-fill."
            : "Couldn't determine your location. Please try again.";
        setMapActionHint(msg);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }

  async function handleVisit() {
    if (!directions.from || !directions.to) return;
    setFetching(true);
    setFallbackUsed(false);
    setRouteStats(null);
    setMapActionHint("Computing route…");
    toggleDirections(true);

    let result: DrivingRouteResult | null = null;
    let usedFallback = false;
    try {
      result = await fetchDrivingRoute(
        directions.from.lonLat,
        directions.to.lonLat
      );
    } catch {
      usedFallback = true;
      result = {
        route: geodesicLine(directions.from.lonLat, directions.to.lonLat),
        distanceKm: 0,
        durationMin: 0,
      };
    } finally {
      setFetching(false);
    }
    setDirectionsRoute(result.route);
    if (usedFallback) {
      setFallbackUsed(true);
      setMapActionHint("Straight line (directions offline)");
    } else {
      setRouteStats({
        distanceKm: result.distanceKm,
        durationMin: result.durationMin,
      });
      setMapActionHint(null);
    }
  }

  return (
    <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-ng-green text-sm"
          >
            🧭
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Plan visit
          </p>
        </div>
        {(directions.from ||
          directions.routeGeoJSON ||
          routeStats ||
          fallbackUsed) && (
          <button
            type="button"
            onClick={() => {
              clearDirections();
              setRouteStats(null);
              setFallbackUsed(false);
            }}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear route
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            From
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {directions.from ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full bg-blue-500"
                />
                {directions.from.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 px-3 py-1 text-xs font-medium">
                <span aria-hidden>📍</span>
                Your current location
              </span>
            )}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locationLoading}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {locationLoading ? "Detecting…" : "Use my location"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            To
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            />
            {feature.name}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleVisit}
        disabled={!canVisit}
        className={[
          "w-full rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
          canVisit
            ? "bg-ng-green text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm"
            : "bg-slate-100 text-slate-400 cursor-not-allowed",
        ].join(" ")}
      >
        {fetching ? (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin"
            />
            Computing route…
          </span>
        ) : (
          <span>Visit {feature.kind === "state" ? "" : feature.kind === "lga" ? "LGA" : "site"} (driving)</span>
        )}
      </button>

      {!canVisit && !fetching && (
        <p className="text-[11px] text-slate-400 text-center leading-relaxed -mt-1">
          Select destination + set your location first.
        </p>
      )}

      {(routeStats || fallbackUsed) && (
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-medium">
              {fallbackUsed ? "Straight line" : "Route"}
            </span>
            <span className="font-semibold text-slate-700 tabular-nums">
              {fallbackUsed
                ? "As the crow flies"
                : [
                    routeStats?.distanceKm != null
                      ? `${routeStats.distanceKm.toFixed(1)} km`
                      : "",
                    routeStats?.durationMin != null
                      ? formatDuration(routeStats.durationMin)
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </span>
          </div>
          {fallbackUsed && (
            <p className="text-[10px] text-amber-600 mt-1 leading-relaxed">
              Driving directions unavailable right now — straight line shown.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
