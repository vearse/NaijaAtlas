"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatePillLinkList } from "@/components/hub/StatePillLink";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import EmptyState from "@/components/hub/EmptyState";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubResource } from "@/lib/server/loadEconomyHubData";

/** Group the 35 catalogue entries into the sectors the mock browses by. */
const SECTORS: { id: string; label: string; match: (r: HubResource) => boolean }[] =
  [
    {
      id: "energy",
      label: "Energy",
      match: (r) =>
        /oil|gas|coal|bitumen|uranium/i.test(r.resourceType) ||
        /oil|gas|coal|bitumen|uranium/i.test(r.name),
    },
    {
      id: "metals",
      label: "Metals & industrial",
      match: (r) =>
        /tin|iron|gold|lead|zinc|lithium|manganese|chromite|copper|tungsten|iron-ore|feldspar|fluorspar|rare/i.test(
          r.resourceType
        ),
    },
    {
      id: "construction",
      label: "Construction",
      match: (r) =>
        /limestone|marble|kaolin|gypsum|dolomite|granite|clay|dimension/i.test(
          r.resourceType
        ),
    },
    {
      id: "agro",
      label: "Agro & chemical",
      match: (r) =>
        /salt|phosphate|bentonite|barite|talc|kaolin|diatomite|bauxite/i.test(
          r.resourceType
        ),
    },
    { id: "gemstones", label: "Gemstones", match: (r) => /gemstone/i.test(r.resourceType) },
  ];

function sectorOf(r: HubResource): string {
  return SECTORS.find((s) => s.match(r))?.id ?? "other";
}

export default function SectorBrowser({
  resources,
  slugByStateId,
}: {
  resources: HubResource[];
  slugByStateId: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: resources.length };
    for (const r of resources) {
      const s = sectorOf(r);
      map[s] = (map[s] ?? 0) + 1;
    }
    return map;
  }, [resources]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (sector !== "all" && sectorOf(r) !== sector) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.resourceType.toLowerCase().includes(q) ||
        r.states.join(" ").toLowerCase().includes(q)
      );
    });
  }, [resources, query, sector]);

  const open = resources.find((r) => r.id === openId) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSector("all")}
          aria-pressed={sector === "all"}
          className={`h-10 rounded-full border px-4 text-body-sm font-semibold ${
            sector === "all"
              ? "border-primary-container bg-primary-container text-white"
              : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
          }`}
        >
          All minerals ({counts.all})
        </button>
        {SECTORS.filter((s) => counts[s.id]).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSector(s.id)}
            aria-pressed={sector === s.id}
            className={`h-10 rounded-full border px-4 text-body-sm font-semibold ${
              sector === s.id
                ? "border-primary-container bg-primary-container text-white"
                : "border-border-subtle bg-surface-card text-text-secondary hover:bg-slate-50"
            }`}
          >
            {s.label} ({counts[s.id]})
          </button>
        ))}
      </div>

      <label className="mt-4 block max-w-md">
        <span className="sr-only">Search minerals</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a mineral or a state"
          className="h-11 w-full rounded-xl border border-border-subtle bg-surface-card px-4 text-body-md text-text-primary placeholder:text-slate-400 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
        />
      </label>

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No minerals match" badge="0 results">
            Nothing in the {resources.length}-entry catalogue matches that
            filter.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
          {visible.map((r) => {
            const expanded = openId === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : r.id)}
                  aria-expanded={expanded}
                  className="flex w-full flex-wrap items-start justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md font-semibold text-text-primary">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-body-sm text-text-muted">
                      {r.type || r.resourceType}
                    </p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                      {r.states.slice(0, 5).join(", ")}
                      {r.states.length > 5 && ` +${r.states.length - 5} more`}
                    </p>
                  </div>
                  <span
                    className="mt-1 shrink-0 text-slate-400"
                    aria-hidden
                  >
                    {expanded ? "−" : "+"}
                  </span>
                </button>

                {expanded && (
                  <div className="grid gap-6 border-t border-slate-100 bg-slate-50/60 p-5 md:grid-cols-[200px_minmax(0,1fr)]">
                    <div>
                      {r.lon != null && r.lat != null ? (
                        <NigeriaThumb
                          source="states"
                          highlight={r.stateIds}
                          markers={[{ lon: r.lon, lat: r.lat }]}
                          className="h-32 w-full"
                          title={`${r.name} distribution`}
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-[11px] text-slate-400">
                          No point location
                        </div>
                      )}
                      {r.stateIds.length > 0 && (
                        <Link
                          href={sectionMapHref("economy/resources", {
                            focus: {
                              layerId: "resources",
                              matchKey: "id",
                              matchValue: r.id,
                              label: r.name,
                            },
                          })}
                          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
                        >
                          View on map
                        </Link>
                      )}
                    </div>

                    <div className="space-y-4 text-body-sm text-text-secondary">
                      <p>{r.summary}</p>
                      {r.reserveNote && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Reserves:{" "}
                          </span>
                          {r.reserveNote}
                        </p>
                      )}
                      {r.productionNote && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Production:{" "}
                          </span>
                          {r.productionNote}
                        </p>
                      )}
                      {r.locations.length > 0 && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Known locations:{" "}
                          </span>
                          {r.locations.slice(0, 6).join(", ")}
                        </p>
                      )}
                      {r.products.length > 0 && (
                        <div>
                          <p className="font-semibold text-slate-800">
                            Downstream products
                          </p>
                          <ul className="mt-1 space-y-1">
                            {r.products.slice(0, 4).map((p) => (
                              <li key={p} className="flex gap-2">
                                <span className="text-primary" aria-hidden>
                                  ·
                                </span>
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {r.stateIds.length > 0 && (
                        <StatePillLinkList
                          states={r.states}
                          slugByStateId={slugByStateId}
                        />
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <SourceNote
        className="mt-6"
        source="MSMD mineral catalogue"
        updated="Repository dataset"
      />
    </div>
  );
}
