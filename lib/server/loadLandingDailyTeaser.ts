import { loadLearnFactBase } from "@/lib/server/loadLearnFactBase";
import { buildQuizIndex, buildQuizSession } from "@/lib/learn/questions";
import { filterForConfig, getQuizMode, type QuizConfig } from "@/lib/learn/quizModes";
import { createRng, todayKey } from "@/lib/learn/rng";

/** One multiple-choice question for the landing “Daily challenge” card — same seed as /learn daily. */
export type LandingDailyTeaser = {
  prompt: string;
  options: { id: string; label: string; sub?: string }[];
  answerId: string;
  answerLabel: string;
  explanation: string;
  learnMoreHref?: string;
  questionIndex: number;
  totalQuestions: number;
};

export function loadLandingDailyTeaser(root = process.cwd()): LandingDailyTeaser | null {
  const mode = getQuizMode("daily");
  const fb = loadLearnFactBase(root);
  const ix = buildQuizIndex(fb);
  const config: QuizConfig = {
    modeId: mode.id,
    length: mode.defaultLength,
    difficulty: "standard",
    topics: ["nigeria", "state", "lga"],
    stateId: null,
  };
  const qs = buildQuizSession(
    ix,
    filterForConfig(mode, config),
    mode.defaultLength,
    createRng(`daily-${todayKey()}`),
    "standard"
  );
  const q = qs.find((x) => x.kind === "choice" && x.options.length >= 4) ?? qs[0];
  if (!q || q.kind !== "choice" || q.options.length < 4) return null;

  return {
    prompt: q.prompt,
    options: q.options.map((o) => ({ id: o.id, label: o.label, sub: o.sub })),
    answerId: q.answerId,
    answerLabel: q.answerLabel,
    explanation: q.explanation,
    learnMoreHref: q.learnMoreHref,
    questionIndex: 1,
    totalQuestions: mode.defaultLength,
  };
}
