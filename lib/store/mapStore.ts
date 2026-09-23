import { create } from "zustand";
import type { Map as MaplibreMap } from "maplibre-gl";

const MAX_COMPARE_STATES = 3;
export const MAX_ELECTION_STATES = 5;

function maxSelectedStates(mapType: MapTypeId): number {
  return mapType === "election" ? MAX_ELECTION_STATES : MAX_COMPARE_STATES;
}

export type MobileSheetMode = "hidden" | "peek" | "open";
export type MapTypeId = "minimal" | "osm" | "election";

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
import type { PollingUnitShardEntry } from "@/types/politics";
import {
  MAX_FEATURE_MAP_VIEWS,
  type FeatureMapView,
  fitMapToStateIds,
} from "@/lib/map/featureMapViews";

const DEFAULT_ACTIVE_OVERLAYS = new Set<OverlayLayerId>(["cities"]);

export interface MapSelectionState {
  selectedStateIds: Set<string>;
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
  setMapType: (id) => {
    const prev = get().mapType;
    if (prev === "election" && id !== "election") {
      set({
        mapType: id,
        selectedSenatorialDistrictId: null,
        lgaVisibleStateIds: new Set(),
        selectedLgaId: null,
        directionsPanelTarget: null,
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
      });
      notifyLgaVisibility(get);
      return;
    }
    set({ mapType: id });
  },
  setSelectedSenatorialDistrict: (id) =>
    set({ selectedSenatorialDistrictId: id, mobileSheet: "open" }),
  setConfirmedPollingUnit: (unit) => set({ confirmedPollingUnit: unit }),
  setActiveLens: (lens) => set({ activeLens: lens }),

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
        activeOverlays: next,
        overlayGuideLayer: id,
        selectedOverlay: null,
        selectedLgaId: null,
        activeRegionId: null,
        panelOpen: true,
        mobileSheet: "open" as MobileSheetMode,
        directionsPanelTarget: null,
      });
    } else {
      next.delete(id);
      set({
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
      overlayGuideLayer: feature ? null : get().overlayGuideLayer,
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
    const next = new Set(get().selectedStateIds);
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
      set({
        selectedStateIds: next,
        lgaVisibleStateIds: lgaVisible,
        selectedLgaId: null,
        draggedStateId,
        dragModeStateId,
        labeledLgaOrder,
        panelOpen: next.size > 0,
        activeRegionId: null,
        selectedOverlay: null,
        directionsPanelTarget: null,
        mobileSheet: mobileSheetForSelection(next.size),
      });
      notifyLgaVisibility(get);
      return;
    }
    if (next.size >= maxSelectedStates(get().mapType)) {
      const oldest = next.values().next().value;
      if (oldest) {
        next.delete(oldest);
        lgaVisible.delete(oldest);
      }
    }
    next.add(id);
    syncElectionLgaVisibility(get().mapType, next, lgaVisible);
    set({
      selectedStateIds: next,
      lgaVisibleStateIds: lgaVisible,
      selectedLgaId: null,
      draggedStateId,
      dragModeStateId,
      panelOpen: next.size > 0,
      activeRegionId: null,
      selectedOverlay: null,
      selectedSenatorialDistrictId: null,
      directionsPanelTarget: null,
      mobileSheet: mobileSheetForSelection(next.size),
    });
    notifyLgaVisibility(get);
  },

  addSelectedState: (id) => {
    const next = new Set(get().selectedStateIds);
    if (next.has(id)) return;
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    if (next.size >= maxSelectedStates(get().mapType)) {
      const oldest = next.values().next().value;
      if (oldest) {
        next.delete(oldest);
        lgaVisible.delete(oldest);
      }
    }
    next.add(id);
    syncElectionLgaVisibility(get().mapType, next, lgaVisible);
    set({
      selectedStateIds: next,
      lgaVisibleStateIds: lgaVisible,
      panelOpen: true,
      activeRegionId: null,
      selectedOverlay: null,
      selectedSenatorialDistrictId: null,
      directionsPanelTarget: null,
      mobileSheet: mobileSheetForSelection(next.size),
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
      lgaVisibleStateIds: lgaVisible,
      selectedLgaId: null,
      draggedStateId: null,
      dragModeStateId: null,
      panelOpen: ids.length > 0,
      activeRegionId: null,
      selectedOverlay: null,
      directionsPanelTarget: null,
      mobileSheet: mobileSheetForSelection(ids.length),
    });
    notifyLgaVisibility(get);
  },

  showLgas: (id) => {
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    lgaVisible.add(id);
    const selected = new Set(get().selectedStateIds);
    if (!selected.has(id)) {
      if (selected.size >= maxSelectedStates(get().mapType)) {
        const oldest = selected.values().next().value;
        if (oldest) {
          selected.delete(oldest);
          lgaVisible.delete(oldest);
        }
      }
      selected.add(id);
    }
    set({
      lgaVisibleStateIds: lgaVisible,
      selectedStateIds: selected,
      selectedLgaId: null,
      panelOpen: true,
      activeRegionId: null,
      selectedOverlay: null,
      directionsPanelTarget: null,
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
    set({ lgaVisibleStateIds: lgaVisible, labeledLgaOrder });
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
      selectedLgaId: null,
      panelOpen: ids.length > 0,
      activeRegionId: null,
      selectedOverlay: null,
      directionsPanelTarget: null,
      mobileSheet: mobileSheetForSelection(ids.length),
    });
    notifyLgaVisibility(get);
  },

  setSelectedLga: (id) => {
    if (id) get().addLabeledLga(id);
    set({
      selectedLgaId: id,
      selectedOverlay: id ? null : get().selectedOverlay,
      directionsPanelTarget: null,
      panelOpen: id !== null || get().selectedStateIds.size > 0,
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
      lgaVisibleStateIds: new Set(),
      selectedLgaId: null,
      draggedStateId: null,
      dragModeStateId: null,
      panelOpen: false,
      selectedOverlay: null,
      directionsPanelTarget: null,
      mobileSheet: id ? "peek" : "hidden",
      labeledLgaOrder: [],
    });
    notifyLgaVisibility(get);
  },

  reset: () => {
    set({
      selectedStateIds: new Set(),
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
    });
    notifyLgaVisibility(get);
  },
}));

export { MAX_COMPARE_STATES };
export function labeledLgaIdsSet(order: string[]): Set<string> {
  return new Set(order);
}

export { pruneLabelsForHiddenStates };
