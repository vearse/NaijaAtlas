export type LocationLevel = "country" | "state" | "lga";
export type OverlayLevel = "landform" | "resource" | "city" | "lake" | "waterway" | "coast";

export interface BBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export interface StateLocation {
  id: string;
  slug: string;
  name: string;
  regionId: string;
  regionName: string;
  lgaCount: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
}

export interface LgaLocation {
  id: string;
  slug: string;
  name: string;
  level: "lga";
  parentId: string;
  stateName: string;
  regionId: string;
  wardCount: number;
  areaKm2?: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
}

export interface RegionLocation {
  id: string;
  name: string;
  color: string;
  stateIds: string[];
  stateNames: string[];
}

export interface SearchEntry {
  id: string;
  name: string;
  level: LocationLevel | "country" | OverlayLevel;
  parentId: string | null;
  stateName?: string;
  regionId?: string;
  regionName?: string;
  bbox?: [number, number, number, number];
  layerId?: "landforms" | "resources" | "cities" | "lakes" | "waterways" | "coast";
  typeLabel?: string;
  centroid?: [number, number];
  summary?: string;
}

export interface StateLanguage {
  name: string;
  wikiUrl: string;
}

export interface StateContent {
  id: string;
  name: string;
  region: string;
  capital: string | null;
  lgaCount: number;
  description: string;
  languages: StateLanguage[];
}

export interface LgaContent {
  id: string;
  name: string;
  stateName: string;
  wardCount: number;
  areaKm2?: number;
  description: string;
}

/** Ward names keyed by LGA id (e.g. NG-LA-IKEJA) */
export type WardsByLga = Record<string, string[]>;

export interface WikiNote {
  title: string;
  note: string;
  category: string;
  url: string;
}

/** A metropolitan area grouping one or more LGAs (data/content/metro.json). */
export interface MetroGroup {
  id: string;
  name: string;
  groupType: string;
  isOfficial: boolean;
  partitionsState: string | null;
  stateIds: string[];
  memberIds: string[];
  effectiveFrom: string | null;
  effectiveTo: string | null;
  description: string;
  wikiNotes: WikiNote[];
}

/** Per-state exploration hints keyed by state id (data/content/state-notes.json). */
export type StateNotesMap = Record<string, WikiNote[]>;

/** Hand-curated "general" detail per LGA (data/compare/lgas/general.json). */
export interface LgaGeneral {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  nickname?: string;
  summary?: string;
  headquarters?: string;
  yearCreated?: string;
  chairman?: string | null;
  chairmanNote?: string;
  chairmanUpdatedAt?: string | null;
  senatorialDistrictId?: string | null;
  federalConstituency?: string;
  populationNote?: string;
  majorTowns?: string[];
  languages?: string[];
  ethnicGroups?: string[];
  economy?: string;
  climate?: string;
  landmarks?: string[];
  relatedResourceIds?: string[];
  highlights?: string[];
  wikiUrl?: string;
  needsReview?: boolean;
}
