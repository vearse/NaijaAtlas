import type { Metadata } from "next";
import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Security formations map · ${siteConfig.name}`,
  description: "Nigerian Army divisions, Navy commands and Air Force formations.",
};

export default function SectionMapPage() {
  const data = loadExplorerPageData();
  return <ExplorerShell sectionWorkspace="security" {...data} />;
}
