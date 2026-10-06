import type { Metadata } from "next";
import EconomyHubClient from "@/components/economy/EconomyHubClient";
import { loadEconomyHubData } from "@/lib/server/loadEconomyHubData";
import { loadPowerData } from "@/lib/server/loadPowerData";

export function generateMetadata(): Metadata {
  const data = loadEconomyHubData();
  const mineralTotal = data.resources.length;
  return {
    title: "Economy · Resources & Trade",
    description: `Nigeria's commercial geography: ${mineralTotal} mineral catalogue entries (${data.mineralTypesShown} types in Browse by sector), operating and proposed port complexes, agro-ecological belts, and NERC grid-connected power plants.`,
    alternates: { canonical: "/economy" },
  };
}

export default function EconomyHubPage() {
  const data = loadEconomyHubData();
  const power = loadPowerData();
  return <EconomyHubClient {...data} power={power} />;
}
