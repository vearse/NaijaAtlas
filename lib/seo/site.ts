/** Shared SEO and site identity (used by layout, sitemap, robots, manifest, JSON-LD). */

export const siteConfig = {
  name: "NaijaAtlas",
  tagline: "Interactive Map of Nigeria's States & LGAs",
  /** Primary meta description for search snippets and social cards. */
  description:
    "Explore Nigeria on an interactive atlas: 36 states, 774 local government areas (LGAs), and 6 geopolitical regions. Compare states, browse tourist and investment map layers, search places, and share direct links.",
  /** Longer copy for Open Graph when a shorter default is not enough. */
  ogDescription:
    "Map Nigeria's states, LGAs, and regions with Learn, Tourist, and Invest lenses. Compare metrics, open cities and landmarks on the map, and share bookmarkable URLs.",
  locale: "en_NG" as const,
  language: "en-NG",
  /** Production default; override with NEXT_PUBLIC_SITE_URL in deploy env. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://naija-atlas-zeta.vercel.app",
  twitterHandle: undefined as string | undefined,
  keywords: [
    "NaijaAtlas",
    "Nigeria map",
    "Nigeria atlas",
    "Nigeria states map",
    "Nigeria LGA map",
    "local government areas Nigeria",
    "geopolitical regions Nigeria",
    "interactive map Nigeria",
    "Nigeria tourism map",
    "invest in Nigeria map",
    "compare Nigerian states",
    "Nigerian cities map",
    "West Africa geography",
  ],
  themeColor: "#008751",
  backgroundColor: "#eef2f6",
} as const;

export const defaultTitle = `${siteConfig.name} — ${siteConfig.tagline}`;
