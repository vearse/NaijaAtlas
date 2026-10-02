import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";

/** The section hub pages, in nav order. */
const HUBS: { path: string; priority: number }[] = [
  { path: "/places", priority: 0.85 },
  // { path: "/land", priority: 0.8 },
  { path: "/people", priority: 0.8 },
  { path: "/travel", priority: 0.8 },
  { path: "/civic", priority: 0.85 },
  { path: "/economy", priority: 0.85 },
  { path: "/data", priority: 0.85 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const { url } = siteConfig;
  const lastModified = new Date();
  return [
    {
      url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${url}/explore`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...HUBS.map((hub) => ({
      url: `${url}${hub.path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: hub.priority,
    })),
    {
      url: `${url}/data/map/rankings`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${url}/economy`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${url}/learn`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${url}/civic/map/elections`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
