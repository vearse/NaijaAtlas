import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { totalPollingUnits } from "@/lib/server/pollingUnitLookup";
import { getCategoryData } from "@/lib/compare/compareUtils";
import type { CompareDataBundle } from "@/types/compare";
import type { ComparePerson } from "@/types/compare";
import type { StateLocation } from "@/types/location";
import { loadSecurityData, type SecurityData } from "@/lib/server/loadSecurityData";

/**
 * Candidate rows trimmed for the roster UI. The raw `reps.json` is 1.1 MB and
 * the roster renders party chips, not logos, so remote party-icon URLs and the
 * free-text `qualification` field are dropped here — together ~350 KB.
 */
export type HubCandidate = {
  name: string;
  party: string;
  partyIcon?: string | null;
};

export type HubSenateRace = {
  id: string;
  name: string;
  state: string;
  stateId: string;
  region?: string;
  lgaNames: string[];
  candidates: HubCandidate[];
};

export type HubRepsRace = {
  id: string;
  name: string;
  state: string;
  stateId: string;
  region?: string;
  districtId: string;
  districtName: string;
  lgaNames: string[];
  candidates: HubCandidate[];
};

export type HubOfficeholder = {
  name: string;
  party: string;
  imageUrl: string | null;
  role: string | null;
};

export type HubStateOffice = {
  stateId: string;
  stateName: string;
  governor: HubOfficeholder | null;
  deputyGovernor: HubOfficeholder | null;
  senators: HubOfficeholder[];
  houseSeats: number | null;
  housePartySplit: string | null;
  houseMembers: HubOfficeholder[];
  stateAssemblySeats: number | null;
  assemblySpeaker: HubOfficeholder | null;
};

export type CivicSenatorialLookups = {
  lgaToDistrictId: Record<string, string>;
  lgaToConstituencyId: Record<string, string>;
  districtColorIndex: Record<string, number>;
  constituencyColorIndex: Record<string, number>;
  districtById: Record<string, { id: string; name: string }>;
  constituencyById: Record<string, { id: string; name: string }>;
};

export type CivicHubData = {
  security: SecurityData;
  election: {
    year: number;
    date: string | null;
    listStatus: string | null;
    source: string | null;
    verifiedDate: string | null;
  };
  totals: {
    pollingUnits: number;
    states: number;
    lgas: number;
    wards: number;
    senatorialDistricts: number;
    federalConstituencies: number;
    presidentialTickets: number;
    senateCandidates: number;
    repsCandidates: number;
    houseSeats: number;
  };
  countryOffice: {
    president: HubOfficeholder | null;
    vicePresident: HubOfficeholder | null;
  };
  senateRaces: HubSenateRace[];
  repsRaces: HubRepsRace[];
  presidential: {
    party: string;
    partyName: string;
    partyIcon?: string | null;
    candidate: string;
    runningMate: string;
  }[];
  states: {
    id: string;
    name: string;
    slug: string;
    regionId: string;
    regionName: string;
    lgaCount: number;
  }[];
  lgas: { id: string; name: string; stateId: string }[];
  offices: HubStateOffice[];
  senatorialLookups: CivicSenatorialLookups;
};

function toPerson(value: unknown): HubOfficeholder | null {
  const p = value as ComparePerson | null;
  if (!p || typeof p !== "object" || !p.name) return null;
  const name = String(p.name).trim();
  if (!name || name === "—" || name === "-" || name.toLowerCase() === "n/a") {
    return null;
  }
  return {
    name,
    party: p.party ?? "—",
    imageUrl: p.imageUrl ?? null,
    role: p.role ?? null,
  };
}

function toPersonList(value: unknown): HubOfficeholder[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(toPerson)
    .filter((p): p is HubOfficeholder => p !== null);
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function loadCivicHubData(root = process.cwd()): CivicHubData {
  const explorer = loadExplorerPageData(root);
  const { politics, states, lgas, compareBundle } = explorer;
  const lgaNameById = new Map(lgas.map((l) => [l.id, l.name]));
  const stateIdByName = new Map<string, string>();
  for (const s of states as StateLocation[]) {
    stateIdByName.set(s.name.toLowerCase(), s.id);
    stateIdByName.set(s.name.replace(/^federal capital territory$/i, "fct").toLowerCase(), s.id);
  }
  const stateIdFor = (name: string): string =>
    stateIdByName.get(name.toLowerCase()) ?? "";

  const lgaNamesFor = (ids: string[]): string[] =>
    ids.map((id) => lgaNameById.get(id) ?? titleFromSlug(id.split("-").pop() ?? ""));

  const senateRaces: HubSenateRace[] = politics.senateRaces.map((race) => {
    const district = politics.lookups.districtById[race.senatorial_district_id];
    return {
      id: race.senatorial_district_id,
      name: race.name,
      state: race.state,
      stateId: stateIdFor(race.state),
      region: race.region,
      lgaNames: district ? lgaNamesFor(district.lga_ids) : [],
      candidates: race.candidates.map((c) => ({
        name: c.name,
        party: c.party,
        partyIcon: c.party_icon ?? null,
      })),
    };
  });

  const repsRaces: HubRepsRace[] = politics.repsRaces.map((race) => {
    const district = politics.lookups.districtById[race.senatorial_district_id];
    const lgaIds = new Set<string>();
    for (const c of politics.federalConstituencies) {
      if (c.id !== race.federal_constituency_id) continue;
      for (const id of c.lga_ids) lgaIds.add(id);
    }
    return {
      id: race.federal_constituency_id,
      name: race.name,
      state: race.state,
      stateId: stateIdFor(race.state),
      region: race.region,
      districtId: race.senatorial_district_id,
      districtName: district?.name ?? "",
      lgaNames: lgaNamesFor([...lgaIds]),
      candidates: race.candidates.map((c) => ({
        name: c.name,
        party: c.party,
        partyIcon: c.party_icon ?? null,
      })),
    };
  });

  const governance = getCategoryData(
    compareBundle,
    "state",
    "governance",
    "2023-2027"
  ) as CompareDataBundle;

  // The federal executive lives in the country bundle, not the state rows.
  // Reading it here keeps the 2027 candidate list and the sitting officeholder
  // from being confused for one another.
  const countryGovernance = getCategoryData(
    compareBundle,
    "country",
    "governance",
    "2023-2027"
  ) as CompareDataBundle;
  const federal = (countryGovernance?.["NG"] ?? {}) as unknown as Record<
    string,
    unknown
  >;

  const offices: HubStateOffice[] = states.map((s) => {
    const row = governance[s.id] ?? {};
    return {
      stateId: s.id,
      stateName: s.name,
      governor: toPerson(row.governor),
      deputyGovernor: toPerson(row.deputyGovernor),
      senators: toPersonList(row.senators),
      houseSeats:
        typeof row.houseSeats === "number" ? row.houseSeats : null,
      housePartySplit:
        typeof row.housePartySplit === "string" ? row.housePartySplit : null,
      houseMembers: toPersonList(row.houseMembers),
      stateAssemblySeats:
        typeof row.stateAssemblySeats === "number"
          ? row.stateAssemblySeats
          : null,
      assemblySpeaker: toPerson(row.assemblySpeaker),
    };
  });

  const pollingMeta = explorer.pollingCounts.metadata;
  const presidential = politics.presidential;

  const countryOffice = {
    president: toPerson(federal.president),
    vicePresident: toPerson(federal.vicePresident),
  };

  return {
    security: loadSecurityData(),
    countryOffice,
    election: {
      year: presidential.election.year,
      date: presidential.election.election_date ?? null,
      listStatus: presidential.election.candidate_list_status ?? null,
      source: presidential.source?.organization ?? "INEC",
      verifiedDate: presidential.source?.verified_date ?? null,
    },
    totals: {
      pollingUnits:
        pollingMeta?.totals?.pollingUnits ?? totalPollingUnits(root),
      states: pollingMeta?.totals?.states ?? states.length,
      lgas: pollingMeta?.totals?.lgas ?? lgas.length,
      wards: pollingMeta?.totals?.wards ?? 0,
      senatorialDistricts: politics.senatorialDistricts.length,
      federalConstituencies: politics.federalConstituencies.length,
      presidentialTickets: presidential.candidates.length,
      senateCandidates: senateRaces.reduce(
        (sum, r) => sum + r.candidates.length,
        0
      ),
      repsCandidates: repsRaces.reduce((sum, r) => sum + r.candidates.length, 0),
      houseSeats: politics.federalConstituencies.length,
    },
    senateRaces,
    repsRaces,
    presidential: presidential.candidates.map((t) => ({
      party: t.party.abbreviation,
      partyName: t.party.name,
      partyIcon: t.party.icon ?? null,
      candidate: t.presidential_candidate.name,
      runningMate: t.vice_presidential_candidate.name,
    })),
    states: states.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      regionId: s.regionId,
      regionName: s.regionName,
      lgaCount: s.lgaCount,
    })),
    lgas: lgas.map((l) => ({
      id: l.id,
      name: l.name,
      stateId: l.parentId,
    })),
    offices,
    senatorialLookups: (() => {
      const lgaToConstituencyId: Record<string, string> = {};
      const constituencyById: Record<string, { id: string; name: string }> =
        {};
      const constituencyColorIndex: Record<string, number> = {};
      let constituencyIdx = 0;
      for (const c of politics.federalConstituencies) {
        constituencyById[c.id] = { id: c.id, name: c.name };
        if (constituencyColorIndex[c.id] == null) {
          constituencyColorIndex[c.id] = constituencyIdx++;
        }
        for (const lgaId of c.lga_ids) {
          lgaToConstituencyId[lgaId] = c.id;
        }
      }
      return {
        lgaToDistrictId: politics.lookups.lgaToSenatorialDistrictId,
        lgaToConstituencyId,
        districtColorIndex: politics.lookups.districtColorIndex,
        constituencyColorIndex,
        districtById: Object.fromEntries(
          Object.values(politics.lookups.districtById).map((d) => [
            d.id,
            { id: d.id, name: d.name },
          ])
        ),
        constituencyById,
      };
    })(),
  };
}
