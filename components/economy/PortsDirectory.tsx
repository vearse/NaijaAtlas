"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { StatePillLinkList } from "@/components/hub/StatePillLink";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubPort } from "@/lib/server/loadEconomyHubData";

type Status = HubPort["status"];

const VIEWS: { id: Status; label: string; blurb: string; accent: string }[] = [
  {
    id: "active",
    label: "Operating",
    blurb: "Seaports handling container, bulk and general cargo today.",
    accent: "#0d9488",
  },
  {
    id: "proposed",
    label: "Proposed",
    blurb: "Promoted or conceded deep-water hubs, not yet handling cargo.",
    accent: "#d97706",
  },
];

/**
 * Operating and proposed port complexes, one group at a time. Proposed
 * terminals are opt-in overlay groups on the map, so they are never mixed in
 * with operating ports.
 */
export default function PortsDirectory({
  ports,
  slugByStateId,
}: {
  ports: HubPort[];
  slugByStateId: Record<string, string>;
}) {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<Status>("active");
  const view = VIEWS.find((v) => v.id === status) ?? VIEWS[0];
  const visible = ports.filter((p) => p.status === status);
  const states = [...new Set(visible.flatMap((p) => p.stateIds))];

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div>
      <div
        className="inline-flex rounded-xl border border-border-subtle bg-slate-100 p-1"
        role="tablist"
        aria-label="Port status"
      >
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={status === v.id}
            onClick={() => setStatus(v.id)}
            className={`rounded-lg px-4 py-2 text-label-md font-semibold transition-all duration-200 ${
              status === v.id
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-body-sm text-text-muted">{view.blurb}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="self-start rounded-2xl border border-border-subtle bg-slate-50 p-4 lg:sticky lg:top-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 0.5, scale: 0.97 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0.5, scale: 0.97 },
                    transition: { duration: 0.3 },
                  })}
            >
              <NigeriaThumb
                source="states"
                highlight={states}
                accent={view.accent}
                className="h-56 w-full"
                title={`${view.label} port states`}
              />
            </motion.div>
          </AnimatePresence>
          <Link
            href={sectionMapHref("economy/ports")}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Open ports map
          </Link>
        </div>

        <AnimatePresence mode="wait">
          <motion.ul key={status} className="space-y-3" {...fade}>
            {visible.map((p) => (
              <PortCard key={p.id} port={p} slugByStateId={slugByStateId} />
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      <SourceNote
        className="mt-6"
        source="Nigerian Ports Authority port handbook (2024) · berth characteristics"
        updated="Last verified 2026-04-29"
      />
    </div>
  );
}

function PortCard({
  port,
  slugByStateId,
}: {
  port: HubPort;
  slugByStateId: Record<string, string>;
}) {
  return (
    <li className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-landing-display text-headline-sm text-text-primary">
          {port.name}
        </h4>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            port.status === "active"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {port.status === "active" ? "Operating" : "Proposed"}
        </span>
      </div>
      <p className="mt-1 text-body-sm text-text-muted">{port.type}</p>
      <p className="mt-2 text-body-sm text-text-secondary">{port.summary}</p>
      {port.cargoNote && (
        <p className="mt-2 text-body-sm text-text-secondary">
          <span className="font-semibold text-slate-800">Cargo: </span>
          {port.cargoNote}
        </p>
      )}
      {port.significance && (
        <p className="mt-2 text-body-sm text-text-secondary">
          <span className="font-semibold text-slate-800">Why it matters: </span>
          {port.significance}
        </p>
      )}
      <StatePillLinkList states={port.states} slugByStateId={slugByStateId} />
    </li>
  );
}
