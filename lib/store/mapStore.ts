import { create } from "zustand";

const MAX_COMPARE_STATES = 3;

export type MobileSheetMode = "hidden" | "peek" | "open";

export interface MapSelectionState {
  selectedStateIds: Set<string>;
  lgaVisibleStateIds: Set<string>;
  selectedLgaId: string | null;
  activeRegionId: string | null;
  panelOpen: boolean;
  mobileSheet: MobileSheetMode;
  resetCounter: number;
  toggleState: (id: string) => void;
  selectStates: (ids: string[]) => void;
  showLgas: (id: string) => void;
  hideLgas: (id: string) => void;
  showLgasForStates: (ids: string[]) => void;
  setSelectedLga: (id: string | null) => void;
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

export const useMapStore = create<MapSelectionState>((set, get) => ({
  selectedStateIds: new Set(),
  lgaVisibleStateIds: new Set(),
  selectedLgaId: null,
  activeRegionId: null,
  panelOpen: false,
  mobileSheet: "hidden",
  resetCounter: 0,

  openMobileSheet: () => set({ mobileSheet: "open" }),
  peekMobileSheet: () => set({ mobileSheet: "peek" }),
  closeMobileSheet: () => set({ mobileSheet: "hidden" }),

  toggleState: (id) => {
    const next = new Set(get().selectedStateIds);
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    if (next.has(id)) {
      next.delete(id);
      lgaVisible.delete(id);
    } else {
      if (next.size >= MAX_COMPARE_STATES) {
        const oldest = next.values().next().value;
        if (oldest) {
          next.delete(oldest);
          lgaVisible.delete(oldest);
        }
      }
      next.add(id);
    }
    set({
      selectedStateIds: next,
      lgaVisibleStateIds: lgaVisible,
      selectedLgaId: null,
      panelOpen: next.size > 0,
      activeRegionId: null,
      mobileSheet: mobileSheetForSelection(next.size),
    });
  },

  selectStates: (ids) => {
    set({
      selectedStateIds: new Set(ids),
      lgaVisibleStateIds: new Set(ids),
      selectedLgaId: null,
      panelOpen: ids.length > 0,
      activeRegionId: null,
      mobileSheet: mobileSheetForSelection(ids.length),
    });
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
  },

  hideLgas: (id) => {
    const lgaVisible = new Set(get().lgaVisibleStateIds);
    lgaVisible.delete(id);
    set({ lgaVisibleStateIds: lgaVisible });
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
  },

  setSelectedLga: (id) =>
    set({
      selectedLgaId: id,
      panelOpen: id !== null || get().selectedStateIds.size > 0,
      mobileSheet: id !== null ? "open" : get().mobileSheet,
    }),

  setActiveRegion: (id) =>
    set({
      activeRegionId: id,
      selectedStateIds: new Set(),
      lgaVisibleStateIds: new Set(),
      selectedLgaId: null,
      panelOpen: false,
      mobileSheet: id ? "peek" : "hidden",
    }),

  reset: () =>
    set({
      selectedStateIds: new Set(),
      lgaVisibleStateIds: new Set(),
      selectedLgaId: null,
      activeRegionId: null,
      panelOpen: false,
      mobileSheet: "hidden",
      resetCounter: get().resetCounter + 1,
    }),
}));

export { MAX_COMPARE_STATES };
