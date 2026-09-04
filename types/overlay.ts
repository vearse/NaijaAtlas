/** Individual overlay layer toggles in the map UI. */
export type OverlayLayerId =
  | "waterways"
  | "lakes"
  | "coast"
  | "landforms"
  | "cities";

export const OVERLAY_LAYER_IDS: OverlayLayerId[] = [
  "waterways",
  "lakes",
  "coast",
  "landforms",
  "cities",
];

export const OVERLAY_LAYER_LABELS: Record<
  OverlayLayerId,
  { label: string; short: string; category: string }
> = {
  waterways: { label: "Waterways", short: "Water", category: "Waterway" },
  lakes: { label: "Lakes", short: "Lakes", category: "Lake" },
  coast: { label: "Coast", short: "Coast", category: "Coast" },
  landforms: { label: "Landforms", short: "Relief", category: "Landform" },
  cities: { label: "Cities", short: "Cities", category: "City" },
};

export const CITY_CATEGORIES = [
  "federal-capital",
  "mega-city",
  "state-capital",
  "commercial",
  "historic",
  "port-city",
  "industrial",
  "university",
  "regional",
] as const;

export type CityCategory = (typeof CITY_CATEGORIES)[number];

export const CITY_CATEGORY_LABELS: Record<
  CityCategory,
  { label: string; color: string }
> = {
  "federal-capital": { label: "Federal capital", color: "#7c3aed" },
  "mega-city": { label: "Megacity", color: "#dc2626" },
  "state-capital": { label: "State capital", color: "#008751" },
  commercial: { label: "Commercial hub", color: "#ea580c" },
  historic: { label: "Historic city", color: "#92400e" },
  "port-city": { label: "Port city", color: "#1d4ed8" },
  industrial: { label: "Industrial centre", color: "#475569" },
  university: { label: "University town", color: "#0f766e" },
  regional: { label: "Regional city", color: "#64748b" },
};

export const LAKE_CATEGORIES = ["natural", "reservoir", "lagoon"] as const;
export type LakeCategory = (typeof LAKE_CATEGORIES)[number];

export const LAKE_CATEGORY_LABELS: Record<
  LakeCategory,
  { label: string; color: string }
> = {
  natural: { label: "Natural lake", color: "#2563eb" },
  reservoir: { label: "Reservoir", color: "#0891b2" },
  lagoon: { label: "Coastal lagoon", color: "#0ea5e9" },
};

export const POWER_PLANT_CATEGORIES = ["major-hydro", "regional-hydro"] as const;
export type PowerPlantCategory = (typeof POWER_PLANT_CATEGORIES)[number];

export const POWER_PLANT_CATEGORY_LABELS: Record<
  PowerPlantCategory,
  { label: string; color: string }
> = {
  "major-hydro": { label: "Major hydro plant", color: "#ca8a04" },
  "regional-hydro": { label: "Regional hydro / dam", color: "#64748b" },
};

export const LANDFORM_TYPES = [
  "plateau",
  "mountain-range",
  "hill",
  "escarpment",
  "inselberg",
  "peak",
  "delta",
  "basin",
  "savanna",
] as const;
export type LandformType = (typeof LANDFORM_TYPES)[number];

export const LANDFORM_SIZE_TIERS = ["major", "medium", "minor"] as const;
export type LandformSizeTier = (typeof LANDFORM_SIZE_TIERS)[number];

export const LANDFORM_TYPE_LABELS: Record<
  LandformType,
  { label: string; color: string }
> = {
  plateau: { label: "Plateau", color: "#a16207" },
  "mountain-range": { label: "Mountain range", color: "#57534e" },
  hill: { label: "Hills", color: "#b45309" },
  escarpment: { label: "Escarpment", color: "#92400e" },
  inselberg: { label: "Inselberg / monolith", color: "#78350f" },
  peak: { label: "Peak", color: "#44403c" },
  delta: { label: "Delta / lowland", color: "#15803d" },
  basin: { label: "Basin / plains", color: "#ca8a04" },
  savanna: { label: "Savanna belt", color: "#65a30d" },
};

export const LANDFORM_SIZE_LABELS: Record<
  LandformSizeTier,
  { label: string; description: string }
> = {
  major: { label: "Major", description: "National-scale landform" },
  medium: { label: "Regional", description: "State or multi-LGA feature" },
  minor: { label: "Local", description: "Single peak or landmark" },
};

export interface OverlayLayerGuide {
  title: string;
  summary: string;
  description: string;
  includes: string[];
  legend: string[];
  tip: string;
}

export const OVERLAY_LAYER_GUIDES: Record<OverlayLayerId, OverlayLayerGuide> = {
  waterways: {
    title: "Waterways",
    summary: "Major rivers, tributaries, and Niger Delta creeks traced from Natural Earth data.",
    description:
      "Blue lines show permanent waterways. Thicker dark blue lines are major rivers (Niger, Benue); lighter lines are tributaries and delta creeks. Tap any labelled reach for length, basin, and economy notes.",
    includes: ["Niger & Benue main stems", "Kaduna, Cross, Osun, Imo rivers", "Delta creeks (Nun, Forcados, Bonny)"],
    legend: ["Thick blue = major river", "Medium blue = tributary", "Light cyan = delta creek"],
    tip: "Zoom in to read river names along the line.",
  },
  lakes: {
    title: "Lakes & hydro",
    summary: "Lakes, lagoons, reservoirs, and hydroelectric power stations across Nigeria.",
    description:
      "Shaded polygons show open water — natural lakes, man-made reservoirs, and coastal lagoons. Gold ⚡ icons mark major hydro plants; grey ⚡ icons are regional dams and multipurpose schemes.",
    includes: ["Lake Chad, Kainji, Lagos Lagoon", "Regional reservoirs (Goronyo, Dadin Kowa, Asejire)", "Kainji, Jebba, Shiroro, Zungeru power stations"],
    legend: ["Blue fill = natural lake", "Teal fill = reservoir", "Sky fill = lagoon", "⚡ gold = major hydro", "⚡ grey = regional dam"],
    tip: "Tap a lake polygon or power icon for capacity, operator, and linked dam details.",
  },
  coast: {
    title: "Coast & ports",
    summary: "Atlantic ocean tint, Nigeria's coastline, and major seaports.",
    description:
      "Ocean fill appears offshore. The coastline trace follows Nigeria's ADM0 boundary. Black port dots mark Apapa/Lagos, Port Harcourt, Calabar, Warri, and Onne.",
    includes: ["Gulf of Guinea ocean mask", "National coastline", "Five major ports"],
    legend: ["Light blue = ocean", "Dark line = coastline", "Black dot = port"],
    tip: "Tap a port dot for trade and harbour notes.",
  },
  landforms: {
    title: "Landforms & relief",
    summary: "Plateaus, hills, peaks, inselbergs, deltas, and landscape belts — styled by type and size.",
    description:
      "Large tinted areas are plateaus, basins, savanna belts, and the Niger Delta. Smaller patches are hill groups like Idanre. Triangle markers are peaks; monolith icons are inselbergs (Aso Rock, Zuma Rock, Olumo). Darker, larger fills = major features; lighter fills = regional hills.",
    includes: ["Jos & Mambilla plateaus", "Idanre Hills, Mandara range", "Aso Rock, Zuma Rock, Chappal Waddi peak", "Niger Delta & Guinea savanna belt"],
    legend: ["Brown = plateau / hills", "Green = delta / savanna", "▲ dark = peak", "◆ brown = inselberg"],
    tip: "Compare fill size and colour to distinguish national plateaus from local hills.",
  },
  cities: {
    title: "Cities",
    summary: "Major and regional cities with category icons by economic and administrative role.",
    description:
      "Each city has a shape-coded icon: star for Abuja, diamond for state capitals, red circle for Lagos-scale megacity, and other shapes for commercial, historic, port, and university towns.",
    includes: ["63 cities from megacities to regional centres", "State capitals and economic hubs", "Port cities and university towns"],
    legend: ["★ federal capital", "◆ state capital", "● megacity", "Other shapes = commercial, historic, port…"],
    tip: "Tap any city icon for population notes, economy, and landmarks.",
  },
};

/** Selected overlay feature shown in the detail panel. */
export interface SelectedOverlayFeature {
  id: string;
  layerId: OverlayLayerId;
  name: string;
  properties: Record<string, unknown>;
}
