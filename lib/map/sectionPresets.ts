import type { LensId } from "@/lib/lenses/lensHelper";
import type { OverlayLayerId } from "@/types/overlay";

/** Section map workspaces. Each is the same NigeriaMap with a fixed preset. */
export type SectionWorkspaceMode =
  | "rankings"
  | "elections"
  | "security"
  | "places"
  | "travel"
  | "economy"
  | "people";

export type SectionPreset = {
  id: SectionWorkspaceMode;
  badge: string;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  /** Route shown in the breadcrumb chip. */
  path: string;
  status: string;
  /** Panel content filter; the lens picker itself is never shown. */
  lens: LensId;
  /** Layers offered in the toolbar. Empty hides the toolbar. */
  layers: OverlayLayerId[];
  defaultLayers: OverlayLayerId[];
  reveal?: string[];
  /** Only Places shows LGAs and state compare. */
  lgaAndCompare?: boolean;
  basemapToggle?: boolean;
};

export const SECTION_PRESETS: Record<SectionWorkspaceMode, SectionPreset> = {
  places: {
    id: "places",
    badge: "Places & Land",
    title: "States, LGAs & the land",
    subtitle: "Boundaries · Relief · Rivers · Zones",
    backHref: "/places",
    backLabel: "Back to Places",
    path: "/places/map",
    status: "Pick a state to open its LGAs · Select 2–3 to compare",
    lens: "learn",
    layers: ["landforms", "waterways", "lakes", "cities"],
    defaultLayers: [],
    lgaAndCompare: true,
    basemapToggle: true,
  },
  travel: {
    id: "travel",
    badge: "Travel",
    title: "Destinations map",
    subtitle: "Cities · Tours · Highlands · Lakes",
    backHref: "/travel",
    backLabel: "Back to Travel",
    path: "/travel/map",
    status: "Showing tourist cities, highlands and lakes",
    lens: "tourist",
    layers: ["cities", "landforms", "lakes"],
    defaultLayers: ["cities", "landforms", "lakes"],
    basemapToggle: true,
  },
  economy: {
    id: "economy",
    badge: "Economy",
    title: "Economy map",
    subtitle: "Minerals · Ecosystems · Ports · Power",
    backHref: "/economy",
    backLabel: "Back to Economy",
    path: "/economy/map",
    status: "Showing minerals and farming ecosystems",
    lens: "invest",
    layers: ["resources", "ecology", "waterways", "lakes"],
    defaultLayers: ["resources", "ecology"],
    basemapToggle: true,
  },
  people: {
    id: "people",
    badge: "People",
    title: "Homelands map",
    subtitle: "Groups · Languages · Cities",
    backHref: "/people",
    backLabel: "Back to People",
    path: "/people/map",
    status: "Select a state to read its peoples and languages",
    lens: "learn",
    layers: ["cities"],
    defaultLayers: [],
  },
  security: {
    id: "security",
    badge: "Civic",
    title: "Security formations",
    subtitle: "Army · Navy · Air Force",
    backHref: "/civic",
    backLabel: "Back to Civic",
    path: "/civic/map/security",
    status: "Showing Armed Forces formations",
    lens: "learn",
    layers: ["waterways"],
    defaultLayers: ["waterways"],
    reveal: ["proposed-army-divisions"],
  },
  elections: {
    id: "elections",
    badge: "Civic",
    title: "2027 election map",
    subtitle: "Senate districts · Constituencies · Polling units",
    backHref: "/civic",
    backLabel: "Back to Civic",
    path: "/civic/map/elections",
    status: "Senate districts · Polling units",
    lens: "learn",
    layers: [],
    defaultLayers: [],
  },
  rankings: {
    id: "rankings",
    badge: "Data",
    title: "Rankings map",
    subtitle: "Colour every state by one indicator",
    backHref: "/data",
    backLabel: "Back to Data",
    path: "/data/map/rankings",
    status: "Ranking all 37 states",
    lens: "learn",
    layers: [],
    defaultLayers: [],
  },
};
