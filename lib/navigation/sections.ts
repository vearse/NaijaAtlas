export type SectionId =
  | "civic"
  | "economy"
  | "data"
  | "land"
  | "people"
  | "travel"
  | "learn";

export type ProductSection = {
  id: SectionId;
  label: string;
  shortLabel: string;
  exploreHref: string;
  anchor: string;
};

export const PRODUCT_SECTIONS: ProductSection[] = [
  {
    id: "civic",
    label: "Civic",
    shortLabel: "Civic & Elections",
    exploreHref: "/civic/map/elections",
    anchor: "#civic",
  },
  {
    id: "economy",
    label: "Economy",
    shortLabel: "Economy & Trade",
    exploreHref: "/economy/map",
    anchor: "#economy",
  },
  {
    id: "data",
    label: "Data",
    shortLabel: "Comparative Intelligence",
    exploreHref: "/data/map/rankings",
    anchor: "#data",
  },
  {
    id: "land",
    label: "Land",
    shortLabel: "Terrain & Ecology",
    exploreHref: "/places/map",
    anchor: "#land",
  },
  {
    id: "people",
    label: "People",
    shortLabel: "Linguistic & Cultural",
    exploreHref: "/people/map",
    anchor: "#people",
  },
  {
    id: "travel",
    label: "Travel",
    shortLabel: "Travel & Heritage",
    exploreHref: "/travel/map",
    anchor: "#travel",
  },
  {
    id: "learn",
    label: "Learn",
    shortLabel: "Civic Literacy",
    exploreHref: "/learn",
    anchor: "#learn",
  },
];

export const NAV_SECTIONS = PRODUCT_SECTIONS.filter((s) =>
  ["civic", "economy", "data", "land", "people", "learn"].includes(s.id)
);

export function sectionById(id: SectionId): ProductSection {
  const found = PRODUCT_SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown section: ${id}`);
  return found;
}
