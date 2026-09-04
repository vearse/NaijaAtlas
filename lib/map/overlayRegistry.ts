import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { OverlayLayerId } from "@/types/overlay";
import { OVERLAY_LAYER_IDS } from "@/types/overlay";

export type OverlaySlot = "belowNeighbors" | "belowStates" | "aboveStates" | "aboveLgas";

export interface OverlayLayerDef {
  id: string;
  source: string;
  spec: LayerSpecification;
}

export type OverlayLayerSpec =
  | Omit<FillLayerSpecification, "source">
  | Omit<LineLayerSpecification, "source">
  | Omit<SymbolLayerSpecification, "source">
  | Omit<CircleLayerSpecification, "source">;

export interface OverlayRegistryEntry {
  id: OverlayLayerId;
  sourceId: string;
  geoPath: string;
  slot: OverlaySlot;
  /** MapLibre layer ids that receive pointer events when this overlay is active */
  interactiveLayerIds: string[];
  layers: OverlayLayerSpec[];
}

const WATERWAY_LINE_PAINT: LineLayerSpecification["paint"] = {
  "line-color": [
    "match",
    ["coalesce", ["get", "waterwayClass"], "tributary"],
    "major",
    "#1d4ed8",
    "delta",
    "#0ea5e9",
    "tributary",
    "#2563eb",
    "#3b82c4",
  ],
  "line-width": [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    [
      "match",
      ["coalesce", ["get", "waterwayClass"], "tributary"],
      "major",
      2,
      "delta",
      1.2,
      "tributary",
      1,
      0.8,
    ],
    8,
    [
      "match",
      ["coalesce", ["get", "waterwayClass"], "tributary"],
      "major",
      3.5,
      "delta",
      2.2,
      "tributary",
      1.8,
      1.2,
    ],
    11,
    [
      "match",
      ["coalesce", ["get", "waterwayClass"], "tributary"],
      "major",
      5,
      "delta",
      3,
      "tributary",
      2.5,
      1.8,
    ],
  ],
  "line-opacity": 0.92,
};

const PORT_CIRCLE_PAINT: CircleLayerSpecification["paint"] = {
  "circle-color": "#0f172a",
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 9, 7],
  "circle-stroke-color": "#ffffff",
  "circle-stroke-width": 2,
};

export const OVERLAY_REGISTRY: Record<OverlayLayerId, OverlayRegistryEntry> = {
  waterways: {
    id: "waterways",
    sourceId: "overlays-waterways",
    geoPath: "/geo/overlays/waterways.geojson",
    slot: "aboveStates",
    interactiveLayerIds: ["overlay-waterways-line", "overlay-waterways-labels"],
    layers: [
      {
        id: "overlay-waterways-line",
        type: "line",
        paint: WATERWAY_LINE_PAINT,
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
      {
        id: "overlay-waterways-labels",
        type: "symbol",
        minzoom: 6,
        layout: {
          visibility: "none",
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            10,
            9,
            12,
          ],
          "text-font": ["Open Sans Semibold"],
        },
        paint: {
          "text-color": "#1e40af",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
    ],
  },
  lakes: {
    id: "lakes",
    sourceId: "overlays-lakes",
    geoPath: "/geo/overlays/lakes.geojson",
    slot: "aboveLgas",
    interactiveLayerIds: [
      "overlay-lakes-fill",
      "overlay-lakes-power-icon",
      "overlay-lakes-power-labels",
      "overlay-lakes-labels",
    ],
    layers: [
      {
        id: "overlay-lakes-fill",
        type: "fill",
        filter: ["==", ["get", "featureKind"], "lake"],
        paint: {
          "fill-color": [
            "match",
            ["coalesce", ["get", "lakeCategory"], "natural"],
            "natural",
            "#3b82c6",
            "reservoir",
            "#0891b2",
            "lagoon",
            "#38bdf8",
            "#4a90b8",
          ],
          "fill-opacity": [
            "match",
            ["coalesce", ["get", "lakeCategory"], "natural"],
            "lagoon",
            0.62,
            "reservoir",
            0.68,
            0.58,
          ],
        },
        layout: { visibility: "none" },
      },
      {
        id: "overlay-lakes-line",
        type: "line",
        filter: ["==", ["get", "featureKind"], "lake"],
        paint: {
          "line-color": [
            "match",
            ["coalesce", ["get", "lakeCategory"], "natural"],
            "natural",
            "#1e40af",
            "reservoir",
            "#0e7490",
            "lagoon",
            "#0284c7",
            "#1e4d6b",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            1,
            8,
            1.8,
            11,
            2.5,
          ],
          "line-opacity": 0.85,
        },
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
      {
        id: "overlay-lakes-labels",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "lake"],
        minzoom: 5,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            10,
            8,
            12,
          ],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "center",
          "text-allow-overlap": false,
          "text-optional": true,
        },
        paint: {
          "text-color": "#164e63",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
      {
        id: "overlay-lakes-power-icon",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "power-station"],
        minzoom: 5,
        layout: {
          visibility: "none",
          "icon-image": [
            "match",
            ["coalesce", ["get", "plantCategory"], "regional-hydro"],
            "major-hydro",
            "power-icon-major-hydro",
            "regional-hydro",
            "power-icon-regional-hydro",
            "power-icon-regional-hydro",
          ],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.55,
            8,
            0.75,
            11,
            0.95,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 8,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-lakes-power-labels",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "power-station"],
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.35],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "top",
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#713f12",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
    ],
  },
  coast: {
    id: "coast",
    sourceId: "overlays-coast",
    geoPath: "/geo/overlays/coast.geojson",
    slot: "aboveStates",
    interactiveLayerIds: [
      "overlay-coast-line",
      "overlay-coast-ports",
    ],
    layers: [
      {
        id: "overlay-ocean-fill",
        type: "fill",
        filter: ["==", ["get", "kind"], "ocean"],
        paint: { "fill-color": "#7eb8d8", "fill-opacity": 0.6 },
        layout: { visibility: "none" },
      },
      {
        id: "overlay-coast-line",
        type: "line",
        filter: ["==", ["get", "id"], "coastline-ng"],
        paint: { "line-color": "#1e3a5f", "line-width": 2.5, "line-opacity": 0.9 },
        layout: { visibility: "none" },
      },
      {
        id: "overlay-coast-ports",
        type: "circle",
        filter: ["==", ["get", "subkind"], "port"],
        paint: PORT_CIRCLE_PAINT,
        layout: { visibility: "none" },
      },
    ],
  },
  landforms: {
    id: "landforms",
    sourceId: "overlays-landforms",
    geoPath: "/geo/overlays/landforms.geojson",
    slot: "aboveLgas",
    interactiveLayerIds: [
      "overlay-landforms-fill",
      "overlay-landforms-point",
      "overlay-landforms-labels",
    ],
    layers: [
      {
        id: "overlay-landforms-fill",
        type: "fill",
        filter: ["==", ["get", "featureKind"], "area"],
        paint: {
          "fill-color": [
            "match",
            ["coalesce", ["get", "landformType"], "hill"],
            "plateau",
            "#a16207",
            "mountain-range",
            "#57534e",
            "hill",
            "#b45309",
            "escarpment",
            "#92400e",
            "delta",
            "#15803d",
            "basin",
            "#ca8a04",
            "savanna",
            "#65a30d",
            "#b8a088",
          ],
          "fill-opacity": [
            "match",
            ["coalesce", ["get", "sizeTier"], "medium"],
            "major",
            0.38,
            "medium",
            0.48,
            0.55,
          ],
        },
        layout: { visibility: "none" },
      },
      {
        id: "overlay-landforms-line",
        type: "line",
        filter: ["==", ["get", "featureKind"], "area"],
        paint: {
          "line-color": [
            "match",
            ["coalesce", ["get", "landformType"], "hill"],
            "plateau",
            "#78350f",
            "mountain-range",
            "#44403c",
            "hill",
            "#92400e",
            "escarpment",
            "#713f12",
            "delta",
            "#166534",
            "basin",
            "#a16207",
            "savanna",
            "#4d7c0f",
            "#6b5344",
          ],
          "line-width": [
            "match",
            ["coalesce", ["get", "sizeTier"], "medium"],
            "major",
            2.2,
            "medium",
            1.6,
            1.1,
          ],
          "line-opacity": 0.75,
        },
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
      {
        id: "overlay-landforms-point",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "point"],
        minzoom: 5,
        layout: {
          visibility: "none",
          "icon-image": [
            "match",
            ["coalesce", ["get", "landformType"], "peak"],
            "peak",
            "landform-icon-peak",
            "inselberg",
            "landform-icon-inselberg",
            "landform-icon-peak",
          ],
          "icon-size": [
            "match",
            ["coalesce", ["get", "sizeTier"], "minor"],
            "major",
            ["interpolate", ["linear"], ["zoom"], 5, 0.7, 9, 1],
            "medium",
            ["interpolate", ["linear"], ["zoom"], 5, 0.58, 9, 0.85],
            ["interpolate", ["linear"], ["zoom"], 5, 0.5, 9, 0.72],
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 6,
        },
      },
      {
        id: "overlay-landforms-labels",
        type: "symbol",
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": [
            "match",
            ["coalesce", ["get", "sizeTier"], "medium"],
            "major",
            12,
            "medium",
            11,
            10,
          ],
          "text-font": ["Open Sans Semibold"],
          "text-offset": [
            "case",
            ["==", ["get", "featureKind"], "point"],
            ["literal", [0, 1.35]],
            ["literal", [0, 0]],
          ],
          "text-anchor": [
            "case",
            ["==", ["get", "featureKind"], "point"],
            "top",
            "center",
          ],
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#44403c",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
    ],
  },
  cities: {
    id: "cities",
    sourceId: "overlays-cities",
    geoPath: "/geo/overlays/cities.geojson",
    slot: "aboveLgas",
    interactiveLayerIds: ["overlay-cities-icon", "overlay-cities-labels"],
    layers: [
      {
        id: "overlay-cities-icon",
        type: "symbol",
        minzoom: 4,
        layout: {
          visibility: "none",
          "icon-image": [
            "match",
            ["coalesce", ["get", "category"], "regional"],
            "federal-capital",
            "city-icon-federal-capital",
            "mega-city",
            "city-icon-mega-city",
            "state-capital",
            "city-icon-state-capital",
            "commercial",
            "city-icon-commercial",
            "historic",
            "city-icon-historic",
            "port-city",
            "city-icon-port-city",
            "industrial",
            "city-icon-industrial",
            "university",
            "city-icon-university",
            "city-icon-regional",
          ],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.55, 7, 0.78, 11, 1],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 10,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-cities-labels",
        type: "symbol",
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.35],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "top",
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
    ],
  },
};

export function allOverlayLayerIds(): string[] {
  return OVERLAY_LAYER_IDS.flatMap((id) =>
    OVERLAY_REGISTRY[id].layers.map((l) => l.id)
  );
}

export function interactiveLayersForActive(
  active: Set<OverlayLayerId>
): string[] {
  const ids: string[] = [];
  for (const layerId of ["cities", "waterways", "coast", "lakes", "landforms"] as OverlayLayerId[]) {
    if (!active.has(layerId)) continue;
    ids.push(...OVERLAY_REGISTRY[layerId].interactiveLayerIds);
  }
  return ids;
}

export function overlayLayerIdsForToggle(layerId: OverlayLayerId): string[] {
  return OVERLAY_REGISTRY[layerId].layers.map((l) => l.id);
}

export function resolveOverlayLayerId(
  mapLayerId: string
): OverlayLayerId | null {
  for (const entry of Object.values(OVERLAY_REGISTRY)) {
    if (entry.layers.some((l) => l.id === mapLayerId)) return entry.id;
  }
  return null;
}
