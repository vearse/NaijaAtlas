"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubCrop } from "@/lib/server/loadEconomyHubData";

const STATE_ALIASES: Record<string, string> = {
  Nasarawa: "Nassarawa",
};

function slugFor(name: string, slugByStateName: Record<string, string>): string {
  const canonical = STATE_ALIASES[name] ?? name;
  return slugByStateName[canonical] ?? slugByStateName[name] ?? name.toLowerCase();
}

/** Major crops — one at a time on the thumbnail; full detail on the Ecology map layer. */
export default function AgricultureCropsSection({
  crops,
  slugByStateName,
}: {
  crops: HubCrop[];
  slugByStateName: Record<string, string>;
}) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(crops[0]?.id ?? "");
  const crop = crops.find((c) => c.id === activeId) ?? crops[0];

  if (!crop) return null;

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
      };

  const mapHref = sectionMapHref("economy/resources", {
    focus: {
      layerId: "ecology",
      matchKey: "id",
      matchValue: crop.id,
      label: crop.crop,
    },
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-white shadow-sm">
      <div className="border-b border-emerald-100 px-5 py-4">
        <p className="text-label-caps text-emerald-800">Major crops</p>
        <p className="mt-1 text-body-sm text-text-muted">
          Pick a crop to see where it is grown, then open it on the map to highlight
          every state in its belt.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-emerald-100 px-5 py-4">
        {crops.map((c) => {
          const on = c.id === crop.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-label-md font-semibold transition-colors duration-200 ${
                on
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: c.color }}
              />
              {c.crop}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={crop.id}
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 0.5, scale: 0.97 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0.5, scale: 0.97 },
                    transition: { duration: 0.35 },
                  })}
            >
              <NigeriaThumb
                source="states"
                highlight={crop.stateIds}
                accent={crop.color}
                className="mx-auto h-64 w-full sm:h-72"
                title={crop.crop}
              />
            </motion.div>
          </AnimatePresence>
          <Link
            href={mapHref}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-label-md font-semibold text-white hover:bg-emerald-700 sm:mt-5"
          >
            See this crop on the map →
          </Link>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={crop.id} className="min-w-0" {...motionProps}>
            <p className="text-label-caps text-emerald-800">Crop</p>
            <h3 className="mt-1 font-landing-display text-headline-md text-text-primary">
              {crop.crop}
            </h3>
            <p className="mt-2 text-body-md text-text-secondary">{crop.summary}</p>
            {crop.leadingNote && (
              <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-body-sm text-emerald-900">
                {crop.leadingNote}
              </p>
            )}

            {(crop.statesFully.length > 0 || crop.statesPartly.length > 0) && (
              <div className="mt-5 space-y-3">
                {crop.statesFully.length > 0 && (
                  <div>
                    <p className="text-label-caps text-text-muted">Core producing states</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {crop.statesFully.map((name) => (
                        <Link
                          key={name}
                          href={`/places/${slugFor(name, slugByStateName)}`}
                          className="rounded-full border border-border-subtle bg-white px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-emerald-400 hover:text-emerald-900"
                        >
                          {name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {crop.statesPartly.length > 0 && (
                  <div>
                    <p className="text-label-caps text-text-muted">Also grown in</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {crop.statesPartly.map((name) => (
                        <Link
                          key={name}
                          href={`/places/${slugFor(name, slugByStateName)}`}
                          className="rounded-full border border-dashed border-border-subtle bg-white px-2.5 py-1 text-[11px] font-semibold text-text-muted hover:border-emerald-400 hover:text-emerald-900"
                        >
                          {name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
