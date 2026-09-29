import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Explore the map",
  description:
    "Interactive atlas of Nigeria: 36 states, 774 LGAs, election districts, rankings, and map layers. Compare places and share bookmarkable links.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: `${siteConfig.name} — Explore the map`,
    description:
      "Map Nigeria's states, LGAs, and regions with Learn, Tourist, Invest, Election, and Ranking views.",
    url: `${siteConfig.url}/explore`,
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
