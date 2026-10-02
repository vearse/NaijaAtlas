import type { Metadata } from "next";
import DataHubClient from "@/components/data/DataHubClient";
import { loadDataHubData } from "@/lib/server/loadDataHubData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Data Intelligence · State Indicators · ${siteConfig.name}`,
  description:
    "Ranked state indicators for all 36 states and the FCT — internally generated revenue trends, literacy and school enrolment — with choropleths, source notes and the reserved indicators we do not yet have.",
  alternates: { canonical: "/data" },
};

export default function DataHubPage() {
  const data = loadDataHubData();
  return <DataHubClient {...data} />;
}
