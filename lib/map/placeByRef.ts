import citiesCatalog from "@/data/overlays/catalog/cities.json";
import tourCatalog from "@/data/overlays/catalog/tour.json";
import statesCatalog from "@/data/locations/states.json";
import type { DirectionsTarget } from "@/lib/store/mapStore";

interface CityRow {
  id?: string;
  name: string;
  lon?: number;
  lat?: number;
  stateId?: string;
  stateName?: string;
}

interface StateRow {
  id: string;
  slug: string;
  name: string;
  centroid: [number, number];
}

const cities = citiesCatalog as CityRow[];
const tours = tourCatalog as CityRow[];
const states = statesCatalog as unknown as StateRow[];

/**
 * Resolve a `?dirFrom=` / `?dirTo=` value to a mappable place. Accepts a city
 * or tour destination id/name, a state id (`NG-LA`) or a state slug.
 */
export function findPlaceByRef(
  ref: string | null | undefined
): DirectionsTarget | null {
  if (!ref) return null;
  const raw = ref.trim();
  if (!raw) return null;
  const key = raw.toLowerCase();

  const city = cities.find(
    (c) =>
      c.id?.toLowerCase() === key ||
      c.name.trim().toLowerCase() === key
  );
  if (city && typeof city.lon === "number" && typeof city.lat === "number") {
    return {
      name: city.name,
      lonLat: [city.lon, city.lat],
      kind: "overlay",
    };
  }

  const tour = tours.find(
    (t) => t.id?.toLowerCase() === key || t.name.trim().toLowerCase() === key
  );
  if (tour && typeof tour.lon === "number" && typeof tour.lat === "number") {
    return { name: tour.name, lonLat: [tour.lon, tour.lat], kind: "overlay" };
  }

  const state = states.find(
    (s) => s.id.toLowerCase() === key || s.slug === key
  );
  if (state?.centroid) {
    return { name: state.name, lonLat: state.centroid, kind: "state" };
  }

  return null;
}
