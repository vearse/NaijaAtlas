export type HubNavId =
  | "places"
  | "land"
  | "people"
  | "travel"
  | "civic"
  | "economy"
  | "data"
  | "learn";

export type HubNavItem = {
  id: HubNavId;
  label: string;
  href: string;
};

/** Section hub chrome — Places · Land · People · Travel · Civic · Economy · Data · Learn */
export const HUB_NAV: HubNavItem[] = [
  { id: "places", label: "Places", href: "/places" },
  { id: "land", label: "Land", href: "/places#land" },
  { id: "people", label: "People", href: "/explore#people" },
  { id: "travel", label: "Travel", href: "/explore?lens=tourist" },
  { id: "civic", label: "Civic", href: "/explore?map=election" },
  { id: "economy", label: "Economy", href: "/explore?lens=invest" },
  { id: "data", label: "Data", href: "/explore?map=ranking" },
  { id: "learn", label: "Learn", href: "/explore?lens=learn" },
];

export function hubNavItem(id: HubNavId): HubNavItem {
  const item = HUB_NAV.find((n) => n.id === id);
  if (!item) throw new Error(`Unknown hub nav: ${id}`);
  return item;
}
