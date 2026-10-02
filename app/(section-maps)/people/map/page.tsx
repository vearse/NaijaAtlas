import type { Metadata } from "next";
import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Homelands map · ${siteConfig.name}`,
  description: "Where Nigeria's peoples and languages live, state by state.",
};

export default function SectionMapPage() {
  const data = loadExplorerPageData();
  return <ExplorerShell sectionWorkspace="people" {...data} />;
}
