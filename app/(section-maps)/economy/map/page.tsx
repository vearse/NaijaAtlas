import type { Metadata } from "next";
import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Economy map · ${siteConfig.name}`,
  description: "Minerals, farming ecosystems, ports and power across Nigeria.",
};

export default function SectionMapPage() {
  const data = loadExplorerPageData();
  return <ExplorerShell sectionWorkspace="economy" {...data} />;
}
