import type { Map as MaplibreMap } from "maplibre-gl";
import {
  lensInputFromGeoProperties,
  matchesActiveLens,
  type LensId,
} from "@/lib/lenses/lensHelper";
import { OVERLAY_REGISTRY } from "@/lib/map/overlayRegistry";
import { CITY_TOURS_SOURCE } from "@/components/map/overlayLayers";
import type { OverlayLayerId } from "@/types/overlay";
import { OVERLAY_LAYER_IDS } from "@/types/overlay";

const DIM_OPACITY = 0.22;
const FULL_OPACITY = 1;

const LENS_OPACITY_EXPR = [
  "case",
  ["boolean", ["feature-state", "lensDim"], false],
  DIM_OPACITY,
  FULL_OPACITY,
] as const;

type LensOpacityPaintKey =
  | "icon-opacity"
  | "text-opacity"
  | "line-opacity"
  | "fill-opacity"
  | "circle-opacity";

const PAINT_KEYS: Record<string, LensOpacityPaintKey[]> = {
  symbol: ["icon-opacity", "text-opacity"],
  line: ["line-opacity"],
  fill: ["fill-opacity"],
  circle: ["circle-opacity"],
};

function layerPaintKeys(map: MaplibreMap, layerId: string): LensOpacityPaintKey[] {
  const layer = map.getLayer(layerId);
  if (!layer) return [];
  const type = layer.type;
  return PAINT_KEYS[type] ?? [];
}

function setLayerLensPaint(map: MaplibreMap, layerId: string, enabled: boolean): void {
  if (!map.getLayer(layerId)) return;
  for (const key of layerPaintKeys(map, layerId)) {
    if (enabled) {
      map.setPaintProperty(layerId, key, LENS_OPACITY_EXPR);
    } else {
      map.setPaintProperty(layerId, key, FULL_OPACITY);
    }
  }
}

function sourcesForLayer(layerId: OverlayLayerId): string[] {
  const entry = OVERLAY_REGISTRY[layerId];
  const ids = [entry.sourceId];
  if (layerId === "cities") ids.push(CITY_TOURS_SOURCE);
  return ids;
}

function applyFeatureStates(
  map: MaplibreMap,
  sourceId: string,
  layerId: OverlayLayerId,
  activeLens: LensId
): void {
  const features = map.querySourceFeatures(sourceId);
  const seen = new Set<string | number>();
  for (const f of features) {
    const fid = f.id;
    if (fid == null) continue;
    const key = String(fid);
    if (seen.has(key)) continue;
    seen.add(key);
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const input = lensInputFromGeoProperties(layerId, props);
    const match = matchesActiveLens(input, activeLens);
    map.setFeatureState(
      { source: sourceId, id: fid },
      { lensDim: !match }
    );
  }
}

function clearFeatureStates(map: MaplibreMap, sourceId: string): void {
  const features = map.querySourceFeatures(sourceId);
  const seen = new Set<string | number>();
  for (const f of features) {
    const fid = f.id;
    if (fid == null) continue;
    const key = String(fid);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      map.removeFeatureState({ source: sourceId, id: fid }, "lensDim");
    } catch {
      // source may not support feature-state yet
    }
  }
}

/** Dim non-matching overlay features when lens !== learn; restore when learn. */
export function applyLensOverlayEmphasis(
  map: MaplibreMap,
  activeLens: LensId,
  activeOverlays: Set<OverlayLayerId>
): void {
  const emphasize = activeLens !== "learn";

  for (const layerId of OVERLAY_LAYER_IDS) {
    const entry = OVERLAY_REGISTRY[layerId];
    const visible = activeOverlays.has(layerId);
    for (const lid of entry.layers.map((l) => l.id)) {
      if (!map.getLayer(lid)) continue;
      setLayerLensPaint(map, lid, emphasize && visible);
    }
  }

  if (!emphasize) {
    for (const layerId of OVERLAY_LAYER_IDS) {
      for (const sourceId of sourcesForLayer(layerId)) {
        if (map.getSource(sourceId)) clearFeatureStates(map, sourceId);
      }
    }
    return;
  }

  for (const layerId of OVERLAY_LAYER_IDS) {
    if (!activeOverlays.has(layerId)) continue;
    for (const sourceId of sourcesForLayer(layerId)) {
      if (!map.getSource(sourceId)) continue;
      applyFeatureStates(map, sourceId, layerId, activeLens);
    }
  }
}
