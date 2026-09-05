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

export interface StateContent {
  id: string;
  name: string;
  region: string;
  capital: string | null;
  lgaCount: number;
  description: string;
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
