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

const RIVER_LINE_PAINT: LineLayerSpecification["paint"] = {
  "line-color": "#2563eb",
  "line-width": [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    1.5,
    8,
    3,
    11,
    4.5,
  ],
  "line-opacity": 0.9,
};

const CREEK_LINE_PAINT: LineLayerSpecification["paint"] = {
  "line-color": "#3b82c4",
  "line-width": [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    0.8,
    9,
    2,
    12,
    3,
  ],
  "line-opacity": 0.8,
};

const PORT_CIRCLE_PAINT: CircleLayerSpecification["paint"] = {
  "circle-color": "#0f172a",
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 9, 7],
  "circle-stroke-color": "#ffffff",
  "circle-stroke-width": 2,
};

export const OVERLAY_REGISTRY: Record<OverlayLayerId, OverlayRegistryEntry> = {
  rivers: {
    id: "rivers",
    sourceId: "overlays-rivers",
    geoPath: "/geo/overlays/rivers.geojson",
    slot: "aboveStates",
    interactiveLayerIds: ["overlay-rivers-line", "overlay-rivers-labels"],
    layers: [
      {
        id: "overlay-rivers-line",
        type: "line",
        paint: RIVER_LINE_PAINT,
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
      {
        id: "overlay-rivers-labels",
        type: "symbol",
        minzoom: 7,
        layout: {
          visibility: "none",
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-size": 11,
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
    slot: "belowNeighbors",
    interactiveLayerIds: ["overlay-lakes-fill", "overlay-lakes-labels"],
    layers: [
      {
        id: "overlay-lakes-fill",
        type: "fill",
        paint: { "fill-color": "#4a90b8", "fill-opacity": 0.7 },
        layout: { visibility: "none" },
      },
      {
        id: "overlay-lakes-line",
        type: "line",
        paint: { "line-color": "#1e4d6b", "line-width": 1.5, "line-opacity": 0.8 },
        layout: { visibility: "none" },
      },
      {
        id: "overlay-lakes-labels",
        type: "symbol",
        minzoom: 5,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["Open Sans Semibold"],
        },
        paint: {
          "text-color": "#164e63",
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
  creeks: {
    id: "creeks",
    sourceId: "overlays-creeks",
    geoPath: "/geo/overlays/creeks.geojson",
    slot: "aboveStates",
    interactiveLayerIds: ["overlay-creeks-line"],
    layers: [
      {
        id: "overlay-creeks-line",
        type: "line",
        paint: CREEK_LINE_PAINT,
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
    ],
  },
  landforms: {
    id: "landforms",
    sourceId: "overlays-landforms",
    geoPath: "/geo/overlays/landforms.geojson",
    slot: "belowStates",
    interactiveLayerIds: ["overlay-landforms-fill"],
    layers: [
      {
        id: "overlay-landforms-fill",
        type: "fill",
        paint: {
          "fill-color": [
            "match",
            ["get", "tier"],
            "high",
            "#a8927a",
            "mid",
            "#b8c49a",
            "low",
            "#c4d4b0",
            "#b0b89a",
          ],
          "fill-opacity": 0.32,
        },
        layout: { visibility: "none" },
      },
      {
        id: "overlay-landforms-line",
        type: "line",
        paint: { "line-color": "#6b5344", "line-width": 1, "line-opacity": 0.5 },
        layout: { visibility: "none" },
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
  for (const layerId of ["cities", "rivers", "creeks", "coast", "lakes", "landforms"] as OverlayLayerId[]) {
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
