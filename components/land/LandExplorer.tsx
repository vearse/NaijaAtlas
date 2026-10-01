"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { StatePillLinkList } from "@/components/hub/StatePillLink";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import { useMapStore } from "@/lib/store/mapStore";
import type { OverlayLayerId } from "@/types/overlay";
import type { HubLandProse, LandHubData } from "@/lib/server/loadLandHubData";

type Tab = "terrain" | "rivers" | "lakes" | "coast";

type LandItem = {
  id: string;
  name: string;
  kind: string;
  lede: string;
  highlights: string[];
  details: { label: string; value: string }[];
  states: string[];
  stateIds: string[];
  wikiUrl: string;
  /** Map layer the feature is drawn on, for the focused map link. */
  layerId: OverlayLayerId;
};

type TabMeta = {
  id: Tab;
  label: string;
  blurb: string;
  accent: string;
  tint: string;
  icon: ReactNode;
};

const TABS: TabMeta[] = [
  {
    id: "terrain",
    label: "Terrain",
    blurb: "Plateaus, ranges, hills and inselbergs.",
    accent: "#4d7c0f",
    tint: "bg-lime-50 text-lime-800 border-lime-200",
    icon: (
      <path d="M3 19 9.5 8l3.5 6 2.5-4L21 19H3Z" strokeLinejoin="round" />
    ),
  },
  {
    id: "rivers",
    label: "Rivers",
    blurb: "The Niger, the Benue and the waters that feed them.",
    accent: "#0369a1",
    tint: "bg-sky-50 text-sky-800 border-sky-200",
    icon: (
      <path
        d="M4 6c3 0 3 3 6 3s3-3 6-3 4 2 4 2M4 12c3 0 3 3 6 3s3-3 6-3 4 2 4 2M4 18c3 0 3 3 6 3"
        strokeLinecap="round"
      />
    ),
  },
  {
    id: "lakes",
    label: "Lakes",
    blurb: "Natural lakes, reservoirs and lagoons.",
    accent: "#0e7490",
    tint: "bg-cyan-50 text-cyan-800 border-cyan-200",
    icon: (
      <>
        <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" strokeLinejoin="round" />
        <path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "coast",
    label: "Coastline",
    blurb: "Barrier islands, delta mouths and estuaries.",
    accent: "#0f766e",
    tint: "bg-teal-50 text-teal-800 border-teal-200",
    icon: (
      <>
        <path d="M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15" strokeLinecap="round" />
        <path d="M3 19c2 0 2-1.5 4.5-1.5S10 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19" strokeLinecap="round" />
        <path d="M14 11V4l5 3-5 2" strokeLinejoin="round" />
      </>
    ),
  },
];

function rows(pairs: [string, string][]): LandItem["details"] {
  return pairs
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => ({ label, value }));
}

function lede(item: HubLandProse & { summary: string }): string {
  return item.description || item.summary;
}

function buildItems(data: LandHubData): Record<Tab, LandItem[]> {
  return {
    terrain: data.landforms.map((l) => ({
      id: l.id,
      name: l.name,
      kind: l.landformType.replace(/-/g, " ") || l.type,
      lede: lede(l),
      highlights: l.highlights,
      details: rows([
        ["Relief", l.elevationNote],
        ["Character", l.character],
        ["Livelihoods", l.economy],
      ]),
      states: l.states,
      stateIds: l.stateIds,
      wikiUrl: l.wikiUrl,
      layerId: "landforms",
    })),
    rivers: data.waterways.map((w) => ({
      id: w.id,
      name: w.name,
      kind: w.type || w.class,
      lede: lede(w),
      highlights: w.highlights,
      details: rows([
        ["Course", w.lengthNote],
        ["Mouth", w.mouthNote],
        ["Ecology", w.ecology],
        ["Livelihoods", w.economy],
      ]),
      states: w.states,
      stateIds: w.stateIds,
      wikiUrl: w.wikiUrl,
      layerId: "waterways",
    })),
    lakes: data.lakes
      .filter((l) => !l.isPower)
      .map((l) => ({
        id: l.id,
        name: l.name,
        kind: l.lakeCategory || "water body",
        lede: lede(l),
        highlights: l.highlights,
        details: rows([
          ["Size", l.areaNote],
          ["Use", l.usage],
          ["Ecology", l.ecology],
          ["Why it matters", l.significance],
        ]),
        states: l.states,
        stateIds: l.stateIds,
        wikiUrl: l.wikiUrl,
        layerId: "lakes",
      })),
    coast: data.coast.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.type,
      lede: lede(c),
      highlights: c.highlights,
      details: rows([
        ["Extent", c.lengthNote],
        ["Ecology", c.ecology],
        ["Livelihoods", c.economy],
      ]),
      states: c.states,
      stateIds: c.stateIds,
      wikiUrl: c.wikiUrl,
      layerId: "waterways",
    })),
  };
}

function focusedMapHref(item: LandItem): string {
  return sectionMapHref("land/physical", {
    focus: {
      layerId: item.layerId,
      matchKey: "id",
      matchValue: item.id,
      label: item.name,
    },
  });
}

/** Terrain, rivers, lakes and coastline, each beside a Nigeria map of the states it touches. */
export default function LandExplorer({
  data,
  slugByStateId,
}: {
  data: LandHubData;
  /** State name → Places slug. */
  slugByStateId: Record<string, string>;
}) {
  const [tab, setTab] = useState<Tab>("terrain");
  const [query, setQuery] = useState("");
  const [selectedByTab, setSelectedByTab] = useState<Partial<Record<Tab, string>>>({});

  const itemsByTab = useMemo(() => buildItems(data), [data]);
  const meta = TABS.find((t) => t.id === tab) ?? TABS[0];

  const q = query.trim().toLowerCase();
  const items = useMemo(
    () =>
      itemsByTab[tab].filter(
        (i) =>
          !q ||
          i.name.toLowerCase().includes(q) ||
          i.kind.toLowerCase().includes(q) ||
          i.states.join(" ").toLowerCase().includes(q)
      ),
    [itemsByTab, tab, q]
  );

  const selected =
    items.find((i) => i.id === selectedByTab[tab]) ?? items[0] ?? null;

  const tabStateIds = useMemo(
    () => [...new Set(itemsByTab[tab].flatMap((i) => i.stateIds))],
    [itemsByTab, tab]
  );
  const highlight = selected?.stateIds.length ? selected.stateIds : tabStateIds;

  const select = (id: string) =>
    setSelectedByTab((prev) => ({ ...prev, [tab]: id }));

  const openWikiModal = useMapStore((s) => s.openWikiModal);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="tablist"
          aria-label="Land features"
          className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border-subtle bg-slate-100 p-1.5 sm:inline-grid sm:grid-cols-4"
        >
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-body-sm font-semibold transition-colors ${
                  active
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <TabIcon accent={active ? t.accent : "currentColor"}>{t.icon}</TabIcon>
                {t.label}
              </button>
            );
          })}
        </div>
        <label className="block lg:ml-auto">
          <span className="sr-only">Search land features</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${meta.label.toLowerCase()} or a state`}
            className="h-11 w-full rounded-full border border-border-subtle bg-surface-card px-4 text-body-sm text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10 lg:w-72"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <TabIcon accent={meta.accent}>{meta.icon}</TabIcon>
              <div className="min-w-0">
                <p className="text-label-caps uppercase text-text-muted">{meta.label}</p>
                <p className="text-body-sm text-text-secondary">{meta.blurb}</p>
              </div>
            </div>
            <div className="bg-gradient-to-b from-slate-50 to-white px-4 py-6">
              <NigeriaThumb
                source="states"
                highlight={highlight}
                accent={meta.accent}
                className="mx-auto h-72 w-full sm:h-80 lg:h-[24rem]"
                title={selected ? `States touched by ${selected.name}` : meta.label}
              />
            </div>
            {selected && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-label-caps uppercase text-text-muted">Selected</p>
                <p className="mt-1 font-landing-display text-headline-sm text-text-primary">
                  {selected.name}
                </p>
                {selected.states.length > 0 && (
                  <p className="mt-1 text-body-sm text-text-secondary">
                    {selected.states.join(" · ")}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={focusedMapHref(selected)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary-container px-4 text-label-md font-semibold text-white hover:bg-[#006d40]"
                  >
                    Show on terrain map
                  </Link>
                  {selected.wikiUrl && (
                    <button
                      type="button"
                      onClick={() => openWikiModal(selected.wikiUrl, selected.name)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border-subtle px-4 text-label-md font-semibold text-text-secondary hover:border-primary-container hover:text-primary"
                    >
                      Read more
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        <ul className="space-y-2" role="tabpanel" aria-label={meta.label}>
          {items.length === 0 && (
            <li>
              <EmptyState title={`No ${meta.label.toLowerCase()} match`} badge="No results">
                Try another name or a state.
              </EmptyState>
            </li>
          )}
          {items.map((item) => {
            const active = item.id === selected?.id;
            return (
              <li key={item.id}>
                <article
                  onClick={() => select(item.id)}
                  className={`cursor-pointer rounded-2xl border bg-surface-card shadow-sm transition-colors ${
                    active
                      ? "border-primary-container p-5 ring-2 ring-emerald-500/10 md:p-6"
                      : "border-border-subtle px-4 py-3 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-landing-display text-headline-sm text-text-primary">
                      <button
                        type="button"
                        onClick={() => select(item.id)}
                        aria-pressed={active}
                        className={`text-left hover:text-primary ${active ? "" : "text-body-md font-semibold"}`}
                      >
                        {item.name}
                      </button>
                    </h3>
                    {item.kind && (
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${meta.tint}`}
                      >
                        {item.kind}
                      </span>
                    )}
                  </div>

                  {active && (
                    <>
                      {item.lede && (
                        <p className="mt-2 text-body-md text-text-secondary">{item.lede}</p>
                      )}
                      {item.highlights.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {item.highlights.map((h) => (
                            <li
                              key={h}
                              className="rounded-lg bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-700"
                            >
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}

                      {item.details.length > 0 && (
                        <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                          {item.details.map((d) => (
                            <div key={d.label}>
                              <dt className="text-label-caps uppercase text-text-muted">
                                {d.label}
                              </dt>
                              <dd className="mt-0.5 text-body-sm text-text-secondary">
                                {d.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      <StatePillLinkList
                        states={item.states}
                        slugByStateId={slugByStateId}
                      />

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-body-sm font-semibold">
                        <Link
                          href={focusedMapHref(item)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          On the map &rarr;
                        </Link>
                        {item.wikiUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWikiModal(item.wikiUrl, item.name);
                            }}
                            className="text-text-secondary hover:text-primary"
                          >
                            Read more &rarr;
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <SourceNote className="mt-8" source={data.sources} updated="Repository catalogues" />
    </div>
  );
}

function TabIcon({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke={accent}
      strokeWidth={1.8}
      aria-hidden
    >
      {children}
    </svg>
  );
}
