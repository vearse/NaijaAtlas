"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import LandingSearch from "@/components/landing/LandingSearch";
import HeroMapHud from "@/components/landing/HeroMapHud";
import HeroNigeriaMap from "@/components/landing/HeroNigeriaMap";
import type { LandingStateCard } from "@/lib/landing/landingPageTypes";

type Props = {
  spotlightOpen: boolean;
  onSpotlightClose: () => void;
  states: LandingStateCard[];
};

const IDLE_MS = 20_000;

const QUICK_FILTERS = [
  { label: "Lagos", href: "/places/lagos" },
  { label: "Osun-Osogbo Festival", href: "/travel" },
  { label: "Kainji Lake", href: "/land" },
  { label: "Senate districts", href: "/civic" },
];

export default function LandingHero({
  spotlightOpen,
  onSpotlightClose,
  states,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const lastTouch = useRef(Date.now());
  const touch = () => {
    lastTouch.current = Date.now();
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() - lastTouch.current >= IDLE_MS) {
        setSlide((s) => (s + 1) % 2);
        lastTouch.current = Date.now();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

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
          Understand Nigeria. Discover every corner.
        </motion.h1>

        <motion.p
          className="text-body-lg text-text-secondary max-w-xl"
          {...fade(0.1)}
        >
          Every state, people and place, on one living map.
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
        className="lg:col-span-6 relative select-none"
        {...fade(0.12)}
        onPointerDown={touch}
        onPointerMove={touch}
        onKeyDown={touch}
        onFocus={touch}
      >
        <div className="relative min-h-[440px] overflow-hidden">
          <div
            className="flex w-[200%] transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${slide * 50}%)` }}
          >
            <div
              className="flex w-1/2 items-center justify-center px-1"
              aria-hidden={slide !== 0}
              inert={slide !== 0 ? true : undefined}
            >
              <HeroNigeriaMap states={states} />
            </div>
            <div
              className="flex min-h-[440px] w-1/2 items-center justify-center"
              aria-hidden={slide !== 1}
              inert={slide !== 1 ? true : undefined}
            >
              <HeroMapHud />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Hero panels">
          {["Nigeria map", "Live atlas"].map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={slide === i}
              aria-label={label}
              onClick={() => {
                setSlide(i);
                touch();
              }}
              className={`h-2 rounded-full transition-all ${
                slide === i ? "w-6 bg-primary-container" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
