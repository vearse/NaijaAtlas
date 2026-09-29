import type { ReactNode } from "react";

export default function HubShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-landing text-body-md antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {children}
    </div>
  );
}
