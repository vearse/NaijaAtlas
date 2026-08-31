import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import { MAP_GLYPHS, MAP_FONT, MAP_FONT_EMPHASIS } from "@/lib/map/interaction";

const FILL_TRANSITION = {
  "fill-opacity-transition": { duration: 300 },
  "fill-color-transition": { duration: 300 },
};

const LINE_TRANSITION = {
  "line-opacity-transition": { duration: 300 },
  "line-color-transition": { duration: 300 },
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
          0.72,
          ["boolean", ["feature-state", "hover"], false],
          0.62,
          0.52,
        ],
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
          "#0f172a",
          ["boolean", ["feature-state", "selected"], false],
          "#7f1d1d",
          "#1e293b",
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          2.5,
          ["boolean", ["feature-state", "selected"], false],
          2,
          1.4,
        ],
        "line-opacity": 1,
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
