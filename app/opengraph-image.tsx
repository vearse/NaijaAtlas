import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const { name, tagline, description, themeColor } = siteConfig;
  const blurb =
    description.length > 160 ? `${description.slice(0, 160)}…` : description;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "#0f172a",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 24,
            color: themeColor,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 20,
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            lineHeight: 1.4,
            opacity: 0.85,
            maxWidth: 920,
          }}
        >
          {blurb}
        </div>
      </div>
    ),
    { ...size }
  );
}
