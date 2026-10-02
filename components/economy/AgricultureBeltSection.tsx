"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubBelt } from "@/lib/server/loadEconomyHubData";

const ACCENT = "#d97706";

/** Agro-ecological belts as a picker: one belt at a time, map on the left. */
export default function AgricultureBeltSection({
  belts,
  slugByStateName,
}: {
  belts: HubBelt[];
  slugByStateName: Record<string, string>;
}) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(belts[0]?.id ?? "");
  const belt = belts.find((b) => b.id === activeId) ?? belts[0];

  if (!belt) {
    return <p className="text-body-sm text-text-muted">No farming belt data yet.</p>;
  }

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-white shadow-sm">
      <div className="flex gap-2 overflow-x-auto border-b border-amber-100 px-5 py-4">
        {belts.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveId(b.id)}
            aria-pressed={b.id === belt.id}
            className={`shrink-0 rounded-full px-4 py-2 text-label-md font-semibold transition-colors duration-200 ${
              b.id === belt.id
                ? "bg-amber-600 text-white shadow-sm"
                : "border border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="rounded-2xl border border-amber-100 bg-white px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={belt.id}
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
                highlight={belt.stateIds}
                accent={ACCENT}
                className="mx-auto h-64 w-full sm:h-72"
                title={belt.name}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={belt.id} className="min-w-0" {...motionProps}>
            <p className="text-label-caps text-amber-800">Farming belt</p>
            <h3 className="mt-1 font-landing-display text-headline-md text-text-primary">
              {belt.name}
            </h3>
            <p className="mt-2 text-body-md text-text-secondary">{belt.summary}</p>

            {belt.crops.length > 0 && (
              <div className="mt-5">
                <p className="text-label-caps text-text-muted">What grows here</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {belt.crops.slice(0, 8).map((c) => (
                    <li
                      key={c}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-body-sm font-medium text-amber-900"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(belt.agriculture || belt.economy) && (
              <p className="mt-4 text-body-sm text-text-secondary">
                {belt.agriculture || belt.economy}
              </p>
            )}

            {belt.states.length > 0 && (
              <div className="mt-5">
                <p className="text-label-caps text-text-muted">States in the belt</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {belt.states.map((name) => (
                    <Link
                      key={name}
                      href={`/places/${slugByStateName[name] ?? name.toLowerCase()}`}
                      className="rounded-full border border-border-subtle bg-white px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-amber-400 hover:text-amber-900"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              href={sectionMapHref("economy/resources", {
                focus: { layerId: "ecology", matchKey: "id", matchValue: belt.id, label: belt.name },
              })}
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-600 px-5 text-label-md font-semibold text-white hover:bg-amber-700"
            >
              See the belt on the map →
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
