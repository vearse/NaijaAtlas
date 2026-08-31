import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://explore-nigeria.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Explore Nigeria — Interactive Map of States & LGAs",
    template: "%s · Explore Nigeria",
  },
  description:
    "Explore Nigeria's 36 states, 774 local government areas, and 6 geopolitical regions on an interactive map. Search locations, compare states, and share direct links.",
  keywords: [
    "Nigeria map",
    "Nigeria states",
    "LGA map",
    "local government areas",
    "geopolitical regions",
    "interactive map",
    "Explore Nigeria",
  ],
  authors: [{ name: "Explore Nigeria" }],
  creator: "Explore Nigeria",
  openGraph: {
    title: "Explore Nigeria — Interactive Map",
    description:
      "Navigate Nigeria's states, LGAs, and regions with an interactive map. Shareable links and mobile-friendly exploration.",
    type: "website",
    locale: "en_NG",
    siteName: "Explore Nigeria",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Nigeria — Interactive Map",
    description:
      "Explore Nigeria's states, LGAs, and regions on an interactive map.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
