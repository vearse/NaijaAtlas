import type { Map as MaplibreMap } from "maplibre-gl";
import type { OverlayLayerId, SelectedOverlayFeature } from "@/types/overlay";

function finitePair(a: unknown, b: unknown): [number, number] | null {
  const lon = Number(a);
  const lat = Number(b);
  if (Number.isFinite(lon) && Number.isFinite(lat)) return [lon, lat];
  return null;
}

function coordsFromGeometry(
  geometry: GeoJSON.Geometry | null | undefined
): [number, number] | null {
  if (!geometry) return null;

  const ring = (geom: GeoJSON.Geometry): GeoJSON.Position[] | null => {
    if (geom.type === "Point") {
      return geom.coordinates.length >= 2 ? [geom.coordinates] : null;
    }
    if (geom.type === "LineString") {
      return geom.coordinates.length >= 2 ? geom.coordinates : null;
    }
    if (geom.type === "MultiLineString") {
      return geom.coordinates.flat();
    }
    if (geom.type === "Polygon") {
      return geom.coordinates[0] ?? null;
    }
    if (geom.type === "MultiPolygon") {
      return geom.coordinates.flat().flat();
    }
    if (geom.type === "MultiPoint") {
      return geom.coordinates;
    }
    if (geom.type === "GeometryCollection") {
      for (const child of geom.geometries) {
        const found = ring(child);
        if (found && found.length) return found;
      }
    }
    return null;
  };

  const coords = ring(geometry);
  if (!coords || coords.length === 0) return null;
  let lonSum = 0;
  let latSum = 0;
  let count = 0;
  for (const c of coords) {
    if (!Array.isArray(c) || c.length < 2) continue;
    const lon = Number(c[0]);
    const lat = Number(c[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      lonSum += lon;
      latSum += lat;
      count += 1;
    }
  }
  if (count === 0) return null;
  return [lonSum / count, latSum / count];
}

function boundsFromGeometry(
  geometry: GeoJSON.Geometry
): [[number, number], [number, number]] | null {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const visit = (geom: GeoJSON.Geometry) => {
    if (geom.type === "Point") {
      const [lon, lat] = geom.coordinates;
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
      return;
    }
    if (geom.type === "MultiPoint" || geom.type === "LineString") {
      for (const c of geom.coordinates) visitCoord(c);
      return;
    }
    if (geom.type === "MultiLineString" || geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        for (const c of ring) visitCoord(c);
      }
      return;
    }
    if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          for (const c of ring) visitCoord(c);
        }
      }
      return;
    }
    if (geom.type === "GeometryCollection") {
      for (const child of geom.geometries) visit(child);
    }
  };

  const visitCoord = (c: GeoJSON.Position) => {
    if (!Array.isArray(c) || c.length < 2) return;
    const lon = Number(c[0]);
    const lat = Number(c[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  };

  visit(geometry);
  if (!Number.isFinite(minLon)) return null;
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}

export function resolveOverlayLonLat(
  feature: SelectedOverlayFeature
): [number, number] | null {
  const props = feature.properties;
  return (
    finitePair(props.longitude, props.latitude) ??
    finitePair(props.lon, props.lat) ??
    (feature.geometry?.type === "Point"
      ? finitePair(
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1]
        )
      : null) ??
    coordsFromGeometry(feature.geometry)
  );
}

function targetZoom(layerId: OverlayLayerId): number {
  switch (layerId) {
    case "landforms":
    case "ecology":
      return 6.5;
    case "security":
    case "power":
    case "resources":
      return 7.5;
    case "cities":
      return 7;
    case "lakes":
    case "waterways":
      return 6;
    default:
      return 7;
  }
}

/** Pan/zoom the map to show a selected overlay feature (panel list, search, deep links). */
export function flyToOverlayFeature(
  map: MaplibreMap,
  feature: SelectedOverlayFeature
): void {
  const geom = feature.geometry;
  if (
    geom &&
    geom.type !== "Point" &&
    (geom.type === "LineString" ||
      geom.type === "MultiLineString" ||
      geom.type === "Polygon" ||
      geom.type === "MultiPolygon")
  ) {
    const bounds = boundsFromGeometry(geom);
    if (bounds) {
      const [[minLon, minLat], [maxLon, maxLat]] = bounds;
      const isTiny =
        Math.abs(maxLon - minLon) < 0.02 && Math.abs(maxLat - minLat) < 0.02;
      if (!isTiny) {
        map.fitBounds(bounds, { padding: 72, duration: 900, maxZoom: 10 });
        return;
      }
    }
  }

  const center = resolveOverlayLonLat(feature);
  if (!center) return;

  map.flyTo({
    center,
    zoom: Math.max(map.getZoom() ?? 5, targetZoom(feature.layerId)),
    speed: 0.9,
  });
}
