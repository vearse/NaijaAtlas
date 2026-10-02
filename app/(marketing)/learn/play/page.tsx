import type { Metadata } from "next";
import { Suspense } from "react";
import QuizGameShellClient from "@/components/learn/QuizGameShellClient";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Quiz · Learn · ${siteConfig.name}`,
  description: "Interactive quiz shell preview for NaijaAtlas Learn.",
  robots: { index: false, follow: true },
};

export default function LearnPlayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-secondary">Loading quiz…</div>}>
      <QuizGameShellClient />
    </Suspense>
  );
}
