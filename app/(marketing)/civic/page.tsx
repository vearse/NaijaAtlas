import type { Metadata } from "next";
import CivicHubClient from "@/components/civic/CivicHubClient";
import { loadCivicHubData } from "@/lib/server/loadCivicHubData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Civic Intelligence · Elections · ${siteConfig.name}`,
  description:
    "Find your polling unit, the INEC 2027 candidate roster for every senate and House race, your representatives, and focused election and security maps.",
  alternates: { canonical: "/civic" },
};

export default function CivicHubPage() {
  const data = loadCivicHubData();
  return <CivicHubClient {...data} />;
}
