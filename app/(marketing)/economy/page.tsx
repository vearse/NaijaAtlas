import type { Metadata } from "next";
import EconomyHubClient from "@/components/economy/EconomyHubClient";
import { loadEconomyHubData } from "@/lib/server/loadEconomyHubData";
import { loadPowerData } from "@/lib/server/loadPowerData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Economy · Resources & Trade · ${siteConfig.name}`,
  description:
    "Nigeria's commercial geography: 35 mineral entries with reserves and downstream products, operating and proposed port complexes, agro-ecological belts, and the states that host them.",
  alternates: { canonical: "/economy" },
};

export default function EconomyHubPage() {
  const data = loadEconomyHubData();
  const power = loadPowerData();
  return <EconomyHubClient {...data} power={power} />;
}
