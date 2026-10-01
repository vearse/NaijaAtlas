import type { MetroGroup } from "@/types/location";

export type EthnicGroupsCatalog = {
  schemaVersion: number;
  source: string;
  groupType: "cultural-group";
  generatedAt: string;
  count: number;
  groups: MetroGroup[];
};

export type EthnicSpotlightCard = {
  id: string;
  name: string;
  cultureId: string;
  motifLabel: string;
  motifAccentClass: string;
  /** Local SVG textile / aquatic motif used as the card artwork. */
  image?: string;
  overlayClass: string;
  gradientClass: string;
  description: string;
  homelandLgaCount: number;
  zonesLabel: string;
  exploreHref: string;
};
