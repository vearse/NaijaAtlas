import type { LayerSpecification, Map, SourceSpecification } from "maplibre-gl";
import { MAP_GLYPHS, MAP_FONT, MAP_FONT_EMPHASIS } from "@/lib/map/interaction";
import { LGA_PALETTE, assignLgaPaletteColors, colorForIndex } from "@/lib/map/colors";

const FILL_TRANSITION = {
  "fill-opacity-transition": { duration: 300 },
  "fill-color-transition": { duration: 300 },
};

/** LGA boundary strokes — warm stone/brown so they read clearly over green fills */
const LGA_LINE = {
  default: "#8B7355",
  hover: "#6B5344",
  selected: "#5C4033",
} as const;

const LINE_TRANSITION = {
  "line-opacity-transition": { duration: 300 },
  "line-color-transition": { duration: 300 },
  "line-width-transition": { duration: 300 },
};

export const BASE_STYLE = {
  version: 8 as const,
  glyphs: MAP_GLYPHS,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: { "background-color": "#c5d4e3" },
    },
  ],
};

export const GEO_SOURCES = {
  neighbors: "neighbors",
  adm0: "nigeria-adm0",
  adm1: "nigeria-adm1",
  regions: "nigeria-regions",
} as const;

export function geoSourceUrl(path: string): SourceSpecification {
  return {
    type: "geojson",
    data: path,
    promoteId: "id",
  };
}

export function lgaSourceSpec(
  data: GeoJSON.FeatureCollection
): SourceSpecification {
  return {
    type: "geojson",
    data,
    promoteId: "id",
  };
}

export function lgaSourceId(stateId: string) {
  return `lgas-${stateId}`;
}

export function lgaFillLayerId(stateId: string) {
  return `${lgaSourceId(stateId)}-fill`;
}

export function lgaLineLayerId(stateId: string) {
  return `${lgaSourceId(stateId)}-line`;
}

export function lgaLabelLayerId(stateId: string) {
  return `${lgaSourceId(stateId)}-labels`;
}

export function lgaLayersReady(map: Map, stateId: string): boolean {
  return (
    !!map.getSource(lgaSourceId(stateId)) &&
    !!map.getLayer(lgaFillLayerId(stateId)) &&
    !!map.getLayer(lgaLineLayerId(stateId)) &&
    !!map.getLayer(lgaLabelLayerId(stateId))
  );
}

/** Apply cyclical earth-tone fills from {@link LGA_PALETTE} (sorted by LGA name). */
export function enrichLgaColors(
  data: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
  const colorById = assignLgaPaletteColors(data.features);
  return {
    type: "FeatureCollection",
    features: data.features.map((feature, index) => {
      const id = String(feature.properties?.id ?? `idx-${index}`);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          fillColor: colorById.get(id) ?? colorForIndex(index, LGA_PALETTE),
        },
      };
    }),
  };
}

export function removeLgaStateLayers(map: Map, stateId: string): void {
  const srcId = lgaSourceId(stateId);
  for (const lid of [
    lgaLabelLayerId(stateId),
    lgaLineLayerId(stateId),
    lgaFillLayerId(stateId),
    `${srcId}-boundaries`,
  ]) {
    if (map.getLayer(lid)) map.removeLayer(lid);
  }
  if (map.getSource(srcId)) map.removeSource(srcId);
}

/** Line above fill, labels on top — matches e9f9074 map behaviour. */
export function stackLgaLayers(map: Map, stateId: string): void {
  const lineId = lgaLineLayerId(stateId);
  const labelId = lgaLabelLayerId(stateId);
  if (map.getLayer(lineId) && map.getLayer(labelId)) {
    map.moveLayer(lineId, labelId);
  }
  if (map.getLayer(labelId)) {
    map.moveLayer(labelId);
  }
}

export function stackAllLgaLayers(map: Map, stateIds: Iterable<string>): void {
  for (const stateId of stateIds) stackLgaLayers(map, stateId);
}

export function createNeighborLayers(): LayerSpecification[] {
  return [
    {
      id: "neighbors-fill",
      source: GEO_SOURCES.neighbors,
      type: "fill",
      paint: {
        "fill-color": "#94a3b8",
        "fill-opacity": 0.45,
        ...FILL_TRANSITION,
      },
    },
    {
      id: "neighbors-line",
      source: GEO_SOURCES.neighbors,
      type: "line",
      paint: {
        "line-color": "#64748b",
        "line-width": 1,
        "line-opacity": 0.6,
        ...LINE_TRANSITION,
      },
    },
    {
      id: "neighbors-labels",
      source: GEO_SOURCES.neighbors,
      type: "symbol",
      minzoom: 4,
      layout: {
        "text-field": ["get", "name"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          12,
          6,
          14,
          8,
          16,
        ],
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-font": [MAP_FONT_EMPHASIS],
        "text-letter-spacing": 0.05,
      },
      paint: {
        "text-color": "#334155",
        "text-halo-color": "#f1f5f9",
        "text-halo-width": 2,
        "text-opacity": 0.85,
      },
    },
  ];
}

export function createRegionLayers(): LayerSpecification[] {
  return [
    {
      id: "regions-fill",
      source: GEO_SOURCES.regions,
      type: "fill",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "highlight"], false],
          0.22,
          0.08,
        ],
        ...FILL_TRANSITION,
      },
    },
    {
      id: "regions-line",
      source: GEO_SOURCES.regions,
      type: "line",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 0.8,
        "line-opacity": 0.35,
        ...LINE_TRANSITION,
      },
    },
  ];
}

export function createStateLayers(): LayerSpecification[] {
  return [
    {
      id: "states-fill",
      source: GEO_SOURCES.adm1,
      type: "fill",
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#008751",
          ["boolean", ["feature-state", "hover"], false],
          "#fbbf24",
          ["coalesce", ["get", "regionColor"], "#f1f5f9"],
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.5,
          ["boolean", ["feature-state", "hover"], false],
          0.38,
          0.92,
        ],
        ...FILL_TRANSITION,
      },
    },
    {
      id: "states-line",
      source: GEO_SOURCES.adm1,
      type: "line",
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#006b40",
          ["boolean", ["feature-state", "hover"], false],
          "#b45309",
          "#475569",
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          2.5,
          ["boolean", ["feature-state", "hover"], false],
          2.2,
          1.25,
        ],
        ...LINE_TRANSITION,
      },
    },
    {
      id: "country-outline",
      source: GEO_SOURCES.adm0,
      type: "line",
      paint: {
        "line-color": "#0f172a",
        "line-width": 2.5,
      },
    },
  ];
}

export function createStateLabelLayer(): LayerSpecification {
  return {
    id: "states-labels",
    source: GEO_SOURCES.adm1,
    type: "symbol",
    layout: {
      "text-field": ["get", "name"],
      "text-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        10,
        7,
        11,
        9,
        12,
      ],
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-font": [MAP_FONT_EMPHASIS],
      "text-max-width": 10,
    },
    paint: {
      "text-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#0f172a",
        ["boolean", ["feature-state", "selected"], false],
        "#006b40",
        "#1e293b",
      ],
      "text-opacity": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        0.5,
        1,
      ],
      "text-halo-color": "#ffffff",
      "text-halo-width": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        2.5,
        2,
      ],
      "text-halo-blur": 0.5,
    },
    minzoom: 4,
  };
}

import {
  DRAG_STATE_FILL,
  DRAG_STATE_LINE,
} from "@/lib/map/dragStateGeometry";

export const DRAGGED_STATE_SOURCE = "dragged-state";

export function createDraggedStateLayers(): LayerSpecification[] {
  return [
    {
      id: "dragged-state-fill",
      source: DRAGGED_STATE_SOURCE,
      type: "fill",
      paint: {
        "fill-color": DRAG_STATE_FILL,
        "fill-opacity": 0.72,
        ...FILL_TRANSITION,
      },
    },
    {
      id: "dragged-state-line",
      source: DRAGGED_STATE_SOURCE,
      type: "line",
      paint: {
        "line-color": DRAG_STATE_LINE,
        "line-width": 2.5,
        ...LINE_TRANSITION,
      },
    },
    {
      id: "dragged-state-labels",
      source: DRAGGED_STATE_SOURCE,
      type: "symbol",
      minzoom: 4,
      layout: {
        "text-field": ["get", "name"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          11,
          7,
          12,
          9,
          13,
        ],
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-font": [MAP_FONT_EMPHASIS],
        "text-max-width": 10,
      },
      paint: {
        "text-color": DRAG_STATE_LINE,
        "text-halo-color": "#ffffff",
        "text-halo-width": 2.5,
      },
    },
  ];
}

export function createCountryLabelLayer(): LayerSpecification {
  return {
    id: "country-label",
    source: GEO_SOURCES.adm0,
    type: "symbol",
    layout: {
      "text-field": "Nigeria",
      "text-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4,
        14,
        6,
        18,
        8,
        22,
      ],
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-font": [MAP_FONT_EMPHASIS],
    },
    paint: {
      "text-color": "#008751",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2.5,
      "text-opacity": 0.35,
    },
    minzoom: 4,
    maxzoom: 7,
  };
}

export function createLgaFillLineLayers(stateId: string): LayerSpecification[] {
  const src = lgaSourceId(stateId);
  return [
    {
      id: lgaFillLayerId(stateId),
      source: src,
      type: "fill",
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#dc2626",
          ["boolean", ["feature-state", "hover"], false],
          "#ea580c",
          ["coalesce", ["get", "fillColor"], "#7cb87c"],
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.78,
          ["boolean", ["feature-state", "hover"], false],
          0.68,
          0.65,
        ],
        "fill-outline-color": LGA_LINE.default,
        ...FILL_TRANSITION,
      },
    },
    {
      id: lgaLineLayerId(stateId),
      source: src,
      type: "line",
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          LGA_LINE.hover,
          ["boolean", ["feature-state", "selected"], false],
          LGA_LINE.selected,
          LGA_LINE.default,
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          2,
          ["boolean", ["feature-state", "selected"], false],
          2.25,
          1.75,
        ],
        "line-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          1,
          ["boolean", ["feature-state", "selected"], false],
          1,
          0.95,
        ],
        ...LINE_TRANSITION,
      },
    },
  ];
}

export function createLgaLabelLayer(stateId: string): LayerSpecification {
  return {
    id: lgaLabelLayerId(stateId),
    source: lgaSourceId(stateId),
    type: "symbol",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-font": [MAP_FONT_EMPHASIS],
      "text-max-width": 14,
      "symbol-placement": "point",
    },
    paint: {
      "text-color": "#0f172a",
      "text-opacity": 1,
      "text-halo-color": "#ffffff",
      "text-halo-width": 2.5,
    },
  };
}

export function createLgaLayers(stateId: string): LayerSpecification[] {
  return [...createLgaFillLineLayers(stateId), createLgaLabelLayer(stateId)];
}

/** Tear down any prior mount, then add source + fill/line/label layers. */
export function addLgaStateLayers(
  map: Map,
  stateId: string,
  data: GeoJSON.FeatureCollection
): void {
  removeLgaStateLayers(map, stateId);
  const srcId = lgaSourceId(stateId);
  map.addSource(srcId, lgaSourceSpec(enrichLgaColors(data)));
  for (const layer of createLgaFillLineLayers(stateId)) {
    map.addLayer(layer);
  }
  map.addLayer(createLgaLabelLayer(stateId));
  stackLgaLayers(map, stateId);
}