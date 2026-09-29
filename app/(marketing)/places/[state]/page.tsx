import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StateProfileClient from "@/components/places/StateProfileClient";
import {
  allStateSlugs,
  loadStateProfileData,
} from "@/lib/server/loadPlacesPageData";
import { siteConfig } from "@/lib/seo/site";

type PageProps = { params: Promise<{ state: string }> };

export async function generateStaticParams() {
  return allStateSlugs().map((state) => ({ state }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const profile = loadStateProfileData(slug);
  if (!profile) return { title: `Places · ${siteConfig.name}` };
  return {
    title: `${profile.state.name} · Places · ${siteConfig.name}`,
    description: profile.content.description.slice(0, 160),
  };
}

export default async function StatePlacesPage({ params }: PageProps) {
  const { state: slug } = await params;
  const profile = loadStateProfileData(slug);
  if (!profile) notFound();
  return <StateProfileClient {...profile} />;
}
