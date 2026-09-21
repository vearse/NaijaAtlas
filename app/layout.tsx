import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";
import JsonLd from "@/components/seo/JsonLd";
import { buildRootJsonLd } from "@/lib/seo/jsonLd";
import { defaultTitle, siteConfig } from "@/lib/seo/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const { url, name, description, ogDescription, keywords, locale } = siteConfig;

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: defaultTitle,
    template: `%s · ${name}`,
  },
  description,
  keywords: [...keywords],
  applicationName: name,
  authors: [{ name, url }],
  creator: name,
  publisher: name,
  category: "education",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    title: defaultTitle,
    description: ogDescription,
    type: "website",
    locale,
    siteName: name,
    url,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: defaultTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: ogDescription,
    images: ["/opengraph-image"],
    ...(siteConfig.twitterHandle
      ? { site: siteConfig.twitterHandle, creator: siteConfig.twitterHandle }
      : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  other: {
    "geo.region": "NG",
    "geo.placename": "Nigeria",
  },
  appleWebApp: {
    capable: true,
    title: name,
    statusBarStyle: "default",
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
        <JsonLd data={buildRootJsonLd()} />
        <PostHogProvider apiKey={process.env.POSTHOG_API_KEY}>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
