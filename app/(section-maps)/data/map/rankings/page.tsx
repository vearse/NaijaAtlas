import type { Metadata } from "next";
import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Rankings map · ${siteConfig.name}`,
  description:
    "Choropleth rankings map for Nigeria's states — compare IGR, population, and social indicators.",
};

export default function RankingsMapPage() {
  const data = loadExplorerPageData();
  return <ExplorerShell sectionWorkspace="rankings" {...data} />;
}
