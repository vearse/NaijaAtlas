"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import { shuffle } from "@/lib/utils/shufflePick";
import type { HubResource } from "@/lib/server/loadEconomyHubData";

const MAX = 3;

function symbolFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function MineralBrowseSpotlight({
  resources,
}: {
  resources: HubResource[];
}) {
  const [seed, setSeed] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const picked = useMemo(() => {
    const shuffled = shuffle(resources);
    return shuffled.slice(0, MAX);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffle when seed bumps
  }, [resources, seed]);

  const reshuffle = useCallback(() => {
    setSeed((s) => s + 1);
    setOpenId(null);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h3 className="font-landing-display text-headline-md text-text-primary">
            Browse by sector
          </h3>
          <p className="text-body-sm text-text-secondary mt-0.5">
            Minerals spotlight — up to {MAX} entries from the catalogue. Maps
            coming later.
          </p>
        </div>
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-border-subtle text-label-md">
          <span className="px-4 py-2 rounded-lg bg-surface-card text-primary font-semibold shadow-sm">
            Minerals
          </span>
          <span className="px-4 py-2 rounded-lg text-slate-400" title="Soon">
            Ports
          </span>
          <span className="px-4 py-2 rounded-lg text-slate-400" title="Soon">
            Power
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={reshuffle}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-subtle bg-surface-card text-label-md font-semibold text-slate-700 hover:border-primary-container/40"
        >
          <span aria-hidden>↻</span>
          Shuffle minerals
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-border-subtle text-label-caps text-text-muted">
          <div className="col-span-4">Commodity</div>
          <div className="col-span-4">Primary states</div>
          <div className="col-span-4 text-right">Action</div>
        </div>
        <ul className="divide-y divide-slate-100">
          {picked.map((r) => {
            const expanded = openId === r.id;
            return (
              <li
                key={r.id}
                className={expanded ? "bg-slate-50/80 border-l-4 border-primary-container" : ""}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : r.id)}
                  className="grid w-full grid-cols-1 md:grid-cols-12 gap-3 px-6 py-4 text-left hover:bg-slate-50/80"
                >
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-primary flex items-center justify-center text-xs font-bold">
                      {symbolFor(r.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{r.name}</p>
                      <p className="text-body-sm text-text-muted">
                        {r.resourceType || r.type}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-4 text-body-sm text-slate-700">
                    {r.states.slice(0, 4).join(", ")}
                    {r.states.length > 4 && ` +${r.states.length - 4}`}
                  </div>
                  <div className="md:col-span-4 md:text-right text-label-md text-primary font-semibold">
                    {expanded ? "Collapse" : "Details"}
                  </div>
                </button>
                {expanded && (
                  <div className="px-6 pb-5 text-body-sm text-text-secondary space-y-3">
                    <p>{r.summary || "Summary pending in catalogue."}</p>
                    {r.reserveNote && (
                      <p>
                        <span className="font-semibold text-slate-800">
                          Reserves:{" "}
                        </span>
                        {r.reserveNote}
                      </p>
                    )}
                    <Link
                      href={sectionMapHref("economy/resources", {
                        focus: {
                          layerId: "resources",
                          matchKey: "id",
                          matchValue: r.id,
                          label: r.name,
                        },
                      })}
                      className="inline-flex h-10 items-center px-4 rounded-xl border border-primary-container text-primary font-semibold hover:bg-emerald-50"
                    >
                      View on map (when live)
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-3 text-body-sm text-text-muted">
        Showing {picked.length} of {resources.length} mineral entries ·{" "}
        <button
          type="button"
          onClick={reshuffle}
          className="text-primary font-semibold hover:underline"
        >
          pick another set
        </button>
      </p>
    </div>
  );
}
