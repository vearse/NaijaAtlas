import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const { name, tagline, description, themeColor } = siteConfig;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 48,
              height: 32,
              borderRadius: 4,
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            <div style={{ flex: 1, background: themeColor }} />
            <div style={{ flex: 1, background: "#ffffff" }} />
            <div style={{ flex: 1, background: themeColor }} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.9 }}>
            {name}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>
            {tagline}
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              opacity: 0.85,
              maxWidth: 920,
            }}
          >
            {description.slice(0, 160)}
            {description.length > 160 ? "…" : ""}
          </div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.6 }}>States · LGAs · Regions · Compare</div>
      </div>
    ),
    { ...size }
  );
}
