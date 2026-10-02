import type { ReactNode } from "react";
import ToastStack from "@/components/ui/ToastStack";

const CANVAS: Record<string, string> = {
  /** #f8fafc — the default cool-gray hub canvas. */
  cool: "bg-surface-canvas",
  /** #eef2f6 — slightly deeper blue-gray used by the civic hub. */
  civic: "bg-[#eef2f6]",
  /** #fafaf9 — warm off-white used by the travel hub. */
  warm: "bg-surface-base",
  /** #f8fafc alias for the economy hub, which uses a warmer near-white. */
  economy: "bg-slate-50",
  /** Clean white canvas for directory-style hubs. */
  white: "bg-white",
};

export default function HubShell({
  children,
  canvas = "cool",
}: {
  children: ReactNode;
  canvas?: keyof typeof CANVAS;
}) {
  return (
    <div
      className={`min-h-screen ${CANVAS[canvas]} text-text-primary font-landing font-body-md antialiased selection:bg-primary-tint-soft selection:text-primary`}
    >
      {children}
      <ToastStack />
    </div>
  );
}