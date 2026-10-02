"use client";

import { useState } from "react";
import Link from "next/link";
import { HUB_NAV, type HubNavId } from "@/lib/navigation/hubNav";
import {
  IconClose,
  IconExplore,
  IconMenu,
  IconSearch,
  IconVote,
} from "@/components/landing/icons";

type Props = {
  /** Omitted by pages that are not a top-level hub section (e.g. `/places`). */
  active?: HubNavId;
  onSearchOpen?: () => void;
  primaryCta?: { label: string; href: string; icon?: "vote" | "explore" };
  /** Small muted line under the wordmark, e.g. "36 states · 774 LGAs · 6 regions". */
  tagline?: string;
};

const SECTION_MAP_HREF: Record<HubNavId, string> = {
  land: "/places/map",
  people: "/people/map",
  travel: "/travel/map",
  civic: "/civic/map/elections",
  economy: "/economy/map",
  data: "/data/map/rankings",
  learn: "/explore",
};

export default function HubHeader({
  active,
  onSearchOpen,
  primaryCta,
  tagline,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface-card border-b border-border-subtle shadow-sm">
        <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <span className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <IconExplore className="w-5 h-5" />
            </span>
            <span className="flex flex-col">
              <span className="font-landing-display text-headline-md font-bold text-primary tracking-tight leading-none">
                NaijaAtlas
              </span>
              {tagline && (
                <span className="hidden lg:inline text-[10px] text-text-muted font-medium tracking-tight -mt-0.5">
                  {tagline}
                </span>
              )}
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-8 h-full"
            aria-label="Sections"
          >
            {HUB_NAV.map((item) => {
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`text-label-md transition-colors py-4 ${
                    isActive
                      ? "border-b-2 border-primary text-primary font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {onSearchOpen && (
              <button
                type="button"
                aria-label="Search"
                onClick={onSearchOpen}
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:bg-slate-100 border border-transparent hover:border-border-subtle transition-colors duration-150 active:scale-95"
              >
                <IconSearch className="w-[20px] h-[20px]" />
              </button>
            )}
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="hidden sm:inline-flex items-center gap-2 bg-primary-container hover:bg-[#006d40] text-white text-label-md px-3.5 py-2 rounded-lg shadow-sm active:scale-95 transition-colors"
              >
                {primaryCta.icon === "vote" ? (
                  <IconVote className="w-4 h-4" />
                ) : primaryCta.icon === "explore" ? (
                  <IconExplore className="w-4 h-4" />
                ) : null}
                {primaryCta.label}
              </Link>
            )}
            <button
              type="button"
              aria-label="Menu"
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:bg-slate-100"
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav
            className="absolute top-0 right-0 h-full w-[min(100%,300px)] bg-surface-card border-l border-border-subtle p-6 flex flex-col gap-1 overflow-y-auto"
            aria-label="Mobile sections"
          >
            <div className="flex justify-end mb-4">
              <button
                type="button"
                aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-slate-100"
                onClick={() => setMenuOpen(false)}
              >
                <IconClose />
              </button>
            </div>
            {HUB_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`py-3 text-headline-sm border-b border-slate-100 ${
                  item.id === active
                    ? "text-primary font-semibold"
                    : "text-text-primary"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={active ? SECTION_MAP_HREF[active] : "/explore"}
              className="mt-4 text-center bg-primary-container text-white py-3 rounded-lg text-label-md"
              onClick={() => setMenuOpen(false)}
            >
              Open the map
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
