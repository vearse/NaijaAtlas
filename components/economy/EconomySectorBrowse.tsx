"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubPort, HubResource } from "@/lib/server/loadEconomyHubData";
import type { HubDistributor } from "@/lib/server/loadPowerData";

type SectorTab = "minerals" | "ports" | "disco";

const TABS: { id: SectorTab; label: string; accent: string }[] = [
  { id: "minerals", label: "Minerals", accent: "#008751" },
  { id: "ports", label: "Ports", accent: "#0d9488" },
  { id: "disco", label: "DisCos", accent: "#b45309" },
];

const MINERAL_PAGE = 7;

type Props = {
  resources: HubResource[];
  mineralTypesShown: number;
  ports: HubPort[];
  distributors: HubDistributor[];
};

type MapState = {
  highlight: string[];
  markers: { lon: number; lat: number }[];
  accent: string;
  label: string;
  detail: string;
  /** Single deep link for whatever the map is currently showing. */
  href: string | null;
};

const PICK_LABEL: Record<SectorTab, string> = {
  minerals: "minerals",
  ports: "ports",
  disco: "DisCos",
};

function symbolFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function EconomySectorBrowse({
  resources,
  mineralTypesShown,
  ports,
  distributors,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<SectorTab>("minerals");
  const [mineralSeed, setMineralSeed] = useState(0);
  const [mineralOffset, setMineralOffset] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);

  const mineralPool = useMemo(() => {
    const sorted = [...resources].sort((a, b) => a.name.localeCompare(b.name));
    const start = mineralOffset % Math.max(1, sorted.length);
    const slice: HubResource[] = [];
    for (let i = 0; i < Math.min(MINERAL_PAGE, sorted.length); i++) {
      slice.push(sorted[(start + i) % sorted.length]);
    }
    return slice;
  }, [resources, mineralOffset]);
  const activePorts = useMemo(
    () => ports.filter((p) => p.status === "active").slice(0, 4),
    [ports]
  );
  const discoRows = useMemo(() => distributors, [distributors]);

  useEffect(() => {
    setActiveIdx(0);
  }, [tab, mineralOffset, mineralSeed]);

  const mapState = useMemo<MapState>(() => {
    const accent = TABS.find((t) => t.id === tab)?.accent ?? "#008751";
    const point = (lon: number | null, lat: number | null) =>
      lon != null && lat != null ? [{ lon, lat }] : [];
    if (tab === "minerals") {
      const r = mineralPool[activeIdx];
      return r
        ? {
            highlight: r.stateIds,
            markers: point(r.lon, r.lat),
            accent,
            label: r.name,
            detail: r.resourceType || r.type,
            href: sectionMapHref("economy/resources", {
              focus: {
                layerId: "resources",
                matchKey: "id",
                matchValue: r.id,
                label: r.name,
              },
            }),
          }
        : { highlight: [], markers: [], accent, label: "Minerals", detail: "", href: null };
    }
    if (tab === "ports") {
      const p = activePorts[activeIdx];
      return p
        ? {
            highlight: p.stateIds,
            markers: [],
            accent,
            label: p.name,
            detail: `${p.status} port · ${p.states.slice(0, 3).join(" · ")}`,
            href: sectionMapHref("economy/ports"),
          }
        : { highlight: [], markers: [], accent, label: "Ports", detail: "", href: null };
    }
    const d = discoRows[activeIdx];
    return d
      ? {
          highlight: d.stateIds,
          markers: point(d.lon, d.lat),
          accent,
          label: d.name,
          detail: d.operator ?? d.states.slice(0, 3).join(" · "),
          href: sectionMapHref("economy/power"),
        }
      : { highlight: [], markers: [], accent, label: "Distribution", detail: "", href: null };
  }, [tab, activeIdx, mineralPool, activePorts, discoRows]);

  const reshuffleMinerals = useCallback(() => {
    setMineralSeed((s) => s + 1);
    setMineralOffset(Math.floor(Math.random() * Math.max(1, resources.length)));
  }, [resources.length]);

  const advance = useCallback(() => {
    if (tab === "minerals") {
      setMineralOffset((o) => (o + MINERAL_PAGE) % Math.max(1, resources.length));
      return;
    }
    const total =
      tab === "ports" ? activePorts.length : discoRows.length;
    if (total === 0) return;
    setActiveIdx((i) => (i + 1) % total);
  }, [activePorts.length, discoRows.length, resources.length, tab]);

  const pickCount =
    tab === "minerals"
      ? resources.length
      : tab === "ports"
        ? activePorts.length
        : discoRows.length;

  const listCount =
    tab === "minerals" ? mineralPool.length : pickCount;

  const scrollAway = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: -12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
      };

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
      };

  const mapFade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0.6, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0.5, scale: 0.98 },
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-landing-display text-headline-lg text-text-primary">
            Browse by sector
          </h3>
          <p className="mt-1 max-w-xl text-body-sm text-text-secondary">
            {resources.length} mineral catalogue entries ({mineralTypesShown}{" "}
            resource types). Power generation is covered in the energy section
            below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {tab === "minerals" && (
            <button
              type="button"
              onClick={reshuffleMinerals}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-4 text-label-md font-semibold text-text-secondary hover:border-primary-container/40"
            >
              <span aria-hidden>↻</span>
              Shuffle
            </button>
          )}
          <div
            className="inline-flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-slate-100 p-1"
            role="tablist"
            aria-label="Economy sectors"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-3.5 py-2 text-label-md font-semibold transition-all duration-200 ${
                  tab === t.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
<aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <div className="flex min-h-full w-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
              <p className="text-label-caps text-text-muted">Map preview</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-text-secondary">
                {tab === "minerals"
                  ? `${resources.length} minerals`
                  : `${listCount} ${PICK_LABEL[tab]}`}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${tab}-${activeIdx}-${mineralSeed}`}
                  className="w-full"
                  {...mapFade}
                >
                  <NigeriaThumb
                    source="states"
                    highlight={mapState.highlight}
                    accent={mapState.accent}
                    markers={mapState.markers}
                    className="mx-auto aspect-[4/3] w-full max-h-80"
                    title={mapState.label}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* One dynamic button for the map, plus a symbol to roll to the next pick. */}
          <div className="rounded-2xl border border-border-subtle bg-surface-card p-3 shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div key={mapState.label} {...scrollAway}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: mapState.accent }}>
                    {symbolFor(mapState.label)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md font-semibold text-text-primary">
                      {mapState.label}
                    </p>
                    <p className="truncate text-body-sm text-text-muted">
                      {mapState.detail || PICK_LABEL[tab]}
                    </p>
                  </div>
                  {mapState.href && (
                    <Link
                      href={mapState.href}
                      className="shrink-0 self-center rounded-xl px-3 py-2 text-label-md font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: mapState.accent }}
                    >
                      On the map →
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
              <span className="text-[11px] tabular-nums text-text-muted">
                {tab === "minerals"
                  ? `${Math.min(MINERAL_PAGE, resources.length)} shown · ${resources.length} total`
                  : pickCount > 0
                    ? `${(activeIdx % listCount) + 1} of ${listCount}`
                    : "—"}
              </span>
              <button
                type="button"
                onClick={advance}
                disabled={tab !== "minerals" && listCount <= 1}
                aria-label={tab === "minerals" ? "Show next minerals" : "View the next pick"}
                title="View more"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 text-[11px] font-semibold text-text-secondary transition-colors hover:border-primary-container/40 hover:text-primary disabled:opacity-40"
              >
                View more
                <span aria-hidden>▾</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex min-h-full flex-1 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div key={`${tab}-${mineralSeed}`} className="flex-1" {...fade}>
                {tab === "minerals" && (
                  <ul className="divide-y divide-slate-100">
                    {mineralPool.map((r, i) => (
                      <MineralRow
                        key={r.id}
                        resource={r}
                        active={activeIdx === i}
                        onSelect={() => setActiveIdx(i)}
                      />
                    ))}
                  </ul>
                )}
                {tab === "ports" &&
                  activePorts.map((p, i) => (
                    <PortRow
                      key={p.id}
                      port={p}
                      active={activeIdx === i}
                      onSelect={() => setActiveIdx(i)}
                    />
                  ))}
                {tab === "disco" &&
                  discoRows.map((d, i) => (
                    <DiscoRow
                      key={d.id}
                      disco={d}
                      active={activeIdx === i}
                      onSelect={() => setActiveIdx(i)}
                    />
                  ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function MineralRow({
  resource: r,
  active,
  onSelect,
}: {
  resource: HubResource;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li
      className={`border-l-4 transition-colors duration-200 ${
        active ? "border-primary-container bg-emerald-50/60" : "border-transparent hover:bg-slate-50"
      }`}
    >
      <div className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-12 md:items-center">
        <button
          type="button"
          onClick={onSelect}
          className="flex items-center gap-3 text-left md:col-span-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint-light text-xs font-bold text-primary">
            {symbolFor(r.name)}
          </span>
          <span>
            <span className="block font-semibold text-text-primary">{r.name}</span>
            <span className="block text-body-sm text-text-muted">
              {r.resourceType || r.type}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="text-left text-body-sm text-text-secondary md:col-span-7"
        >
          {r.states.slice(0, 4).join(", ")}
        </button>
      </div>
      {active && r.summary && (
        <p className="px-5 pb-4 text-body-sm text-text-secondary">{r.summary}</p>
      )}
      {active && r.gasSupplyToPowerNote && (
        <p className="px-5 pb-4 text-body-sm text-text-secondary">
          <span className="font-semibold text-text-primary">
            Gas supply to power:{" "}
          </span>
          {r.gasSupplyToPowerNote}
        </p>
      )}
    </li>
  );
}

function SelectableRow({
  active,
  activeClass,
  onSelect,
  title,
  subtitle,
  href,
  linkLabel,
  linkClass,
}: {
  active: boolean;
  activeClass: string;
  onSelect: () => void;
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
  linkClass: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-l-4 border-b-slate-100 px-5 py-4 transition-colors last:border-b-0 ${
        active ? activeClass : "border-l-transparent hover:bg-slate-50"
      }`}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="block font-semibold text-text-primary">{title}</span>
        <span className="block text-body-sm text-text-muted">{subtitle}</span>
      </button>
      <Link href={href} onClick={(e) => e.stopPropagation()} className={`text-label-md font-semibold ${linkClass}`}>
        {linkLabel}
      </Link>
    </div>
  );
}

function PortRow({
  port: p,
  active,
  onSelect,
}: {
  port: HubPort;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <SelectableRow
      active={active}
      activeClass="border-l-teal-600 bg-teal-50/80"
      onSelect={onSelect}
      title={p.name}
      subtitle={p.states.join(" · ")}
      href={sectionMapHref("economy/ports")}
      linkLabel="Ports map →"
      linkClass="text-teal-700"
    />
  );
}

function DiscoRow({
  disco: d,
  active,
  onSelect,
}: {
  disco: HubDistributor;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <SelectableRow
      active={active}
      activeClass="border-l-amber-600 bg-amber-50/80"
      onSelect={onSelect}
      title={d.name}
      subtitle={
        d.operator
          ? `${d.operator} · ${d.states.join(", ")}`
          : d.states.join(" · ")
      }
      href={sectionMapHref("economy/power")}
      linkLabel="Grid map →"
      linkClass="text-amber-800"
    />
  );
}
