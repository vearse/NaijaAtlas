import type { Metadata } from "next";
import PlacesHubClient from "@/components/places/PlacesHubClient";
import { loadPlacesDirectoryData } from "@/lib/server/loadPlacesPageData";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Places · ${siteConfig.name}`,
  description:
    "Directory of Nigeria's states and LGAs — capitals, zones, polling units, and state profiles.",
};

export default function PlacesPage() {
  const directory = loadPlacesDirectoryData();
  const explorer = loadExplorerPageData();
  return (
    <PlacesHubClient
      directory={directory}
      compareStates={explorer.states}
      compareContents={explorer.stateContent}
      compareLgas={explorer.lgas}
      compareBundle={explorer.compareBundle}
    />
  );
}