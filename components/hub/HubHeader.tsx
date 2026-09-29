"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HUB_NAV, type HubNavId } from "@/lib/navigation/hubNav";
import { IconClose, IconMenu, IconSearch } from "@/components/landing/icons";

type Props = {
  active: HubNavId;
  onSearchOpen?: () => void;
  primaryCta?: { label: string; href: string };
};

export default function HubHeader({
  active,
  onSearchOpen,
  primaryCta,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo.jpeg"
              alt="NaijaAtlas"
              width={36}
              height={36}
              className="w-9 h-9 rounded-lg object-cover border border-emerald-200"
              priority
            />
            <span className="font-landing-display text-headline-sm font-bold text-[#006b3f] tracking-tight">
              NaijaAtlas
            </span>
          </Link>

          <nav
            className="hidden lg:flex items-center gap-6 h-16"
            aria-label="Sections"
          >
            {HUB_NAV.map((item) => {
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`text-label-md py-5 border-b-2 transition-colors ${
                    isActive
                      ? "border-[#008751] text-[#008751] font-semibold"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {onSearchOpen && (
              <button
                type="button"
                aria-label="Search"
                onClick={onSearchOpen}
                className="p-2 text-slate-500 hover:text-[#008751] rounded-lg hover:bg-slate-100"
              >
                <IconSearch />
              </button>
            )}
            <Link
              href="/explore"
              className="hidden sm:inline-flex px-3.5 py-1.5 text-slate-600 text-label-md border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Explore
            </Link>
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#008751] text-white text-label-md rounded-xl shadow-sm hover:bg-[#007345]"
              >
                {primaryCta.label}
              </Link>
            )}
            <button
              type="button"
              aria-label="Menu"
              className="lg:hidden p-2 text-slate-600"
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav
            className="absolute top-0 right-0 h-full w-[min(100%,300px)] bg-white border-l border-slate-200 p-6 flex flex-col gap-1"
            aria-label="Mobile sections"
          >
            <div className="flex justify-end mb-4">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
              >
                <IconClose />
              </button>
            </div>
            {HUB_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="py-3 text-headline-sm border-b border-slate-100"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
