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
