import type { Metadata } from "next";
import { Suspense } from "react";
import QuizGameShellClient from "@/components/learn/QuizGameShellClient";
import { loadLearnFactBase } from "@/lib/server/loadLearnFactBase";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Quiz · Learn · ${siteConfig.name}`,
  description:
    "Play Nigeria geography quizzes generated from the atlas — find states and LGAs on the map, capitals, zones, blitz and daily challenges.",
  robots: { index: false, follow: true },
};

export default function LearnPlayPage() {
  const fb = loadLearnFactBase();
  return (
    <Suspense fallback={<div className="p-8 text-text-secondary">Loading quiz…</div>}>
      <QuizGameShellClient fb={fb} />
    </Suspense>
  );
}
