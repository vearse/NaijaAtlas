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
import { registerLandformIcons } from "./landformIcons";

const INSERT_BELOW_NEIGHBORS = "neighbors-fill";
const INSERT_ABOVE_STATES = "states-line";

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
  mountOverlaySource(map, layerId);
  const entry = OVERLAY_REGISTRY[layerId];
  const before = insertBeforeId(map, entry.slot);
  for (const layer of entry.layers) {
    if (!map.getLayer(layer.id)) {
      map.addLayer(
        { ...layer, source: entry.sourceId } as AddLayerObject,
        before
      );
    }
  }
}

/** Mount all overlay layer slots (hidden by default). */
export function addOverlayLayers(map: Map): void {
  registerCityIcons(map);
  registerCoastIcons(map);
  registerLakeIcons(map);
  registerLandformIcons(map);
  for (const layerId of OVERLAY_LAYER_IDS) {
    mountOverlayLayersFor(map, layerId);
  }
}

export function setOverlayVisibility(
  map: Map,
  layerId: OverlayLayerId,
  visible: boolean
): void {
  if (layerId === "cities") registerCityIcons(map);
  if (layerId === "coast") registerCoastIcons(map);
  if (layerId === "lakes") registerLakeIcons(map);
  if (layerId === "landforms") registerLandformIcons(map);
  mountOverlayLayersFor(map, layerId);
  const vis = visible ? "visible" : "none";
  for (const lid of overlayLayerIdsForToggle(layerId)) {
    if (map.getLayer(lid)) {
      map.setLayoutProperty(lid, "visibility", vis);
    }
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

/** Lakes, landforms, cities — always above states and LGA fills. */
export function restackTopOverlayLayers(map: Map): void {
  const topIds = [
    ...OVERLAY_REGISTRY.lakes.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.landforms.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.cities.layers.map((l) => l.id),
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
