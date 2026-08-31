/** Rough land-area estimate from bounding box (km²) */
export function estimateAreaKm2(
  bbox: [number, number, number, number]
): number {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const latMid = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const kmPerDegLat = 111.32;
  const kmPerDegLon = 111.32 * Math.cos(latMid);
  const w = Math.abs(maxLon - minLon) * kmPerDegLon;
  const h = Math.abs(maxLat - minLat) * kmPerDegLat;
  return Math.round(w * h);
}

export function formatAreaKm2(km2: number): string {
  if (km2 >= 10_000) return `${(km2 / 1000).toFixed(1)}k km²`;
  return `${km2.toLocaleString()} km²`;
}

export function formatCoord([lon, lat]: [number, number]): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`;
}
