export type QuizDifficulty = "Easy" | "Medium" | "Hard";

export type QuizCatalogItem = {
  id: string;
  title: string;
  description: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  avgScore: string;
  icon: string;
  mode: string;
  category: "geography" | "civic" | "culture" | "quick";
};

export const MOCK_QUIZZES: QuizCatalogItem[] = [
  {
    id: "find-state",
    title: "Find the state",
    description:
      "Locate states on an interactive boundary outline (game shell preview).",
    difficulty: "Easy",
    questionCount: 20,
    avgScore: "82%",
    icon: "pin",
    mode: "find-state",
    category: "geography",
  },
  {
    id: "capitals",
    title: "Capitals & metros",
    description: "Match state capitals from Ikeja to Dutse.",
    difficulty: "Easy",
    questionCount: 36,
    avgScore: "89%",
    icon: "city",
    mode: "capitals",
    category: "geography",
  },
  {
    id: "zones",
    title: "Geopolitical zones",
    description: "Which of the six zones does each state belong to?",
    difficulty: "Medium",
    questionCount: 18,
    avgScore: "74%",
    icon: "grid",
    mode: "zones",
    category: "geography",
  },
  {
    id: "civic",
    title: "Civic basics",
    description: "Senate, House, INEC, and how elections are run.",
    difficulty: "Medium",
    questionCount: 25,
    avgScore: "68%",
    icon: "vote",
    mode: "civic",
    category: "civic",
  },
  {
    id: "land-and-rivers",
    title: "Land and rivers",
    description:
      "Rivers Niger & Benue confluence, high plateaus, and ecological reserves.",
    difficulty: "Hard",
    questionCount: 15,
    avgScore: "58%",
    icon: "water",
    mode: "features",
    category: "geography",
  },
  {
    id: "culture-and-festivals",
    title: "Culture and festivals",
    description:
      "89 ethnic homelands, Durbar, Argungu, Osun-Osogbo, and Calabar carnival.",
    difficulty: "Medium",
    questionCount: 24,
    avgScore: "71%",
    icon: "festival",
    mode: "quick",
    category: "culture",
  },
  {
    id: "quick-drill",
    title: "Quick 5-minute drill",
    description: "Ten mixed questions — streak-friendly.",
    difficulty: "Easy",
    questionCount: 10,
    avgScore: "85%",
    icon: "timer",
    mode: "quick",
    category: "quick",
  },
];

export type RecentResult = {
  id: string;
  scorePct: number;
  title: string;
  detail: string;
  badge: string;
  badgeTone: "primary" | "amber";
  href: string;
};

export const MOCK_RESULTS: RecentResult[] = [
  {
    id: "result-zones",
    scorePct: 94,
    title: "Geopolitical Zones",
    detail: "Scored 17/18 \u00b7 Yesterday",
    badge: "Top 5% nationwide",
    badgeTone: "primary",
    href: "/learn/play?mode=zones",
  },
  {
    id: "result-civic",
    scorePct: 88,
    title: "Civic Basics",
    detail: "Scored 22/25 \u00b7 3 days ago",
    badge: "Passed Certificate",
    badgeTone: "primary",
    href: "/learn/play?mode=civic",
  },
  {
    id: "result-capitals",
    scorePct: 100,
    title: "Capitals & Metros",
    detail: "Scored 36/36 \u00b7 5 days ago",
    badge: "Perfect Mastery \u2b50",
    badgeTone: "amber",
    href: "/learn/play?mode=capitals",
  },
];

export const MOCK_DAILY = {
  questionIndex: 14,
  totalQuestions: 30,
  progressPct: 47,
  prompt: "Which state is highlighted?",
  hint:
    'Known as the "Home of Peace and Tourism", this plateau borders Bauchi, Kaduna, Taraba, and Nassarawa.',
  refreshesIn: "08h 42m",
  stateCode: "NG-PL",
  cycleLabel: "FEB 2025",
  boundaryFocus: "Boundary Focus: North Central Zone",
  scholarLevel: "Level 4 Atlas Scholar",
};
