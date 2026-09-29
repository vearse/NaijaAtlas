import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ng: {
          green: "#008751",
          gold: "#f59e0b",
        },
        background: "#101412",
        surface: "#101412",
        "surface-dim": "#101412",
        "surface-bright": "#363a38",
        "surface-container-lowest": "#0b0f0d",
        "surface-container-low": "#181c1a",
        "surface-container": "#1c201e",
        "surface-container-high": "#272b28",
        "surface-container-highest": "#323633",
        "on-surface": "#e0e3df",
        "on-surface-variant": "#bdcabe",
        "on-background": "#e0e3df",
        outline: "#879489",
        "outline-variant": "#3e4a41",
        primary: "#70db9d",
        "on-primary": "#00391f",
        "primary-container": "#008751",
        "on-primary-container": "#fdfff9",
        "primary-fixed": "#8df8b7",
        "inverse-primary": "#006d40",
        secondary: "#95d3ba",
        "secondary-container": "#0b513d",
        "on-secondary-container": "#83c2a9",
        "secondary-fixed-dim": "#95d3ba",
        tertiary: "#4fdbc8",
        "tertiary-container": "#008477",
        error: "#ffb4ab",
        "error-container": "#93000a",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        landing: ["var(--font-landing-body)", "system-ui", "sans-serif"],
        "landing-display": [
          "var(--font-landing-display)",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-hero": [
          "56px",
          {
            lineHeight: "64px",
            letterSpacing: "-0.03em",
            fontWeight: "800",
          },
        ],
        "display-hero-mobile": [
          "36px",
          {
            lineHeight: "44px",
            letterSpacing: "-0.02em",
            fontWeight: "800",
          },
        ],
        "headline-xl": [
          "40px",
          {
            lineHeight: "48px",
            letterSpacing: "-0.025em",
            fontWeight: "700",
          },
        ],
        "headline-xl-mobile": [
          "28px",
          {
            lineHeight: "36px",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
        "headline-lg": [
          "32px",
          {
            lineHeight: "40px",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
        "headline-md": [
          "24px",
          {
            lineHeight: "32px",
            letterSpacing: "-0.015em",
            fontWeight: "600",
          },
        ],
        "headline-sm": [
          "20px",
          {
            lineHeight: "28px",
            letterSpacing: "-0.01em",
            fontWeight: "600",
          },
        ],
        "body-lg": [
          "18px",
          {
            lineHeight: "28px",
            letterSpacing: "-0.005em",
          },
        ],
        "body-md": [
          "15px",
          {
            lineHeight: "24px",
            letterSpacing: "-0.005em",
          },
        ],
        "body-sm": [
          "13px",
          {
            lineHeight: "20px",
          },
        ],
        "label-caps": [
          "11px",
          {
            lineHeight: "16px",
            letterSpacing: "0.08em",
            fontWeight: "700",
          },
        ],
        "label-md": [
          "13px",
          {
            lineHeight: "18px",
            letterSpacing: "0.01em",
            fontWeight: "600",
          },
        ],
        "metric-mono": [
          "28px",
          {
            lineHeight: "32px",
            letterSpacing: "-0.02em",
            fontWeight: "600",
          },
        ],
      },
    },
  },
  plugins: [],
};

export default config;
