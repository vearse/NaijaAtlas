/** Individual overlay layer toggles in the map UI. */
export type OverlayLayerId =
  | "waterways"
  | "lakes"
  | "coast"
  | "landforms"
  | "cities"
  | "resources";

export const OVERLAY_LAYER_IDS: OverlayLayerId[] = [
  "waterways",
  "lakes",
  "coast",
  "landforms",
  "cities",
  "resources",
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
  resources: { label: "Resources", short: "Minerals", category: "Resource" },
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

export const WATERWAY_MILITARY_CATEGORIES = [
  "army-division",
  "navy-base",
  "airforce-hq",
  "airforce-base",
] as const;
export type WaterwayMilitaryCategory = (typeof WATERWAY_MILITARY_CATEGORIES)[number];

export const WATERWAY_MILITARY_CATEGORY_LABELS: Record<
  WaterwayMilitaryCategory,
  { label: string; color: string; branch: string }
> = {
  "army-division": { label: "Army division", color: "#3f6212", branch: "Nigerian Army" },
  "navy-base": { label: "Navy command", color: "#0f172a", branch: "Nigerian Navy" },
  "airforce-hq": { label: "Air Force HQ", color: "#0369a1", branch: "Nigerian Air Force" },
  "airforce-base": { label: "Air Force base", color: "#1e40af", branch: "Nigerian Air Force" },
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

export const COAST_CATEGORIES = [
  "seaport",
  "oil-terminal",
  "estuary",
  "environment",
  "historic",
] as const;
export type CoastCategory = (typeof COAST_CATEGORIES)[number];

export const COAST_CATEGORY_LABELS: Record<
  CoastCategory,
  { label: string; color: string }
> = {
  seaport: { label: "Seaport", color: "#1e3a8a" },
  "oil-terminal": { label: "Oil & gas terminal", color: "#d97706" },
  estuary: { label: "Estuary / lagoon", color: "#0891b2" },
  environment: { label: "Coastal environment", color: "#059669" },
  historic: { label: "Historic coast", color: "#92400e" },
};

export const RESOURCE_TYPES = [
  "crude-oil",
  "natural-gas",
  "coal",
  "tin-columbite",
  "iron-ore",
  "gold",
  "limestone",
  "bitumen",
  "lead-zinc",
  "lithium-rare",
  "marble",
  "salt-potash",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<
  ResourceType,
  { label: string; color: string }
> = {
  "crude-oil": { label: "Crude oil", color: "#1c1917" },
  "natural-gas": { label: "Natural gas", color: "#ea580c" },
  coal: { label: "Coal", color: "#292524" },
  "tin-columbite": { label: "Tin & columbite", color: "#64748b" },
  "iron-ore": { label: "Iron ore", color: "#92400e" },
  gold: { label: "Gold", color: "#ca8a04" },
  limestone: { label: "Limestone", color: "#a8a29e" },
  bitumen: { label: "Bitumen / tar sands", color: "#44403c" },
  "lead-zinc": { label: "Lead & zinc", color: "#475569" },
  "lithium-rare": { label: "Lithium & rare earths", color: "#0ea5e9" },
  marble: { label: "Marble", color: "#d6d3d1" },
  "salt-potash": { label: "Salt & potash", color: "#f59e0b" },
};

export const COAST_ZONE_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  national: { label: "National coastline", color: "#1e3a5f" },
  "coast-zone": { label: "Coast zone", color: "#0d9488" },
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
  "forest",
  "reserve",
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
  forest: { label: "Forest", color: "#15803d" },
  reserve: { label: "Game reserve / park", color: "#166534" },
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

export const LANDFORM_MAP_LEGEND = [
  { emoji: "🌿", icon: "grass", label: "grass = savanna" },
  { emoji: "🏜", icon: "sand", label: "sand = dry basin" },
  { emoji: "💧", icon: "delta", label: "delta = wetland" },
  { emoji: "🌲", icon: "forest", label: "trees = forest" },
  { emoji: "🏞", icon: "reserve", label: "park = reserve / park" },
  { emoji: "⛰", icon: "highland", label: "peaks & hills = highlands" },
] as const;

export const OVERLAY_LAYER_GUIDES: Record<OverlayLayerId, OverlayLayerGuide> = {
  waterways: {
    title: "Waterways",
    summary: "Major rivers, tributaries, Niger Delta creeks, and Armed Forces formations.",
    description:
      "Blue lines show permanent waterways. Thicker dark blue lines are major rivers (Niger, Benue); lighter lines are tributaries and delta creeks. Military markers show Army divisions (olive shields), Navy commands (slate ships), and Air Force bases (sky roundels/deltas). Tap any line or marker for details.",
    includes: ["Niger & Benue main stems", "Kaduna, Cross, Osun, Imo rivers", "Delta creeks (Nun, Forcados, Bonny)", "9 Army divisions, 3 Navy commands, 5 Air Force formations"],
    legend: ["Thick blue = major river", "Medium blue = tributary", "Light cyan = delta creek", "🪖 olive shield = Army division", "🚢 slate ship = Navy command", "🎯 sky roundel = Air Force HQ", "✈️ indigo delta = Air Force base"],
    tip: "Zoom in to read river names and see military formation labels.",
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
    summary: "Atlantic ocean, coastline zones, seaports, delta terminals, estuaries, and coastal environment.",
    description:
      "Light blue shows the Gulf of Guinea offshore. A thick dark national coastline and coloured zone traces divide Lagos barrier coast, Niger Delta, and the eastern Cross River shore. Icons match this legend: ⚓ seaport, 💧 oil terminal, ~ estuary, 🍃 environment, 🏛 historic coast.",
    includes: [
      "853 km national coastline & three coast zones",
      "Apapa, Lekki, Port Harcourt, Calabar, Warri, Onne",
      "Forcados, Bonny, Escravos terminals",
      "Lagos Lagoon, Niger Delta & Cross River estuaries",
    ],
    legend: [
      "Light blue = ocean",
      "Thick dark line = national coast",
      "Teal / green / purple = coast zones",
      "⚓ navy = seaport",
      "💧 amber = oil terminal",
      "~ cyan = estuary",
      "🍃 green = environment",
      "🏛 brown = historic coast",
    ],
    tip: "Tap any coast line or icon for trade, ecology, and environment notes. Navy commands are now on the Waterways layer.",
  },
  landforms: {
    title: "Landforms & relief",
    summary: "Plateaus, hills, peaks, inselbergs, deltas, and landscape belts — styled by type and size.",
    description:
      "Icons match the map legend: 🌿 grass for savanna, 🏜 sand for dry basins, 💧 for delta wetlands, 🌲 trees for forest, 🏞 park for reserves, and ⛰ for peaks and hills. Hills show one icon; larger belts use fewer spread markers. Tap any icon for soil/planting notes and landform details.",
    includes: ["Jos, Mambilla, Obudu & Bauchi plateaus", "Sambisa, Cross River NP, Yankari & Okomu", "Idanre, Shebshi, Gashaka highlands", "Aso Rock, Zuma Rock, Mount Patti", "Guinea & Sudan savanna belts, Sokoto Basin, Niger Delta"],
    legend: LANDFORM_MAP_LEGEND.map((item) => `${item.emoji} ${item.label}`),
    tip: "Multiple icons in one region show the extent of large landforms — tap any for planting guidance.",
  },
  cities: {
    title: "Cities",
    summary: "Major and regional cities with category icons by economic and administrative role.",
    description:
      "Each city has a shape-coded icon: star for Abuja, diamond for state capitals, red circle for Lagos-scale megacity, and other shapes for commercial, historic, port, and university towns. Military formations (Army, Navy, Air Force) are now on the Waterways layer.",
    includes: [
      "87 cities from megacities to regional centres",
      "State capitals and economic hubs",
      "University towns and historic settlements",
    ],
    legend: [
      "★ federal capital",
      "◆ state capital",
      "● megacity",
      "Other shapes = commercial, historic, port, university…",
    ],
    tip: "Tap any city for notes, economy, or linked institutions. Military formations are on the Waterways layer.",
  },
  resources: {
    title: "Mineral resources",
    summary: "Major minerals and energy deposits — oil, gas, coal, metals, and industrial minerals.",
    description:
      "Coded icons mark where Nigeria's mineral reserves are concentrated. Oil/gas are in the Niger Delta; tin, columbite, and gold are on the Jos Plateau and southwest; limestone belts span the central states. Each entry lists reserves, production notes, and what the mineral is used to produce.",
    includes: [
      "Crude oil & natural gas fields (Niger Delta)",
      "Enugu coal, Jos Plateau tin-columbite",
      "Kogi/Ajaokuta iron ore, Iperindo gold, limestone belts",
      "Bitumen (Ondo/Edo), lithium & rare earths (Nasarawa/Kaduna)",
      "Marble (Kwara/Sokoto), salt & potash (Lagos/Sokoto)",
    ],
    legend: [
      "🛢️ dark barrel = crude oil",
      "🔥 orange flame = natural gas",
      "⛏️ black cube = coal",
      "⚙️ grey spark = tin / columbite",
      "⛓️ brown pick = iron ore",
      "🪙 gold coin = gold",
      "🟦 light tank = limestone",
      "⬛ dark block = bitumen",
      "🔩 grey zinc = lead / zinc",
      "🔋 sky battery = lithium / rare earths",
      "🔲 white tile = marble",
      "🧂 amber jar = salt / potash",
    ],
    tip: "Tap any resource icon to see reserves, production notes, and downstream products.",
  },
};

/** Selected overlay feature shown in the detail panel. */
export interface SelectedOverlayFeature {
  id: string;
  layerId: OverlayLayerId;
  name: string;
  properties: Record<string, unknown>;
}
