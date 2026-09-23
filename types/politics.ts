export interface SenatorialDistrict {
  id: string;
  name: string;
  state: string;
  lga_ids: string[];
}

export interface FederalConstituency {
  id: string;
  name: string;
  state: string;
  senatorial_district_id: string;
  lga_ids: string[];
  verify?: boolean;
}

export interface CandidateRow {
  party: string;
  name: string;
}

export interface SenateRace {
  senatorial_district_id: string;
  name: string;
  state: string;
  region?: string;
  candidates: CandidateRow[];
}

export interface RepsCandidate {
  name: string;
  party: string;
  age?: string;
  gender?: string;
  pwd?: string;
  qualification?: string;
}

export interface RepsRace {
  federal_constituency_id: string;
  name: string;
  state: string;
  region?: string;
  senatorial_district_id: string;
  candidates: RepsCandidate[];
}

export interface PresidentialCandidateTicket {
  party: { abbreviation: string; name: string };
  presidential_candidate: { name: string; age?: number; gender?: string };
  vice_presidential_candidate: { name: string; age?: number; gender?: string };
}

export interface PresidentialBundle {
  election: {
    country: string;
    year: number;
    type: string;
    election_date?: string;
    candidate_list_status?: string;
  };
  source?: Record<string, string>;
  candidates: PresidentialCandidateTicket[];
}

export interface PoliticsLookups {
  lgaToSenatorialDistrictId: Record<string, string>;
  districtById: Record<string, SenatorialDistrict>;
  federalBySenatorialDistrictId: Record<string, FederalConstituency[]>;
  senateBySenatorialDistrictId: Record<string, SenateRace>;
  repsByFederalConstituencyId: Record<string, RepsRace>;
  districtsByStateId: Record<string, SenatorialDistrict[]>;
  districtColorIndex: Record<string, number>;
}

export interface PoliticsBundle {
  senatorialDistricts: SenatorialDistrict[];
  federalConstituencies: FederalConstituency[];
  senateRaces: SenateRace[];
  repsRaces: RepsRace[];
  presidential: PresidentialBundle;
  lookups: PoliticsLookups;
}

export interface PollingUnitCountsMetadata {
  source?: { name: string; url: string; license?: string };
  scrapedAt?: string;
  totals?: Record<string, number>;
}

export interface PollingUnitWardCount {
  id: string;
  name: string;
  pollingUnitCount: number;
}

export interface PollingUnitLgaCount {
  id: string;
  name: string;
  pollingUnitCount: number;
  wards: PollingUnitWardCount[];
}

export interface PollingUnitStateCount {
  id: string;
  name: string;
  code?: string;
  pollingUnitCount: number;
  lgas: PollingUnitLgaCount[];
}

export interface PollingUnitCountsBundle {
  metadata: PollingUnitCountsMetadata;
  states: PollingUnitStateCount[];
}

export interface PollingUnitShardEntry {
  id: string;
  delimitation: string;
  name: string;
  abbreviation?: string;
  wardId: string;
  wardName?: string;
  lgaId: string;
  lgaName?: string;
  status?: string;
}

export interface DelimitationIndexEntry {
  stateId: string;
  puId: string;
}
