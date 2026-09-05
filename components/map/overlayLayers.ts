import type { AddLayerObject, Map } from "maplibre-gl";
import { geoSourceUrl } from "./mapLayers";
import {
  OVERLAY_REGISTRY,
  overlayLayerIdsForToggle,
  type OverlayRegistryEntry,
} from "@/lib/map/overlayRegistry";
import type { OverlayLayerId } from "@/types/overlay";
import { OVERLAY_LAYER_IDS } from "@/types/overlay";
import { registerCityIcons } from "./cityIcons";
import { registerCoastIcons } from "./coastIcons";
import { registerLakeIcons } from "./lakeIcons";
import {
  landformKindFromImageId,
  registerLandformIcon,
  registerLandformIcons,
} from "./landformIcons";
import { registerWaterwayIcons } from "./waterwayIcons";
import { registerResourceIcons } from "./resourceIcons";

const INSERT_BELOW_NEIGHBORS = "neighbors-fill";
const INSERT_ABOVE_STATES = "states-line";

/** Retired layer ids from earlier landform implementations. */
const STALE_LANDFORM_LAYER_IDS = [
  "overlay-landforms-fill",
  "overlay-landforms-line",
  "overlay-landforms-point",
];

let styleImageHookInstalled = false;

function ensureStyleImageMissingHook(map: Map): void {
  if (styleImageHookInstalled) return;
  styleImageHookInstalled = true;
  map.on("styleimagemissing", (event) => {
    const kind = landformKindFromImageId(event.id);
    if (kind) registerLandformIcon(map, kind);
  });
}

function removeStaleLandformLayers(map: Map): void {
  for (const id of STALE_LANDFORM_LAYER_IDS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
}

function insertBeforeId(map: Map, slot: OverlayRegistryEntry["slot"]): string | undefined {
  if (slot === "belowNeighbors") {
    return map.getLayer(INSERT_BELOW_NEIGHBORS) ? INSERT_BELOW_NEIGHBORS : undefined;
  }
  if (slot === "belowStates" || slot === "aboveStates") {
    return map.getLayer(INSERT_ABOVE_STATES) ? INSERT_ABOVE_STATES : undefined;
  }
  return undefined;
}

export function mountOverlaySource(map: Map, layerId: OverlayLayerId): void {
  const entry = OVERLAY_REGISTRY[layerId];
  if (!map.getSource(entry.sourceId)) {
    map.addSource(entry.sourceId, geoSourceUrl(entry.geoPath));
  }
}

export function mountOverlayLayersFor(map: Map, layerId: OverlayLayerId): void {
  if (layerId === "landforms") removeStaleLandformLayers(map);
  mountOverlaySource(map, layerId);
  const entry = OVERLAY_REGISTRY[layerId];
  const before = insertBeforeId(map, entry.slot);
  for (const layer of entry.layers) {
    if (map.getLayer(layer.id)) continue;
    try {
      map.addLayer(
        { ...layer, source: entry.sourceId } as AddLayerObject,
        before
      );
    } catch (error) {
      console.error(`Failed to add overlay layer ${layer.id}`, error);
    }
  }
}

/** Mount all overlay layer slots (hidden by default). */
export function addOverlayLayers(map: Map): void {
  ensureStyleImageMissingHook(map);
  removeStaleLandformLayers(map);
  registerCityIcons(map);
  registerCoastIcons(map);
  registerLakeIcons(map);
  registerLandformIcons(map);
  registerWaterwayIcons(map);
  registerResourceIcons(map);
  for (const layerId of OVERLAY_LAYER_IDS) {
    mountOverlayLayersFor(map, layerId);
  }
  registerLandformIcons(map);
}

export function setOverlayVisibility(
  map: Map,
  layerId: OverlayLayerId,
  visible: boolean
): void {
  if (layerId === "cities") registerCityIcons(map);
  if (layerId === "coast") registerCoastIcons(map);
  if (layerId === "lakes") registerLakeIcons(map);
  if (layerId === "waterways") registerWaterwayIcons(map);
  if (layerId === "resources") registerResourceIcons(map);
  if (layerId === "landforms") {
    registerLandformIcons(map);
    removeStaleLandformLayers(map);
  }
  mountOverlayLayersFor(map, layerId);
  const vis = visible ? "visible" : "none";
  for (const lid of overlayLayerIdsForToggle(layerId)) {
    if (map.getLayer(lid)) {
      map.setLayoutProperty(lid, "visibility", vis);
    }
  }
  if (layerId === "landforms" && visible) {
    registerLandformIcons(map);
    map.triggerRepaint();
  }
}

export function syncAllOverlayVisibility(
  map: Map,
  active: Set<OverlayLayerId>
): void {
  for (const layerId of OVERLAY_LAYER_IDS) {
    setOverlayVisibility(map, layerId, active.has(layerId));
  }
  restackOverlayLayers(map);
  restackTopOverlayLayers(map);
}

/**
 * Ocean + mid overlays. Lakes/landforms/cities are restacked on top separately.
 */
export function restackOverlayLayers(map: Map): void {
  if (map.getLayer("overlay-ocean-fill")) {
    map.moveLayer(
      "overlay-ocean-fill",
      map.getLayer("states-fill") ? "states-fill" : undefined
    );
  }

  const aboveStates = map.getLayer(INSERT_ABOVE_STATES)
    ? INSERT_ABOVE_STATES
    : undefined;
  const midOverlayIds = [
    ...OVERLAY_REGISTRY.waterways.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.coast.layers
      .filter((l) => l.id !== "overlay-ocean-fill")
      .map((l) => l.id),
  ];
  for (const id of midOverlayIds) {
    if (map.getLayer(id)) map.moveLayer(id, aboveStates);
  }
}

/** Lakes, landforms, cities, resources — always above states and LGA fills. */
export function restackTopOverlayLayers(map: Map): void {
  const topIds = [
    ...OVERLAY_REGISTRY.lakes.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.landforms.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.cities.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.resources.layers.map((l) => l.id),
  ];
  for (const id of topIds) {
    if (map.getLayer(id)) map.moveLayer(id);
  }
}

/** @deprecated Use restackTopOverlayLayers */
export function restackCityLayers(map: Map): void {
  restackTopOverlayLayers(map);
}

/** @deprecated Use restackOverlayLayers */
export function restackMapLayers(map: Map): void {
  restackOverlayLayers(map);
  restackTopOverlayLayers(map);
}

/** @deprecated Use restackOverlayLayers */
export function restackOverlayHighLayers(map: Map): void {
  restackOverlayLayers(map);
  restackTopOverlayLayers(map);
}
