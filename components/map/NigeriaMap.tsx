"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore, MAX_COMPARE_STATES } from "@/lib/store/mapStore";
import {
  BASE_STYLE,
  GEO_SOURCES,
  DRAGGED_STATE_SOURCE,
  getMapStyle,
  createNeighborLayers,
  createRegionLayers,
  createStateLayers,
  createStateLabelLayer,
  createCountryLabelLayer,
  createDraggedStateLayers,
  addLgaStateLayers,
  removeLgaStateLayers,
  applyStateMaskForLgaVisibility,
  applyStateSelectionPaint,
  restackLgaStack,
  enrichLgaColors,
  geoSourceUrl,
  lgaSourceId,
  lgaOutlineSourceId,
  lgaLineLayerId,
  lgaLayersReady,
  updateLgaLabelFilter,
  applyNeighborLayersMapTypeTuning,
  applyAdminLayersMapTypeTuning,
  DIRECTIONS_ROUTE_SOURCE,
  createDirectionsRouteLayers,
  ensureCoreMapSourcesAndLayers,
} from "./mapLayers";
import type { MapTypeId } from "@/lib/store/mapStore";
import type { StyleSpecification } from "maplibre-gl";
import {
  addOverlayLayers,
  syncAllOverlayVisibility,
  restackOverlayLayers,
  restackTopOverlayLayers,
  restackCityLayers,
} from "./overlayLayers";
import MapTooltip from "./MapTooltip";
import MapLoadingBadge from "./MapLoadingBadge";
import { createHoverController } from "@/lib/map/useHoverHighlight";
import {
  queryOverlayLayers,
  queryPriorityLayers,
} from "@/lib/map/interaction";
import { OVERLAY_REGISTRY, resolveOverlayLayerId } from "@/lib/map/overlayRegistry";
import { applyLensOverlayEmphasis } from "@/lib/map/lensOverlayEmphasis";
import { OVERLAY_LAYER_LABELS, type OverlayLayerId } from "@/types/overlay";
import {
  cloneGeometry,
  translateGeometry,
  withExcludeState,
} from "@/lib/map/dragStateGeometry";
import {
  NIGERIA_BOUNDS,
  WEST_AFRICA_BOUNDS,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  bboxToLngLatBounds,
  unionBboxes,
  boundsKey,
  getFeatureId,
  getFeatureName,
} from "@/lib/map/constants";
import {
  fetchLgaGeo,
  prefetchLgaGeoForStates,
  clearLgaGeoCache,
} from "@/lib/map/lgaGeoCache";
import type { RegionLocation, StateLocation, LgaLocation } from "@/types/location";
import type { PoliticsLookups } from "@/types/politics";

interface NigeriaMapProps {
  states: StateLocation[];
  regions: RegionLocation[];
  lgas: LgaLocation[];
  capitalLgaByState: ReadonlyMap<string, string>;
  politicsLookups: PoliticsLookups;
}

type HitKind = "lga" | "state" | "region";

function classifyFeature(layerId: string): HitKind | null {
  if (layerId.includes("-fill") && layerId.startsWith("lgas-")) return "lga";
  if (layerId.includes("-line") && layerId.startsWith("lgas-")) return "lga";
  if (layerId.includes("-labels") && layerId.startsWith("lgas-")) return "lga";
  if (layerId === "states-fill" || layerId === "states-labels") return "state";
  if (layerId === "regions-fill") return "region";
  return null;
}

/** MapLibre isStyleLoaded() flickers false during paint/filter updates — wait for idle. */
function styleIsReady(map: maplibregl.Map): boolean {
  return map.isStyleLoaded() === true;
}

function waitForStyleReady(map: maplibregl.Map, timeoutMs = 8000): Promise<boolean> {
  if (styleIsReady(map)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      map.off("idle", onIdle);
      resolve(ok);
    };
    const onIdle = () => finish(styleIsReady(map));
    const timer = setTimeout(() => finish(styleIsReady(map)), timeoutMs);
    map.once("idle", onIdle);
  });
}

export default function NigeriaMap({
  states,
  regions,
  lgas,
  capitalLgaByState,
  politicsLookups,
}: NigeriaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverRef = useRef<ReturnType<typeof createHoverController> | null>(null);
  const lastFlyKeyRef = useRef("");
  const mapReadyRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const loadingLgaRef = useRef(new Set<string>());
  const [lgaLoadingCount, setLgaLoadingCount] = useState(0);
  const loadLgaLayerRef = useRef<(stateId: string) => Promise<void>>(async () => {});
  const removeLgaLayerRef = useRef<(stateId: string) => void>(() => {});
  const syncLgaVisibilityOnMapRef = useRef<(visible: Set<string>) => void>(() => {});
  const capitalLgaRef = useRef(capitalLgaByState);
  capitalLgaRef.current = capitalLgaByState;
  const lgasRef = useRef(lgas);
  lgasRef.current = lgas;
  const regionsRef = useRef(regions);
  regionsRef.current = regions;
  const politicsLookupsRef = useRef(politicsLookups);
  politicsLookupsRef.current = politicsLookups;
  const adm1FeaturesRef = useRef<Map<string, GeoJSON.Feature>>(new Map());
  const dragHandlersBoundRef = useRef(false);
  const draggedBaseGeometryRef = useRef<GeoJSON.Geometry | null>(null);
  const draggedFeaturePropsRef = useRef<GeoJSON.GeoJsonProperties>({});
  const dragSessionRef = useRef<{
    active: boolean;
    startLngLat: maplibregl.LngLat | null;
    moved: boolean;
  }>({ active: false, startLngLat: null, moved: false });

  const [tooltip, setTooltip] = useState<{
    name: string;
    level: string;
    x: number;
    y: number;
  } | null>(null);

  const bboxById = useMemo(() => {
    const m = new Map<string, [number, number, number, number]>();
    for (const s of states) m.set(s.id, s.bbox);
    for (const l of lgas) m.set(l.id, l.bbox);
    return m;
  }, [states, lgas]);

  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const lgaVisibleStateIds = useMapStore((s) => s.lgaVisibleStateIds);
  const selectedLgaId = useMapStore((s) => s.selectedLgaId);
  const draggedStateId = useMapStore((s) => s.draggedStateId);
  const dragModeStateId = useMapStore((s) => s.dragModeStateId);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const resetCounter = useMapStore((s) => s.resetCounter);
  const activeOverlays = useMapStore((s) => s.activeOverlays);
  const activeLens = useMapStore((s) => s.activeLens);
  const labeledLgaOrder = useMapStore((s) => s.labeledLgaOrder);
  const mapType: MapTypeId = useMapStore((s) => s.mapType);
  const directions = useMapStore((s) => s.directions);
  const loadedLgaRef = useRef(new Set<string>());
  const [lgaReadyKey, setLgaReadyKey] = useState(0);

  const selectedKey = useMemo(
    () => [...selectedStateIds].sort().join(","),
    [selectedStateIds]
  );

  const lgaVisibleKey = useMemo(
    () => [...lgaVisibleStateIds].sort().join(","),
    [lgaVisibleStateIds]
  );

  const activeOverlaysKey = useMemo(
    () => [...activeOverlays].sort().join(","),
    [activeOverlays]
  );

  const flyToBounds = useCallback(
    (bounds: [[number, number], [number, number]], padding = 56) => {
      const map = mapRef.current;
      if (!map) return;
      const key = boundsKey(bounds);
      if (lastFlyKeyRef.current === key) return;
      lastFlyKeyRef.current = key;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      map.fitBounds(bounds, {
        padding,
        duration: reducedMotion ? 0 : 1400,
        pitch: 0,
        bearing: 0,
        easing: (t) =>
          t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
      });
    },
    []
  );

  const setFeatureState = useCallback(
    (source: string, id: string, state: Record<string, boolean>) => {
      const map = mapRef.current;
      if (!map?.getSource(source)) return;
      try {
        map.setFeatureState({ source, id }, state);
      } catch {
        /* ignore */
      }
    },
    []
  );

  /** Write the current directions state into the runtime geojson source. */
  const applyDirectionsState = useCallback((map: maplibregl.Map) => {
    const { directions } = useMapStore.getState();
    const features: GeoJSON.Feature[] = [];

    if (directions.from) {
      features.push({
        type: "Feature",
        properties: { kind: "from", name: directions.from.name },
        geometry: {
          type: "Point",
          coordinates: directions.from.lonLat,
        },
      });
    }
    if (directions.to) {
      features.push({
        type: "Feature",
        properties: { kind: "to", name: directions.to.name },
        geometry: {
          type: "Point",
          coordinates: directions.to.lonLat,
        },
      });
    }
    if (directions.routeGeoJSON && directions.active) {
      features.push({
        type: "Feature",
        properties: {},
        geometry: directions.routeGeoJSON,
      });
    }

    const source = map.getSource(DIRECTIONS_ROUTE_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features,
    });

    for (const lid of [
      "directions-route-line-casing",
      "directions-route-line",
      "directions-endpoints",
    ]) {
      if (map.getLayer(lid)) map.moveLayer(lid);
    }
  }, []);

  const syncLgaLabelFilters = useCallback((map: maplibregl.Map) => {
    const store = useMapStore.getState();
    for (const stateId of store.lgaVisibleStateIds) {
      const visibleIds = store.labeledLgaOrder.filter(
        (lgaId) =>
          lgasRef.current.find((l) => l.id === lgaId)?.parentId === stateId
      );
      updateLgaLabelFilter(map, stateId, visibleIds);
    }
  }, []);

  const readyLgaStateIds = useCallback(
    (map: maplibregl.Map, visible: Iterable<string>) =>
      new Set([...visible].filter((sid) => lgaLayersReady(map, sid))),
    []
  );

  const refreshSelectionPaint = useCallback(
    (map: maplibregl.Map) => {
      const store = useMapStore.getState();
      const ready = readyLgaStateIds(map, store.lgaVisibleStateIds);
      applyStateMaskForLgaVisibility(map, ready, store.draggedStateId);
      applyStateSelectionPaint(map, store.selectedStateIds, ready);
      // Final writer: keep OSM free of admin/region/LGA fills.
      applyAdminLayersMapTypeTuning(map, useMapStore.getState().mapType);
    },
    [readyLgaStateIds]
  );

  const syncLgaVisibilityOnMap = useCallback(
    (visible: Set<string>) => {
      const map = mapRef.current;
      if (!map) return;
      if (!map.isStyleLoaded()) {
        void waitForStyleReady(map).then((ok) => {
          if (ok) syncLgaVisibilityOnMapRef.current(visible);
        });
        return;
      }

      const dragged = useMapStore.getState().draggedStateId;
      const readyVisible = readyLgaStateIds(map, visible);
      applyStateMaskForLgaVisibility(map, readyVisible, dragged);

      for (const stateId of visible) {
        prefetchLgaGeoForStates([stateId]);
        void loadLgaLayerRef.current(stateId);
      }

      for (const stateId of [...loadedLgaRef.current]) {
        if (!visible.has(stateId)) {
          removeLgaLayerRef.current(stateId);
        }
      }

      restackOverlayLayers(map);
      restackLgaStack(map, readyVisible);
      restackTopOverlayLayers(map);
      syncLgaLabelFilters(map);
      refreshSelectionPaint(map);
    },
    [syncLgaLabelFilters, readyLgaStateIds, refreshSelectionPaint]
  );

  const pickCityFeature = useCallback(
    (map: maplibregl.Map, point: maplibregl.PointLike) => {
      const store = useMapStore.getState();
      if (!store.activeOverlays.has("cities")) return null;
      const layers = OVERLAY_REGISTRY.cities.interactiveLayerIds.filter((id) =>
        map.getLayer(id)
      );
      if (!layers.length) return null;
      const features = map.queryRenderedFeatures(point, { layers });
      if (!features.length) return null;
      const feature = features[0];
      const props = feature.properties as Record<string, unknown>;
      const id = getFeatureId(props) ?? String(props.id ?? "");
      if (!id) return null;
      return {
        id,
        name: getFeatureName(props),
        props,
        geometry: feature.geometry,
      };
    },
    []
  );

  const selectOverlayHit = useCallback(
    (
      overlayLayerId: OverlayLayerId,
      hit: {
        id: string;
        name: string;
        props: Record<string, unknown>;
        geometry?: GeoJSON.Geometry | null;
      }
    ) => {
      useMapStore.getState().setSelectedOverlay({
        id: hit.id,
        layerId: overlayLayerId,
        name: hit.name,
        properties: hit.props,
        geometry: hit.geometry,
      });
    },
    []
  );

  const pickOverlayFeature = useCallback(
    (map: maplibregl.Map, point: maplibregl.PointLike) => {
      const store = useMapStore.getState();
      if (store.activeOverlays.size === 0) return null;

      const layers = queryOverlayLayers(store.activeOverlays).filter((id) =>
        map.getLayer(id)
      );
      if (!layers.length) return null;

      const features = map.queryRenderedFeatures(point, { layers });
      if (!features.length) return null;

      const feature = features[0];
      const overlayLayerId = resolveOverlayLayerId(feature.layer.id);
      if (!overlayLayerId) return null;

      const props = feature.properties as Record<string, unknown>;
      if (props.kind === "ocean" || props.interactive === false) return null;
      const id = getFeatureId(props) ?? String(props.id ?? "");
      const name = getFeatureName(props);

      return { feature, overlayLayerId, id, name, props, geometry: feature.geometry };
    },
    []
  );

  const pickTopFeature = useCallback(
    (map: maplibregl.Map, point: maplibregl.PointLike) => {
      const store = useMapStore.getState();
      const layers = queryPriorityLayers(
        store.lgaVisibleStateIds,
        store.selectedStateIds
      ).filter((id) => map.getLayer(id));
      if (!layers.length) return null;

      const features = map.queryRenderedFeatures(point, { layers });
      if (!features.length) return null;

      for (const kind of ["lga", "state", "region"] as HitKind[]) {
        const match = features.find(
          (f) => classifyFeature(f.layer.id) === kind
        );
        if (match) return { kind, feature: match };
      }
      return null;
    },
    []
  );

  const handleMapClick = useCallback(
    (map: maplibregl.Map, e: maplibregl.MapMouseEvent) => {
      const store = useMapStore.getState();

      const cityHit = pickCityFeature(map, e.point);
      if (cityHit) {
        selectOverlayHit("cities", cityHit);
        return;
      }

      const overlayHit = pickOverlayFeature(map, e.point);
      if (overlayHit) {
        selectOverlayHit(overlayHit.overlayLayerId, {
          id: overlayHit.id,
          name: overlayHit.name,
          props: overlayHit.props,
          geometry: overlayHit.geometry,
        });
        return;
      }

      if (useMapStore.getState().mapType === "osm") return;

      const lineLayers = [...store.lgaVisibleStateIds]
        .map((sid) => lgaLineLayerId(sid))
        .filter((id) => map.getLayer(id));
      if (lineLayers.length) {
        const lineHits = map.queryRenderedFeatures(e.point, { layers: lineLayers });
        if (lineHits.length) {
          const lineId = getFeatureId(
            lineHits[0].properties as Record<string, unknown>
          );
          if (lineId) {
            store.addLabeledLga(lineId);
            syncLgaLabelFilters(map);
            return;
          }
        }
      }

      const hit = pickTopFeature(map, e.point);
      if (!hit) return;

      const id = getFeatureId(hit.feature.properties as Record<string, unknown>);
      if (!id) return;

      if (hit.kind === "lga") {
        if (hit.feature.layer.id.includes("-line")) return;
        if (store.mapType === "election") {
          const districtId =
            politicsLookupsRef.current.lgaToSenatorialDistrictId[id] ?? null;
          store.setSelectedLgaForElection(id, districtId);
        } else {
          store.setSelectedLga(id);
        }
        syncLgaLabelFilters(map);
        return;
      }

      if (hit.kind === "state") {
        store.toggleState(id);
        return;
      }

      if (hit.kind === "region") {
        if (store.selectedStateIds.size > 0) return;
        if (store.activeRegionId === id) {
          const region = regionsRef.current.find((r) => r.id === id);
          if (region) store.selectStates(region.stateIds);
        } else {
          store.setActiveRegion(id);
        }
      }
    },
    [pickCityFeature, pickOverlayFeature, pickTopFeature, selectOverlayHit, syncLgaLabelFilters]
  );

  const armDragForState = useCallback(
    (map: maplibregl.Map, point: maplibregl.PointLike) => {
      const layers = ["states-fill", "states-labels", "dragged-state-fill"].filter(
        (id) => map.getLayer(id)
      );
      const features = map.queryRenderedFeatures(point, { layers });
      const stateHit = features.find(
        (f) =>
          f.layer.id === "states-fill" ||
          f.layer.id === "states-labels" ||
          f.layer.id === "dragged-state-fill"
      );
      if (!stateHit) return;

      const stateId = getFeatureId(
        stateHit.properties as Record<string, unknown>
      );
      if (!stateId) return;

      const store = useMapStore.getState();
      const stateName =
        getFeatureName(stateHit.properties as Record<string, unknown>) ||
        stateId;

      if (!store.selectedStateIds.has(stateId)) {
        store.addSelectedState(stateId);
      }

      store.enableDragMode(
        stateId,
        `Drag mode on — drag ${stateName} on the map`
      );
      map.getCanvas().style.cursor = "grab";
    },
    []
  );

  const handleContextMenu = useCallback(
    (map: maplibregl.Map, e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      armDragForState(map, e.point);
    },
    [armDragForState]
  );

  const handleMapDblClick = useCallback(
    (map: maplibregl.Map, e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      const layers = ["states-fill", "states-labels"].filter((id) =>
        map.getLayer(id)
      );
      const features = map.queryRenderedFeatures(e.point, { layers });
      const stateHit = features.find(
        (f) => f.layer.id === "states-fill" || f.layer.id === "states-labels"
      );
      if (!stateHit) return;
      const id = getFeatureId(stateHit.properties as Record<string, unknown>);
      if (!id) return;
      useMapStore.getState().showLgas(id);
      void loadLgaLayerRef.current(id);
    },
    []
  );

  const handleMapMove = useCallback(
    (map: maplibregl.Map, e: maplibregl.MapMouseEvent) => {
      const drag = dragSessionRef.current;
      if (drag.active && drag.startLngLat && draggedBaseGeometryRef.current) {
        const dLng = e.lngLat.lng - drag.startLngLat.lng;
        const dLat = e.lngLat.lat - drag.startLngLat.lat;
        if (Math.abs(dLng) > 0.0001 || Math.abs(dLat) > 0.0001) {
          drag.moved = true;
        }

        const source = map.getSource(DRAGGED_STATE_SOURCE) as
          | maplibregl.GeoJSONSource
          | undefined;
        if (source && draggedBaseGeometryRef.current) {
          const newGeometry = translateGeometry(
            draggedBaseGeometryRef.current,
            dLng,
            dLat
          );
          source.setData({
            type: "Feature",
            properties: draggedFeaturePropsRef.current,
            geometry: newGeometry,
          });
          draggedBaseGeometryRef.current = cloneGeometry(newGeometry);
          dragSessionRef.current.startLngLat = e.lngLat;
        }
        return;
      }

      const cityHit = pickCityFeature(map, e.point);
      if (cityHit) {
        map.getCanvas().style.cursor = "pointer";
        hoverRef.current?.clear();
        setTooltip({
          name: cityHit.name,
          level: OVERLAY_LAYER_LABELS.cities.category,
          x: e.point.x,
          y: e.point.y,
        });
        return;
      }

      const overlayHit = pickOverlayFeature(map, e.point);
      if (overlayHit) {
        map.getCanvas().style.cursor = "pointer";
        hoverRef.current?.clear();
        const category =
          OVERLAY_LAYER_LABELS[overlayHit.overlayLayerId].category;
        setTooltip({
          name: overlayHit.name,
          level: category,
          x: e.point.x,
          y: e.point.y,
        });
        return;
      }

      const hit = pickTopFeature(map, e.point);

      if (!hit) {
        map.getCanvas().style.cursor = "";
        hoverRef.current?.clear();
        setTooltip(null);
        return;
      }

      if (useMapStore.getState().mapType === "osm") {
        map.getCanvas().style.cursor = "";
        hoverRef.current?.clear();
        setTooltip(null);
        return;
      }

      const props = hit.feature.properties as Record<string, unknown>;
      const id = getFeatureId(props);
      const name = getFeatureName(props);
      const source = hit.feature.source as string;

      map.getCanvas().style.cursor =
        hit.kind === "state" && id === useMapStore.getState().dragModeStateId
          ? "grab"
          : "pointer";

      if (id && source) hoverRef.current?.set(source, id);

      const levelLabel =
        hit.kind === "lga" ? "LGA" : hit.kind === "state" ? "State" : "Region";

      setTooltip({ name, level: levelLabel, x: e.point.x, y: e.point.y });
    },
    [pickCityFeature, pickOverlayFeature, pickTopFeature]
  );

  const clearDraggedSource = useCallback((map: maplibregl.Map) => {
    const source = map.getSource(DRAGGED_STATE_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData({ type: "FeatureCollection", features: [] });
    draggedBaseGeometryRef.current = null;
  }, []);

  const liftStateForDrag = useCallback(
    (map: maplibregl.Map, stateId: string) => {
      const feature = adm1FeaturesRef.current.get(stateId);
      if (!feature?.geometry) return;

      const prev = useMapStore.getState().draggedStateId;
      if (prev && prev !== stateId) {
        clearDraggedSource(map);
      }

      useMapStore.getState().setDraggedStateId(stateId);
      draggedBaseGeometryRef.current = cloneGeometry(feature.geometry);
      draggedFeaturePropsRef.current = feature.properties ?? { id: stateId };

      const source = map.getSource(DRAGGED_STATE_SOURCE) as
        | maplibregl.GeoJSONSource
        | undefined;
      source?.setData(feature as GeoJSON.Feature);
    },
    [clearDraggedSource]
  );

  const liftStateForDragRef = useRef(liftStateForDrag);
  liftStateForDragRef.current = liftStateForDrag;

  const setupDragLayers = useCallback(
    (map: maplibregl.Map) => {
      if (!map.getSource(DRAGGED_STATE_SOURCE)) {
        map.addSource(DRAGGED_STATE_SOURCE, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          promoteId: "id",
        });
        for (const layer of createDraggedStateLayers()) {
          map.addLayer(layer);
        }
      }

      if (!dragHandlersBoundRef.current) {
        dragHandlersBoundRef.current = true;

        const beginDrag = (
          e: maplibregl.MapMouseEvent & {
            features?: maplibregl.MapGeoJSONFeature[];
          }
        ) => {
          if (e.originalEvent.button !== 0) return;
          const props = e.features?.[0]?.properties as
            | Record<string, unknown>
            | undefined;
          const id = props ? getFeatureId(props) : null;
          const store = useMapStore.getState();
          if (!id || store.dragModeStateId !== id) return;

          e.preventDefault();
          if (store.draggedStateId !== id) {
            liftStateForDragRef.current(map, id);
          }
          map.dragPan.disable();
          dragSessionRef.current = {
            active: true,
            startLngLat: e.lngLat,
            moved: false,
          };
          map.getCanvas().style.cursor = "grabbing";
        };

        const onDragEnd = () => {
          if (!dragSessionRef.current.active) return;
          dragSessionRef.current.active = false;
          dragSessionRef.current.startLngLat = null;
          map.dragPan.enable();
          const lifted = useMapStore.getState().draggedStateId;
          map.getCanvas().style.cursor = lifted ? "grab" : "";
        };

        map.on("mousedown", "states-fill", beginDrag);
        map.on("mousedown", "dragged-state-fill", beginDrag);
        map.on("mouseup", onDragEnd);
        map.on("mouseleave", onDragEnd);
        map.on("mouseenter", "dragged-state-fill", () => {
          if (
            useMapStore.getState().dragModeStateId &&
            !dragSessionRef.current.active
          ) {
            map.getCanvas().style.cursor = "grab";
          }
        });
        map.on("mouseenter", "states-fill", (e) => {
          const props = e.features?.[0]?.properties as
            | Record<string, unknown>
            | undefined;
          const id = props ? getFeatureId(props) : null;
          if (
            id === useMapStore.getState().dragModeStateId &&
            !dragSessionRef.current.active
          ) {
            map.getCanvas().style.cursor = "grab";
          }
        });
        map.on("mouseleave", "dragged-state-fill", () => {
          if (!dragSessionRef.current.active) map.getCanvas().style.cursor = "";
        });
      }

      if (adm1FeaturesRef.current.size > 0) return;

      void fetch("/geo/nigeria-adm1.geojson")
        .then((res) => res.json())
        .then((collection: GeoJSON.FeatureCollection) => {
          for (const f of collection.features) {
            const id = getFeatureId(f.properties as Record<string, unknown>);
            if (id) adm1FeaturesRef.current.set(id, f as GeoJSON.Feature);
          }
        })
        .catch((err) => console.warn("ADM1 preload for drag failed:", err));
    },
    []
  );

  const handleMapClickRef = useRef(handleMapClick);
  const handleMapDblClickRef = useRef(handleMapDblClick);
  const handleMapMoveRef = useRef(handleMapMove);
  const handleContextMenuRef = useRef(handleContextMenu);
  const setupDragLayersRef = useRef(setupDragLayers);
  const armDragForStateRef = useRef(armDragForState);
  const refreshSelectionPaintRef = useRef(refreshSelectionPaint);
  const readyLgaStateIdsRef = useRef(readyLgaStateIds);
  const syncLgaLabelFiltersRef = useRef(syncLgaLabelFilters);
  const syncLgaVisibilityOnMapRef2 = useRef(syncLgaVisibilityOnMap);

  handleMapClickRef.current = handleMapClick;
  handleMapDblClickRef.current = handleMapDblClick;
  handleMapMoveRef.current = handleMapMove;
  handleContextMenuRef.current = handleContextMenu;
  setupDragLayersRef.current = setupDragLayers;
  armDragForStateRef.current = armDragForState;
  refreshSelectionPaintRef.current = refreshSelectionPaint;
  readyLgaStateIdsRef.current = readyLgaStateIds;
  syncLgaLabelFiltersRef.current = syncLgaLabelFilters;
  syncLgaVisibilityOnMapRef2.current = syncLgaVisibilityOnMap;

  // ——— Map init (once) ———
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const loadedLga = loadedLgaRef.current;
    const loadingLga = loadingLgaRef.current;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE as maplibregl.StyleSpecification,
      maxBounds: WEST_AFRICA_BOUNDS,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.doubleClickZoom.disable();

    const onClick = (e: maplibregl.MapMouseEvent) =>
      handleMapClickRef.current(map, e);
    const onDblClick = (e: maplibregl.MapMouseEvent) =>
      handleMapDblClickRef.current(map, e);
    const onMove = (e: maplibregl.MapMouseEvent) =>
      handleMapMoveRef.current(map, e);
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      hoverRef.current?.clear();
      setTooltip(null);
    };

    map.on("load", () => {
      map.fitBounds(NIGERIA_BOUNDS, { padding: 48, duration: 0 });

      map.addSource(GEO_SOURCES.neighbors, geoSourceUrl("/geo/neighbors.geojson"));
      map.addSource(GEO_SOURCES.adm0, geoSourceUrl("/geo/nigeria-adm0.geojson"));
      map.addSource(GEO_SOURCES.adm1, geoSourceUrl("/geo/nigeria-adm1.geojson"));
      map.addSource(GEO_SOURCES.regions, geoSourceUrl("/geo/regions.geojson"));

      for (const layer of createNeighborLayers()) {
        map.addLayer(layer);
      }

      for (const layer of [
        ...createRegionLayers(),
        ...createStateLayers(),
        createStateLabelLayer(),
        createCountryLabelLayer(),
      ]) {
        map.addLayer(layer);
      }

      addOverlayLayers(map);

      map.addSource(DIRECTIONS_ROUTE_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      for (const layer of createDirectionsRouteLayers()) {
        map.addLayer(layer);
      }

      syncAllOverlayVisibility(map, useMapStore.getState().activeOverlays);

      applyNeighborLayersMapTypeTuning(map, useMapStore.getState().mapType);
      applyAdminLayersMapTypeTuning(map, useMapStore.getState().mapType);

      hoverRef.current = createHoverController(map);
      mapReadyRef.current = true;
      setMapReady(true);
      useMapStore.getState().registerMap(map);
      setupDragLayersRef.current(map);

      const pending = useMapStore.getState().lgaVisibleStateIds;
      for (const stateId of pending) {
        void loadLgaLayerRef.current(stateId);
      }
    });

    const onContextMenu = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      handleContextMenuRef.current(map, e);
    };

    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    const clearLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    const onTouchStart = (e: maplibregl.MapTouchEvent) => {
      if (e.points.length !== 1) return;
      clearLongPress();
      const point = e.points[0];
      longPressTimer = setTimeout(() => {
        armDragForStateRef.current(map, point);
        longPressTimer = null;
      }, 550);
    };
    const onTouchEnd = () => clearLongPress();
    const onTouchMove = () => clearLongPress();

    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    map.on("mousemove", onMove);
    map.on("mouseleave", onLeave);
    map.on("contextmenu", onContextMenu);
    map.on("touchstart", onTouchStart);
    map.on("touchend", onTouchEnd);
    map.on("touchmove", onTouchMove);
    map.on("touchcancel", onTouchEnd);

    mapRef.current = map;
    return () => {
      clearLongPress();
      mapReadyRef.current = false;
      setMapReady(false);
      useMapStore.getState().registerMap(null);
      loadedLga.clear();
      loadingLga.clear();
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      map.off("mousemove", onMove);
      map.off("mouseleave", onLeave);
      map.off("contextmenu", onContextMenu);
      map.off("touchstart", onTouchStart);
      map.off("touchend", onTouchEnd);
      map.off("touchmove", onTouchMove);
      map.off("touchcancel", onTouchEnd);
      map.remove();
      mapRef.current = null;
      hoverRef.current = null;
      dragHandlersBoundRef.current = false;
    };
    // Map instance must init once — handler refs keep listeners up to date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— MapType base-style swap (setStyle + diff:true + reconcile) ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;

    // IDENTITY SHORT-CIRCUIT: prevent setStyle entirely when no raster layer
    // is present and we're going to minimal (i.e. already minimal).
    // This guarantees Minimal mode === the identity pass and eliminates
    // "Minimal stopped working" reports caused by diff-style reapplying
    // paint/layout to runtime-added layers when there was nothing to swap.
    const hasOsmLayer = Boolean(map.getLayer("osm-tiles"));
    if ((mapType === "minimal" || mapType === "election") && !hasOsmLayer) return;
    // Also skip if OSM already loaded + OSM requested (no re-fetch of tiles).
    if (mapType === "osm" && hasOsmLayer) return;

    let cancelled = false;
    void (async () => {
      try {
        map.setStyle(getMapStyle(mapType) as StyleSpecification, {
          diff: true,
        });

        const ready = await waitForStyleReady(map, 10000);
        if (cancelled || !ready) return;

        // 0. Re-ensure core geo + directions sources/layers that
        //    `setStyle({ diff: true })` may have stripped (base styles declare
        //    zero runtime sources → diff drops all of them). Overlay sources
        //    are re-added implicitly by syncAllOverlayVisibility below.
        ensureCoreMapSourcesAndLayers(map);

        const store = useMapStore.getState();
        const readyLgas = readyLgaStateIds(map, store.lgaVisibleStateIds);

        // The dragged-state geojson source is recreated empty by
        // ensureCoreMapSourcesAndLayers, so any armed/lifted drag highlight
        // no longer exists after the swap. Cancel the drag instead of leaving
        // it pointing at a vanished layer with a lingering "drag mode" hint.
        if (store.draggedStateId || store.dragModeStateId) {
          map.getCanvas().style.cursor = "";
          dragSessionRef.current.active = false;
          dragSessionRef.current.startLngLat = null;
          map.dragPan.enable();
          store.cancelDrag();
        }

        // 1. Overlay toggles (cities / resources / landforms / etc.)
        syncAllOverlayVisibility(map, store.activeOverlays);

        // 2. Selection paint + LGA masking (state fill colors & dragged state)
        applyStateMaskForLgaVisibility(
          map,
          readyLgas,
          store.draggedStateId
        );
        applyStateSelectionPaint(
          map,
          store.selectedStateIds,
          readyLgas
        );

        // 3. Z-order restacking
        restackOverlayLayers(map);
        restackLgaStack(map, readyLgas);
        restackTopOverlayLayers(map);

        // 4. Progressive LGA label filters (click-to-label)
        syncLgaLabelFilters(map);

        // 5. Idempotent LGA layer ensure — re-masks + re-stacks for any visible states
        syncLgaVisibilityOnMapRef.current(store.lgaVisibleStateIds);

        // 6. Neighbor-layer tuning per MapType (OSM: less data, minimal: full)
        applyNeighborLayersMapTypeTuning(map, mapType);
        applyAdminLayersMapTypeTuning(map, mapType);

        // 7. Re-apply the directions route + endpoints, because
        //    `setStyle({ diff: true })` wiped the runtime geojson source data.
        //    Re-stacks the route line on top.
        applyDirectionsState(map);
      } catch (err) {
        console.warn("MapType style swap failed:", err);
        const store = useMapStore.getState();
        if (store.draggedStateId || store.dragModeStateId) {
          map.getCanvas().style.cursor = "";
          store.cancelDrag();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Delegate to the *Ref mirrors for callbacks so identity is not a concern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapType, mapReady]);

  // ——— Directions route + endpoints sync to map source ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    // Ensure directions source + layers exist (a concurrent style swap may
    // have just stripped them and reconciliation hasn't finished yet, or
    // directions were activated triggering a fresh swap that hasn't resolved).
    ensureCoreMapSourcesAndLayers(map);
    applyDirectionsState(map);

    const { active, routeGeoJSON, from, to } = useMapStore.getState().directions;
    if (active && routeGeoJSON && from && to) {
      useMapStore.getState().flyToDirectionsRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    directions.routeGeoJSON,
    directions.from?.lonLat[0],
    directions.from?.lonLat[1],
    directions.to?.lonLat[0],
    directions.to?.lonLat[1],
    directions.active,
    mapReady,
  ]);

  // ——— Clear lifted state when drag id cleared ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map || draggedStateId) return;
    clearDraggedSource(map);
  }, [draggedStateId, clearDraggedSource, mapReady]);

  // ——— Sync selection, labels & region highlight ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !mapReadyRef.current) return;

    const activeRegion = activeRegionId
      ? regions.find((r) => r.id === activeRegionId)
      : null;
    const readyVisible = readyLgaStateIds(map, lgaVisibleStateIds);

    for (const s of states) {
      setFeatureState(GEO_SOURCES.adm1, s.id, {
        selected: selectedStateIds.has(s.id),
        inRegion: activeRegion?.stateIds.includes(s.id) ?? false,
      });
    }

    for (const r of regions) {
      setFeatureState(GEO_SOURCES.regions, r.id, {
        highlight: activeRegionId === r.id,
      });
    }

    if (map.getLayer("regions-fill")) {
      map.setPaintProperty(
        "regions-fill",
        "fill-opacity",
        selectedStateIds.size > 0 ? 0.04 : activeRegionId ? 0.12 : 0.08
      );
    }

    // Hide state names only while LGA polygons are on the map
    if (map.getLayer("states-labels")) {
      if (useMapStore.getState().mapType === "osm") {
        map.setLayoutProperty("states-labels", "visibility", "none");
      } else {
      const hideLabels = lgaVisibleStateIds.size > 0;
      if (hideLabels) {
        map.setLayoutProperty("states-labels", "visibility", "none");
      } else if (activeRegionId) {
        map.setLayoutProperty("states-labels", "visibility", "visible");
        map.setFilter(
          "states-labels",
          withExcludeState(
            ["==", ["get", "regionId"], activeRegionId],
            draggedStateId
          )
        );
        map.setPaintProperty("states-labels", "text-opacity", 1);
        map.moveLayer("states-labels");
      } else {
        map.setLayoutProperty("states-labels", "visibility", "visible");
        map.setFilter(
          "states-labels",
          withExcludeState(null, draggedStateId)
        );
        map.setPaintProperty("states-labels", "text-opacity", 1);
        map.moveLayer("states-labels");
      }
      }
    }

    if (map.getLayer("states-fill")) {
      applyStateMaskForLgaVisibility(
        map,
        readyVisible,
        draggedStateId
      );
    }

    if (map.getLayer("country-label")) {
      map.setLayoutProperty(
        "country-label",
        "visibility",
        selectedStateIds.size > 0 ||
          activeRegionId ||
          lgaVisibleStateIds.size > 0
          ? "none"
          : "visible"
      );
    }

    if (map.getLayer("states-fill")) {
      if (activeRegionId && activeRegion && selectedStateIds.size === 0) {
        map.setPaintProperty("states-fill", "fill-color", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#fbbf24",
          ["==", ["get", "regionId"], activeRegionId],
          activeRegion.color,
          "#cbd5e1",
        ]);
        map.setPaintProperty("states-fill", "fill-opacity", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.45,
          ["==", ["get", "regionId"], activeRegionId],
          0.72,
          0.22,
        ]);
      } else {
        applyStateSelectionPaint(
          map,
          selectedStateIds,
          readyVisible
        );
      }
    }

    // Map-type tuning must be the final writer so OSM stays uncluttered
    // no matter which selection/mask effect ran above.
    applyAdminLayersMapTypeTuning(map, useMapStore.getState().mapType);
  }, [selectedKey, lgaVisibleKey, lgaReadyKey, activeRegionId, draggedStateId, states, regions, setFeatureState, mapReady, selectedStateIds, lgaVisibleStateIds, readyLgaStateIds]);

  // ——— LGA selected highlight ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    for (const stateId of lgaVisibleStateIds) {
      const src = lgaSourceId(stateId);
      if (!map.getSource(src)) continue;
      for (const l of lgas) {
        if (l.parentId !== stateId) continue;
        setFeatureState(src, l.id, { selected: l.id === selectedLgaId });
        setFeatureState(lgaOutlineSourceId(stateId), l.id, {
          selected: l.id === selectedLgaId,
        });
      }
    }
  }, [lgaVisibleKey, selectedLgaId, lgas, setFeatureState, lgaVisibleStateIds]);

  const loadLgaLayer = useCallback(async (stateId: string) => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      const ready = await waitForStyleReady(map);
      if (!ready) return;
    }

    if (
      loadedLgaRef.current.has(stateId) &&
      lgaLayersReady(map, stateId)
    ) {
      const visible = useMapStore.getState().lgaVisibleStateIds;
      const readyVisible = readyLgaStateIds(map, visible);
      applyStateMaskForLgaVisibility(
        map,
        readyVisible,
        useMapStore.getState().draggedStateId
      );
      restackOverlayLayers(map);
      restackLgaStack(map, readyVisible);
      restackTopOverlayLayers(map);
      syncLgaLabelFilters(map);
      refreshSelectionPaint(map);
      return;
    }

    if (loadingLgaRef.current.has(stateId)) return;

    loadingLgaRef.current.add(stateId);
    setLgaLoadingCount(loadingLgaRef.current.size);

    try {
      const data = await fetchLgaGeo(stateId);
      if (!data) return;

      let liveMap = mapRef.current;
      if (!liveMap) return;
      if (!liveMap.isStyleLoaded()) {
        const ready = await waitForStyleReady(liveMap);
        if (!ready) return;
        liveMap = mapRef.current;
        if (!liveMap) return;
      }

      addLgaStateLayers(liveMap, stateId, data, {
        electionLookups:
          useMapStore.getState().mapType === "election"
            ? politicsLookupsRef.current
            : undefined,
      });

      loadedLgaRef.current.add(stateId);
      const visible = useMapStore.getState().lgaVisibleStateIds;
      const readyVisible = readyLgaStateIds(liveMap, visible);
      applyStateMaskForLgaVisibility(
        liveMap,
        readyVisible,
        useMapStore.getState().draggedStateId
      );

      const capitalId = capitalLgaRef.current.get(stateId);
      if (capitalId) {
        useMapStore.getState().seedCapitalLabel(capitalId);
      }

      syncLgaLabelFilters(liveMap);
      restackOverlayLayers(liveMap);
      restackLgaStack(liveMap, readyVisible);
      restackTopOverlayLayers(liveMap);
      refreshSelectionPaint(liveMap);
      setLgaReadyKey((k) => k + 1);
    } finally {
      loadingLgaRef.current.delete(stateId);
      setLgaLoadingCount(loadingLgaRef.current.size);
    }
  }, [syncLgaLabelFilters, readyLgaStateIds, refreshSelectionPaint]);

  loadLgaLayerRef.current = loadLgaLayer;

  const removeLgaLayer = useCallback((stateId: string) => {
    const map = mapRef.current;
    if (!map) return;
    const idsInState = lgasRef.current
      .filter((l) => l.parentId === stateId)
      .map((l) => l.id);
    useMapStore.getState().clearLabelsForState(stateId, idsInState);
    removeLgaStateLayers(map, stateId);
    loadingLgaRef.current.delete(stateId);
    loadedLgaRef.current.delete(stateId);
  }, []);

  removeLgaLayerRef.current = removeLgaLayer;
  syncLgaVisibilityOnMapRef.current = syncLgaVisibilityOnMap;

  // ——— LGA layer load/unload (backup for URL hydration; handler fires synchronously on toggle) ———
  useEffect(() => {
    if (!mapReady) return;
    syncLgaVisibilityOnMap(lgaVisibleStateIds);
  }, [lgaVisibleKey, mapReady, syncLgaVisibilityOnMap, lgaVisibleStateIds]);

  useEffect(() => {
    useMapStore.getState().registerLgaVisibilityHandler((visible) => {
      syncLgaVisibilityOnMapRef.current(visible);
    });
    return () => useMapStore.getState().registerLgaVisibilityHandler(null);
  }, []);

  // ——— Overlay layer visibility ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !mapReady) return;
    syncAllOverlayVisibility(map, activeOverlays);
    restackLgaStack(map, readyLgaStateIds(map, lgaVisibleStateIds));
    restackTopOverlayLayers(map);
  }, [activeOverlaysKey, mapReady, activeOverlays, lgaVisibleStateIds, readyLgaStateIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !mapReady) return;
    if (useMapStore.getState().mapType === "election") return;
    const run = () => applyLensOverlayEmphasis(map, activeLens, activeOverlays);
    run();
    map.once("idle", run);
  }, [activeLens, activeOverlaysKey, mapReady, activeOverlays]);

  useEffect(() => {
    if (!mapReady) return;
    const visible = [...useMapStore.getState().lgaVisibleStateIds];
    if (visible.length === 0) return;
    for (const stateId of visible) {
      loadedLgaRef.current.delete(stateId);
      void loadLgaLayer(stateId);
    }
  }, [mapType, mapReady, loadLgaLayer]);

  const labeledLgaKey = labeledLgaOrder.join(",");

  // ——— LGA label filters (progressive reveal) ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !mapReady) return;
    syncLgaLabelFilters(map);
  }, [labeledLgaKey, lgaVisibleKey, mapReady, syncLgaLabelFilters]);

  // ——— Fly to selection ———
  useEffect(() => {
    if (selectedLgaId) {
      const bbox = bboxById.get(selectedLgaId);
      if (bbox) flyToBounds(bboxToLngLatBounds(bbox), 72);
      return;
    }

    if (activeRegionId && selectedStateIds.size === 0) {
      const region = regions.find((r) => r.id === activeRegionId);
      if (region) {
        const bboxes = states
          .filter((s) => region.stateIds.includes(s.id))
          .map((s) => s.bbox);
        flyToBounds(unionBboxes(bboxes), 48);
      }
      return;
    }

    if (selectedStateIds.size > 0) {
      const bboxes = states
        .filter((s) => selectedStateIds.has(s.id))
        .map((s) => s.bbox);
      flyToBounds(unionBboxes(bboxes));
    }
  }, [
    selectedKey,
    selectedLgaId,
    activeRegionId,
    states,
    regions,
    bboxById,
    flyToBounds,
    selectedStateIds,
  ]);

  useEffect(() => {
    if (resetCounter <= 0) return;

    const map = mapRef.current;
    lastFlyKeyRef.current = "";
    hoverRef.current?.clear();
    setTooltip(null);

    if (map) {
      clearDraggedSource(map);
      dragSessionRef.current = { active: false, startLngLat: null, moved: false };
      map.dragPan.enable();
      map.dragRotate.enable();
      map.getCanvas().style.cursor = "";
    }

    if (map?.isStyleLoaded()) {
      syncAllOverlayVisibility(map, new Set());
      applyStateMaskForLgaVisibility(map, [], null);
      applyStateSelectionPaint(map, [], []);
      clearLgaGeoCache();
      loadedLgaRef.current.clear();

      for (const s of states) {
        setFeatureState(GEO_SOURCES.adm1, s.id, {
          selected: false,
          inRegion: false,
          hover: false,
        });
      }
      for (const r of regions) {
        setFeatureState(GEO_SOURCES.regions, r.id, {
          highlight: false,
        });
      }

      if (map.getLayer("states-fill")) {
        map.setPaintProperty("states-fill", "fill-color", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#fbbf24",
          ["coalesce", ["get", "regionColor"], "#f1f5f9"],
        ]);
        map.setPaintProperty("states-fill", "fill-opacity", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.38,
          0.92,
        ]);
      }
      if (map.getLayer("states-labels")) {
        map.setLayoutProperty("states-labels", "visibility", "visible");
        map.setFilter("states-labels", null);
        map.setPaintProperty("states-labels", "text-opacity", 1);
        map.moveLayer("states-labels");
      }
      if (map.getLayer("country-label")) {
        map.setLayoutProperty("country-label", "visibility", "visible");
      }

      // Keep the basemap's map-type tuning intact (OSM stays subtle after reset).
      applyNeighborLayersMapTypeTuning(map, useMapStore.getState().mapType);
      applyAdminLayersMapTypeTuning(map, useMapStore.getState().mapType);

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      map.stop();
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: reducedMotion ? 0 : 600,
      });
    }

    flyToBounds(NIGERIA_BOUNDS, 40);
  }, [
    resetCounter,
    flyToBounds,
    clearDraggedSource,
    setFeatureState,
    states,
    regions,
  ]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full rounded-2xl overflow-hidden shadow-inner ring-1 ring-slate-200/80"
      />
      {lgaLoadingCount > 0 && (
        <MapLoadingBadge label="Loading LGAs…" />
      )}
      {tooltip && (
        <MapTooltip
          name={tooltip.name}
          level={tooltip.level}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </div>
  );
}