import type { Metadata } from "next";
import LearnHubClient from "@/components/learn/LearnHubClient";
import { loadLearnFactBase } from "@/lib/server/loadLearnFactBase";
import { buildQuizIndex, countQuestions } from "@/lib/learn/questions";
import { QUIZ_MODES, filterForConfig } from "@/lib/learn/quizModes";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Learn · Quizzes · ${siteConfig.name}`,
  description:
    "Test yourself on Nigerian geography, zones, states and LGAs — map hunts, capitals, blitz and a daily challenge generated from the atlas.",
  alternates: { canonical: "/learn" },
};

export default function LearnHubPage() {
  const fb = loadLearnFactBase();
  const ix = buildQuizIndex(fb);
  const modeCounts = Object.fromEntries(
    QUIZ_MODES.map((m) => [
      m.id,
      countQuestions(
        ix,
        filterForConfig(m, { modeId: m.id, length: 10, difficulty: "standard", topics: ["nigeria", "state", "lga"], stateId: null })
      ),
    ])
  );
  // Map-LGA style modes are per state; advertise the full catalogue across states.
  modeCounts["map-lgas"] = countQuestions(ix, { generatorIds: ["map-find-lga"] });
  modeCounts["lga-master"] = countQuestions(ix, { topics: ["lga"] });

  return (
    <LearnHubClient
      totalQuestions={countQuestions(ix)}
      modeCounts={modeCounts}
      states={fb.states.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        regionName: s.zoneName,
        capital: s.capital,
        population: s.population,
        lgaCount: s.lgaCount,
      }))}
      lgaTotal={fb.country.lgaTotal}
    />
  );
}
