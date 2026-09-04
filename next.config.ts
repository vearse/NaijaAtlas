import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  /** Avoids SegmentViewNode client-manifest errors in dev after production builds. */
  experimental: {
    devtoolSegmentExplorer: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "dailypost.ng" },
      { protocol: "https", hostname: "nigerianobservernews.com" },
    ],
  },
  async headers() {
    const geoCache =
      process.env.NODE_ENV === "production"
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate";

    return [
      {
        source: "/geo/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: geoCache,
          },
        ],
      },
      {
        source: "/search-index.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
