import type { ReactNode } from "react";

export default function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-landing text-body-md antialiased relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <div
        className="fixed inset-0 pointer-events-none landing-topo-grid z-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0, 135, 81, 0.07) 1px, transparent 0)",
        }}
        aria-hidden
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none z-0"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
