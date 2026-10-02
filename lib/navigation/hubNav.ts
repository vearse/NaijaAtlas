export type HubNavId =
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

/**
 * Section hub chrome — Land · People · Travel · Civic · Economy · Data · Learn
 *
 * Places is deliberately absent: it is no longer a top-level section. It is
 * reached from the Home page's Geopolitical Directory band (`/places`), which
 * owns the state directory and every `/places/[state]` profile.
 */
export const HUB_NAV: HubNavItem[] = [
  { id: "land", label: "Land", href: "/land" },
  { id: "people", label: "People", href: "/people" },
  { id: "travel", label: "Travel", href: "/travel" },
  { id: "civic", label: "Civic", href: "/civic" },
  { id: "economy", label: "Economy", href: "/economy" },
  { id: "data", label: "Data", href: "/data" },
  { id: "learn", label: "Learn", href: "/learn" },
];

export function hubNavItem(id: HubNavId): HubNavItem {
  const item = HUB_NAV.find((n) => n.id === id);
  if (!item) throw new Error(`Unknown hub nav: ${id}`);
  return item;
}
