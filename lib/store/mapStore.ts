import { create } from "zustand";
import type { Map as MaplibreMap } from "maplibre-gl";

const MAX_COMPARE_STATES = 3;
export const MAX_ELECTION_STATES = 5;

function maxSelectedStates(mapType: MapTypeId): number {
  return mapType === "election" ? MAX_ELECTION_STATES : MAX_COMPARE_STATES;
}

export type MobileSheetMode = "hidden" | "peek" | "open";
export type MapTypeId = "minimal" | "osm" | "election" | "ranking";

/** Active comparison panel (state today; metro & LGA later). */
export type CompareViewId = "state" | "metro" | "lga";

export function canCompareStates(state: {
  mapType: MapTypeId;
  selectedStateIds: Set<string>;
  selectedLgaId: string | null;
}): boolean {
  if (
    state.mapType === "election" ||
    state.mapType === "ranking" ||
    state.selectedLgaId
  ) {
    return false;
  }
  const n = state.selectedStateIds.size;
  return n >= 2 && n <= MAX_COMPARE_STATES;
}

function pruneStateOrder(order: string[], ids: Set<string>): string[] {
  return order.filter((id) => ids.has(id));
}

/** Most recently selected state still in the set (panel focus when multi-select). */
export function primarySelectedStateId(
  selectedStateIds: Set<string>,
  selectedStateOrder: string[]
): string | null {
  for (let i = selectedStateOrder.length - 1; i >= 0; i--) {
    const id = selectedStateOrder[i];
    if (selectedStateIds.has(id)) return id;
  }
  return selectedStateIds.size > 0
    ? (selectedStateIds.values().next().value ?? null)
    : null;
}

function appendStateToOrder(
  order: string[],
  id: string,
  ids: Set<string>
): string[] {
  const pruned = pruneStateOrder(order, ids);
  return [...pruned.filter((x) => x !== id), id];
}

function evictOldestSelectedState(
  mapType: MapTypeId,
  next: Set<string>,
  order: string[]
): { ids: Set<string>; order: string[] } {
  const max = maxSelectedStates(mapType);
  let ids = new Set(next);
  let ord = pruneStateOrder(order, ids);
  while (ids.size > max) {
    const oldest = ord.find((sid) => ids.has(sid)) ?? ids.values().next().value;
    if (!oldest) break;
    ids.delete(oldest);
    ord = ord.filter((sid) => sid !== oldest);
  }
  return { ids, order: ord };
}

function retainCompareView(
  current: CompareViewId | null,
  mapType: MapTypeId,
  selectedStateIds: Set<string>,
  selectedLgaId: string | null
): CompareViewId | null {
  if (current === "state") {
    return canCompareStates({ mapType, selectedStateIds, selectedLgaId })
      ? current
      : null;
  }
  return current;
}

function syncElectionLgaVisibility(
  mapType: MapTypeId,
  selectedStateIds: Set<string>,
  lgaVisible: Set<string>
): void {
  if (mapType !== "election") return;
  for (const id of selectedStateIds) {
    lgaVisible.add(id);
  }
}

export interface DirectionsTarget {
  name: string;
  lonLat: [number, number];
  kind: "state" | "lga" | "overlay" | "custom";
}

export interface DirectionsState {
  from: DirectionsTarget | null;
  to: DirectionsTarget | null;
  routeGeoJSON: GeoJSON.LineString | null;
  steps: DrivingStep[];
  active: boolean;
}

import type { OverlayLayerId, SelectedOverlayFeature } from "@/types/overlay";
import type { DrivingStep } from "@/lib/map/directionsApi";
import type { LensId } from "@/lib/lenses/lensHelper";
import { defaultOverlaysForLens } from "@/lib/lenses/lensMapLayers";
import { syncAllOverlayVisibility } from "@/components/map/overlayLayers";
import type { PollingUnitShardEntry } from "@/types/politics";
import type { LgaFocusPlan } from "@/lib/map/lgaMapFocus";
import {
  MAX_FEATURE_MAP_VIEWS,
  type FeatureMapView,
  fitMapToStateIds,
} from "@/lib/map/featureMapViews";
import {
  MAX_METRO_MAP_VIEWS,
  type MetroMapView,
  planToMetroView,
  assignMetroColorIndex,
} from "@/lib/map/metroMapViews";
import type { OverlayFocusSpec } from "@/lib/map/overlayFocus";
import type { RankingCategoryId } from "@/lib/ranking/types";
import { DEFAULT_RANKING } from "@/lib/ranking/defaults";

const DEFAULT_ACTIVE_OVERLAYS = new Set<OverlayLayerId>(["cities"]);

export interface MapSelectionState {
  selectedStateIds: Set<string>;
  /** Selection order — last entry is the panel “focus” state when several are selected. */
  selectedStateOrder: string[];
  lgaVisibleStateIds: Set<string>;
  selectedLgaId: string | null;
  /** State currently lifted off the map for dragging (one at a time). */
  draggedStateId: string | null;
  /** Selected state armed for dragging from the header (required before map drag). */
  dragModeStateId: string | null;
  activeRegionId: string | null;
  panelOpen: boolean;
  mobileSheet: MobileSheetMode;
  resetCounter: number;
  activeOverlays: Set<OverlayLayerId>;
  /** Layer guide shown in the panel when a toolbar layer is toggled on. */
  overlayGuideLayer: OverlayLayerId | null;
  selectedOverlay: SelectedOverlayFeature | null;
  wikiModal: { url: string; title?: string } | null;
  directionsModalFeature: DirectionsTarget | null;
  /** Directions target pinned into the location panel (focus mode). */
  directionsPanelTarget: DirectionsTarget | null;
  mapTypeBeforeDirections: MapTypeId | null;
  /** LGA ids with visible map labels (click-to-label, no cap). */
  labeledLgaOrder: string[];
  /** Transient toast-style hint from map actions (e.g. drag armed). */
  mapActionHint: string | null;
  mapInstance: MaplibreMap | null;
  /** Called synchronously when LGA visibility changes (map loads/masks immediately). */
  lgaVisibilityHandler: ((visible: Set<string>) => void) | null;
  registerLgaVisibilityHandler: (
    handler: ((visible: Set<string>) => void) | null
  ) => void;
  toggleState: (id: string) => void;
  addSelectedState: (id: string) => void;
  selectStates: (ids: string[]) => void;
  showLgas: (id: string) => void;
  hideLgas: (id: string) => void;
  showLgasForStates: (ids: string[]) => void;
  setSelectedLga: (id: string | null) => void;
  setSelectedLgaForElection: (
    lgaId: string | null,
    senatorialDistrictId: string | null
  ) => void;
  setDraggedStateId: (id: string | null) => void;
  cancelDrag: () => void;
  toggleDragMode: (stateId: string) => void;
  enableDragMode: (stateId: string, hint?: string) => void;
  toggleOverlay: (id: OverlayLayerId) => void;
  clearAllOverlays: () => void;
  clearOverlayGuide: () => void;
  setSelectedOverlay: (feature: SelectedOverlayFeature | null) => void;
  clearSelectedOverlay: () => void;
  openWikiModal: (url: string, title?: string) => void;
  closeWikiModal: () => void;
  openDirectionsModal: (target: DirectionsTarget) => void;
  closeDirectionsModal: () => void;
  openDirectionsPanel: (target: DirectionsTarget) => void;
  closeDirectionsPanel: () => void;
  restoreMapTypeAfterDirections: () => void;
  addLabeledLga: (id: string) => boolean;
  seedCapitalLabel: (lgaId: string) => void;
  clearLabelsForState: (stateId: string, lgaIdsInState: string[]) => void;
  setMapActionHint: (hint: string | null) => void;
  registerMap: (map: MaplibreMap | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setActiveRegion: (id: string | null) => void;
  openMobileSheet: () => void;
  peekMobileSheet: () => void;
  closeMobileSheet: () => void;
  reset: () => void;
  mapType: MapTypeId;
  setMapType: (id: MapTypeId) => void;
  selectedSenatorialDistrictId: string | null;
  setSelectedSenatorialDistrict: (id: string | null) => void;
  /** Confirmed polling unit from the 2027 locator (persists until the user changes it). */
  confirmedPollingUnit: PollingUnitShardEntry | null;
  setConfirmedPollingUnit: (unit: PollingUnitShardEntry | null) => void;
  activeLens: LensId;
  setActiveLens: (lens: LensId) => void;
  directions: DirectionsState;
  setDirectionsFrom: (f: DirectionsTarget | null) => void;
  setDirectionsTo: (t: DirectionsTarget | null) => void;
  setDirectionsRoute: (r: GeoJSON.LineString | null) => void;
  setDirectionsSteps: (steps: DrivingStep[]) => void;
  toggleDirections: (active: boolean) => void;
  clearDirections: () => void;
  flyToDirectionsRoute: () => void;
  /** Colored state coverage from overlay “view on map” (max 10). */
  featureMapViews: FeatureMapView[];
  toggleFeatureMapView: (input: {
    id: string;
    label: string;
    stateIds: string[];
  }) => void;
  removeFeatureMapView: (id: string) => void;
  clearFeatureMapViews: () => void;
  /** Metro / LGA groups on the map (independent of state selection). */
  metroMapViews: MetroMapView[];
  activeMetroPanelId: string | null;
  toggleMetroMapView: (plan: LgaFocusPlan) => void;
  removeMetroMapView: (id: string) => void;
  clearMetroMapViews: () => void;
  setActiveMetroPanelId: (id: string | null) => void;
  /** User-opened compare mode (not automatic when multi-select). */
  compareView: CompareViewId | null;
  openCompareView: (view: CompareViewId) => void;
  closeCompareView: () => void;
  rankingCategory: RankingCategoryId;
  rankingFieldKey: string;
  rankingPeriod: string;
  rankingHighlightedStateId: string | null;
  setRankingMetric: (categoryId: RankingCategoryId, fieldKey: string) => void;
  setRankingPeriod: (period: string) => void;
  setRankingHighlightedState: (stateId: string | null) => void;
  enterRankingMode: (metric?: {
    categoryId: RankingCategoryId;
    fieldKey: string;
    period: string;
  }) => void;
  overlayFeatureFocus: OverlayFocusSpec | null;
  setOverlayFeatureFocus: (spec: OverlayFocusSpec | null) => void;
  lensOverlaysCustomized: boolean;
}

function mobileSheetForSelection(count: number): MobileSheetMode {
  if (count === 0) return "hidden";
  if (count === 1) return "open";
  return "peek";
}

function notifyLgaVisibility(get: () => MapSelectionState): void {
  get().lgaVisibilityHandler?.(get().lgaVisibleStateIds);
}

function pruneLabelsForHiddenStates(
  order: string[],
  lgaVisible: Set<string>,
  getParent: (lgaId: string) => string | undefined
): string[] {
  return order.filter((lgaId) => {
    const parent = getParent(lgaId);
    return parent != null && lgaVisible.has(parent);
  });
}

export const useMapStore = create<MapSelectionState>((set, get) => ({
  selectedStateIds: new Set(),
  selectedStateOrder: [],
  lgaVisibleStateIds: new Set(),
  selectedLgaId: null,
  draggedStateId: null,
  dragModeStateId: null,
  activeRegionId: null,
  panelOpen: false,
  mobileSheet: "hidden",
  resetCounter: 0,
  activeOverlays: new Set(DEFAULT_ACTIVE_OVERLAYS),
  overlayGuideLayer: null,
  selectedOverlay: null,
  wikiModal: null,
  directionsModalFeature: null,
  directionsPanelTarget: null,
  mapTypeBeforeDirections: null,
  labeledLgaOrder: [],
  mapActionHint: null,
  mapInstance: null,
  lgaVisibilityHandler: null,
  mapType: "minimal",
  selectedSenatorialDistrictId: null,
  confirmedPollingUnit: null,
  activeLens: "learn",
  directions: {
    from: null,
    to: null,
    routeGeoJSON: null,
    steps: [],
    active: false,
  },
  featureMapViews: [],
  metroMapViews: [],
  activeMetroPanelId: null,
  compareView: null,
  rankingCategory: DEFAULT_RANKING.categoryId,
  rankingFieldKey: DEFAULT_RANKING.fieldKey,
  rankingPeriod: DEFAULT_RANKING.period,
  rankingHighlightedStateId: null,
  overlayFeatureFocus: null,
  lensOverlaysCustomized: false,

  registerMap: (map) => set({ mapInstance: map }),

  toggleFeatureMapView: ({ id, label, stateIds }) => {
    const uniqueIds = [...new Set(stateIds)].filter(Boolean);
    if (uniqueIds.length === 0) return;
    const current = get().featureMapViews;
    const existing = current.find((v) => v.id === id);
    if (existing) {
      set({ featureMapViews: current.filter((v) => v.id !== id) });
      return;
    }
    let next = [...current];
    if (next.length >= MAX_FEATURE_MAP_VIEWS) {
      next = next.slice(1);
    }
    const used = new Set(next.map((v) => v.colorIndex));
    let colorIndex = 0;
    for (let i = 0; i < MAX_FEATURE_MAP_VIEWS; i += 1) {
      if (!used.has(i)) {
        colorIndex = i;
        break;
      }
    }
    next.push({ id, label, stateIds: uniqueIds, colorIndex });
    set({ featureMapViews: next });
    const map = get().mapInstance;
    if (map) fitMapToStateIds(map, uniqueIds);
  },

  removeFeatureMapView: (id) =>
    set({
      featureMapViews: get().featureMapViews.filter((v) => v.id !== id),
    }),

  clearFeatureMapViews: () => set({ featureMapViews: [] }),

  toggleMetroMapView: (plan) => {
    if (!plan || plan.stateIds.length === 0) return;
    const current = get().metroMapViews;
    const existing = current.find((v) => v.id === plan.id);
    if (existing) {
      const next = current.filter((v) => v.id !== plan.id);
      set({
        metroMapViews: next,
        activeMetroPanelId:
          get().activeMetroPanelId === plan.id
            ? next[0]?.id ?? null
            : get().activeMetroPanelId,
      });
      notifyLgaVisibility(get);
      return;
    }

    let next = [...current];
    if (next.length >= MAX_METRO_MAP_VIEWS) {
      next = next.slice(1);
    }
    const used = new Set(next.map((v) => v.colorIndex));
    const colorIndex = assignMetroColorIndex(used);
    const view = planToMetroView(
      { ...plan, colorIndex, label: plan.label ?? plan.id },
      colorIndex
    );
    next.push(view);
    set({
      metroMapViews: next,
      activeMetroPanelId: plan.id,
      selectedOverlay: null,
      directionsPanelTarget: null,
      panelOpen: true,
      mobileSheet: "open",
      mapActionHint: plan.label
        ? `${plan.label} on map — add up to ${MAX_METRO_MAP_VIEWS} metros; states stay unselected`
        : `Metro on map — up to ${MAX_METRO_MAP_VIEWS} at once`,
    });
    notifyLgaVisibility(get);
    const map = get().mapInstance;
    if (map && plan.bounds) {
      map.fitBounds(plan.bounds, { padding: 40, duration: 900 });
    }
  },

  removeMetroMapView: (id) => {
    const next = get().metroMapViews.filter((v) => v.id !== id);
    set({
      metroMapViews: next,
      activeMetroPanelId:
        get().activeMetroPanelId === id ? next[0]?.id ?? null : get().activeMetroPanelId,
    });
    notifyLgaVisibility(get);
  },

  clearMetroMapViews: () => {
    set({ metroMapViews: [], activeMetroPanelId: null, mapActionHint: null });
    notifyLgaVisibility(get);
  },

  setActiveMetroPanelId: (id) => set({ activeMetroPanelId: id }),

  openCompareView: (view) => {
    if (view !== "state") return;
    if (!canCompareStates(get())) return;
    set({
      compareView: view,
      panelOpen: true,
      mobileSheet: "open",
    });
  },

  closeCompareView: () => set({ compareView: null }),
  setMapType: (id) => {
    const prev = get().mapType;
    if (prev === "election" && id !== "election") {
      set({
        mapType: id,
        selectedSenatorialDistrictId: null,
        lgaVisibleStateIds: new Set(),
        selectedLgaId: null,
        directionsPanelTarget: null,
        metroMapViews: [],
        activeMetroPanelId: null,
        compareView: null,
      });
      notifyLgaVisibility(get);
      return;
    }
    if (prev === "ranking" && id !== "ranking") {
      set({
        mapType: id,
        rankingHighlightedStateId: null,
        selectedStateIds: new Set(),
        selectedStateOrder: [],
        lgaVisibleStateIds: new Set(),
        selectedLgaId: null,
        activeRegionId: null,
        compareView: null,
      });
      notifyLgaVisibility(get);
      return;
    }
    if (id === "ranking" && prev !== "ranking") {
      set({
        mapType: id,
        activeOverlays: new Set(),
        selectedOverlay: null,
        overlayGuideLayer: null,
        overlayFeatureFocus: null,
        selectedSenatorialDistrictId: null,
        lgaVisibleStateIds: new Set(),
        selectedLgaId: null,
        activeRegionId: null,
        directionsPanelTarget: null,
        metroMapViews: [],
        activeMetroPanelId: null,
        compareView: null,
        rankingHighlightedStateId: null,
        mobileSheet: "open",
      });
      notifyLgaVisibility(get);
      return;
    }
    if (id === "election" && prev !== "election") {
      const selected = new Set(get().selectedStateIds);
      const lgaVisible = new Set(get().lgaVisibleStateIds);
      syncElectionLgaVisibility("election", selected, lgaVisible);
      set({
        mapType: id,
        activeOverlays: new Set(),
        selectedOverlay: null,
        overlayGuideLayer: null,
        selectedSenatorialDistrictId: null,
        lgaVisibleStateIds: lgaVisible,
        activeRegionId: null,
        directionsPanelTarget: null,
        metroMapViews: [],
        activeMetroPanelId: null,
        compareView: null,
      });
      notifyLgaVisibility(get);
      return;
    }
    set({ mapType: id });
  },
  setSelectedSenatorialDistrict: (id) =>
    set({ selectedSenatorialDistrictId: id, mobileSheet: "open" }),
  setConfirmedPollingUnit: (unit) => set({ confirmedPollingUnit: unit }),
  setActiveLens: (lens) => {
    const mapType = get().mapType;
    if (mapType === "election" || mapType === "ranking") {
      set({ activeLens: lens });
      return;
    }
    const customized = get().lensOverlaysCustomized;
    set({
      activeLens: lens,
      activeOverlays: customized
        ? get().activeOverlays
        : defaultOverlaysForLens(lens),
      selectedOverlay: null,
      overlayGuideLayer: null,
    });
  },

  setRankingMetric: (categoryId, fieldKey) => {
    set({
      rankingCategory: categoryId,
      rankingFieldKey: fieldKey,
      rankingHighlightedStateId: null,
    });
  },
  setRankingPeriod: (period) =>
    set({ rankingPeriod: period, rankingHighlightedStateId: null }),
  setRankingHighlightedState: (stateId) =>
    set({ rankingHighlightedStateId: stateId }),
  enterRankingMode: (metric) => {
    const m = metric ?? DEFAULT_RANKING;
    get().setMapType("ranking");
    set({
      rankingCategory: m.categoryId,
      rankingFieldKey: m.fieldKey,
      rankingPeriod: m.period,
      rankingHighlightedStateId: null,
      mobileSheet: "open",
    });
  },
  setOverlayFeatureFocus: (spec) => set({ overlayFeatureFocus: spec }),

  clearAllOverlays: () => {
    const empty = new Set<OverlayLayerId>();
    set({
      activeOverlays: empty,
      selectedOverlay: null,
      overlayGuideLayer: null,
    });
    const map = get().mapInstance;
    if (map?.isStyleLoaded()) {
      syncAllOverlayVisibility(map, empty);
    }
  },

  setDirectionsFrom: (from) =>
    set((state) => ({
      directions: { ...state.directions, from },
    })),
  setDirectionsTo: (to) =>
    set((state) => ({
      directions: { ...state.directions, to },
    })),
  setDirectionsRoute: (routeGeoJSON) =>
    set((state) => ({
      directions: { ...state.directions, routeGeoJSON },
    })),
  setDirectionsSteps: (steps) =>
    set((state) => ({
      directions: { ...state.directions, steps },
    })),
  toggleDirections: (active) => {
    const state = get();
    if (active) {
      if (state.mapType !== "osm") {
        set({ mapTypeBeforeDirections: state.mapType });
        state.setMapType("osm");
      }
      set({
        directions: { ...get().directions, active: true },
      });
      get().closeDirectionsModal();
      return;
    }
    set({
      directions: { ...state.directions, active: false },
    });
  },
  clearDirections: () => {
    const prev = get().mapTypeBeforeDirections;
    set({
      directions: {
        ...get().directions,
        from: null,
        to: null,
        routeGeoJSON: null,
        steps: [],
        active: false,
      },
      mapTypeBeforeDirections: null,
    });
    if (prev && prev !== "osm") {
      get().setMapType(prev);
    }
  },
  restoreMapTypeAfterDirections: () => {
    get().clearDirections();
  },
  flyToDirectionsRoute: () => {
    const state = get();
    const map = state.mapInstance;
    const from = state.directions.from;
    const to = state.directions.to;
    if (!map || !from || !to) return;
    const lons = [from.lonLat[0], to.lonLat[0]];
    const lats = [from.lonLat[1], to.lonLat[1]];
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    // Expand bbox by ~25% on each side for padding.
    const dx = (maxLon - minLon) * 0.25;
    const dy = (maxLat - minLat) * 0.25;
    map.fitBounds(
      [
        [minLon - dx, minLat - dy],
        [maxLon + dx, maxLat + dy],
      ] as [[number, number], [number, number]],
      { padding: 80, duration: 900 }
    );
  },

  registerLgaVisibilityHandler: (handler) =>
    set({ lgaVisibilityHandler: handler }),

  zoomIn: () => {
    get().mapInstance?.zoomIn({ duration: 250 });
  },

  zoomOut: () => {
    get().mapInstance?.zoomOut({ duration: 250 });
  },

  openMobileSheet: () => set({ mobileSheet: "open" }),
  peekMobileSheet: () => set({ mobileSheet: "peek" }),
  closeMobileSheet: () => set({ mobileSheet: "hidden" }),

  toggleOverlay: (id) => {
    const state = get();
    const next = new Set(state.activeOverlays);
    const turningOn = !next.has(id);
    if (turningOn) {
      next.add(id);
      set({
        lensOverlaysCustomized: true,
        activeOverlays: next,
        overlayGuideLayer: id,
        selectedOverlay: null,
        selectedLgaId: null,
        activeRegionId: null,
        panelOpen: true,
        mobileSheet: "open" as MobileSheetMode,
        directionsPanelTarget: null,
        metroMapViews: [],
        activeMetroPanelId: null,
      });
    } else {
      next.delete(id);
      set({
        lensOverlaysCustomized: true,
        activeOverlays: next,
        overlayGuideLayer:
          state.overlayGuideLayer === id ? null : state.overlayGuideLayer,
      });
    }
  },

  clearOverlayGuide: () => set({ overlayGuideLayer: null }),

  setSelectedOverlay: (feature) =>
    set({
      selectedOverlay: feature,
      overlayGuideLayer: feature
        ? feature.layerId
        : get().overlayGuideLayer,
      selectedLgaId: feature ? null : get().selectedLgaId,
      activeRegionId: feature ? null : get().activeRegionId,
      directionsPanelTarget: null,
      panelOpen:
        feature !== null ||
        get().selectedStateIds.size > 0 ||
        get().selectedLgaId !== null,
      mobileSheet: feature !== null ? "open" : get().mobileSheet,
    }),

  clearSelectedOverlay: () => set({ selectedOverlay: null }),

  openWikiModal: (url, title) => set({ wikiModal: { url, title } }),

  closeWikiModal: () => set({ wikiModal: null }),

  openDirectionsModal: (target) =>
    set({ directionsModalFeature: target, mobileSheet: "open" }),

  closeDirectionsModal: () => set({ directionsModalFeature: null }),

  openDirectionsPanel: (target) =>
    set({
      directionsModalFeature: null,
      directionsPanelTarget: target,
      mobileSheet: "open",
    }),

  closeDirectionsPanel: () => {
    get().restoreMapTypeAfterDirections();
    set({ directionsPanelTarget: null });
  },

  addLabeledLga: (id) => {
    const order = [...get().labeledLgaOrder];
    if (order.includes(id)) return true;
    order.push(id);
    set({ labeledLgaOrder: order });
    return true;
  },

  seedCapitalLabel: (lgaId) => {
    const order = [...get().labeledLgaOrder];
    if (order.includes(lgaId)) return;
    order.push(lgaId);
    set({ labeledLgaOrder: order });
  },

  clearLabelsForState: (_stateId, lgaIdsInState) => {
    const drop = new Set(lgaIdsInState);
    set({
      labeledLgaOrder: get().labeledLgaOrder.filter((id) => !drop.has(id)),
    });
  },

  setMapActionHint: (hint) => set({ mapActionHint: hint }),

  toggleState: (id) => {
    let next = new Set(get().selectedStateIds);
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    const draggedStateId =
      get().draggedStateId === id ? null : get().draggedStateId;
    const dragModeStateId =
      get().dragModeStateId === id ? null : get().dragModeStateId;
    if (next.has(id)) {
      next.delete(id);
      lgaVisible.delete(id);
      const labeledLgaOrder = get().labeledLgaOrder.filter(
        (lgaId) => !lgaId.startsWith(`${id}-`)
      );
      const order = pruneStateOrder(get().selectedStateOrder, next);
      set({
        selectedStateIds: next,
        selectedStateOrder: order,
        lgaVisibleStateIds: lgaVisible,
        selectedLgaId: null,
        draggedStateId,
        dragModeStateId,
        labeledLgaOrder,
        panelOpen: next.size > 0,
        activeRegionId: null,
        selectedOverlay: null,
        directionsPanelTarget: null,
        compareView: retainCompareView(
          get().compareView,
          get().mapType,
          next,
          null
        ),
        mobileSheet: mobileSheetForSelection(next.size),
      });
      notifyLgaVisibility(get);
      return;
    }
    next.add(id);
    let order = appendStateToOrder(get().selectedStateOrder, id, next);
    const evicted = evictOldestSelectedState(get().mapType, next, order);
    for (const sid of get().selectedStateIds) {
      if (!evicted.ids.has(sid)) lgaVisible.delete(sid);
    }
    syncElectionLgaVisibility(get().mapType, evicted.ids, lgaVisible);
    set({
      selectedStateIds: evicted.ids,
      selectedStateOrder: evicted.order,
      lgaVisibleStateIds: lgaVisible,
      selectedLgaId: null,
      draggedStateId,
      dragModeStateId,
      panelOpen: evicted.ids.size > 0,
      activeRegionId: null,
      selectedOverlay: null,
      selectedSenatorialDistrictId: null,
      directionsPanelTarget: null,
      compareView: retainCompareView(
        get().compareView,
        get().mapType,
        evicted.ids,
        null
      ),
      mobileSheet: mobileSheetForSelection(evicted.ids.size),
    });
    notifyLgaVisibility(get);
  },

  addSelectedState: (id) => {
    let next = new Set(get().selectedStateIds);
    if (next.has(id)) return;
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    next.add(id);
    let order = appendStateToOrder(get().selectedStateOrder, id, next);
    const evicted = evictOldestSelectedState(get().mapType, next, order);
    for (const sid of get().selectedStateIds) {
      if (!evicted.ids.has(sid)) lgaVisible.delete(sid);
    }
    syncElectionLgaVisibility(get().mapType, evicted.ids, lgaVisible);
    set({
      selectedStateIds: evicted.ids,
      selectedStateOrder: evicted.order,
      lgaVisibleStateIds: lgaVisible,
      panelOpen: true,
      activeRegionId: null,
      selectedOverlay: null,
      selectedSenatorialDistrictId: null,
      directionsPanelTarget: null,
      compareView: retainCompareView(
        get().compareView,
        get().mapType,
        evicted.ids,
        get().selectedLgaId
      ),
      mobileSheet: mobileSheetForSelection(evicted.ids.size),
    });
    notifyLgaVisibility(get);
  },

  selectStates: (ids) => {
    const idSet = new Set(ids);
    const lgaVisible = new Set(
      [...get().lgaVisibleStateIds].filter((sid) => idSet.has(sid))
    );
    if (get().mapType === "election") {
      for (const sid of idSet) lgaVisible.add(sid);
    }
    set({
      selectedStateIds: idSet,
      selectedStateOrder: [...ids],
      lgaVisibleStateIds: lgaVisible,
      selectedLgaId: null,
      draggedStateId: null,
      dragModeStateId: null,
      panelOpen: ids.length > 0,
      activeRegionId: null,
      selectedOverlay: null,
      directionsPanelTarget: null,
      compareView: retainCompareView(
        get().compareView,
        get().mapType,
        idSet,
        null
      ),
      mobileSheet: mobileSheetForSelection(ids.length),
    });
    notifyLgaVisibility(get);
  },

  showLgas: (id) => {
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    lgaVisible.add(id);
    let selected = new Set(get().selectedStateIds);
    let order = get().selectedStateOrder;
    if (!selected.has(id)) {
      selected.add(id);
      order = appendStateToOrder(order, id, selected);
      const evicted = evictOldestSelectedState(get().mapType, selected, order);
      for (const sid of get().selectedStateIds) {
        if (!evicted.ids.has(sid)) lgaVisible.delete(sid);
      }
      selected = evicted.ids;
      order = evicted.order;
    }
    set({
      lgaVisibleStateIds: lgaVisible,
      selectedStateIds: selected,
      selectedStateOrder: order,
      selectedLgaId: null,
      panelOpen: true,
      activeRegionId: null,
      selectedOverlay: null,
      directionsPanelTarget: null,
      metroMapViews: [],
      activeMetroPanelId: null,
      mobileSheet: "open",
    });
    notifyLgaVisibility(get);
  },

  hideLgas: (id) => {
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    lgaVisible.delete(id);
    const labeledLgaOrder = get().labeledLgaOrder.filter(
      (lgaId) => !lgaId.startsWith(`${id}-`)
    );
    set({
      lgaVisibleStateIds: lgaVisible,
      labeledLgaOrder,
    });
    notifyLgaVisibility(get);
  },

  setDraggedStateId: (id) => set({ draggedStateId: id }),

  cancelDrag: () =>
    set({
      draggedStateId: null,
      dragModeStateId: null,
      mapActionHint: null,
    }),

  toggleDragMode: (stateId) => {
    const current = get().dragModeStateId;
    if (current === stateId) {
      set({
        dragModeStateId: null,
        draggedStateId:
          get().draggedStateId === stateId ? null : get().draggedStateId,
        mapActionHint: null,
      });
      return;
    }
    set({ dragModeStateId: stateId, draggedStateId: null, mapActionHint: null });
  },

  enableDragMode: (stateId, hint) => {
    set({
      dragModeStateId: stateId,
      draggedStateId: null,
      mapActionHint: hint ?? null,
    });
  },

  showLgasForStates: (ids) => {
    set({
      lgaVisibleStateIds: new Set(ids),
      selectedStateIds: new Set(ids),
      selectedStateOrder: [...ids],
      selectedLgaId: null,
      panelOpen: ids.length > 0,
      activeRegionId: null,
      selectedOverlay: null,
      directionsPanelTarget: null,
      metroMapViews: [],
      activeMetroPanelId: null,
      mobileSheet: mobileSheetForSelection(ids.length),
    });
    notifyLgaVisibility(get);
  },

  setSelectedLga: (id) => {
    if (id) get().addLabeledLga(id);
    const selectedStateIds = get().selectedStateIds;
    set({
      selectedLgaId: id,
      selectedOverlay: id ? null : get().selectedOverlay,
      directionsPanelTarget: null,
      compareView: retainCompareView(
        get().compareView,
        get().mapType,
        selectedStateIds,
        id
      ),
      panelOpen:
        id !== null ||
        selectedStateIds.size > 0 ||
        get().metroMapViews.length > 0,
      mobileSheet: id !== null ? "open" : get().mobileSheet,
    });
  },

  setSelectedLgaForElection: (lgaId, senatorialDistrictId) => {
    if (lgaId) get().addLabeledLga(lgaId);
    set({
      selectedLgaId: lgaId,
      selectedSenatorialDistrictId: senatorialDistrictId,
      selectedOverlay: null,
      directionsPanelTarget: null,
      panelOpen: true,
      mobileSheet: "open",
    });
  },

  setActiveRegion: (id) => {
    set({
      activeRegionId: id,
      selectedStateIds: new Set(),
      selectedStateOrder: [],
      lgaVisibleStateIds: new Set(),
      selectedLgaId: null,
      draggedStateId: null,
      dragModeStateId: null,
      panelOpen: false,
      selectedOverlay: null,
      directionsPanelTarget: null,
      mobileSheet: id ? "peek" : "hidden",
      labeledLgaOrder: [],
      metroMapViews: [],
      activeMetroPanelId: null,
    });
    notifyLgaVisibility(get);
  },

  reset: () => {
    set({
      selectedStateIds: new Set(),
      selectedStateOrder: [],
      lgaVisibleStateIds: new Set(),
      selectedLgaId: null,
      draggedStateId: null,
      dragModeStateId: null,
      activeRegionId: null,
      panelOpen: false,
      mobileSheet: "hidden",
      labeledLgaOrder: [],
      mapActionHint: null,
      selectedOverlay: null,
      overlayGuideLayer: null,
      wikiModal: null,
      directionsModalFeature: null,
      directionsPanelTarget: null,
      activeOverlays: new Set(DEFAULT_ACTIVE_OVERLAYS),
      resetCounter: get().resetCounter + 1,
      featureMapViews: [],
      metroMapViews: [],
      activeMetroPanelId: null,
      compareView: null,
    });
    notifyLgaVisibility(get);
  },
}));

export { MAX_COMPARE_STATES };
export function labeledLgaIdsSet(order: string[]): Set<string> {
  return new Set(order);
}

export { pruneLabelsForHiddenStates };
