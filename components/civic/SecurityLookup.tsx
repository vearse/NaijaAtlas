"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { useWikiReader } from "@/hooks/useWikiReader";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  SECURITY_BRANCHES_META,
  formationCoverage,
  formationTypeLabel,
} from "@/components/civic/securityBranchMeta";
import type {
  HubFormation,
  SecurityBranchSummary,
  SecurityData,
} from "@/lib/server/loadSecurityData";

/**
 * Security lookup.
 *
 * Same shape as the metro-cities browser on the Travel hub: pick a branch, scan
 * the roster on the left, read one formation in full on the right. Scaling up is
 * the point — every formation gets its area of responsibility, highlights,
 * milestones and map footprint, which the previous three-card grid could not fit.
 */
export default function SecurityLookup({ security }: { security: SecurityData }) {
  const reduceMotion = useReducedMotion();
  const { openArticle, openByName, resolving } = useWikiReader();

  const branches = useMemo(
    () =>
      SECURITY_BRANCHES_META.map((meta) => ({
        meta,
        group: security.byBranch.find((b) => b.branch === meta.id) ?? null,
      })).filter((row) => row.group !== null),
    [security.byBranch]
  );

  const [branchId, setBranchId] = useState(branches[0]?.meta.id ?? "army");
  const [activeId, setActiveId] = useState<string>("");

  const branch = branches.find((b) => b.meta.id === branchId) ?? branches[0];
  const accent = branch?.group?.color ?? "#008751";
  const inBranch: HubFormation[] = branch?.group?.formations ?? [];
  const formation = inBranch.find((f) => f.id === activeId) ?? inBranch[0];

  const swap = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -12 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
      };

  if (!branch || !formation) return null;

  return (
    <div>
      <div>
        <span className="text-label-caps uppercase tracking-wider text-primary">
          Armed Forces · Security lookup
        </span>
        <h2 className="mt-1 font-landing-display text-headline-md text-text-primary">
          Look up any formation
        </h2>
        <p className="mt-1 max-w-2xl text-body-md text-text-secondary">
          {security.formations.length} documented formations across the Army,
          Navy and Air Force. Pick a service, open a headquarters, and read its
          area of responsibility, status and map footprint.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Armed Forces branch">
        {branches.map(({ meta, group }) => (
          <button
            key={meta.id}
            type="button"
            role="tab"
            aria-selected={branchId === meta.id}
            onClick={() => {
              setBranchId(meta.id);
              setActiveId("");
            }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2 text-label-md font-semibold transition-all duration-200 ${
              branchId === meta.id
                ? "text-white shadow-md"
                : "bg-surface-card hover:shadow-sm"
            }`}
            style={
              branchId === meta.id
                ? { backgroundColor: group?.color, borderColor: group?.color }
                : { borderColor: `${group?.color}55`, color: group?.color }
            }
          >
            <span aria-hidden>{meta.icon}</span>
            {meta.label}
            <span className="rounded-full bg-black/10 px-1.5 text-[10px] font-bold tabular-nums">
              {group?.formations.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div
        className={`mt-6 overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br ${branch.meta.wash} via-white to-white shadow-sm`}
      >
        <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          {/* Formation stack */}
          <div className="border-b border-border-subtle p-4 lg:border-b-0 lg:border-r">
            <p className="px-1 text-body-sm italic text-text-muted">
              {branch.meta.tagline}
            </p>
            <ul className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
              {inBranch.map((f) => {
                const active = f.id === formation.id;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(f.id)}
                      aria-pressed={active}
                      className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                        active
                          ? "border-transparent bg-white shadow-md"
                          : "border-slate-300 bg-white/60 hover:bg-white"
                      }`}
                      style={
                        active ? { boxShadow: `inset 4px 0 0 ${accent}` } : undefined
                      }
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: accent, opacity: active ? 1 : 0.65 }}
                        aria-hidden
                      >
                        {formationTypeLabel(f).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-text-primary">
                          {f.name}
                        </span>
                        <span className="block truncate text-[11px] text-text-muted">
                          {formationTypeLabel(f)} · {formationCoverage(f)}
                        </span>
                      </span>
                      {f.proposed && (
                        <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
                          New
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Feature */}
          <AnimatePresence mode="wait">
            <motion.div
              key={formation.id}
              className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_200px] md:p-6"
              {...swap}
            >
              <div className="min-w-0">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-caps uppercase text-white"
                  style={{ backgroundColor: accent }}
                >
                  {branch.meta.icon} {branch.group?.label}
                </span>
                <h4 className="mt-3 font-landing-display text-headline-md text-text-primary">
                  {formation.name}
                </h4>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  {formationTypeLabel(formation)} · {formationCoverage(formation)}
                  {formation.status ? ` · ${formation.status}` : ""}
                </p>
                <p className="mt-2 text-body-md text-text-secondary">
                  {formation.description || formation.summary}
                </p>

                {formation.aorNote && (
                  <div className="mt-4 rounded-2xl border border-border-subtle bg-white p-4">
                    <p
                      className="text-label-caps uppercase"
                      style={{ color: accent }}
                    >
                      Area of responsibility
                    </p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                      {formation.aorNote}
                    </p>
                  </div>
                )}

                {formation.states.length > 0 && (
                  <div className="mt-4">
                    <p className="text-label-caps uppercase text-text-muted">
                      Where it sits
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {formation.states.slice(0, 12).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border-subtle bg-white px-2.5 py-1 text-[11px] font-semibold text-text-secondary"
                        >
                          {s}
                        </span>
                      ))}
                      {formation.states.length > 12 && (
                        <span className="rounded-full border border-border-subtle bg-white px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                          +{formation.states.length - 12} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {formation.highlights.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {formation.highlights.slice(0, 4).map((h) => (
                      <li
                        key={h}
                        className="flex gap-2 text-body-sm text-text-secondary"
                      >
                        <span aria-hidden style={{ color: accent }}>
                          ✓
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}

                {formation.milestones.length > 0 && (
                  <div className="mt-4">
                    <p className="text-label-caps uppercase text-text-muted">
                      Milestones
                    </p>
                    <ol className="mt-2 space-y-1.5">
                      {formation.milestones.slice(0, 4).map((m) => (
                        <li
                          key={`${m.date}-${m.event}`}
                          className="flex gap-3 text-body-sm"
                        >
                          <span className="w-20 shrink-0 tabular-nums text-text-muted">
                            {m.date}
                          </span>
                          <span className="min-w-0 text-text-secondary">
                            {m.event}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={sectionMapHref("civic/security", {
                      focus: {
                        layerId: "security",
                        matchKey: "id",
                        matchValue: formation.id,
                        label: formation.name,
                      },
                    })}
                    className="inline-flex h-10 items-center rounded-xl px-4 text-label-md font-semibold text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    View on security map
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      formation.wikiUrl
                        ? openArticle(formation.wikiUrl, formation.name)
                        : void openByName(formation.name)
                    }
                    disabled={resolving === formation.name}
                    className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-white px-4 text-label-md font-semibold text-text-secondary hover:text-primary disabled:opacity-60"
                  >
                    {resolving === formation.name ? "Loading…" : "Read more"}
                  </button>
                  <Link
                    href="/civic/map/security"
                    className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-white px-4 text-label-md font-semibold text-text-secondary hover:text-primary"
                  >
                    Open workspace
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-white p-3">
                <NigeriaThumb
                  source="states"
                  highlight={formation.stateIds}
                  accent={accent}
                  markers={
                    formation.lon != null && formation.lat != null
                      ? [{ lon: formation.lon, lat: formation.lat }]
                      : []
                  }
                  className="h-44 w-full md:h-full md:min-h-[12rem]"
                  title={formation.name}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BranchStrip branches={security.byBranch} />

      {security.proposedCount > 0 && (
        <p className="mt-4 text-body-sm text-text-secondary">
          <span className="font-semibold text-text-primary">
            {security.proposedCount} new Army divisions
          </span>{" "}
          were approved in July 2026 and are forming toward Initial Operational
          Capability. They are hidden on the map until you reveal them.
        </p>
      )}
    </div>
  );
}

/** Branch totals strip, kept from the old three-card summary. */
function BranchStrip({ branches }: { branches: SecurityBranchSummary[] }) {
  if (branches.length === 0) return null;
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {branches.map((group) => (
        <div
          key={group.branch}
          className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
          style={{ borderLeft: `4px solid ${group.color}` }}
        >
          <p className="text-label-caps text-text-muted">{group.label}</p>
          <p className="mt-2 font-landing-display text-headline-lg font-bold tabular-nums tracking-tight text-text-primary">
            {group.formations.length}
          </p>
          <p className="mt-1 text-body-sm text-text-secondary">
            {group.branch === "army"
              ? "Divisional HQs, Army HQ and the Guards Brigade"
              : group.branch === "navy"
                ? "Naval Commands covering the coastline"
                : "Air Force HQ, commands and bases"}
          </p>
        </div>
      ))}
    </div>
  );
}