import type {
  FederalConstituency,
  PoliticsBundle,
  PoliticsLookups,
  SenateRace,
  SenatorialDistrict,
  PresidentialBundle,
} from "@/types/politics";
import type { StateLocation } from "@/types/location";

function stateNameToId(
  stateName: string,
  states: StateLocation[]
): string | null {
  const n = stateName.trim().toLowerCase();
  const hit = states.find((s) => s.name.trim().toLowerCase() === n);
  if (hit) return hit.id;
  if (n === "federal capital territory" || n === "fct") return "NG-FC";
  return null;
}

export function buildPoliticsLookups(
  senatorialDistricts: SenatorialDistrict[],
  federalConstituencies: FederalConstituency[],
  senateRaces: SenateRace[],
  states: StateLocation[]
): PoliticsLookups {
  const lgaToSenatorialDistrictId: Record<string, string> = {};
  const districtById: Record<string, SenatorialDistrict> = {};
  const districtsByStateId: Record<string, SenatorialDistrict[]> = {};
  const districtColorIndex: Record<string, number> = {};

  for (const d of senatorialDistricts) {
    districtById[d.id] = d;
    for (const lgaId of d.lga_ids) {
      lgaToSenatorialDistrictId[lgaId] = d.id;
    }
    const stateId = stateNameToId(d.state, states);
    if (!stateId) continue;
    if (!districtsByStateId[stateId]) districtsByStateId[stateId] = [];
    districtsByStateId[stateId].push(d);
  }

  for (const stateId of Object.keys(districtsByStateId)) {
    districtsByStateId[stateId].sort((a, b) => a.name.localeCompare(b.name));
  }

  const allDistricts = [...senatorialDistricts].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  allDistricts.forEach((d, index) => {
    districtColorIndex[d.id] = index;
  });

  const federalBySenatorialDistrictId: Record<string, FederalConstituency[]> =
    {};
  for (const fc of federalConstituencies) {
    const key = fc.senatorial_district_id;
    if (!federalBySenatorialDistrictId[key]) {
      federalBySenatorialDistrictId[key] = [];
    }
    federalBySenatorialDistrictId[key].push(fc);
  }
  for (const key of Object.keys(federalBySenatorialDistrictId)) {
    federalBySenatorialDistrictId[key].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  const senateBySenatorialDistrictId: Record<string, SenateRace> = {};
  for (const race of senateRaces) {
    senateBySenatorialDistrictId[race.senatorial_district_id] = race;
  }

  return {
    lgaToSenatorialDistrictId,
    districtById,
    federalBySenatorialDistrictId,
    senateBySenatorialDistrictId,
    districtsByStateId,
    districtColorIndex,
  };
}

export function buildPoliticsBundle(
  senatorialDistricts: SenatorialDistrict[],
  federalConstituencies: FederalConstituency[],
  senateRaces: SenateRace[],
  presidential: PresidentialBundle,
  states: StateLocation[]
): PoliticsBundle {
  return {
    senatorialDistricts,
    federalConstituencies,
    senateRaces,
    presidential,
    lookups: buildPoliticsLookups(
      senatorialDistricts,
      federalConstituencies,
      senateRaces,
      states
    ),
  };
}
