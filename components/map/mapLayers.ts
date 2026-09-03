import type { LayerSpecification, Map, SourceSpecification } from "maplibre-gl";
import { MAP_GLYPHS, MAP_FONT, MAP_FONT_EMPHASIS } from "@/lib/map/interaction";
import { LGA_PALETTE, assignLgaPaletteColors, colorForIndex } from "@/lib/map/colors";
import { withExcludeState, withExcludeStates } from "@/lib/map/dragStateGeometry";

const FILL_TRANSITION = {
  "fill-opacity-transition": { duration: 300 },
  "fill-color-transition": { duration: 300 },
};

/** LGA boundary strokes — lighter than state borders for hierarchy */
const LGA_LINE = {
  default: "#cbd5e1",
  hover: "#94a3b8",
  selected: "#64748b",
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

export function lgaOutlineSourceId(stateId: string) {
  return `${lgaSourceId(stateId)}-outlines`;
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
    !!map.getSource(lgaOutlineSourceId(stateId)) &&
    !!map.getLayer(lgaFillLayerId(stateId)) &&
    !!map.getLayer(lgaLineLayerId(stateId)) &&
    !!map.getLayer(lgaLabelLayerId(stateId))
  );
}

/** Polygon rings as LineString/MultiLineString so MapLibre actually draws LGA borders. */
export function polygonRingsToLineGeometry(
  geometry: GeoJSON.Geometry | null
): GeoJSON.LineString | GeoJSON.MultiLineString | null {
  if (!geometry) return null;
  const rings: GeoJSON.Position[][] = [];
  if (geometry.type === "Polygon") {
    rings.push(...geometry.coordinates);
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) rings.push(...polygon);
  } else if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
    return geometry;
  }
  if (rings.length === 0) return null;
  if (rings.length === 1) {
    return { type: "LineString", coordinates: rings[0] };
  }
  return { type: "MultiLineString", coordinates: rings };
}

export function toLgaOutlineCollection(
  data: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const feature of data.features) {
    const lineGeom = polygonRingsToLineGeometry(feature.geometry);
    if (!lineGeom) continue;
    features.push({
      type: "Feature",
      properties: feature.properties ?? {},
      geometry: lineGeom,
    });
  }
  return { type: "FeatureCollection", features };
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
  const outlineId = lgaOutlineSourceId(stateId);
  for (const lid of [
    lgaLabelLayerId(stateId),
    lgaLineLayerId(stateId),
    lgaFillLayerId(stateId),
  ]) {
    if (map.getLayer(lid)) map.removeLayer(lid);
  }
  if (map.getSource(outlineId)) map.removeSource(outlineId);
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

/** Insert LGA stack just below state outlines (above state fill). */
export const LGA_STACK_BEFORE = "states-line";

function lgaStackAnchor(map: Map): string | undefined {
  if (map.getLayer("dragged-state-fill")) return "dragged-state-fill";
  if (map.getLayer(LGA_STACK_BEFORE)) return LGA_STACK_BEFORE;
  return undefined;
}

/** Ensure LGA stack sits above state fill (borders stay visible). */
export function raiseLgaLayersForState(map: Map, stateId: string): void {
  restackLgaStack(map, [stateId]);
}

export function raiseAllLgaLayers(map: Map, stateIds: Iterable<string>): void {
  globalStackLgaLayers(map, stateIds);
}

/**
 * LGA stack (bottom → top): state fill → LGA fills → state outline → LGA borders → labels.
 */
export function restackLgaStack(map: Map, stateIds: Iterable<string>): void {
  const ids = [...stateIds].sort();
  const anchor = lgaStackAnchor(map);

  for (const stateId of ids) {
    const fillId = lgaFillLayerId(stateId);
    if (map.getLayer(fillId)) map.moveLayer(fillId, anchor);
  }

  const firstLgaLine = ids.map(lgaLineLayerId).find((id) => map.getLayer(id));
  if (map.getLayer("states-line")) {
    if (firstLgaLine) map.moveLayer("states-line", firstLgaLine);
    else if (map.getLayer("country-outline")) {
      map.moveLayer("states-line", "country-outline");
    }
  }

  for (const stateId of ids) {
    const lineId = lgaLineLayerId(stateId);
    if (map.getLayer(lineId)) map.moveLayer(lineId);
  }
  for (const stateId of ids) {
    const labelId = lgaLabelLayerId(stateId);
    if (map.getLayer(labelId)) map.moveLayer(labelId);
  }
  if (map.getLayer("dragged-state-fill")) map.moveLayer("dragged-state-fill");
  if (map.getLayer("dragged-state-line")) map.moveLayer("dragged-state-line");
  if (map.getLayer("dragged-state-labels")) map.moveLayer("dragged-state-labels");
}

/** @deprecated Use restackLgaStack */
export function globalStackLgaLayers(map: Map, stateIds: Iterable<string>): void {
  restackLgaStack(map, stateIds);
}

/** Hide state fill (not outlines) so LGA polygons show; keep state borders as fallback. */
export function applyStateMaskForLgaVisibility(
  map: Map,
  lgaVisibleStateIds: Iterable<string>,
  draggedStateId: string | null
): void {
  const mask = withExcludeStates(
    withExcludeState(null, draggedStateId),
    lgaVisibleStateIds
  );
  if (map.getLayer("states-fill")) map.setFilter("states-fill", mask);
  if (map.getLayer("states-line")) {
    map.setFilter("states-line", withExcludeState(null, draggedStateId));
  }
}

/** Selection color from feature ids — not sticky feature-state. */
export function applyStateSelectionPaint(
  map: Map,
  selectedIds: Iterable<string>,
  readyLgaStateIds: Iterable<string>
): void {
  const ids = [...selectedIds];
  const ready = [...readyLgaStateIds];
  const isSelected =
    ids.length > 0
      ? (["in", ["get", "id"], ["literal", ids]] as const)
      : (["==", ["get", "id"], ""] as const);
  const lgaCoversState =
    ready.length > 0
      ? (["in", ["get", "id"], ["literal", ready]] as const)
      : (["==", ["get", "id"], ""] as const);
  const selectedWithLga = ["all", isSelected, lgaCoversState] as const;

  if (map.getLayer("states-fill")) {
    map.setPaintProperty("states-fill", "fill-color", [
      "case",
      isSelected,
      "#008751",
      ["boolean", ["feature-state", "hover"], false],
      "#fbbf24",
      ["coalesce", ["get", "regionColor"], "#f1f5f9"],
    ]);
    map.setPaintProperty("states-fill", "fill-opacity", [
      "case",
      ["all", isSelected, ["!", lgaCoversState]],
      0.55,
      isSelected,
      0.55,
      ["boolean", ["feature-state", "hover"], false],
      0.42,
      ids.length > 0 ? 0.18 : 0.92,
    ]);
  }

  if (map.getLayer("states-line")) {
    map.setPaintProperty("states-line", "line-color", [
      "case",
      selectedWithLga,
      "#003322",
      isSelected,
      "#006b40",
      ["boolean", ["feature-state", "hover"], false],
      "#b45309",
      "#475569",
    ]);
    map.setPaintProperty("states-line", "line-width", [
      "case",
      selectedWithLga,
      4.5,
      isSelected,
      3,
      ["boolean", ["feature-state", "hover"], false],
      2,
      1.1,
    ]);
    map.setPaintProperty("states-line", "line-opacity", [
      "case",
      selectedWithLga,
      1,
      isSelected,
      1,
      ["boolean", ["feature-state", "hover"], false],
      0.95,
      0.85,
    ]);
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
  const outlineSrc = lgaOutlineSourceId(stateId);
  return [
    {
      id: lgaFillLayerId(stateId),
      source: src,
      type: "fill",
      paint: {
        "fill-antialias": true,
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
          0.72,
        ],
      },
    },
    {
      id: lgaLineLayerId(stateId),
      source: outlineSrc,
      type: "line",
      layout: {
        "line-cap": "butt",
        "line-join": "round",
        visibility: "visible",
      },
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
          1.35,
          ["boolean", ["feature-state", "selected"], false],
          1.5,
          1,
        ],
        "line-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.95,
          ["boolean", ["feature-state", "hover"], false],
          0.9,
          0.72,
        ],
      },
    },
  ];
}

export function createLgaLabelLayer(stateId: string): LayerSpecification {
  return {
    id: lgaLabelLayerId(stateId),
    source: lgaSourceId(stateId),
    type: "symbol",
    filter: ["==", ["get", "id"], ""],
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

/** Show labels only for LGAs in `visibleIds` (progressive reveal). */
export function updateLgaLabelFilter(
  map: Map,
  stateId: string,
  visibleIds: string[]
): void {
  const layerId = lgaLabelLayerId(stateId);
  if (!map.getLayer(layerId)) return;
  if (visibleIds.length === 0) {
    map.setFilter(layerId, ["==", ["get", "id"], ""]);
    return;
  }
  map.setFilter(layerId, ["in", ["get", "id"], ["literal", visibleIds]]);
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
  const filled = enrichLgaColors(data);
  map.addSource(lgaSourceId(stateId), lgaSourceSpec(filled));
  map.addSource(
    lgaOutlineSourceId(stateId),
    lgaSourceSpec(toLgaOutlineCollection(filled))
  );
  const [fillLayer, lineLayer] = createLgaFillLineLayers(stateId);
  const anchor = lgaStackAnchor(map);
  map.addLayer(fillLayer, anchor);
  map.addLayer(lineLayer);
  map.addLayer(createLgaLabelLayer(stateId));
  stackLgaLayers(map, stateId);
}