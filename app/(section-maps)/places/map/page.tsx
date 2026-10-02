import type { Metadata } from "next";
import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Places & Land map · ${siteConfig.name}`,
  description: "Nigeria's states, LGAs, relief, rivers and six zones on one map.",
};

export default function SectionMapPage() {
  const data = loadExplorerPageData();
  return <ExplorerShell sectionWorkspace="places" {...data} />;
}
