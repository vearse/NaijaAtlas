export type GeoJsonPolygon = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};

export type GeoJsonFeature = {
  id?: string | number;
  properties?: Record<string, unknown> | null;
  geometry: GeoJsonPolygon | null;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export type ProjectedFeature = {
  /** `id` when present, else a property override, else index. */
  key: string;
  d: string;
  properties: Record<string, unknown>;
};

export type ProjectedCollection = {
  features: ProjectedFeature[];
  viewBox: string;
};

type Ring = number[][];

function ringsOf(geometry: GeoJsonPolygon | null): Ring[] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") {
    return geometry.coordinates as Ring[];
  }
  // MultiPolygon -> flatten
  const out: Ring[] = [];
  for (const poly of geometry.coordinates as number[][][][]) {
    for (const ring of poly) out.push(ring);
  }
  return out;
}

function ringToPath(ring: Ring, project: (lon: number, lat: number) => [number, number]): string {
  let d = "";
  for (let i = 0; i < ring.length; i += 1) {
    const [lon, lat] = ring[i];
    if (typeof lon !== "number" || typeof lat !== "number") continue;
    const [x, y] = project(lon, lat);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d ? `${d}Z` : "";
}

/**
 * Equirectangular projection into a fixed viewBox. Nigeria spans ~2.6E–14.7E
 * and ~4.2N–13.9N, so a fixed frame keeps every thumbnail aligned with the
 * others without recomputing bounds per feature set.
 */
export function projectFeatureCollection(
  collection: GeoJsonFeatureCollection,
  options: { width?: number; height?: number; idKey?: string } = {}
): ProjectedCollection {
  const width = options.width ?? 200;
  const height = options.height ?? 200;
  const idKey = options.idKey ?? "id";

  const minLon = 2.5;
  const maxLon = 14.85;
  const minLat = 3.9;
  const maxLat = 14.05;

  // Fit the country inside the box, preserving aspect ratio.
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const scale = Math.min(width / lonSpan, height / latSpan);
  const offsetX = (width - lonSpan * scale) / 2;
  const offsetY = (height - latSpan * scale) / 2;

  const project = (lon: number, lat: number): [number, number] => [
    offsetX + (lon - minLon) * scale,
    height - offsetY - (lat - minLat) * scale,
  ];

  const features: ProjectedFeature[] = [];
  collection.features.forEach((feature, index) => {
    const d = ringsOf(feature.geometry)
      .map((ring) => ringToPath(ring, project))
      .join("");
    if (!d) return;
    const rawId = feature.properties?.[idKey] ?? feature.id ?? index;
    features.push({
      key: String(rawId),
      d,
      properties: feature.properties ?? {},
    });
  });

  return { features, viewBox: `0 0 ${width} ${height}` };
}
