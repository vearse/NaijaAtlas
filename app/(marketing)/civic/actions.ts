"use server";

import fs from "fs";
import path from "path";
import type {
  FederalConstituency,
  SenatorialDistrict,
} from "@/types/politics";
import { normalizeDelimitation } from "@/lib/politics/delimitation";
import {
  listLgas,
  listWards,
  lookupByDelimitation,
  lookupByText,
  pollingUnitStateOptions,
  wardById,
  type WardHit,
} from "@/lib/server/pollingUnitLookup";

/**
 * Polling-unit finder actions for the Civic hub.
 *
 * Everything here is deliberately server-side: the ward ladder is 712 KB and
 * the delimitation index ~1.5 MB, and the browser should receive one ward.
 */

type ConstituencyBundle = {
  districtsById: Map<string, SenatorialDistrict>;
  districtsByLgaId: Map<string, SenatorialDistrict>;
  constituenciesById: Map<string, FederalConstituency>;
  constituenciesByDistrictId: Map<string, FederalConstituency[]>;
  constituenciesByLgaId: Map<string, FederalConstituency[]>;
  lgaNamesById: Map<string, string>;
};

let cachedBundle: ConstituencyBundle | null = null;

function bundle(root = process.cwd()): ConstituencyBundle {
  if (cachedBundle) return cachedBundle;
  const read = <T,>(p: string) =>
    JSON.parse(fs.readFileSync(path.join(root, p), "utf-8")) as T;

  const districts = read<SenatorialDistrict[]>(
    "data/politics/constituencies/senatorial-districts.json"
  );
  const constituencies = read<FederalConstituency[]>(
    "data/politics/constituencies/federal-constituencies.json"
  );
  const lgas = read<{ id: string; name: string }[]>(
    "data/locations/lgas.json"
  );

  const districtsById = new Map(districts.map((d) => [d.id, d]));
  const districtsByLgaId = new Map<string, SenatorialDistrict>();
  for (const d of districts) {
    for (const lgaId of d.lga_ids) {
      if (!districtsByLgaId.has(lgaId)) districtsByLgaId.set(lgaId, d);
    }
  }

  const constituenciesById = new Map(
    constituencies.map((c) => [c.id, c])
  );
  const constituenciesByDistrictId = new Map<string, FederalConstituency[]>();
  const constituenciesByLgaId = new Map<string, FederalConstituency[]>();
  for (const c of constituencies) {
    const byDistrict = constituenciesByDistrictId.get(
      c.senatorial_district_id
    );
    if (byDistrict) byDistrict.push(c);
    else
      constituenciesByDistrictId.set(c.senatorial_district_id, [c]);
    for (const lgaId of c.lga_ids) {
      const list = constituenciesByLgaId.get(lgaId);
      if (list) list.push(c);
      else constituenciesByLgaId.set(lgaId, [c]);
    }
  }

  cachedBundle = {
    districtsById,
    districtsByLgaId,
    constituenciesById,
    constituenciesByDistrictId,
    constituenciesByLgaId,
    lgaNamesById: new Map(lgas.map((l) => [l.id, l.name])),
  };
  return cachedBundle;
}

export type PollingUnitMatch = {
  hit: WardHit;
  district: {
    id: string;
    name: string;
    state: string;
    /** LGAs in the district, title-cased from the slug fallback. */
    lgaNames: string[];
  } | null;
  constituencies: { id: string; name: string }[];
};

export type FindPollingUnitResult = {
  mode: string;
  /** Echo of what the user typed. */
  query: string;
  /** The single best match, or the first of several. */
  primary: PollingUnitMatch | null;
  /** Populated when the free-text search is ambiguous. */
  alternatives: PollingUnitMatch[];
  note?: string;
};

function toMatch(hit: WardHit): PollingUnitMatch {
  const b = bundle();
  const district = b.districtsByLgaId.get(hit.lgaId) ?? null;
  const districtLgas = district
    ? district.lga_ids
        .map((id) => b.lgaNamesById.get(id))
        .filter((n): n is string => Boolean(n))
    : [];
  // Prefer the LGA's own federal constituency. Listing every constituency in
  // the senatorial district answers a different question than "what is mine".
  const byLga = b.constituenciesByLgaId.get(hit.lgaId) ?? [];
  const byDistrict = district
    ? b.constituenciesByDistrictId.get(district.id) ?? []
    : [];
  const constituencies = (byLga.length > 0 ? byLga : byDistrict)
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((x, y) => x.name.localeCompare(y.name));

  return {
    hit,
    district: district
      ? {
          id: district.id,
          name: district.name,
          state: district.state,
          lgaNames: districtLgas,
        }
      : null,
    constituencies,
  };
}

export async function getPollingStates() {
  return pollingUnitStateOptions();
}

export async function getPollingLgas(stateId: string) {
  return listLgas(stateId);
}

export async function getPollingWards(lgaId: string) {
  return listWards(lgaId);
}

export type FindPollingUnitInput =
  | { mode: "delimitation"; query: string }
  | { mode: "text"; query: string; stateId: string }
  | { mode: "ward"; wardId: string };

export async function findPollingUnit(
  input: FindPollingUnitInput
): Promise<FindPollingUnitResult> {
  const empty: FindPollingUnitResult = {
    mode: input.mode,
    query: input.mode === "ward" ? "" : input.query,
    primary: null,
    alternatives: [],
  };

  if (input.mode === "ward") {
    const hit = wardById(input.wardId);
    if (!hit) {
      return {
        ...empty,
        note: "That ward is no longer in the INEC delimitation register.",
      };
    }
    return { mode: "ward", query: hit.wardName, primary: toMatch(hit), alternatives: [] };
  }

  if (input.mode === "delimitation") {
    if (!normalizeDelimitation(input.query)) {
      return {
        ...empty,
        note: "Enter a 9-digit PU code in the form State-LGA-Ward-Unit, for example 24-01-02-005.",
      };
    }
    const result = lookupByDelimitation(input.query);
    if (!result) {
      return {
        ...empty,
        note: "No polling unit matches that code in the INEC delimitation register.",
      };
    }
    const match = toMatch(result.matches[0]);
    return {
      mode: "delimitation",
      query: result.query,
      primary: match,
      alternatives: result.matches.slice(1, 6).map(toMatch),
    };
  }

  const q = input.query.trim();
  if (!q) {
    return { ...empty, note: "Type a street, landmark, school or ward name." };
  }
  const result = lookupByText(q, input.stateId === "all" ? null : input.stateId);
  if (!result) {
    return {
      ...empty,
      note: "No ward, LGA or state matches that text. Try the ward tab or a PU code.",
    };
  }
  const matches = result.matches.map(toMatch);
  return {
    mode: "text",
    query: q,
    primary: matches[0],
    alternatives: matches.slice(1, 6),
    note: matches.length > 1
      ? `${matches.length} matches — pick the ward closest to your address.`
      : undefined,
  };
}
