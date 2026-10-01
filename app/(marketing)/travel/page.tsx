import type { Metadata } from "next";
import TravelHubClient from "@/components/travel/TravelHubClient";
import { loadTravelHubData } from "@/lib/server/loadTravelHubData";
import { loadFestivalsCalendar } from "@/lib/server/loadFestivalsCalendar";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Travel · Destinations & Cities · ${siteConfig.name}`,
  description:
    "Nigeria's documented destinations and cities — national parks, waterfalls, heritage sites, resorts and 100 mapped cities, with the states and landmarks behind each one.",
  alternates: { canonical: "/travel" },
};

export default function TravelHubPage() {
  const data = loadTravelHubData();
  const festivals = loadFestivalsCalendar();
  return <TravelHubClient data={data} festivals={festivals} />;
}
