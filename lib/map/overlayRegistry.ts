import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  FilterSpecification,
  LayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { OverlayLayerId } from "@/types/overlay";
import { OPT_IN_GROUPS, OVERLAY_LAYER_IDS } from "@/types/overlay";

export type OverlaySlot = "belowNeighbors" | "belowStates" | "aboveStates" | "aboveLgas";

/**
 * Opt-in features (e.g. proposed deep sea ports) are built into the source but
 * kept off the map until the user reveals their group from the layer guide.
 *
 * `["!=", ["get", "optIn"], true]` passes features where `optIn` is absent or
 * `false`, and drops the ones flagged `true`.
 */
export const HIDE_OPT_IN_FILTER: FilterSpecification = [
  "!=",
  ["get", "optIn"],
  true,
];

/**
 * Filter for the Lakes & Ports point layer, honouring which opt-in groups the
 * user has revealed.
 *
 * A point passes when it is not an opt-in feature, or when its `optInGroup` is
 * one the user has revealed. Falls back to the plain point filter when every
 * known group is revealed, which keeps the expression cheap in the common case.
 */
export function coastPointFilter(
  revealedGroups?: ReadonlySet<string>
): FilterSpecification {
  const pointOnly: FilterSpecification = ["==", ["get", "featureKind"], "point"];
  if (!revealedGroups || revealedGroups.size === 0) {
    return ["all", pointOnly, HIDE_OPT_IN_FILTER] as FilterSpecification;
  }
  const allRevealed = [...OPT_IN_GROUPS].every((g) => revealedGroups.has(g));
  if (allRevealed) return pointOnly;
  return [
    "all",
    pointOnly,
    [
      "any",
      ["!", ["has", "optInGroup"]],
      ["in", ["get", "optInGroup"], ["literal", [...revealedGroups]]],
    ],
  ] as FilterSpecification;
}

/**
 * Filter for the security formation layers, honouring the revealed opt-in
 * groups. The four new Army divisions are approved but still forming, so they
 * ship hidden until the reader reveals them from the guide.
 */
export function securityPointFilter(
  revealedGroups?: ReadonlySet<string>
): FilterSpecification {
  const formation: FilterSpecification = [
    "==",
    ["get", "featureKind"],
    "security-formation",
  ];
  if (!revealedGroups || revealedGroups.size === 0) {
    return ["all", formation, HIDE_OPT_IN_FILTER] as FilterSpecification;
  }
  if ([...OPT_IN_GROUPS].every((g) => revealedGroups.has(g))) return formation;
  return [
    "all",
    formation,
    [
      "any",
      ["!", ["has", "optInGroup"]],
      ["in", ["get", "optInGroup"], ["literal", [...revealedGroups]]],
    ],
  ] as FilterSpecification;
}

export interface OverlayLayerDef {
  id: string;
  source: string;
  spec: LayerSpecification;
}

export type OverlayLayerSpec =
  | (Omit<FillLayerSpecification, "source"> & { source?: string })
  | (Omit<LineLayerSpecification, "source"> & { source?: string })
  | (Omit<SymbolLayerSpecification, "source"> & { source?: string })
  | (Omit<CircleLayerSpecification, "source"> & { source?: string });

export interface OverlayRegistryEntry {
  id: OverlayLayerId;
  sourceId: string;
  geoPath: string;
  slot: OverlaySlot;
  /** MapLibre layer ids that receive pointer events when this overlay is active */
  interactiveLayerIds: string[];
  layers: OverlayLayerSpec[];
}

/**
 * One line paint for the waterways layer and the Lakes & Ports coastline.
 *
 * `waterwayClass` discriminates rivers (`major` / `tributary` / `delta`) from
 * the coast (`coastline` / `coast-zone`); `coastZone` picks the zone colour.
 */
const WATERWAY_LINE_PAINT: LineLayerSpecification["paint"] = {
  "line-color": [
    "match",
    ["get", "waterwayClass"],
    "coastline",
    "#1e3a5f",
    "coast-zone",
    [
      "match",
      ["get", "coastZone"],
      "niger-delta",
      "#15803d",
      "cross-river-east",
      "#7c3aed",
      "#0d9488",
    ],
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
      ["get", "waterwayClass"],
      "coastline",
      3.5,
      "coast-zone",
      4.2,
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
      ["get", "waterwayClass"],
      "coastline",
      5.5,
      "coast-zone",
      6.5,
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
      ["get", "waterwayClass"],
      "coastline",
      8,
      "coast-zone",
      9.5,
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

/** Formation labels are coloured by military category, matching the icons. */
const SECURITY_LABEL_PAINT: SymbolLayerSpecification["paint"] = {
  "text-color": [
    "match",
    ["get", "militaryCategory"],
    "army-division",
    "#365314",
    "proposed-army-division",
    "#6d28d9",
    "navy-base",
    "#0f172a",
    "airforce-hq",
    "#075985",
    "airforce-base",
    "#1e3a8a",
    "#334155",
  ],
  "text-halo-color": "#ffffff",
  "text-halo-width": 2,
};

/** Coast points share one label colour lookup. */
const COAST_POINT_LABEL_PAINT: SymbolLayerSpecification["paint"] = {
  "text-color": [
    "match",
    ["get", "waterwayClass"],
    "seaport",
    "#1e3a8a",
    "oil-terminal",
    "#b45309",
    "estuary",
    "#0e7490",
    "environment",
    "#047857",
    "historic",
    "#78350f",
    "#334155",
  ],
  "text-halo-color": "#ffffff",
  "text-halo-width": 2,
};

function createReliefOverlayEntry(
  id: "landforms" | "ecology",
  sourceId: string,
  geoPath: string
): OverlayRegistryEntry {
  const tag = id;
  return {
    id,
    sourceId,
    geoPath,
    slot: "aboveLgas",
    interactiveLayerIds: [
      `overlay-${tag}-markers`,
      `overlay-${tag}-labels`,
      `overlay-${tag}-areas`,
    ],
    layers: [
      {
        id: `overlay-${tag}-areas`,
        type: "fill",
        minzoom: 4,
        filter: ["==", ["get", "featureKind"], "area"],
        paint: {
          "fill-color": [
            "match",
            ["coalesce", ["get", "landformType"], "hill"],
            "plateau",
            "#fde68a",
            "mountain-range",
            "#d6d3d1",
            "escarpment",
            "#fed7aa",
            "delta",
            "#a7f3d0",
            "basin",
            "#fef3c7",
            "savanna",
            "#bef264",
            "forest",
            "#bbf7d0",
            "reserve",
            "#86efac",
            "#ffffff",
          ],
          "fill-opacity": 0.18,
        },
        layout: { visibility: "none" },
      },
      {
        id: `overlay-${tag}-area-lines`,
        type: "line",
        minzoom: 4,
        filter: ["==", ["get", "featureKind"], "area"],
        paint: {
          "line-color": [
            "match",
            ["coalesce", ["get", "landformType"], "hill"],
            "plateau",
            "#a16207",
            "mountain-range",
            "#57534e",
            "escarpment",
            "#92400e",
            "delta",
            "#0891b2",
            "basin",
            "#ca8a04",
            "savanna",
            "#65a30d",
            "forest",
            "#15803d",
            "reserve",
            "#166534",
            "#a8a29e",
          ],
          "line-width": 1.2,
          "line-dasharray": [2, 2],
          "line-opacity": 0.6,
        },
        layout: { visibility: "none" },
      },
      {
        id: `overlay-${tag}-markers`,
        type: "symbol",
        minzoom: 4,
        layout: {
          visibility: "none",
          "icon-image": [
            "match",
            ["coalesce", ["get", "landformType"], "hill"],
            "savanna",
            "landform-icon-grass",
            "basin",
            "landform-icon-sand",
            "delta",
            "landform-icon-delta",
            "forest",
            "landform-icon-forest",
            "reserve",
            "landform-icon-reserve",
            "hill",
            "landform-icon-hill",
            "mountain-range",
            "landform-icon-mountain",
            "plateau",
            "landform-icon-plateau",
            "escarpment",
            "landform-icon-escarpment",
            "inselberg",
            "landform-icon-inselberg",
            "peak",
            "landform-icon-peak",
            "landform-icon-hill",
          ],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.88,
            7,
            1.08,
            10,
            1.28,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 0,
          "icon-anchor": "center",
        },
      },
      {
        id: `overlay-${tag}-labels`,
        type: "symbol",
        filter: ["==", ["to-boolean", ["get", "isLabelAnchor"]], true],
        minzoom: 5,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            [
              "match",
              ["coalesce", ["get", "sizeTier"], "medium"],
              "major",
              11,
              "medium",
              10,
              9,
            ],
            8,
            [
              "match",
              ["coalesce", ["get", "sizeTier"], "medium"],
              "major",
              13,
              "medium",
              12,
              11,
            ],
          ],
          "text-font": ["Open Sans Semibold"],
          "text-offset": [0, 1.35],
          "text-anchor": "top",
          "text-optional": false,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#44403c",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
    ],
  };
}

export const OVERLAY_REGISTRY: Record<OverlayLayerId, OverlayRegistryEntry> = {
  waterways: {
    id: "waterways",
    sourceId: "overlays-waterways",
    geoPath: "/geo/overlays/waterways.geojson",
    slot: "aboveStates",
    interactiveLayerIds: [
      "overlay-waterways-line",
      "overlay-waterways-line-labels",
    ],
    layers: [
      {
        id: "overlay-waterways-line",
        type: "line",
        filter: ["==", ["get", "featureKind"], "line"],
        paint: WATERWAY_LINE_PAINT,
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
      {
        id: "overlay-waterways-line-labels",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "line"],
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
      "overlay-lakes-labels",
      "overlay-lakes-coast-line",
      "overlay-lakes-port-icons",
      "overlay-lakes-port-labels",
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
        id: "overlay-lakes-coast-line",
        type: "line",
        filter: ["==", ["get", "featureKind"], "line"],
        paint: WATERWAY_LINE_PAINT,
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
      {
        id: "overlay-lakes-port-icons",
        type: "symbol",
        filter: coastPointFilter(),
        minzoom: 4,
        layout: {
          visibility: "none",
          // `iconId` is stamped by the overlay build (coast-icon-*).
          "icon-image": ["get", "iconId"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.9, 8, 1.1, 11, 1.4],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 8,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-lakes-port-labels",
        type: "symbol",
        filter: coastPointFilter(),
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "top",
          "text-optional": true,
          "text-max-width": 12,
        },
        paint: COAST_POINT_LABEL_PAINT,
      },
    ],
  },
  power: {
    id: "power",
    sourceId: "overlays-power",
    geoPath: "/geo/overlays/power.geojson",
    slot: "aboveLgas",
    interactiveLayerIds: [
      "overlay-power-corridor",
      "overlay-power-plant-icon",
      "overlay-power-distributor-icon",
      "overlay-power-substation-icon",
      "overlay-power-labels",
    ],
    layers: [
      {
        id: "overlay-power-corridor",
        type: "line",
        filter: ["==", ["get", "featureKind"], "grid-corridor"],
        paint: {
          // 330 kV is the backbone; 132 kV feeders are drawn lighter and thinner.
          "line-color": [
            "match",
            ["to-string", ["get", "voltageKv"]],
            "330",
            "#334155",
            "132",
            "#94a3b8",
            "#64748b",
          ],
          "line-width": [
            "match",
            ["to-string", ["get", "voltageKv"]],
            "330",
            2.2,
            "132",
            1.2,
            1.6,
          ],
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "overlayHidden"], false],
            0,
            ["match", ["to-string", ["get", "voltageKv"]], "330", 0.85, 0.6],
          ],
          "line-dasharray": [2, 1.6],
        },
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      },
      {
        id: "overlay-power-plant-icon",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "power-plant"],
        minzoom: 4,
        layout: {
          visibility: "none",
          "icon-image": [
            "match",
            ["coalesce", ["get", "plantCategory"], "gas-ocgt"],
            "major-hydro",
            "power-icon-major-hydro",
            "regional-hydro",
            "power-icon-regional-hydro",
            "gas-ccgt",
            "power-icon-gas-ccgt",
            "gas-ocgt",
            "power-icon-gas-ocgt",
            "steam",
            "power-icon-steam",
            "power-icon-gas-ocgt",
          ],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.72,
            7,
            1,
            10,
            1.25,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 8,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-power-distributor-icon",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "power-distributor"],
        minzoom: 4,
        layout: {
          visibility: "none",
          "icon-image": "power-icon-distributor",
          // DisCos are only 11 in number and one per licence area, so they are
          // drawn at least as large as a generating station.
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.78,
            7,
            1.05,
            10,
            1.3,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 8,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-power-substation-icon",
        type: "symbol",
        filter: ["==", ["get", "featureKind"], "grid-substation"],
        minzoom: 5,
        layout: {
          visibility: "none",
          "icon-image": [
            "match",
            ["to-string", ["get", "voltageKv"]],
            "330",
            "power-icon-substation-330",
            "power-icon-substation-132",
          ],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.62,
            8,
            0.9,
            11,
            1.1,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 6,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-power-labels",
        type: "symbol",
        filter: ["in", ["get", "featureKind"], ["literal", ["power-plant", "power-distributor"]]],
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "top",
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1f2937",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
    ],
  },
  security: {
    id: "security",
    sourceId: "overlays-security",
    geoPath: "/geo/overlays/security.geojson",
    slot: "aboveLgas",
    interactiveLayerIds: [
      "overlay-security-icons",
      "overlay-security-labels",
    ],
    layers: [
      {
        id: "overlay-security-icons",
        type: "symbol",
        filter: securityPointFilter(),
        minzoom: 4,
        layout: {
          visibility: "none",
          // `iconId` is stamped by the overlay build (security-icon-*).
          "icon-image": ["get", "iconId"],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.85,
            8,
            1.05,
            11,
            1.3,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 8,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-security-labels",
        type: "symbol",
        filter: securityPointFilter(),
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "top",
          "text-optional": true,
          "text-max-width": 12,
        },
        paint: SECURITY_LABEL_PAINT,
      },
    ],
  },
  landforms: createReliefOverlayEntry(
    "landforms",
    "overlays-landforms",
    "/geo/overlays/landforms.geojson"
  ),
  ecology: createReliefOverlayEntry(
    "ecology",
    "overlays-ecology",
    "/geo/overlays/ecology.geojson"
  ),
  cities: {
    id: "cities",
    sourceId: "overlays-cities",
    geoPath: "/geo/overlays/cities.geojson",
    slot: "aboveLgas",
    interactiveLayerIds: [
      "overlay-cities-icon",
      "overlay-cities-labels",
      "overlay-tours-icon",
      "overlay-tours-labels",
    ],
    layers: [
      {
        id: "overlay-cities-icon",
        type: "symbol",
        minzoom: 4,
        layout: {
          visibility: "none",
          "icon-image": [
            "case",
            ["to-boolean", ["coalesce", ["get", "isTour"], false]],
            "city-icon-tour",
            [
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
      {
        id: "overlay-tours-icon",
        type: "symbol",
        source: "overlays-tours",
        minzoom: 4,
        layout: {
          visibility: "none",
          "icon-image": "city-icon-tour",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.55, 7, 0.78, 11, 1],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 10,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-tours-labels",
        type: "symbol",
        source: "overlays-tours",
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 10.5,
          "text-offset": [0, 1.35],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "top",
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#92400e",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      },
    ],
  },
  resources: {
    id: "resources",
    sourceId: "overlays-resources",
    geoPath: "/geo/overlays/resources.geojson",
    slot: "aboveLgas",
    interactiveLayerIds: ["overlay-resources-icons", "overlay-resources-labels"],
    layers: [
      {
        id: "overlay-resources-icons",
        type: "symbol",
        minzoom: 4,
        layout: {
          visibility: "none",
          "icon-image": [
            "concat",
            "resource-icon-",
            ["coalesce", ["get", "resourceType"], "crude-oil"],
          ],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.72, 7, 0.95, 11, 1.2],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-padding": 8,
          "icon-anchor": "center",
        },
      },
      {
        id: "overlay-resources-labels",
        type: "symbol",
        minzoom: 6,
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.45],
          "text-font": ["Open Sans Semibold"],
          "text-anchor": "top",
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": [
            "match",
            ["coalesce", ["get", "resourceType"], "crude-oil"],
            "crude-oil",
            "#1c1917",
            "natural-gas",
            "#b45309",
            "coal",
            "#292524",
            "tin-columbite",
            "#475569",
            "iron-ore",
            "#78350f",
            "gold",
            "#92400e",
            "limestone",
            "#57534e",
            "bitumen",
            "#44403c",
            "lead-zinc",
            "#334155",
            "lithium-rare",
            "#0369a1",
            "marble",
            "#44403c",
            "salt-potash",
            "#92400e",
            "bauxite",
            "#991b1b",
            "gemstones",
            "#6d28d9",
            "kaolin",
            "#44403c",
            "phosphate",
            "#4d7c0f",
            "gypsum",
            "#44403c",
            "graphite",
            "#0c0a09",
            "tungsten",
            "#334155",
            "feldspar-mica",
            "#4338ca",
            "barite",
            "#475569",
            "talc",
            "#57534e",
            "manganese",
            "#57534e",
            "chromite",
            "#7c2d12",
            "copper",
            "#b45309",
            "uranium",
            "#16a34a",
            "diatomite",
            "#57534e",
            "bentonite",
            "#57534e",
            "heavy-mineral-sands",
            "#92400e",
            "dolomite",
            "#57534e",
            "granite-dimension-stone",
            "#334155",
            "fluorspar",
            "#8b5cf6",
            "#0f172a",
          ],
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

/**
 * Pointer-event layers for every active overlay.
 *
 * Derived from `OVERLAY_LAYER_IDS` rather than a hand-maintained list: this list
 * is what makes a layer clickable, and a hardcoded copy silently dropped new
 * layers from the hit test (power rendered but could not be clicked).
 */
export function interactiveLayersForActive(
  active: Set<OverlayLayerId>
): string[] {
  const ids: string[] = [];
  for (const layerId of OVERLAY_LAYER_IDS) {
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
