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
    exploreHref: "/explore?map=election",
    anchor: "#civic",
  },
  {
    id: "economy",
    label: "Economy",
    shortLabel: "Economy & Trade",
    exploreHref: "/explore?lens=invest",
    anchor: "#economy",
  },
  {
    id: "data",
    label: "Data",
    shortLabel: "Comparative Intelligence",
    exploreHref: "/explore?map=ranking",
    anchor: "#data",
  },
  {
    id: "land",
    label: "Land",
    shortLabel: "Terrain & Ecology",
    exploreHref: "/explore",
    anchor: "#land",
  },
  {
    id: "people",
    label: "People",
    shortLabel: "Linguistic & Cultural",
    exploreHref: "/explore",
    anchor: "#people",
  },
  {
    id: "travel",
    label: "Travel",
    shortLabel: "Travel & Heritage",
    exploreHref: "/explore?lens=tourist",
    anchor: "#travel",
  },
  {
    id: "learn",
    label: "Learn",
    shortLabel: "Civic Literacy",
    exploreHref: "/explore?lens=learn",
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
