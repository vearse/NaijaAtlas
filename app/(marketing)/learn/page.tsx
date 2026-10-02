import type { Metadata } from "next";
import LearnHubClient from "@/components/learn/LearnHubClient";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Learn · Quizzes · ${siteConfig.name}`,
  description:
    "Test yourself on Nigerian geography, zones, and civic basics — quiz catalog and game shell (mock data until the question bank ships).",
  alternates: { canonical: "/learn" },
};

export default function LearnHubPage() {
  return <LearnHubClient />;
}
