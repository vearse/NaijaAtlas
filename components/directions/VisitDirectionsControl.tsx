"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useMapStore,
  type DirectionsTarget,
} from "@/lib/store/mapStore";
import {
  fetchDrivingRoute,
  geodesicLine,
  type DrivingRouteResult,
  type DrivingStep,
} from "@/lib/map/directionsApi";
import {
  findCityCoordsByName,
  searchCitySuggestions,
} from "@/lib/map/cityCoordsLookup";

interface VisitDirectionsControlProps {
  feature: {
    name: string;
    lonLat?: [number, number] | null | undefined;
    kind: "state" | "lga" | "overlay" | "mapFeature";
  };
  restoreMapTypeOnClose?: boolean;
}

function formatDuration(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `~${m} min`;
  if (m === 0) return `~${h} h`;
  return `~${h} h ${m} m`;
}

function formatStepDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function maneuverGlyph(step: DrivingStep): string {
  const t = step.maneuverType;
  const m = step.modifier ?? "";
  if (t === "depart") return "➤";
  if (t === "arrive") return "🏁";
  if (t === "roundabout" || t === "rotary") return "↻";
  if (m.includes("uturn")) return "↩";
  if (m.includes("right")) return m.startsWith("slight") ? "↗" : "→";
  if (m.includes("left")) return m.startsWith("slight") ? "↖" : "←";
  if (m.includes("straight")) return "↑";
  return "•";
}

export default function VisitDirectionsControl({
  feature,
  restoreMapTypeOnClose = false,
}: VisitDirectionsControlProps) {
  const directions = useMapStore((s) => s.directions);
  const setDirectionsFrom = useMapStore((s) => s.setDirectionsFrom);
  const setDirectionsTo = useMapStore((s) => s.setDirectionsTo);
  const setDirectionsRoute = useMapStore((s) => s.setDirectionsRoute);
  const setDirectionsSteps = useMapStore((s) => s.setDirectionsSteps);
  const toggleDirections = useMapStore((s) => s.toggleDirections);
  const clearDirections = useMapStore((s) => s.clearDirections);
  const setMapActionHint = useMapStore((s) => s.setMapActionHint);
  const setMapType = useMapStore((s) => s.setMapType);
  const restoreMapTypeAfterDirections = useMapStore(
    (s) => s.restoreMapTypeAfterDirections
  );
  const closeDirectionsModal = useMapStore((s) => s.closeDirectionsModal);

  const [fetching, setFetching] = useState(false);
  const [routeStats, setRouteStats] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [fromPickerOpen, setFromPickerOpen] = useState(false);
  const [fromQuery, setFromQuery] = useState("");

  const fromSuggestions = searchCitySuggestions(fromQuery.trim());

  // Collapse consecutive steps that stay on the same road (OSRM emits
  // "continue" / "new name" markers for a street it's still traversing) so the
  // list reads like real turn-by-turn navigation: one row per road.
  const displaySteps = useMemo(() => {
    const out: DrivingStep[] = [];
    for (const s of directions.steps) {
      if (s.maneuverType === "arrive") continue;
      const last = out[out.length - 1];
      if (
        last &&
        last.name &&
        last.name === s.name &&
        (s.maneuverType === "continue" ||
          s.maneuverType === "new name" ||
          s.maneuverType === "depart")
      ) {
        last.distanceM += s.distanceM;
        last.durationS += s.durationS;
      } else {
        out.push({ ...s });
      }
    }
    return out;
  }, [directions.steps]);

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
  const hasSteps = directions.steps.length > 0 && !fallbackUsed;

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
        const target: DirectionsTarget = {
          name: "Your current location",
          lonLat: [lon, lat],
          kind: "custom",
        };
        setDirectionsFrom(target);
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

  function handlePickFrom(name: string, lonLat: [number, number]) {
    setDirectionsFrom({ name, lonLat, kind: "custom" });
    setFromPickerOpen(false);
    setFromQuery("");
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
        steps: [],
      };
    } finally {
      setFetching(false);
    }
    setDirectionsRoute(result.route);
    setDirectionsSteps(result.steps);
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

  function handleCloseDirections() {
    if (restoreMapTypeOnClose) {
      restoreMapTypeAfterDirections();
      closeDirectionsModal();
    } else {
      clearDirections();
    }
    setRouteStats(null);
    setFallbackUsed(false);
    setMapActionHint(null);
    if (!restoreMapTypeOnClose) {
      setMapType("minimal");
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
          <div className="space-y-2">
            {fromPickerOpen ? (
              <div className="relative">
                <input
                  autoFocus
                  value={fromQuery}
                  onChange={(e) => setFromQuery(e.target.value)}
                  placeholder="Type a city to start from…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ng-green/40 focus:border-ng-green"
                />
                {fromQuery.trim() ? (
                  <ul className="absolute z-20 mt-1 w-full max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                    {fromSuggestions.map((s) => (
                      <li key={s.name}>
                        <button
                          type="button"
                          onClick={() => handlePickFrom(s.name, s.lonLat)}
                          className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-emerald-50 transition-colors flex items-baseline justify-between gap-2"
                        >
                          <span className="truncate">{s.name}</span>
                          {s.stateName ? (
                            <span className="text-[10px] text-slate-400 truncate shrink-0">
                              {s.stateName}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                    {fromSuggestions.length === 0 && (
                      <li className="px-3 py-1.5 text-sm text-slate-400">
                        No matching cities
                      </li>
                    )}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setFromPickerOpen(false);
                    setFromQuery("");
                  }}
                  aria-label="Cancel location selection"
                  title="Cancel"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
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
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationLoading || fromPickerOpen}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {locationLoading ? "Detecting…" : "Use my location"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromPickerOpen(true);
                  setFromQuery("");
                }}
                disabled={fromPickerOpen}
                className="rounded-lg border border-ng-green/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-ng-green hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Select location
              </button>
            </div>
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

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleVisit}
          disabled={!canVisit}
          className={[
            "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
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
        <button
          type="button"
          onClick={handleCloseDirections}
          aria-label="Close directions"
          title="Close directions"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-colors"
        >
          ✕
        </button>
      </div>

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

      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {hasSteps ? "Directions" : "Waypoints"}
          </p>
          <span className="text-[10px] font-medium text-slate-400 tabular-nums">
            {directions.steps.length > 0
              ? `${displaySteps.length} turns`
              : "2 stops"}
          </span>
        </div>
        <ol className="relative space-y-1 max-h-60 overflow-y-auto pr-1">
          <li className="relative flex items-start gap-2.5 py-1">
            <span
              aria-hidden
              className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0 ring-2 ring-white"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Start
              </p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {directions.from?.name ?? "Your current location"}
              </p>
            </div>
          </li>

          {hasSteps
            ? displaySteps.map((step, i) => (
                <li
                  key={`${i}-${step.name}-${step.instruction}`}
                  className="relative flex items-start gap-2.5 py-1 pl-0.5 border-l border-slate-200 ml-[4px]"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-200 text-[10px] text-slate-600 shrink-0"
                  >
                    {maneuverGlyph(step)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 leading-snug truncate">
                      {step.name || step.instruction}
                    </p>
                    {step.name ? (
                      <p className="text-[11px] text-slate-500 truncate">
                        {step.instruction}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 tabular-nums shrink-0">
                    {formatStepDistance(step.distanceM)}
                  </span>
                </li>
              ))
            : null}

          <li className="relative flex items-start gap-2.5 py-1">
            <span
              aria-hidden
              className="mt-1.5 h-2.5 w-2.5 rounded-full bg-ng-green shrink-0 ring-2 ring-white"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Destination
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {feature.name}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}