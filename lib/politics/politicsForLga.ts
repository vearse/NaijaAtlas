import type { PoliticsLookups, FederalConstituency } from "@/types/politics";

export function senatorialDistrictIdForLga(
  lookups: PoliticsLookups,
  lgaId: string
): string | null {
  return lookups.lgaToSenatorialDistrictId[lgaId] ?? null;
}

export function federalConstituenciesForLga(
  federalConstituencies: FederalConstituency[],
  lgaId: string
): FederalConstituency[] {
  return federalConstituencies.filter((fc) => fc.lga_ids.includes(lgaId));
}
