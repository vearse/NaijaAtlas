import type { Metadata } from "next";
import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Destinations map · ${siteConfig.name}`,
  description: "Tourist cities, highlands and lakes across Nigeria.",
};

export default function SectionMapPage() {
  const data = loadExplorerPageData();
  return <ExplorerShell sectionWorkspace="travel" {...data} />;
}
