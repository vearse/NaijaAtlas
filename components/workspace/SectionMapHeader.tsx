"use client";

import Link from "next/link";
import Image from "next/image";
import { HUB_NAV } from "@/lib/navigation/hubNav";

type Props = {
  accent: "data" | "civic";
  badge: string;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  statusChip?: string;
};

export default function SectionMapHeader({
  accent,
  badge,
  title,
  subtitle,
  backHref,
  backLabel,
  statusChip,
}: Props) {
  const accentColor = accent === "data" ? "text-cyan-700" : "text-[#008751]";

  return (
    <header className="shrink-0 z-20 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.jpeg"
                alt=""
                width={36}
                height={36}
                className="w-9 h-9 rounded-lg object-cover border border-slate-200"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  NaijaAtlas
                </span>
                <span
                  className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    accent === "data"
                      ? "bg-cyan-50 text-cyan-800"
                      : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {badge}
                </span>
              </div>
            </Link>
            <div className="hidden md:block h-8 w-px bg-slate-200" />
            <div className="hidden md:block min-w-0">
              <p className={`text-label-caps tracking-wide ${accentColor}`}>
                {title}
              </p>
              <p className="text-body-sm text-slate-500 truncate">{subtitle}</p>
            </div>
          </div>

          <nav
            className="hidden xl:flex items-center gap-5 text-label-md text-slate-600"
            aria-label="Sections"
          >
            {HUB_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="hover:text-[#008751] whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-semibold"
              aria-label="Basemap (Minimal active)"
            >
              <span className="px-2.5 py-1 rounded-md bg-white text-slate-900 shadow-sm">
                Minimal
              </span>
              <span className="px-2.5 py-1 rounded-md text-slate-500">Street</span>
            </div>
            <Link
              href="/explore"
              className="hidden sm:inline-flex h-9 items-center px-4 rounded-lg bg-[#008751] text-white text-label-md font-semibold shadow-sm"
            >
              Open map
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-label-md text-slate-600 hover:text-[#008751]"
          >
            <span aria-hidden>←</span>
            {backLabel}
          </Link>
          {statusChip && (
            <span className="text-body-sm text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1">
              {statusChip}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
