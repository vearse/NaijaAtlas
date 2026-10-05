import type { AddLayerObject, Map } from "maplibre-gl";
import { geoSourceUrl } from "./mapLayers";
import {
  OVERLAY_REGISTRY,
  coastPointFilter,
  overlayLayerIdsForToggle,
  securityPointFilter,
  type OverlayRegistryEntry,
} from "@/lib/map/overlayRegistry";
import { useMapStore } from "@/lib/store/mapStore";
import type { OverlayLayerId } from "@/types/overlay";
import { OPT_IN_GROUPS } from "@/types/overlay";
import { OVERLAY_LAYER_IDS } from "@/types/overlay";
import { registerCityIcons, registerTourIcon } from "./cityIcons";
import { registerCoastIcons } from "./coastIcons";
import { registerPowerIcons } from "./powerIcons";
import {
  landformKindFromImageId,
  registerLandformIcon,
  registerLandformIcons,
} from "./landformIcons";
import { registerSecurityIcons } from "./securityIcons";
import { registerResourceIcons } from "./resourceIcons";
import {
  EMPTY_GEOJSON,
  getTourGeoJSON,
} from "@/lib/map/tourCatalog";

export const CITY_TOURS_SOURCE = "overlays-tours";

const INSERT_BELOW_NEIGHBORS = "neighbors-fill";
const INSERT_ABOVE_STATES = "states-line";

/** Retired layer ids from earlier landform implementations. */
const STALE_LANDFORM_LAYER_IDS = [
  "overlay-landforms-fill",
  "overlay-landforms-line",
  "overlay-landforms-point",
];

/** Retired layer ids from before Coast and ports moved to the Lakes layer. */
const STALE_WATERWAY_LAYER_IDS = [
  "overlay-waterways-labels",
  "overlay-waterways-mil-icons",
  "overlay-waterways-mil-labels",
  "overlay-waterways-point-icons",
  "overlay-waterways-point-labels",
  "overlay-coast-line",
  "overlay-coast-icons",
  "overlay-coast-labels",
];

/**
 * Per-map guard. A module-level flag would survive `map.remove()` and leave
 * every remounted map without its `styleimagemissing` handler, so lazily
 * resolved landform icons would silently stop rendering.
 */
const styleImageHookMaps = new WeakSet<Map>();

function ensureStyleImageMissingHook(map: Map): void {
  if (styleImageHookMaps.has(map)) return;
  styleImageHookMaps.add(map);
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

function removeStaleWaterwayLayers(map: Map): void {
  for (const id of STALE_WATERWAY_LAYER_IDS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
}

/** Ocean, coastline and ports all live in the Lakes source. */
const OCEAN_FILL_LAYER_ID = "overlay-ocean-fill";

/** Register the icon set the Lakes & Ports point layer draws from. */
function registerCoastLayerIcons(map: Map): void {
  registerCoastIcons(map);
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
    if (layerId === "cities") {
      map.addSource(entry.sourceId, geoSourceUrl(entry.geoPath));
      // Tour catalog shares the Cities toggle: keep its data separate but
      // mounted so visibility toggles and restacks apply identically.
      if (!map.getSource(CITY_TOURS_SOURCE)) {
        map.addSource(CITY_TOURS_SOURCE, {
          type: "geojson",
          data: EMPTY_GEOJSON,
        });
      }
    } else {
      map.addSource(entry.sourceId, geoSourceUrl(entry.geoPath));
    }
  }
}

export function mountOverlayLayersFor(map: Map, layerId: OverlayLayerId): void {
  if (layerId === "landforms" || layerId === "ecology") removeStaleLandformLayers(map);
  if (layerId === "waterways") removeStaleWaterwayLayers(map);
  mountOverlaySource(map, layerId);
  const entry = OVERLAY_REGISTRY[layerId];
  const before = insertBeforeId(map, entry.slot);
  for (const layer of entry.layers) {
    if (map.getLayer(layer.id)) continue;
    const source = layer.source ?? entry.sourceId;
    try {
      map.addLayer({ ...layer, source } as AddLayerObject, before);
    } catch (error) {
      console.error(`Failed to add overlay layer ${layer.id}`, error);
    }
  }
}

/** Mount all overlay layer slots (hidden by default). */
export function addOverlayLayers(map: Map): void {
  ensureStyleImageMissingHook(map);
  removeStaleLandformLayers(map);
  removeStaleWaterwayLayers(map);
  registerCityIcons(map);
  registerTourIcon(map);
  registerPowerIcons(map);
  registerSecurityIcons(map);
  registerLandformIcons(map);
  registerCoastLayerIcons(map);
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
  if (layerId === "cities") {
    registerCityIcons(map);
    registerTourIcon(map);
  }
  if (layerId === "power") registerPowerIcons(map);
  if (layerId === "security") registerSecurityIcons(map);
  if (layerId === "lakes") registerCoastLayerIcons(map);
  if (layerId === "resources") registerResourceIcons(map);
  if (layerId === "landforms" || layerId === "ecology") {
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
  // Tours ride along with the Cities toggle — hydrate the shared source.
  if (layerId === "cities") {
    const tourSource = map.getSource(CITY_TOURS_SOURCE) as
      | { setData: (data: GeoJSON.GeoJSON) => void }
      | undefined;
    tourSource?.setData(visible ? getTourGeoJSON() : EMPTY_GEOJSON);
  }
  if ((layerId === "landforms" || layerId === "ecology") && visible) {
    registerLandformIcons(map);
    map.triggerRepaint();
  }
}

/** Re-register icons before showing layers (style swaps can drop images). */
export function prepareOverlayAssets(
  map: Map,
  active: Set<OverlayLayerId>
): void {
  if (active.has("cities")) {
    registerCityIcons(map);
    registerTourIcon(map);
  }
  if (active.has("power")) registerPowerIcons(map);
  if (active.has("security")) registerSecurityIcons(map);
  if (active.has("lakes")) registerCoastLayerIcons(map);
  if (active.has("resources")) registerResourceIcons(map);
  if (active.has("landforms") || active.has("ecology")) {
    registerLandformIcons(map);
  }
}

export function syncAllOverlayVisibility(
  map: Map,
  active: Set<OverlayLayerId>
): void {
  prepareOverlayAssets(map, active);
  for (const layerId of OVERLAY_LAYER_IDS) {
    setOverlayVisibility(map, layerId, active.has(layerId));
  }
  finalizeOverlayStack(map);
  syncOptInGroupVisibility(map, active);
}

/** Layers that opt-in features (proposed ports, new Army divisions) are hidden from. */
const OPT_IN_FILTERED_LAYERS = [
  "overlay-lakes-port-icons",
  "overlay-lakes-port-labels",
  "overlay-security-icons",
  "overlay-security-labels",
];

/**
 * Apply the opt-in reveal state to the Lakes (ports) and Security point layers.
 *
 * `setOverlayVisibility` re-mounts nothing once the layers exist, so the
 * registry's default (hide opt-in) filter persists until it is replaced here.
 */
export function syncOptInGroupVisibility(
  map: Map,
  active: Set<OverlayLayerId>
): void {
  const revealed = useMapStore.getState().revealedOptInGroups;
  for (const lid of OPT_IN_FILTERED_LAYERS) {
    if (!map.getLayer(lid)) continue;
    if (lid.startsWith("overlay-lakes") && !active.has("lakes")) {
      continue;
    }
    if (lid.startsWith("overlay-security") && !active.has("security")) {
      continue;
    }
    // Each overlay keys its opt-in filter on its own `featureKind`.
    const filter = lid.startsWith("overlay-security")
      ? securityPointFilter(revealed)
      : coastPointFilter(revealed);
    try {
      map.setFilter(lid, filter);
    } catch (error) {
      console.error(`Failed to set opt-in filter on ${lid}`, error);
    }
  }
}

/** Keep ocean under states; symbol overlays above admin (cities on top). */
export function finalizeOverlayStack(map: Map): void {
  restackOverlayLayers(map);
  restackTopOverlayLayers(map);
}

/**
 * Ocean + mid overlays. Lakes/landforms/cities are restacked on top separately.
 */
function anchorBelowStatesFill(map: Map): string | undefined {
  if (map.getLayer("states-fill")) return "states-fill";
  if (map.getLayer(INSERT_ABOVE_STATES)) return INSERT_ABOVE_STATES;
  if (map.getLayer(INSERT_BELOW_NEIGHBORS)) return INSERT_BELOW_NEIGHBORS;
  return undefined;
}

export function restackOverlayLayers(map: Map): void {
  const belowFill = anchorBelowStatesFill(map);
  if (map.getLayer(OCEAN_FILL_LAYER_ID) && belowFill) {
    map.moveLayer(OCEAN_FILL_LAYER_ID, belowFill);
  }

  const aboveStates = map.getLayer(INSERT_ABOVE_STATES)
    ? INSERT_ABOVE_STATES
    : undefined;
  const midOverlayIds = OVERLAY_REGISTRY.waterways.layers
    .filter((l) => l.id !== OCEAN_FILL_LAYER_ID)
    .map((l) => l.id);
  for (const id of midOverlayIds) {
    if (!map.getLayer(id)) continue;
    if (aboveStates) map.moveLayer(id, aboveStates);
  }
}

/**
 * Symbol overlays above admin boundaries. Order (bottom → top): lakes (fills,
 * coastline, ports) → landforms → ecology → waterways (rivers) → cities → power
 * → security → resources.
 *
 * Derived from `OVERLAY_REGISTRY` so a newly added overlay is always moved
 * above the admin stack. A layer left out here still draws, but ends up buried
 * under layers that are moved to the top after it.
 */
export function restackTopOverlayLayers(map: Map): void {
  const lakeIds = OVERLAY_REGISTRY.lakes.layers
    .filter((l) => l.id !== OCEAN_FILL_LAYER_ID)
    .map((l) => l.id);
  const topIds = [
    ...lakeIds,
    ...OVERLAY_REGISTRY.landforms.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.ecology.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.waterways.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.cities.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.power.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.security.layers.map((l) => l.id),
    ...OVERLAY_REGISTRY.resources.layers.map((l) => l.id),
  ];
  for (const id of topIds) {
    if (map.getLayer(id)) map.moveLayer(id);
  }
}
