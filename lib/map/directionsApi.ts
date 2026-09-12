export function geodesicLine(
  from: [number, number],
  to: [number, number]
): GeoJSON.LineString {
  return {
    type: "LineString",
    coordinates: [from, to],
  };
}

export function toOSRMEndpoint(pairs: Array<[number, number]>): string {
  const coords = pairs.map(([lon, lat]) => `${lon},${lat}`).join(";");
  return `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;
}

export interface DrivingRouteResult {
  route: GeoJSON.LineString;
  distanceKm: number;
  durationMin: number;
}

export interface DrivingStep {
  instruction: string;
  name: string;
  maneuverType: string;
  modifier?: string;
  distanceM: number;
  durationS: number;
}

export interface DrivingRouteResult {
  route: GeoJSON.LineString;
  distanceKm: number;
  durationMin: number;
  steps: DrivingStep[];
}

interface OsmStep {
  maneuver?: { instruction?: string; type?: string; modifier?: string };
  name?: string;
  distance?: number;
  duration?: number;
}

export async function fetchDrivingRoute(
  from: [number, number],
  to: [number, number],
  signal?: AbortSignal
): Promise<DrivingRouteResult> {
  const url = toOSRMEndpoint([from, to]);

  const controller = signal
    ? undefined
    : new AbortController();
  const effectiveSignal = signal ?? controller?.signal;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), 8000)
    : undefined;

  try {
    const res = await fetch(url, { signal: effectiveSignal });
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`OSRM HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      routes?: Array<{
        geometry: GeoJSON.LineString;
        distance?: number;
        duration?: number;
        legs?: Array<{ steps?: OsmStep[] }>;
      }>;
    };
    const route = data.routes?.[0];
    if (!route?.geometry) {
      throw new Error("OSRM returned no route geometry");
    }
    const distanceMeters = route.distance ?? 0;
    const durationSeconds = route.duration ?? 0;
    const steps: DrivingStep[] = (route.legs?.[0]?.steps ?? [])
      .map((step) => ({
        instruction: step.maneuver?.instruction ?? "Continue",
        name: step.name ?? "",
        maneuverType: step.maneuver?.type ?? "depart",
        modifier: step.maneuver?.modifier,
        distanceM: step.distance ?? 0,
        durationS: step.duration ?? 0,
      }))
      .filter(
        (s) =>
          (s.name || s.maneuverType !== "new name") &&
          s.distanceM >= 5
      );
    return {
      route: route.geometry,
      distanceKm: distanceMeters / 1000,
      durationMin: durationSeconds / 60,
      steps,
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
}
