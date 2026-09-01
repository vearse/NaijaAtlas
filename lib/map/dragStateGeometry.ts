import type { FilterSpecification } from "maplibre-gl";

type Coord = number[];
type Ring = Coord[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

function translateCoord(coord: Coord, dLng: number, dLat: number): Coord {
  return [coord[0] + dLng, coord[1] + dLat, ...coord.slice(2)];
}

function translateRing(ring: Ring, dLng: number, dLat: number): Ring {
  return ring.map((c) => translateCoord(c, dLng, dLat));
}

function translatePolygon(polygon: Polygon, dLng: number, dLat: number): Polygon {
  return polygon.map((ring) => translateRing(ring, dLng, dLat));
}

export function translateGeometry(
  geometry: GeoJSON.Geometry,
  dLng: number,
  dLat: number
): GeoJSON.Geometry {
  switch (geometry.type) {
    case "Polygon":
      return {
        type: "Polygon",
        coordinates: translatePolygon(geometry.coordinates, dLng, dLat),
      };
    case "MultiPolygon":
      return {
        type: "MultiPolygon",
        coordinates: (geometry.coordinates as MultiPolygon).map((p) =>
          translatePolygon(p, dLng, dLat)
        ),
      };
    default:
      return geometry;
  }
}

export function cloneGeometry(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  return JSON.parse(JSON.stringify(geometry)) as GeoJSON.Geometry;
}

export function excludeStateFilter(
  stateId: string | null
): FilterSpecification | null {
  if (!stateId) return null;
  return ["!", ["==", ["get", "id"], stateId]];
}

export function withExcludeState(
  filter: FilterSpecification | null | undefined,
  excludedStateId: string | null
): FilterSpecification | null {
  const exclude = excludeStateFilter(excludedStateId);
  if (!exclude) return filter ?? null;
  if (!filter) return exclude;
  return ["all", exclude, filter] as FilterSpecification;
}

/** Drag-layer colours — only the lifted state uses these. */
export const DRAG_STATE_FILL = "#fbbf24";
export const DRAG_STATE_LINE = "#b45309";
