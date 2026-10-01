import type { ReactNode } from "react";

export default function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary font-landing font-body-md antialiased relative overflow-x-hidden selection:bg-primary-container selection:text-white">
      <div
        className="fixed inset-0 pointer-events-none landing-topo-grid z-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0, 107, 63, 0.08) 1.25px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[480px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none z-0"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
