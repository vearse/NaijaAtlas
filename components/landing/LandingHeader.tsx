"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { HUB_NAV } from "@/lib/navigation/hubNav";
import NaijaAtlasMark from "@/components/brand/NaijaAtlasMark";
import {
  IconClose,
  IconMenu,
  IconSearch,
  IconVote,
} from "@/components/landing/icons";

type Props = {
  onSearchOpen: () => void;
};

export default function LandingHeader({ onSearchOpen }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface-card/85 backdrop-blur-md border-b border-border-subtle/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center w-full px-4 md:px-6 py-3.5 max-w-7xl mx-auto">
          <NaijaAtlasMark />

          <nav className="hidden md:flex items-center gap-8" aria-label="Sections">
            {HUB_NAV.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className="text-label-md text-text-secondary hover:text-primary transition-colors duration-150"
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
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:bg-slate-100 border border-transparent hover:border-border-subtle transition-colors duration-150 active:scale-95"
            >
              <IconSearch className="w-[20px] h-[20px]" />
            </button>
            <Link
              href="/civic/map/elections"
              className="hidden sm:inline-flex items-center gap-2 bg-primary-container hover:bg-primary text-white font-label-md px-4 py-2 rounded-full border border-emerald-600/30 shadow-sm shadow-emerald-700/20 active:scale-95 transition-colors duration-150"
            >
              <IconVote className="w-[18px] h-[18px]" />
              Find my polling unit
            </Link>
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
              className="absolute top-0 right-0 h-full w-[min(100%,320px)] bg-surface-card border-l border-border-subtle p-6 flex flex-col gap-4"
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
                  className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-slate-100"
                >
                  <IconClose />
                </button>
              </div>
              {HUB_NAV.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="text-headline-sm text-text-primary py-2 border-b border-border-subtle"
                  onClick={() => setMenuOpen(false)}
                >
                  {s.label}
                </Link>
              ))}
              <Link
                href="/explore"
                className="mt-4 text-center bg-primary-container text-white py-3 rounded-lg text-label-md"
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
