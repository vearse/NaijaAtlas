import type { Metadata } from "next";
import PeopleHubClient from "@/components/people/PeopleHubClient";
import { loadPeopleHubData } from "@/lib/server/loadPeopleHubData";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `People · Cultures & Languages · ${siteConfig.name}`,
  description:
    "89 documented Nigerian cultural groups across 436 LGA areas, four culture spotlights, and the languages recorded in each state — with confidence ratings where homelands are contested.",
  alternates: { canonical: "/people" },
};

export default function PeopleHubPage() {
  const data = loadPeopleHubData();
  return <PeopleHubClient {...data} />;
}
