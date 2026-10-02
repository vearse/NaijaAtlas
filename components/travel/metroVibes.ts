import type { MetroVibe } from "@/lib/server/loadTravelHubData";

export type MetroVibeMeta = {
  id: MetroVibe;
  label: string;
  icon: string;
  tagline: string;
  accent: string;
  wash: string;
};

/** Shared metro personality chips, used by the top-destinations grid and the vibe browser. */
export const METRO_VIBES: MetroVibeMeta[] = [
  {
    id: "capital",
    label: "Megacities",
    icon: "🏙",
    tagline: "Skylines, nightlife and the pace of power.",
    accent: "#008751",
    wash: "from-emerald-50",
  },
  {
    id: "heritage",
    label: "Old kingdoms",
    icon: "🏛",
    tagline: "Palaces, city walls and centuries of history.",
    accent: "#b45309",
    wash: "from-amber-50",
  },
  {
    id: "trade",
    label: "Markets & industry",
    icon: "🛒",
    tagline: "Where Nigeria buys, sells and makes things.",
    accent: "#be123c",
    wash: "from-rose-50",
  },
  {
    id: "port",
    label: "Port cities",
    icon: "⚓",
    tagline: "Creeks, quaysides and oil-coast energy.",
    accent: "#0369a1",
    wash: "from-sky-50",
  },
  {
    id: "campus",
    label: "Campus towns",
    icon: "🎓",
    tagline: "Old universities and scholarly streets.",
    accent: "#6d28d9",
    wash: "from-violet-50",
  },
  {
    id: "rising",
    label: "Rising capitals",
    icon: "🌱",
    tagline: "Young state capitals still writing their story.",
    accent: "#4d7c0f",
    wash: "from-lime-50",
  },
];

export const VIBE_BY_ID: Record<MetroVibe, MetroVibeMeta> = Object.fromEntries(
  METRO_VIBES.map((v) => [v.id, v])
) as Record<MetroVibe, MetroVibeMeta>;