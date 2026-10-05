
import {
  encodeFocusParam,
  type OverlayFocusSpec,
} from "@/lib/map/overlayFocus";

/**
 * Section map workspaces.
 *
 * The election and rankings workspaces already have dedicated routes
 * (`/civic/map/elections`, `/data/map/rankings`) with their own headers and
 * back-links, so those CTAs go there. Every other section resolves to the atlas
 * route, which renders the same layers. Centralising the URLs here means adding
 * a dedicated route later is a one-file change.
 */
export type SectionMapId =
  | "civic/elections"
  | "civic/security"
  | "data/rankings"
  | "data/compare"
  | "land/physical"
  | "land/zones"
  | "travel/places"
  | "travel/directions"
  | "economy/resources"
  | "economy/ports"
  | "economy/power"
  | "people/groups";

export type SectionMapMeta = {
  id: SectionMapId;
  title: string;
  blurb: string;
  /** Which hub owns the card. */
  hub: "civic" | "data" | "land" | "travel" | "economy" | "people";
  /** Thumbnail shading. */
  thumb: { source: "regions" | "states"; highlight?: string[] };
  /**
   * Dedicated workspace route, when one exists. Falls back to the atlas map
   * with the section's own parameters.
   */
  path?: string;
  /** CTA wording. */
  cta: string;
  variant: "primary" | "outline";
};

export const SECTION_MAPS: Record<SectionMapId, SectionMapMeta> = {
  "civic/elections": {
    id: "civic/elections",
    path: "/civic/map/elections",
    title: "Election map",
    blurb:
      "Senatorial districts, federal constituencies, polling units and candidates by area.",
    hub: "civic",
    thumb: { source: "states", highlight: ["NG-LA"] },
    cta: "Go to election map",
    variant: "primary",
  },
  "civic/security": {
    id: "civic/security",
    path: "/civic/map/security",
    title: "Security map",
    blurb:
      "Army divisions, naval commands and air force formations — the civic security view.",
    hub: "civic",
    thumb: { source: "states", highlight: ["NG-BE", "NG-KW", "NG-ED"] },
    cta: "Go to security map",
    variant: "outline",
  },
  "data/rankings": {
    id: "data/rankings",
    path: "/data/map/rankings",
    title: "Rankings map",
    blurb: "Colour every state by one indicator and read the table beside it.",
    hub: "data",
    thumb: { source: "regions" },
    cta: "Go to rankings map",
    variant: "primary",
  },
  "data/compare": {
    id: "data/compare",
    path: "/places/map",
    title: "Compare map",
    blurb: "Pick two or three states on the Places map and compare them side by side.",
    hub: "land",
    thumb: { source: "states", highlight: ["NG-LA", "NG-KN", "NG-RI"] },
    cta: "Go to compare map",
    variant: "outline",
  },
  "land/physical": {
    id: "land/physical",
    path: "/places/map",
    title: "Terrain & water map",
    blurb: "Relief, rivers, lakes, coastline and ecosystem bands.",
    hub: "land",
    thumb: { source: "states", highlight: ["NG-NI", "NG-OG"] },
    cta: "Go to physical map",
    variant: "primary",
  },
  "land/zones": {
    id: "land/zones",
    path: "/places/map",
    title: "Zones map",
    blurb: "The six geopolitical zones, one colour each.",
    hub: "land",
    thumb: { source: "regions" },
    cta: "Go to zones map",
    variant: "outline",
  },
  "travel/places": {
    id: "travel/places",
    path: "/travel/map",
    title: "Destinations map",
    blurb: "Cities, parks, heritage sites and resort towns in one view.",
    hub: "travel",
    thumb: { source: "states", highlight: ["NG-LA", "NG-CR", "NG-OY"] },
    cta: "Go to places map",
    variant: "primary",
  },
  "travel/directions": {
    id: "travel/directions",
    path: "/travel/map",
    title: "Directions map",
    blurb: "Turn-by-turn routes between any two documented Nigerian cities.",
    hub: "travel",
    thumb: { source: "states" },
    cta: "Go to directions map",
    variant: "outline",
  },
  "economy/resources": {
    id: "economy/resources",
    path: "/economy/map",
    title: "Resources map",
    blurb: "Solid minerals, farming belts and export commodities by state.",
    hub: "economy",
    thumb: { source: "states", highlight: ["NG-NA", "NG-KO", "NG-NI"] },
    cta: "Go to resources map",
    variant: "primary",
  },
  "economy/power": {
    id: "economy/power",
    path: "/economy/map",
    title: "Power & hydropower map",
    blurb:
      "Hydroelectric stations on the lakes layer, plus the eleven grid distribution companies.",
    hub: "economy",
    thumb: { source: "states", highlight: ["NG-NI", "NG-KO"] },
    cta: "Go to power map",
    variant: "outline",
  },
  "economy/ports": {
    id: "economy/ports",
    path: "/economy/map",
    title: "Ports & trade map",
    blurb: "Active seaports, river ports and the proposed deep-water terminals.",
    hub: "economy",
    thumb: { source: "states", highlight: ["NG-LA", "NG-RI", "NG-ON"] },
    cta: "Go to ports map",
    variant: "outline",
  },
  "people/groups": {
    id: "people/groups",
    path: "/people/map",
    title: "Homelands map",
    blurb: "Where the documented cultural groups live, state by state.",
    hub: "people",
    thumb: { source: "regions" },
    cta: "Go to homelands map",
    variant: "primary",
  },
};

export type SectionMapHrefOptions = {
  stateIds?: string[];
  regionId?: string;
  senatorialDistrictId?: string;
  lens?: "learn" | "tourist" | "invest";
  focus?: Omit<OverlayFocusSpec, "label"> & { label?: string };
  ranking?: { category: "economy" | "social"; field: string; period: string };
  basemap?: "minimal" | "osm";
  directions?: { from: string; to: string };
  /** Opt-in groups the target workspace depends on (proposed ports, new Army divisions). */
  reveal?: string[];
};

/** Build the atlas URL that renders a section map workspace. */
export function sectionMapHref(
  id: SectionMapId,
  options: SectionMapHrefOptions = {}
): string {
  const params = new URLSearchParams();
  params.set("map", options.basemap ?? "minimal");

  switch (id) {
    case "civic/elections":
      params.set("map", "election");
      if (options.senatorialDistrictId) {
        params.set("sd", options.senatorialDistrictId);
      } else if (options.stateIds?.length) {
        params.set("states", options.stateIds.join(","));
        params.set("lgas", "1");
      }
      break;
    case "civic/security":
      params.set("reveal", "proposed-army-divisions");
      params.set(
        "focus",
        encodeFocusParam({
          layerId: "security",
          matchKey: "featureKind",
          matchValue: "security-formation",
          label: "Military formations",
        })
      );
      break;
    case "data/rankings":
      params.set("map", "ranking");
      if (options.ranking) {
        params.set("rankCat", options.ranking.category);
        params.set("rankField", options.ranking.field);
        params.set("rankPeriod", options.ranking.period);
      }
      break;
    case "data/compare":
      if (options.stateIds?.length) {
        params.set("states", options.stateIds.join(","));
      }
      break;
    case "land/physical":
      params.set(
        "focus",
        options.focus
          ? encodeFocusParam({
              ...options.focus,
              label: options.focus.label ?? options.focus.matchValue,
            })
          : encodeFocusParam({
              layerId: "landforms",
              matchKey: "landformType",
              matchValue: "plateau",
              label: "Landforms",
            })
      );
      break;
    case "land/zones":
      if (options.regionId) params.set("regions", options.regionId);
      break;
    case "travel/places":
      break;
    case "travel/directions":
      if (options.directions) {
        params.set("dirFrom", options.directions.from);
        params.set("dirTo", options.directions.to);
      }
      break;
    case "economy/resources":
      params.set(
        "focus",
        options.focus
          ? encodeFocusParam({
              ...options.focus,
              label: options.focus.label ?? options.focus.matchValue,
            })
          : encodeFocusParam({
              layerId: "resources",
              matchKey: "resourceType",
              matchValue: "crude-oil",
              label: "Resources",
            })
      );
      break;
    case "economy/ports":
      params.set("reveal", "proposed-ports");
      params.set(
        "focus",
        encodeFocusParam({
          layerId: "lakes",
          matchKey: "waterwayClass",
          matchValue: "seaport",
          label: "Ports",
        })
      );
      break;
    case "economy/power":
      params.set("layers", "power");
      params.set(
        "focus",
        encodeFocusParam({
          layerId: "power",
          matchKey: "featureKind",
          matchValue: "power-plant",
          label: "Power stations",
        })
      );
      break;
    case "people/groups":
      if (options.stateIds?.length) {
        params.set("states", options.stateIds.join(","));
      }
      break;
  }

  const base = SECTION_MAPS[id].path ?? "/explore";
  return `${base}?${params.toString()}`;
}
