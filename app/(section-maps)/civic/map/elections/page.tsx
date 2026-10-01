import type { Metadata } from "next";
import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Election map · ${siteConfig.name}`,
  description:
    "2027 election map — Senate districts, House constituencies, and polling units across Nigeria.",
};

export default function ElectionMapPage() {
  const data = loadExplorerPageData();
  return <ExplorerShell sectionWorkspace="elections" {...data} />;
}
