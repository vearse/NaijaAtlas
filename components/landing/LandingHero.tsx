"use client";

import { motion, useReducedMotion } from "motion/react";
import LandingSearch from "@/components/landing/LandingSearch";
import HeroMapHud from "@/components/landing/HeroMapHud";

type Props = {
  spotlightOpen: boolean;
  onSpotlightClose: () => void;
};

const QUICK_FILTERS = [
  { label: "Lagos", href: "/places/lagos" },
  { label: "Osun-Osogbo Festival", href: "/travel" },
  { label: "Kainji Lake", href: "/land" },
  { label: "Senate districts", href: "/civic" },
];

export default function LandingHero({
  spotlightOpen,
  onSpotlightClose,
}: Props) {
  const reduceMotion = useReducedMotion();

  const fade = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay },
        };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
      <div className="lg:col-span-6 flex flex-col space-y-6">
        <motion.div
          className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 w-fit backdrop-blur-md"
          {...fade(0)}
        >
          <span className="w-2 h-2 rounded-full bg-primary-container landing-pulse-radar" />
          <span className="text-label-caps text-emerald-800 uppercase font-semibold">
            Nigeria in high resolution
          </span>
        </motion.div>

        <motion.h1
          className="font-landing-display text-display-hero-mobile md:text-display-hero text-text-primary leading-[1.08] tracking-tight"
          {...fade(0.05)}
        >
          Understand Nigeria. Discover every corner. Reimagine it with data.
        </motion.h1>

        <motion.p
          className="text-body-lg text-text-secondary max-w-xl"
          {...fade(0.1)}
        >
          States, LGAs, homelands, rankings, and elections — connected on one
          living map for Nigerians and the world.
        </motion.p>

        <motion.div className="pt-2" {...fade(0.15)}>
          <LandingSearch
            spotlightOpen={spotlightOpen}
            onSpotlightClose={onSpotlightClose}
          />
        </motion.div>

<motion.div
          className="flex flex-wrap items-center gap-2 text-label-md text-text-secondary pt-1"
          {...fade(0.2)}
        >
          <span className="text-body-sm text-slate-400">Popular:</span>
          {QUICK_FILTERS.map((f) => (
            <a
              key={f.label}
              href={f.href}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-border-subtle text-slate-700 transition-colors"
            >
              {f.label}
            </a>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="lg:col-span-6 relative flex items-center justify-center min-h-[440px] select-none"
        {...fade(0.12)}
      >
        <HeroMapHud />
      </motion.div>
    </div>
  );
}
