"use client";

import { useCallback, useMemo, useState } from "react";
import type { HubPlace } from "@/lib/server/loadTravelHubData";
import type { PickOption } from "@/components/travel/PlacePicker";

const EARTH_RADIUS_KM = 6371;

export type RouteLocationState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "error"; message: string }
  | { status: "found"; placeName: string; distanceKm: number };

export function haversineKm(
  a: { lat: number | null; lon: number | null },
  b: { lat: number | null; lon: number | null }
): number | null {
  if (a.lat == null || a.lon == null || b.lat == null || b.lon == null) return null;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toOption(place: HubPlace, group: string): PickOption {
  return {
    value: place.id,
    label: place.name,
    group,
    hint: place.stateName,
  };
}

/**
 * Searchable place list for the route planner plus a "use my location" lookup
 * that snaps the browser's coordinates onto the nearest mapped place.
 *
 * Shared by the full planner card and the sticky bottom bar so both fields
 * search the same list and agree on the resolved origin.
 */
export function useRoutePlaces({
  cities,
  destinations,
  onPick,
}: {
  cities: HubPlace[];
  destinations: HubPlace[];
  /** Called with the place id snapped to from the device's coordinates. */
  onPick?: (placeId: string) => void;
}) {
  const [location, setLocation] = useState<RouteLocationState>({ status: "idle" });

  const options = useMemo<PickOption[]>(() => {
    const byName = (a: HubPlace, b: HubPlace) => a.name.localeCompare(b.name);
    return [
      ...cities
        .filter((c) => c.lon != null && c.lat != null)
        .sort(byName)
        .map((c) => toOption(c, "Cities")),
      ...destinations
        .filter((d) => d.lon != null && d.lat != null)
        .sort(byName)
        .map((d) => toOption(d, "Destinations")),
    ];
  }, [cities, destinations]);

  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({
        status: "error",
        message: "This browser cannot share a location.",
      });
      return;
    }

    setLocation({ status: "busy" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        let best: { place: HubPlace; km: number } | null = null;

        for (const group of [cities, destinations]) {
          for (const place of group) {
            const km = haversineKm(here, place);
            if (km == null) continue;
            if (!best || km < best.km) best = { place, km };
          }
        }

        if (!best) {
          setLocation({
            status: "error",
            message: "No mapped place is close to your coordinates.",
          });
          return;
        }

        setLocation({
          status: "found",
          placeName: best.place.name,
          distanceKm: best.km,
        });
        onPick?.(best.place.id);
      },
      (err) => {
        setLocation({
          status: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied — search for your start instead."
              : "Could not read your location. Search for your start instead.",
        });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 }
    );
  }, [cities, destinations, onPick]);

  return { options, location, useMyLocation };
}