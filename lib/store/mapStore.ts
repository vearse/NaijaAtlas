import { create } from "zustand";
import type { Map as MaplibreMap } from "maplibre-gl";

const MAX_COMPARE_STATES = 3;

export type MobileSheetMode = "hidden" | "peek" | "open";

import type { OverlayLayerId, SelectedOverlayFeature } from "@/types/overlay";

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
  selectedOverlay: SelectedOverlayFeature | null;
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
  setDraggedStateId: (id: string | null) => void;
  toggleDragMode: (stateId: string) => void;
  enableDragMode: (stateId: string, hint?: string) => void;
  toggleOverlay: (id: OverlayLayerId) => void;
  setSelectedOverlay: (feature: SelectedOverlayFeature | null) => void;
  clearSelectedOverlay: () => void;
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
  selectedOverlay: null,
  labeledLgaOrder: [],
  mapActionHint: null,
  mapInstance: null,
  lgaVisibilityHandler: null,

  registerMap: (map) => set({ mapInstance: map }),

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
    const next = new Set(get().activeOverlays);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ activeOverlays: next });
  },

  setSelectedOverlay: (feature) =>
    set({
      selectedOverlay: feature,
      panelOpen: feature !== null || get().selectedStateIds.size > 0,
      mobileSheet: feature !== null ? "open" : get().mobileSheet,
    }),

  clearSelectedOverlay: () => set({ selectedOverlay: null }),

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
        mobileSheet: mobileSheetForSelection(next.size),
      });
      notifyLgaVisibility(get);
      return;
    }
    if (next.size >= MAX_COMPARE_STATES) {
      const oldest = next.values().next().value;
      if (oldest) {
        next.delete(oldest);
        lgaVisible.delete(oldest);
      }
    }
    next.add(id);
    lgaVisible.add(id);
    set({
      selectedStateIds: next,
      lgaVisibleStateIds: lgaVisible,
      selectedLgaId: null,
      draggedStateId,
      dragModeStateId,
      panelOpen: next.size > 0,
      activeRegionId: null,
      mobileSheet: mobileSheetForSelection(next.size),
    });
    notifyLgaVisibility(get);
  },

  addSelectedState: (id) => {
    const next = new Set(get().selectedStateIds);
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    if (next.has(id)) {
      if (!lgaVisible.has(id)) {
        lgaVisible.add(id);
        set({ lgaVisibleStateIds: lgaVisible });
        notifyLgaVisibility(get);
      }
      return;
    }
    if (next.size >= MAX_COMPARE_STATES) {
      const oldest = next.values().next().value;
      if (oldest) {
        next.delete(oldest);
        lgaVisible.delete(oldest);
      }
    }
    next.add(id);
    lgaVisible.add(id);
    set({
      selectedStateIds: next,
      lgaVisibleStateIds: lgaVisible,
      panelOpen: true,
      activeRegionId: null,
      mobileSheet: mobileSheetForSelection(next.size),
    });
    notifyLgaVisibility(get);
  },

  selectStates: (ids) => {
    set({
      selectedStateIds: new Set(ids),
      lgaVisibleStateIds: new Set(ids),
      selectedLgaId: null,
      draggedStateId: null,
      dragModeStateId: null,
      panelOpen: ids.length > 0,
      activeRegionId: null,
      mobileSheet: mobileSheetForSelection(ids.length),
    });
    notifyLgaVisibility(get);
  },

  showLgas: (id) => {
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    lgaVisible.add(id);
    const selected = new Set(get().selectedStateIds);
    if (!selected.has(id)) {
      if (selected.size >= MAX_COMPARE_STATES) {
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
      mobileSheet: mobileSheetForSelection(ids.length),
    });
    notifyLgaVisibility(get);
  },

  setSelectedLga: (id) => {
    if (id) get().addLabeledLga(id);
    set({
      selectedLgaId: id,
      panelOpen: id !== null || get().selectedStateIds.size > 0,
      mobileSheet: id !== null ? "open" : get().mobileSheet,
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
      activeOverlays: new Set(DEFAULT_ACTIVE_OVERLAYS),
      resetCounter: get().resetCounter + 1,
    });
    notifyLgaVisibility(get);
  },
}));

export { MAX_COMPARE_STATES };
export function labeledLgaIdsSet(order: string[]): Set<string> {
  return new Set(order);
}

export { pruneLabelsForHiddenStates };
