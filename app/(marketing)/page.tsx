import type { Metadata } from "next";
import LandingPageClient from "@/components/landing/LandingPageClient";
import { loadLandingPageData } from "@/lib/server/loadLandingPageData";
import { loadLandingDailyTeaser } from "@/lib/server/loadLandingDailyTeaser";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: siteConfig.name,
  description:
    "Explore, discover, and reimagine Nigeria with data and maps. States, LGAs, polling units, elections, rankings, and cultural homelands on one atlas.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteConfig.name} — Explore Nigeria with data & maps`,
    description:
      "High-resolution civic and geographic intelligence: 36 states, 774 LGAs, election districts, and living map layers.",
    url: siteConfig.url,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  const data = loadLandingPageData();
  const dailyTeaser = loadLandingDailyTeaser();
  return <LandingPageClient {...data} dailyTeaser={dailyTeaser} />;
}
