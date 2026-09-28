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
      const mapWithRemove = map as MaplibreMap & {
        removePaintProperty?: (layer: string, prop: string) => MaplibreMap;
      };
      try {
        if (typeof mapWithRemove.removePaintProperty === "function") {
          mapWithRemove.removePaintProperty(layerId, key);
        } else {
          map.setPaintProperty(layerId, key, 1);
        }
      } catch {
        map.setPaintProperty(layerId, key, 1);
      }
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

/**
 * Write `overlayHidden` without ever calling `removeFeatureState`.
 *
 * `map.removeFeatureState` queues a deletion that maplibre applies inside
 * `SourceFeatureState.coalesceChanges`, which does
 * `delete state[sourceLayer][feature][key]`. For a feature that never had the
 * state set, `state[sourceLayer][feature]` is `undefined` and the delete
 * throws `Cannot convert undefined or null to object` from inside the render
 * loop — killing the frame and leaving the map stuck until reload.
 *
 * `HIDDEN_OPACITY_EXPR` treats an absent key and `false` identically, so
 * writing `false` is behaviourally the same as removing the key.
 */
function writeHiddenState(
  map: MaplibreMap,
  sourceId: string,
  featureId: string | number,
  hidden: boolean
): void {
  try {
    map.setFeatureState({ source: sourceId, id: featureId }, {
      overlayHidden: hidden,
    });
  } catch {
    /* source may not support feature-state yet */
  }
}

/** Iterate each distinct feature id in a source exactly once. */
function eachSourceFeatureId(
  map: MaplibreMap,
  sourceId: string,
  visit: (
    featureId: string | number,
    props: Record<string, unknown>
  ) => void
): void {
  const features = map.querySourceFeatures(sourceId);
  const seen = new Set<string>();
  for (const f of features) {
    const fid = f.id;
    if (fid == null) continue;
    const key = String(fid);
    if (seen.has(key)) continue;
    seen.add(key);
    visit(fid, (f.properties ?? {}) as Record<string, unknown>);
  }
}

function applyHiddenStates(
  map: MaplibreMap,
  sourceId: string,
  layerId: OverlayLayerId,
  activeLens: LensId,
  focus: OverlayFocusSpec | null
): void {
  eachSourceFeatureId(map, sourceId, (fid, props) => {
    writeHiddenState(
      map,
      sourceId,
      fid,
      shouldHideFeature(layerId, props, activeLens, focus)
    );
  });
}

function clearHiddenStates(map: MaplibreMap, sourceId: string): void {
  eachSourceFeatureId(map, sourceId, (fid) => {
    writeHiddenState(map, sourceId, fid, false);
  });
}

/**
 * Hide non-matching overlay features when the user applies a category focus.
 * Tourist/Invest lens alone does not hide toolbar layers — toggles always stack.
 */
export function syncOverlayPresentation(
  map: MaplibreMap,
  activeLens: LensId,
  activeOverlays: Set<OverlayLayerId>,
  focus: OverlayFocusSpec | null,
  enabled: boolean
): void {
  const useFilter = enabled && focus != null;

  for (const layerId of OVERLAY_LAYER_IDS) {
    const entry = OVERLAY_REGISTRY[layerId];
    const visible = activeOverlays.has(layerId);
    const filterThisLayer = useFilter && visible;
    for (const lid of entry.layers.map((l) => l.id)) {
      if (!map.getLayer(lid)) continue;
      setLayerPresentationPaint(map, lid, filterThisLayer);
    }
  }

  for (const layerId of OVERLAY_LAYER_IDS) {
    for (const sourceId of sourcesForLayer(layerId)) {
      if (!map.getSource(sourceId)) continue;
      if (useFilter && activeOverlays.has(layerId)) continue;
      clearHiddenStates(map, sourceId);
    }
  }

  if (!useFilter) return;

  for (const layerId of OVERLAY_LAYER_IDS) {
    if (!activeOverlays.has(layerId)) continue;
    for (const sourceId of sourcesForLayer(layerId)) {
      if (!map.getSource(sourceId)) continue;
      applyHiddenStates(map, sourceId, layerId, activeLens, focus);
    }
  }
}
