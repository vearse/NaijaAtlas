"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { HUB_NAV } from "@/lib/navigation/hubNav";
import { IconClose, IconMenu, IconSearch, IconVote } from "@/components/landing/icons";

type Props = {
  onSearchOpen: () => void;
};

export default function LandingHeader({ onSearchOpen }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-center w-full px-4 md:px-6 py-3.5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.jpeg"
              alt="NaijaAtlas"
              width={36}
              height={36}
              className="w-9 h-9 rounded-lg object-cover shadow-sm border border-primary/20 group-hover:scale-105 transition-transform duration-150"
              priority
            />
            <span className="font-landing-display text-headline-sm font-extrabold text-[#006b3f] tracking-tight">
              NaijaAtlas
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Sections">
            {HUB_NAV.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className="text-label-md text-slate-600 hover:text-slate-900 transition-colors py-5 border-b-2 border-transparent"
              >
                {s.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3.5">
            <button
              type="button"
              aria-label="Search"
              onClick={onSearchOpen}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors active:scale-95"
            >
              <IconSearch />
            </button>
            <Link
              href="/explore?map=election"
              className="hidden sm:inline-flex items-center gap-2 bg-primary-container hover:bg-inverse-primary text-on-primary-container font-label-md px-4 py-2 rounded-full border border-primary/30 shadow-sm active:scale-95 transition-all"
            >
              <IconVote className="w-[18px] h-[18px]" />
              Find my polling unit
            </Link>
            <button
              type="button"
              aria-label="Menu"
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary"
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <motion.nav
              className="absolute top-0 right-0 h-full w-[min(100%,320px)] bg-surface-container-high border-l border-outline-variant/40 p-6 flex flex-col gap-4"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              aria-label="Mobile navigation"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant"
                >
                  <IconClose />
                </button>
              </div>
              {HUB_NAV.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="text-headline-sm text-slate-900 py-2 border-b border-slate-200"
                  onClick={() => setMenuOpen(false)}
                >
                  {s.label}
                </Link>
              ))}
              <Link
                href="/places"
                className="text-headline-sm text-[#008751] font-semibold py-2"
                onClick={() => setMenuOpen(false)}
              >
                Places directory
              </Link>
              <Link
                href="/explore"
                className="mt-4 text-center bg-primary-container text-on-primary-container py-3 rounded-xl font-label-md"
                onClick={() => setMenuOpen(false)}
              >
                Open the map
              </Link>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
