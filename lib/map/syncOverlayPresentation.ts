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
import type { OverlayFocusSpec } from "@/lib/map/overlayFocus";
import { featureMatchesFocus } from "@/lib/map/overlayFocus";

type OpacityPaintKey =
  | "icon-opacity"
  | "text-opacity"
  | "line-opacity"
  | "fill-opacity"
  | "circle-opacity";

const PAINT_KEYS: Record<string, OpacityPaintKey[]> = {
  symbol: ["icon-opacity", "text-opacity"],
  line: ["line-opacity"],
  fill: ["fill-opacity"],
  circle: ["circle-opacity"],
};

const HIDDEN_OPACITY_EXPR = [
  "case",
  ["boolean", ["feature-state", "overlayHidden"], false],
  0,
  1,
] as const;

function sourcesForLayer(layerId: OverlayLayerId): string[] {
  const entry = OVERLAY_REGISTRY[layerId];
  const ids = [entry.sourceId];
  if (layerId === "cities") ids.push(CITY_TOURS_SOURCE);
  return ids;
}

function setLayerPresentationPaint(
  map: MaplibreMap,
  layerId: string,
  enabled: boolean
): void {
  if (!map.getLayer(layerId)) return;
  const layer = map.getLayer(layerId);
  const keys = PAINT_KEYS[layer?.type ?? ""] ?? [];
  for (const key of keys) {
    if (enabled) {
      map.setPaintProperty(layerId, key, HIDDEN_OPACITY_EXPR);
    } else {
      map.setPaintProperty(layerId, key, 1);
    }
  }
}

function shouldHideFeature(
  layerId: OverlayLayerId,
  props: Record<string, unknown>,
  activeLens: LensId,
  focus: OverlayFocusSpec | null
): boolean {
  if (focus) {
    if (
      focus.layerId === layerId &&
      !featureMatchesFocus(props, focus)
    ) {
      return true;
    }
    if (focus.layerId !== layerId) {
      return false;
    }
  }
  if (activeLens === "learn") return false;
  const input = lensInputFromGeoProperties(layerId, props);
  return !matchesActiveLens(input, activeLens);
}

function applyHiddenStates(
  map: MaplibreMap,
  sourceId: string,
  layerId: OverlayLayerId,
  activeLens: LensId,
  focus: OverlayFocusSpec | null,
  layerVisible: boolean
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
    const hidden =
      layerVisible &&
      shouldHideFeature(layerId, props, activeLens, focus);
    map.setFeatureState(
      { source: sourceId, id: fid },
      { overlayHidden: hidden }
    );
  }
}

function clearHiddenStates(map: MaplibreMap, sourceId: string): void {
  const features = map.querySourceFeatures(sourceId);
  const seen = new Set<string | number>();
  for (const f of features) {
    const fid = f.id;
    if (fid == null) continue;
    const key = String(fid);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      map.removeFeatureState({ source: sourceId, id: fid }, "overlayHidden");
    } catch {
      /* ignore */
    }
  }
}

/** Hide non-matching overlay features (lens + optional category focus). */
export function syncOverlayPresentation(
  map: MaplibreMap,
  activeLens: LensId,
  activeOverlays: Set<OverlayLayerId>,
  focus: OverlayFocusSpec | null,
  enabled: boolean
): void {
  const useFilter = enabled && (activeLens !== "learn" || focus != null);

  for (const layerId of OVERLAY_LAYER_IDS) {
    const entry = OVERLAY_REGISTRY[layerId];
    const visible = activeOverlays.has(layerId);
    for (const lid of entry.layers.map((l) => l.id)) {
      if (!map.getLayer(lid)) continue;
      setLayerPresentationPaint(map, lid, useFilter && visible);
    }
  }

  if (!useFilter) {
    for (const layerId of OVERLAY_LAYER_IDS) {
      for (const sourceId of sourcesForLayer(layerId)) {
        if (map.getSource(sourceId)) clearHiddenStates(map, sourceId);
      }
    }
    return;
  }

  for (const layerId of OVERLAY_LAYER_IDS) {
    if (!activeOverlays.has(layerId)) continue;
    for (const sourceId of sourcesForLayer(layerId)) {
      if (!map.getSource(sourceId)) continue;
      applyHiddenStates(
        map,
        sourceId,
        layerId,
        activeLens,
        focus,
        true
      );
    }
  }
}
