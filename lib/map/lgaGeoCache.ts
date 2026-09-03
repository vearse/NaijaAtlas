/** In-memory cache for per-state LGA GeoJSON (prefetch on selection). */
const cache = new Map<string, GeoJSON.FeatureCollection>();
const inflight = new Map<string, Promise<GeoJSON.FeatureCollection | null>>();

export function getCachedLgaGeo(
  stateId: string
): GeoJSON.FeatureCollection | undefined {
  return cache.get(stateId);
}

export function prefetchLgaGeo(stateId: string): void {
  void fetchLgaGeo(stateId);
}

export function prefetchLgaGeoForStates(stateIds: Iterable<string>): void {
  for (const stateId of stateIds) prefetchLgaGeo(stateId);
}

export async function fetchLgaGeo(
  stateId: string
): Promise<GeoJSON.FeatureCollection | null> {
  const hit = cache.get(stateId);
  if (hit) return hit;

  const pending = inflight.get(stateId);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const res = await fetch(`/geo/lgas/${stateId}.geojson`);
      if (!res.ok) {
        console.warn(`LGA geo not found: ${stateId}`);
        return null;
      }
      const data = (await res.json()) as GeoJSON.FeatureCollection;
      cache.set(stateId, data);
      return data;
    } catch (err) {
      console.warn(`LGA geo fetch failed: ${stateId}`, err);
      return null;
    } finally {
      inflight.delete(stateId);
    }
  })();

  inflight.set(stateId, promise);
  return promise;
}

export function clearLgaGeoCache(): void {
  cache.clear();
  inflight.clear();
}
