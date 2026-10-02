import type { Metadata } from "next";
import LandHubClient from "@/components/land/LandHubClient";
import { loadLandHubData } from "@/lib/server/loadLandHubData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Land · Physical Geography · ${siteConfig.name}`,
  description:
    "Nigeria's physical geography — plateaus, mountain ranges, rivers, lakes, lagoons and the Atlantic coastline, plus the six geopolitical zones and their member states.",
  alternates: { canonical: "/land" },
};

export default function LandHubPage() {
  const data = loadLandHubData();
  return <LandHubClient {...data} />;
}
