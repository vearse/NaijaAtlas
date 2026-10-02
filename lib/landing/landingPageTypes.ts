import type { RegionLocation } from "@/types/location";
import type { EthnicSpotlightCard } from "@/lib/landing/ethnicGroupTypes";

export type LandingStateCard = {
  id: string;
  name: string;
  slug: string;
  regionId: string;
  regionName: string;
  lgaCount: number;
  capital: string | null;
  /** Most recent NPC/NBS estimate, in people. */
  population: number | null;
  populationYear: number | null;
  /** UN SALB land area, km². */
  landAreaKm2: number | null;
  /** Annual internally generated revenue, in naira. */
  igr: number | null;
  /** `[lon, lat]` label point inside the state boundary. */
  centroid: [number, number];
  pollingUnitCount: number;
  code: string;
};

export type LandingPageData = {
  regions: RegionLocation[];
  statesByRegion: Record<string, LandingStateCard[]>;
  ethnicSpotlight: EthnicSpotlightCard[];
  ethnicGroupCount: number;
  totalPollingUnits: number;
  stateCount: number;
  lgaCount: number;
};
