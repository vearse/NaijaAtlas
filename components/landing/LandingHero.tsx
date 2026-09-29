"use client";

import { motion, useReducedMotion } from "motion/react";
import LandingSearch from "@/components/landing/LandingSearch";
import HeroMapHud from "@/components/landing/HeroMapHud";

type Props = {
  spotlightOpen: boolean;
  onSpotlightClose: () => void;
};

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
          className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-secondary-container/40 border border-outline-variant/60 w-fit backdrop-blur-md"
          {...fade(0)}
        >
          <span className="w-2 h-2 rounded-full bg-primary landing-pulse-radar" />
          <span className="text-label-caps text-secondary uppercase tracking-widest">
            Nigeria in high resolution
          </span>
        </motion.div>

        <motion.h1
          className="font-landing-display text-display-hero-mobile md:text-display-hero text-slate-900 leading-[1.08] tracking-tight"
          {...fade(0.05)}
        >
          Explore, discover &amp; reimagine Nigeria with data and maps.
        </motion.h1>

        <motion.p
          className="text-body-lg text-slate-600 max-w-xl"
          {...fade(0.1)}
        >
          Know every state, every LGA, every polling unit. Explore the land,
          meet the people, plan a trip, find opportunities, and follow the 2027
          elections — on one living atlas.
        </motion.p>

        <motion.div className="pt-2" {...fade(0.15)}>
          <LandingSearch
            spotlightOpen={spotlightOpen}
            onSpotlightClose={onSpotlightClose}
          />
        </motion.div>

        <motion.div className="flex flex-wrap gap-3 pt-2" {...fade(0.2)}>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 bg-primary-container hover:bg-inverse-primary text-on-primary-container font-label-md px-5 py-2.5 rounded-full border border-primary/30 shadow-md transition-all active:scale-95"
          >
            Open the map
          </a>
          <a
            href="/explore?map=election"
            className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface font-label-md px-5 py-2.5 rounded-full border border-outline-variant/50 hover:border-primary/40 transition-colors"
          >
            2027 elections
          </a>
        </motion.div>
      </div>

      <motion.div
        className="lg:col-span-6 relative flex items-center justify-center min-h-[320px] md:min-h-[440px] select-none"
        {...fade(0.12)}
      >
        <HeroMapHud />
      </motion.div>
    </div>
  );
}
