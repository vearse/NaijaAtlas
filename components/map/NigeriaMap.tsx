"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "@/lib/store/mapStore";
import {
  BASE_STYLE,
  GEO_SOURCES,
  createNeighborLayers,
  createRegionLayers,
  createStateLayers,
  createStateLabelLayer,
  createCountryLabelLayer,
  createLgaFillLineLayers,
  createLgaLabelLayer,
  geoSourceUrl,
  lgaSourceId,
  lgaFillLayerId,
  lgaLineLayerId,
  lgaLabelLayerId,
  lgaSourceSpec,
} from "./mapLayers";
import MapTooltip from "./MapTooltip";
import MapLoadingBadge from "./MapLoadingBadge";
import { createHoverController } from "@/lib/map/useHoverHighlight";
import { queryPriorityLayers } from "@/lib/map/interaction";
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
import type { RegionLocation, StateLocation, LgaLocation } from "@/types/location";

interface NigeriaMapProps {
  states: StateLocation[];
  regions: RegionLocation[];
  lgas: LgaLocation[];
}

type HitKind = "lga" | "state" | "region";

function classifyFeature(layerId: string): HitKind | null {
  if (layerId.includes("-fill") && layerId.startsWith("lgas-")) return "lga";
  if (layerId.includes("-labels") && layerId.startsWith("lgas-")) return "lga";
  if (layerId === "states-fill" || layerId === "states-labels") return "state";
  if (layerId === "regions-fill") return "region";
  return null;
}

export default function NigeriaMap({ states, regions, lgas }: NigeriaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverRef = useRef<ReturnType<typeof createHoverController> | null>(null);
  const lastFlyKeyRef = useRef("");
  const mapReadyRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const loadingLgaRef = useRef(new Set<string>());
  const [lgaLoadingCount, setLgaLoadingCount] = useState(0);
  const loadLgaLayerRef = useRef<(stateId: string) => Promise<void>>(async () => {});
  const regionsRef = useRef(regions);
  regionsRef.current = regions;

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
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const resetCounter = useMapStore((s) => s.resetCounter);
  const loadedLgaRef = useRef(new Set<string>());

  const selectedKey = useMemo(
    () => [...selectedStateIds].sort().join(","),
    [selectedStateIds]
  );

  const lgaVisibleKey = useMemo(
    () => [...lgaVisibleStateIds].sort().join(","),
    [lgaVisibleStateIds]
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

  const pickTopFeature = useCallback(
    (map: maplibregl.Map, point: maplibregl.PointLike) => {
      const store = useMapStore.getState();
      const layers = queryPriorityLayers(store.lgaVisibleStateIds).filter((id) =>
        map.getLayer(id)
      );
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
      const hit = pickTopFeature(map, e.point);
      if (!hit) return;

      const id = getFeatureId(hit.feature.properties as Record<string, unknown>);
      if (!id) return;

      const store = useMapStore.getState();

      if (hit.kind === "lga") {
        store.setSelectedLga(id);
        return;
      }

      if (hit.kind === "state") {
        store.toggleState(id);
        return;
      }

      if (hit.kind === "region") {
        if (store.activeRegionId === id) {
          const region = regionsRef.current.find((r) => r.id === id);
          if (region) store.selectStates(region.stateIds);
        } else {
          store.setActiveRegion(id);
        }
      }
    },
    [pickTopFeature]
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
      const hit = pickTopFeature(map, e.point);

      if (!hit) {
        map.getCanvas().style.cursor = "";
        hoverRef.current?.clear();
        setTooltip(null);
        return;
      }

      map.getCanvas().style.cursor = "pointer";
      const props = hit.feature.properties as Record<string, unknown>;
      const id = getFeatureId(props);
      const name = getFeatureName(props);
      const source = hit.feature.source as string;

      if (id && source) hoverRef.current?.set(source, id);

      const levelLabel =
        hit.kind === "lga" ? "LGA" : hit.kind === "state" ? "State" : "Region";

      setTooltip({ name, level: levelLabel, x: e.point.x, y: e.point.y });
    },
    [pickTopFeature]
  );

  // ——— Map init (once) ———
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE as maplibregl.StyleSpecification,
      maxBounds: WEST_AFRICA_BOUNDS,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.doubleClickZoom.disable();

    const onClick = (e: maplibregl.MapMouseEvent) => handleMapClick(map, e);
    const onDblClick = (e: maplibregl.MapMouseEvent) =>
      handleMapDblClick(map, e);
    const onMove = (e: maplibregl.MapMouseEvent) => handleMapMove(map, e);
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

      for (const layer of [
        ...createNeighborLayers(),
        ...createRegionLayers(),
        ...createStateLayers(),
        createStateLabelLayer(),
        createCountryLabelLayer(),
      ]) {
        map.addLayer(layer);
      }

      hoverRef.current = createHoverController(map);
      mapReadyRef.current = true;
      setMapReady(true);

      const pending = useMapStore.getState().lgaVisibleStateIds;
      for (const stateId of pending) {
        void loadLgaLayerRef.current(stateId);
      }
    });

    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    map.on("mousemove", onMove);
    map.on("mouseleave", onLeave);

    mapRef.current = map;
    return () => {
      mapReadyRef.current = false;
      setMapReady(false);
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      map.off("mousemove", onMove);
      map.off("mouseleave", onLeave);
      map.remove();
      mapRef.current = null;
      hoverRef.current = null;
    };
  }, [handleMapClick, handleMapDblClick, handleMapMove]);

  // ——— Sync selection, labels & region highlight ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !mapReadyRef.current) return;

    const activeRegion = activeRegionId
      ? regions.find((r) => r.id === activeRegionId)
      : null;

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

    // State label visibility: hide when LGAs shown; filter to region when region active
    if (map.getLayer("states-labels")) {
      const hideLabels =
        selectedStateIds.size > 0 || lgaVisibleStateIds.size > 0;
      if (hideLabels) {
        map.setLayoutProperty("states-labels", "visibility", "none");
      } else if (activeRegionId) {
        map.setLayoutProperty("states-labels", "visibility", "visible");
        map.setFilter("states-labels", ["==", ["get", "regionId"], activeRegionId]);
        map.setPaintProperty("states-labels", "text-opacity", 1);
      } else {
        map.setLayoutProperty("states-labels", "visibility", "visible");
        map.setFilter("states-labels", null);
        map.setPaintProperty("states-labels", "text-opacity", 1);
      }
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

    // State fill colours
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
      } else if (selectedStateIds.size > 0) {
        map.setPaintProperty("states-fill", "fill-color", [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#008751",
          ["boolean", ["feature-state", "hover"], false],
          "#fbbf24",
          ["coalesce", ["get", "regionColor"], "#f1f5f9"],
        ]);
        map.setPaintProperty("states-fill", "fill-opacity", [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.55,
          ["boolean", ["feature-state", "hover"], false],
          0.42,
          0.18,
        ]);
      } else {
        map.setPaintProperty("states-fill", "fill-color", [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#008751",
          ["boolean", ["feature-state", "hover"], false],
          "#fbbf24",
          ["coalesce", ["get", "regionColor"], "#f1f5f9"],
        ]);
        map.setPaintProperty("states-fill", "fill-opacity", [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.5,
          ["boolean", ["feature-state", "hover"], false],
          0.38,
          0.92,
        ]);
      }
    }
  }, [selectedKey, lgaVisibleKey, activeRegionId, states, regions, setFeatureState, mapReady, selectedStateIds, lgaVisibleStateIds]);

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
      }
    }
  }, [lgaVisibleKey, selectedLgaId, lgas, setFeatureState, lgaVisibleStateIds]);

  const loadLgaLayer = useCallback(async (stateId: string) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const srcId = lgaSourceId(stateId);
    if (map.getSource(srcId)) return;
    if (loadingLgaRef.current.has(stateId)) return;

    loadingLgaRef.current.add(stateId);
    setLgaLoadingCount(loadingLgaRef.current.size);
    try {
      const res = await fetch(`/geo/lgas/${stateId}.geojson`);
      if (!res.ok) {
        console.warn(`LGA geo not found: ${stateId}`);
        return;
      }
      const data = (await res.json()) as GeoJSON.FeatureCollection;

      const liveMap = mapRef.current;
      if (!liveMap?.isStyleLoaded() || liveMap.getSource(srcId)) return;

      const lineId = lgaLineLayerId(stateId);
      const labelId = lgaLabelLayerId(stateId);

      liveMap.addSource(srcId, lgaSourceSpec(data));
      for (const layer of createLgaFillLineLayers(stateId)) {
        liveMap.addLayer(layer);
      }
      liveMap.addLayer(createLgaLabelLayer(stateId));
      // Stack: fill → line → label (label on top, borders visible beneath)
      if (liveMap.getLayer(lineId) && liveMap.getLayer(labelId)) {
        liveMap.moveLayer(lineId, labelId);
      }
      if (liveMap.getLayer(labelId)) {
        liveMap.moveLayer(labelId);
      }

      loadedLgaRef.current.add(stateId);
    } finally {
      loadingLgaRef.current.delete(stateId);
      setLgaLoadingCount(loadingLgaRef.current.size);
    }
  }, []);

  loadLgaLayerRef.current = loadLgaLayer;

  const removeLgaLayer = useCallback((stateId: string) => {
    const map = mapRef.current;
    if (!map) return;

    const srcId = lgaSourceId(stateId);
    for (const lid of [
      lgaLabelLayerId(stateId),
      lgaLineLayerId(stateId),
      lgaFillLayerId(stateId),
    ]) {
      if (map.getLayer(lid)) map.removeLayer(lid);
    }
    if (map.getSource(srcId)) map.removeSource(srcId);
    loadingLgaRef.current.delete(stateId);
    loadedLgaRef.current.delete(stateId);
  }, []);

  // ——— LGA layer load/unload ———
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !mapReady) return;

    for (const stateId of lgaVisibleStateIds) {
      void loadLgaLayer(stateId);
    }

    for (const stateId of [...loadedLgaRef.current]) {
      if (!lgaVisibleStateIds.has(stateId)) {
        removeLgaLayer(stateId);
      }
    }
  }, [lgaVisibleKey, mapReady, loadLgaLayer, removeLgaLayer, lgaVisibleStateIds]);

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
    if (resetCounter > 0) {
      lastFlyKeyRef.current = "";
      loadedLgaRef.current.clear();
      flyToBounds(NIGERIA_BOUNDS, 40);
    }
  }, [resetCounter, flyToBounds]);

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
