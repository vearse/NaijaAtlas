import type { Viewport } from "next";
import { siteConfig } from "@/lib/seo/site";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};
