import { create } from "zustand";
import { REQUIRED_PARTIES } from "@/lib/speculation/constants";
import type {
  SpeculationScenario,
  SpeculationStateInput,
} from "@/lib/speculation/types";

export type SpeculationPhase = "setup" | "list" | "editor" | "result";

interface DraftScenario {
  parties: string[];
  states: Record<string, SpeculationStateInput>;
  use2023ForUnset: boolean;
}

interface SpeculationStore {
  active: boolean;
  phase: SpeculationPhase;
  parties: string[];
  states: Record<string, SpeculationStateInput>;
  selectedStateId: string | null;
  use2023ForUnset: boolean;
  setActive: (active: boolean) => void;
  start: (parties: string[]) => void;
  selectState: (stateId: string) => void;
  saveState: (input: SpeculationStateInput) => void;
  clearState: (stateId: string) => void;
  backToList: () => void;
  openSetup: () => void;
  showResult: () => void;
  setUse2023ForUnset: (value: boolean) => void;
  resetAll: () => void;
  mergeStates: (
    inputs: SpeculationStateInput[],
    options?: { openResult?: boolean }
  ) => void;
  restoreDraft: (draft: DraftScenario) => void;
  hydrateFromUrl: (scenario: SpeculationScenario, use2023: boolean) => void;
}

const DRAFT_KEY = "naija-atlas:speculation-draft:v2";

function normaliseParties(parties: string[]): string[] {
  const unique = [...new Set(parties.filter(Boolean))];
  return unique.slice(0, REQUIRED_PARTIES);
}

export function readSpeculationDraft(): DraftScenario | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftScenario>;
    if (!Array.isArray(parsed.parties) || parsed.parties.length !== REQUIRED_PARTIES) {
      return null;
    }
    const parties = normaliseParties(parsed.parties);
    if (parties.length !== REQUIRED_PARTIES) return null;
    const states: Record<string, SpeculationStateInput> = {};
    for (const [stateId, value] of Object.entries(parsed.states ?? {})) {
      if (!value || typeof value !== "object") continue;
      const turnout = Number(value.turnout);
      if (!Number.isFinite(turnout) || turnout < 1 || turnout > 100) continue;
      const shares: Record<string, number> = {};
      for (const party of parties) {
        const share = Number(value.shares?.[party] ?? 0);
        if (!Number.isFinite(share) || share < 0) continue;
        shares[party] = share;
      }
      const total = Object.values(shares).reduce((sum, n) => sum + n, 0);
      if (total > 100 + 1e-6) continue;
      states[stateId] = { stateId, turnout, shares };
    }
    return {
      parties,
      states,
      use2023ForUnset: parsed.use2023ForUnset !== false,
    };
  } catch {
    return null;
  }
}

function writeSpeculationDraft(draft: DraftScenario): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage may be unavailable */
  }
}

function clearSpeculationDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function persist(state: {
  parties: string[];
  states: Record<string, SpeculationStateInput>;
  use2023ForUnset: boolean;
}): void {
  if (state.parties.length !== REQUIRED_PARTIES) return;
  writeSpeculationDraft({
    parties: state.parties,
    states: state.states,
    use2023ForUnset: state.use2023ForUnset,
  });
}

export const useSpeculationStore = create<SpeculationStore>((set, get) => ({
  active: false,
  phase: "setup",
  parties: [],
  states: {},
  selectedStateId: null,
  use2023ForUnset: true,

  setActive: (active) => {
    if (!active) {
      set({ active: false });
      return;
    }
    const state = get();
    set({
      active: true,
      phase:
        Object.keys(state.states).length > 0
          ? state.phase === "result"
            ? "result"
            : "list"
          : "setup",
    });
  },

  start: (parties) => {
    const nextParties = normaliseParties(parties);
    if (nextParties.length !== REQUIRED_PARTIES) return;
    const state = get();
    const changed =
      state.parties.length === REQUIRED_PARTIES &&
      nextParties.some((party, index) => party !== state.parties[index]);
    const states = changed ? {} : state.states;
    const next = {
      active: true,
      phase: "list" as const,
      parties: nextParties,
      states,
      selectedStateId: null,
      use2023ForUnset: state.use2023ForUnset,
    };
    set(next);
    persist(next);
  },

  selectState: (stateId) =>
    set({
      active: true,
      phase: "editor",
      selectedStateId: stateId,
    }),

  saveState: (input) => {
    const state = get();
    const states = { ...state.states, [input.stateId]: input };
    const next = { ...state, states, phase: "list" as const };
    set({
      states,
      phase: "list",
      selectedStateId: input.stateId,
    });
    persist(next);
  },

  clearState: (stateId) => {
    const state = get();
    const states = { ...state.states };
    delete states[stateId];
    const next = { ...state, states };
    set({ states, selectedStateId: null, phase: "list" });
    persist(next);
  },

  backToList: () => set({ phase: "list", selectedStateId: get().selectedStateId }),
  openSetup: () => set({ phase: "setup" }),
  showResult: () => set({ phase: "result" }),
  setUse2023ForUnset: (value) => {
    const state = get();
    set({ use2023ForUnset: value });
    persist({ ...state, use2023ForUnset: value });
  },

  resetAll: () => {
    clearSpeculationDraft();
    set({
      phase: "setup",
      parties: [],
      states: {},
      selectedStateId: null,
      use2023ForUnset: true,
    });
  },

  mergeStates: (inputs, options) => {
    const state = get();
    const states = { ...state.states };
    for (const input of inputs) {
      states[input.stateId] = input;
    }
    const next = {
      ...state,
      states,
      selectedStateId: null,
      phase: options?.openResult
        ? ("result" as const)
        : (state.phase as SpeculationPhase),
    };
    set(next);
    persist(next);
  },

  restoreDraft: (draft) =>
    set({
      active: true,
      phase: "list",
      parties: normaliseParties(draft.parties),
      states: draft.states,
      selectedStateId: null,
      use2023ForUnset: draft.use2023ForUnset,
    }),

  hydrateFromUrl: (scenario, use2023) =>
    set({
      active: true,
      phase: "result",
      parties: normaliseParties(scenario.parties),
      states: scenario.states,
      selectedStateId: null,
      use2023ForUnset: use2023,
    }),
}));
