"use client";

import Link from "next/link";
import NaijaAtlasMark from "@/components/brand/NaijaAtlasMark";
import { HUB_NAV } from "@/lib/navigation/hubNav";
import type { SectionPreset } from "@/lib/map/sectionPresets";

export default function SectionMapHeader({ preset }: { preset: SectionPreset }) {
  return (
    <header className="shrink-0 z-20 bg-white border-b border-slate-200">
      <div className="max-w-[1680px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <NaijaAtlasMark size="sm" wordmarkClassName="font-bold text-slate-900 tracking-tight" />
          <span className="hidden sm:inline text-body-sm text-slate-500 truncate border-l border-slate-200 pl-2.5">
            {preset.subtitle}
          </span>
        </div>
        <nav className="hidden xl:flex items-center gap-5 text-label-md text-slate-600" aria-label="Sections">
          {HUB_NAV.map((item) => {
            const active =
              preset.backHref === item.href ||
              (preset.id === "places" && item.id === "land");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`whitespace-nowrap py-1 border-b-2 ${
                  active
                    ? "border-[#008751] text-[#006b3f] font-bold"
                    : "border-transparent hover:text-[#008751]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/explore"
          className="inline-flex h-9 items-center px-4 rounded-lg bg-[#043828] text-white text-label-md font-semibold whitespace-nowrap"
        >
          Full atlas
        </Link>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-[1680px] mx-auto px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={preset.backHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-label-md text-slate-700 hover:border-[#008751] hover:text-[#008751]"
            >
              <span aria-hidden>←</span>
              {preset.backLabel}
            </Link>
            <span className="hidden md:inline font-mono text-[12px] text-slate-500">
              {preset.path}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-body-sm text-emerald-900">
            <span className="h-2 w-2 rounded-full bg-[#008751]" aria-hidden />
            {preset.status}
          </span>
        </div>
      </div>
    </header>
  );
}
