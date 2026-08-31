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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://naijaatlas.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NaijaAtlas — Interactive Map of Nigeria's States & LGAs",
    template: "%s · NaijaAtlas",
  },
  description:
    "NaijaAtlas maps Nigeria's 36 states, 774 local government areas, and 6 geopolitical regions. Search locations, compare states, and share direct links.",
  keywords: [
    "NaijaAtlas",
    "Nigeria map",
    "Nigeria states",
    "LGA map",
    "local government areas",
    "geopolitical regions",
    "interactive map",
  ],
  authors: [{ name: "NaijaAtlas" }],
  creator: "NaijaAtlas",
  openGraph: {
    title: "NaijaAtlas — Interactive Map of Nigeria",
    description:
      "Navigate Nigeria's states, LGAs, and regions with NaijaAtlas. Shareable links and mobile-friendly exploration.",
    type: "website",
    locale: "en_NG",
    siteName: "NaijaAtlas",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "NaijaAtlas — Interactive Map of Nigeria",
    description:
      "Map Nigeria's states, LGAs, and regions with NaijaAtlas.",
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
