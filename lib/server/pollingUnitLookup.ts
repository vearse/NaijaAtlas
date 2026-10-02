import fs from "fs";
import path from "path";
import type {
  PollingUnitCountsBundle,
  PollingUnitStateCount,
} from "@/types/politics";
import { normalizeDelimitation } from "@/lib/politics/delimitation";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";

/**
 * Server-side polling-unit lookup.
 *
 * `data/locations/polling-units.json` is 27 MB / 176k rows and must never be
 * imported into a page. The counts ladder (712 KB, same shape minus the PU
 * rows) gives us every ward-level lookup the Civic hub needs, and it is read
 * on demand behind a server action so nothing ships to the browser.
 */

export type WardHit = {
  stateId: string;
  stateName: string;
  /** Canonical Places slug for the state, e.g. "nassarawa". */
  stateSlug: string;
  lgaId: string;
  lgaName: string;
  wardId: string;
  wardName: string;
  wardPollingUnits: number;
  lgaPollingUnits: number;
  statePollingUnits: number;
  lgaWardCount: number;
};

export type PollingUnitLookupResult = {
  kind: "ward";
  query: string;
  /** Ambiguity is normal for free-text address search. */
  ambiguous: boolean;
  matches: WardHit[];
};

type WardIndex = {
  totals?: { wards?: number; pollingUnits?: number };
  wards: Record<
    string,
    {
      stateId: string;
      stateName: string;
      lgaId: string;
      lgaName: string;
      wardId: string;
      wardName: string;
      pollingUnits: number;
    }
  >;
};

let cachedStates: PollingUnitStateCount[] | null = null;
let cachedTotalPollingUnits = 0;
let cachedWardIndex: WardIndex | null = null;

function loadWardIndex(root = process.cwd()): WardIndex | null {
  if (cachedWardIndex) return cachedWardIndex;
  const file = path.join(
    root,
    "data/locations/ward-delimitation-index.json"
  );
  if (!fs.existsSync(file)) return null;
  cachedWardIndex = JSON.parse(
    fs.readFileSync(file, "utf-8")
  ) as WardIndex;
  return cachedWardIndex;
}

function loadStates(root = process.cwd()): PollingUnitStateCount[] {
  if (cachedStates) return cachedStates;
  const bundle = JSON.parse(
    fs.readFileSync(
      path.join(root, "data/locations/polling-unit-counts.json"),
      "utf-8"
    )
  ) as PollingUnitCountsBundle;
  cachedStates = bundle.states;
  cachedTotalPollingUnits =
    bundle.metadata?.totals?.pollingUnits ??
    bundle.states.reduce((sum, s) => sum + (s.pollingUnitCount ?? 0), 0);
  return cachedStates;
}

export function totalPollingUnits(root = process.cwd()): number {
  loadStates(root);
  return cachedTotalPollingUnits;
}

export function pollingUnitStateOptions(
  root = process.cwd()
): { id: string; name: string; pollingUnitCount: number }[] {
  return loadStates(root)
    .map((s) => ({
      id: s.id,
      name: s.name,
      pollingUnitCount: s.pollingUnitCount ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

let cachedStateSlugs: Map<string, string> | null = null;

/** Canonical Places slug for a state id, e.g. NG-NA -> "nassarawa". */
function stateSlugFor(stateId: string): string {
  if (!cachedStateSlugs) {
    cachedStateSlugs = new Map(
      loadExplorerPageData().states.map((s) => [s.id, s.slug])
    );
  }
  return cachedStateSlugs.get(stateId) ?? stateId.toLowerCase();
}

function wardHit(
  state: PollingUnitStateCount,
  lga: PollingUnitStateCount["lgas"][number],
  ward: PollingUnitStateCount["lgas"][number]["wards"][number]
): WardHit {
  return {
    stateId: state.id,
    stateName: state.name,
    stateSlug: stateSlugFor(state.id),
    lgaId: lga.id,
    lgaName: lga.name,
    wardId: ward.id,
    wardName: ward.name,
    wardPollingUnits: ward.pollingUnitCount ?? 0,
    lgaPollingUnits: lga.pollingUnitCount ?? 0,
    statePollingUnits: state.pollingUnitCount ?? 0,
    lgaWardCount: lga.wards?.length ?? 0,
  };
}

export function listLgas(
  stateId: string,
  root = process.cwd()
): { id: string; name: string; pollingUnitCount: number; wardCount: number }[] {
  const state = loadStates(root).find((s) => s.id === stateId);
  if (!state) return [];
  return (state.lgas ?? [])
    .map((l) => ({
      id: l.id,
      name: l.name,
      pollingUnitCount: l.pollingUnitCount ?? 0,
      wardCount: l.wards?.length ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listWards(
  lgaId: string,
  root = process.cwd()
): { id: string; name: string; pollingUnitCount: number }[] {
  for (const state of loadStates(root)) {
    for (const lga of state.lgas ?? []) {
      if (lga.id !== lgaId) continue;
      return (lga.wards ?? [])
        .map((w) => ({
          id: w.id,
          name: w.name,
          pollingUnitCount: w.pollingUnitCount ?? 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  return [];
}

export function wardById(wardId: string, root = process.cwd()): WardHit | null {
  for (const state of loadStates(root)) {
    for (const lga of state.lgas ?? []) {
      const ward = (lga.wards ?? []).find((w) => w.id === wardId);
      if (ward) return wardHit(state, lga, ward);
    }
  }
  return null;
}

/**
 * Resolve an INEC delimitation code (`SS/LL/WW/PPP`) to its ward.
 *
 * The counts ladder keys wards by slug (`NG-AB-ABA-NORTH-EZIAMA`) while
 * delimitation uses INEC's numeric state/LGA/ward codes, so the mapping comes
 * from the ward-level index built by `scripts/build-ward-delimitation-index.mjs`.
 */
export function lookupByDelimitation(
  raw: string,
  root = process.cwd()
): PollingUnitLookupResult | null {
  const normalized = normalizeDelimitation(raw);
  if (!normalized) return null;

  const index = loadWardIndex(root);
  if (!index) return null;

  const wardKey = normalized.split("/").slice(0, 3).join("/");
  const row = index.wards[wardKey];
  if (!row) return null;

  const state = loadStates(root).find((s) => s.id === row.stateId);
  const lga = state?.lgas?.find((l) => l.id === row.lgaId);
  if (!state || !lga) return null;

  return {
    kind: "ward",
    query: normalized,
    ambiguous: false,
    matches: [
      {
        ...row,
        stateSlug: stateSlugFor(row.stateId),
        wardPollingUnits: row.pollingUnits,
        lgaPollingUnits: lga.pollingUnitCount ?? 0,
        statePollingUnits: state.pollingUnitCount ?? 0,
        lgaWardCount: lga.wards?.length ?? 0,
      },
    ],
  };
}

/**
 * Free-text search across ward, LGA and state names — the stand-in for street
 * geocoding, which we do not have. Ranked: ward name, then LGA name, then state.
 */
export function lookupByText(
  query: string,
  stateId: string | null,
  root = process.cwd()
): PollingUnitLookupResult | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const states = loadStates(root).filter(
    (s) => !stateId || s.id === stateId || stateId === "all"
  );
  const matches: WardHit[] = [];

  for (const state of states) {
    if (state.name.toLowerCase().includes(q)) {
      for (const lga of state.lgas ?? []) {
        const ward = lga.wards?.[0];
        if (ward) matches.push(wardHit(state, lga, ward));
      }
      if (matches.length >= 6) break;
    }
    for (const lga of state.lgas ?? []) {
      const lgaMatch = lga.name.toLowerCase().includes(q);
      for (const ward of lga.wards ?? []) {
        if (lgaMatch || ward.name.toLowerCase().includes(q)) {
          matches.push(wardHit(state, lga, ward));
          if (matches.length >= 25) break;
        }
      }
      if (matches.length >= 25) break;
    }
    if (matches.length >= 25) break;
  }

  if (matches.length === 0) return null;
  return { kind: "ward", query: query.trim(), ambiguous: matches.length > 1, matches };
}
