import type { QuestionFilter, QuizDifficulty, QuizTopic } from "@/lib/learn/questions";

export type QuizConfig = {
  modeId: QuizModeId;
  length: number;
  difficulty: QuizDifficulty;
  topics: QuizTopic[];
  stateId: string | null;
};

export const ALL_TOPICS: { id: QuizTopic; label: string; emoji: string }[] = [
  { id: "nigeria", label: "Nigeria overview", emoji: "🇳🇬" },
  { id: "state", label: "States", emoji: "🗺️" },
  { id: "lga", label: "LGAs", emoji: "🏘️" },
];

export const DIFFICULTIES: { id: QuizDifficulty; label: string; detail: string; seconds: number | null; multiplier: number }[] = [
  { id: "easy", label: "Easy", detail: "No timer · obvious choices", seconds: null, multiplier: 1 },
  { id: "standard", label: "Standard", detail: "30s per question", seconds: 30, multiplier: 1.5 },
  { id: "hard", label: "Hard", detail: "15s · tricky look-alikes", seconds: 15, multiplier: 2 },
];

/** Final question filter for a config: mode filter + topic toggles + chosen state. */
export function filterForConfig(mode: QuizMode, config: QuizConfig): QuestionFilter {
  return {
    ...mode.filter,
    topics: mode.topicPicker ? config.topics : mode.filter.topics,
    stateId: mode.needsState ? config.stateId : null,
  };
}

export type QuizModeId =
  | "classic"
  | "map-states"
  | "map-lgas"
  | "capitals"
  | "zones"
  | "lga-master"
  | "nigeria"
  | "blitz"
  | "survival"
  | "daily";

export type QuizMode = {
  id: QuizModeId;
  title: string;
  tagline: string;
  description: string;
  emoji: string;
  category: "geography" | "civic" | "map" | "arcade";
  filter: QuestionFilter;
  defaultLength: number;
  /** Whole-game countdown in seconds (blitz). */
  gameSeconds?: number;
  /** Lives before game over (survival). */
  lives?: number;
  /** Keeps drawing questions until time / lives run out. */
  endless?: boolean;
  /** Player picks a state on the map before starting. */
  needsState?: boolean;
  /** Same questions for everyone on a given day. */
  daily?: boolean;
  /** Shows topic toggles on the setup screen. */
  topicPicker?: boolean;
};

export const QUIZ_MODES: QuizMode[] = [
  {
    id: "classic",
    title: "Classic mix",
    tagline: "A bit of everything",
    description: "Country facts, state capitals, slogans and LGAs — choose your topics.",
    emoji: "🎯",
    category: "geography",
    filter: { kinds: ["choice", "map-state"] },
    defaultLength: 10,
    topicPicker: true,
  },
  {
    id: "map-states",
    title: "Map hunt: states",
    tagline: "Tap it on the map",
    description: "Find states by name, capital or slogan on the Nigeria map — or name the highlighted one.",
    emoji: "📍",
    category: "map",
    filter: { generatorIds: ["map-find-state", "map-find-capital", "map-find-nickname", "map-name-state"] },
    defaultLength: 10,
  },
  {
    id: "map-lgas",
    title: "Map hunt: LGAs",
    tagline: "Pick a state, find its LGAs",
    description: "Choose a state on the map, then hunt down its local government areas one by one.",
    emoji: "🧭",
    category: "map",
    filter: { generatorIds: ["map-find-lga"] },
    defaultLength: 10,
    needsState: true,
  },
  {
    id: "capitals",
    title: "Capitals & cities",
    tagline: "Ikeja to Dutse",
    description: "Match states to their capitals and major cities, both ways round.",
    emoji: "🏙️",
    category: "geography",
    filter: { generatorIds: ["state-capital", "capital-state", "state-city", "map-find-capital"] },
    defaultLength: 10,
  },
  {
    id: "zones",
    title: "Zones & neighbours",
    tagline: "Six zones, 37 pieces",
    description: "Geopolitical zones, bordering states, coastline and frontier states.",
    emoji: "🧩",
    category: "geography",
    filter: {
      generatorIds: ["state-zone", "zone-state-count", "state-border", "state-coast", "state-intl-border"],
    },
    defaultLength: 10,
  },
  {
    id: "lga-master",
    title: "LGA master",
    tagline: "Go local",
    description: "Headquarters, towns, sizes and locations of every LGA in a state you choose.",
    emoji: "🏘️",
    category: "geography",
    filter: { topics: ["lga"] },
    defaultLength: 10,
    needsState: true,
  },
  {
    id: "nigeria",
    title: "Nigeria overview",
    tagline: "The big picture",
    description: "Capital, independence, counts, slogans and the biggest, smallest and most populous states.",
    emoji: "🇳🇬",
    category: "civic",
    filter: {
      generatorIds: [
        "ng-capital",
        "ng-independence",
        "ng-state-count",
        "ng-lga-count",
        "zone-state-count",
        "ng-extremes",
        "state-nickname",
        "state-created",
        "state-governor",
        "state-population-rank",
        "state-area-rank",
      ],
    },
    defaultLength: 10,
  },
  {
    id: "blitz",
    title: "60-second blitz",
    tagline: "Beat the clock",
    description: "As many as you can in a minute. Speed and combos multiply your score.",
    emoji: "⚡",
    category: "arcade",
    filter: { kinds: ["choice"], topics: ["nigeria", "state"] },
    defaultLength: 60,
    gameSeconds: 60,
    endless: true,
  },
  {
    id: "survival",
    title: "Survival",
    tagline: "Three lives",
    description: "Mixed questions until you miss three. How long can you last?",
    emoji: "❤️",
    category: "arcade",
    filter: {},
    defaultLength: 200,
    lives: 3,
    endless: true,
  },
  {
    id: "daily",
    title: "Daily challenge",
    tagline: "Same 7 for everyone",
    description: "Seven fresh questions every day. Keep your daily streak alive.",
    emoji: "📅",
    category: "arcade",
    filter: {},
    defaultLength: 7,
    daily: true,
  },
];

export function getQuizMode(id: string | null | undefined): QuizMode {
  return QUIZ_MODES.find((m) => m.id === id) ?? QUIZ_MODES[0];
}
