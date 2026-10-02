import type { Metadata } from "next";
import PlacesHubClient from "@/components/places/PlacesHubClient";
import { loadPlacesDirectoryData } from "@/lib/server/loadPlacesPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Places · ${siteConfig.name}`,
  description:
    "Directory of Nigeria's states and LGAs — capitals, zones, polling units, and state profiles.",
};

export default function PlacesPage() {
  const data = loadPlacesDirectoryData();
  return <PlacesHubClient {...data} />;
}