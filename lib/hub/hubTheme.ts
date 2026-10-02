/**
 * Per-section accents. Hubs are light mode; the accent is used for eyebrows,
 * badges and border tints only — never for large fills.
 */
export type HubId =
  | "places"
  | "civic"
  | "data"
  | "economy"
  | "land"
  | "people"
  | "travel"
  | "learn";

export type HubAccent = {
  /** Uppercase eyebrow text. */
  eyebrow: string;
  /** `text-*` for the eyebrow. */
  text: string;
  /** `bg-* text-*` for pills and badges. */
  badge: string;
  /** `bg-*` for icon tiles. */
  tile: string;
  /** `border-*` for the focused card. */
  border: string;
  /** `bg-*` for a solid accent button. */
  button: string;
  /** `text-*` for links. */
  link: string;
  /** Solid colour for SVG thumbnails. */
  hex: string;
};

const ACCENTS: Record<HubId, HubAccent> = {
  places: {
    eyebrow: "text-lime-800",
    text: "text-lime-800",
    badge: "bg-lime-50 text-lime-800 border-lime-200",
    tile: "bg-lime-100",
    border: "border-lime-400",
    button: "bg-lime-700 text-white hover:bg-lime-800",
    link: "text-lime-800 hover:text-lime-900",
    hex: "#4d7c0f",
  },
  civic: {
    eyebrow: "text-[#008751]",
    text: "text-[#008751]",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    tile: "bg-emerald-100",
    border: "border-emerald-400",
    button: "bg-[#008751] text-white hover:bg-[#007345]",
    link: "text-[#008751] hover:text-emerald-800",
    hex: "#008751",
  },
  data: {
    eyebrow: "text-data-cyan",
    text: "text-data-cyan",
    badge: "bg-data-cyan-tint text-cyan-800 border-cyan-200",
    tile: "bg-cyan-100",
    border: "border-cyan-400",
    button: "bg-cyan-700 text-white hover:bg-cyan-800",
    link: "text-cyan-700 hover:text-cyan-800",
    hex: "#0891b2",
  },
  economy: {
    eyebrow: "text-metric-teal",
    text: "text-metric-teal",
    badge: "bg-metric-teal-tint text-teal-800 border-teal-200",
    tile: "bg-teal-100",
    border: "border-teal-400",
    button: "bg-metric-teal text-white hover:bg-teal-700",
    link: "text-metric-teal hover:text-teal-700",
    hex: "#0d9488",
  },
  land: {
    eyebrow: "text-land-stone",
    text: "text-land-stone",
    badge: "bg-land-stone-tint text-lime-900 border-lime-200",
    tile: "bg-lime-100",
    border: "border-lime-400",
    button: "bg-land-stone text-white hover:bg-lime-800",
    link: "text-land-stone hover:text-lime-800",
    hex: "#4d7c0f",
  },
  travel: {
    eyebrow: "text-heritage-amber",
    text: "text-heritage-amber",
    badge: "bg-heritage-amber-tint text-amber-800 border-amber-200",
    tile: "bg-amber-100",
    border: "border-amber-400",
    button: "bg-heritage-amber text-white hover:bg-amber-700",
    link: "text-heritage-amber hover:text-amber-800",
    hex: "#d97706",
  },
  people: {
    eyebrow: "text-people-violet",
    text: "text-people-violet",
    badge: "bg-people-violet-tint text-violet-800 border-violet-200",
    tile: "bg-violet-100",
    border: "border-violet-400",
    button: "bg-people-violet text-white hover:bg-violet-700",
    link: "text-people-violet hover:text-violet-700",
    hex: "#7c3aed",
  },
  learn: {
    eyebrow: "text-learn-mint",
    text: "text-learn-mint",
    badge: "bg-learn-mint-tint text-teal-800 border-teal-200",
    tile: "bg-teal-100",
    border: "border-teal-400",
    button: "bg-learn-mint text-white hover:bg-teal-700",
    link: "text-learn-mint hover:text-teal-700",
    hex: "#0d9488",
  },
};

export function hubAccent(hub: HubId): HubAccent {
  return ACCENTS[hub];
}
