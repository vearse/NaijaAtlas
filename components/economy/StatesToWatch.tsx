"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import { formatHubValue } from "@/lib/ranking/hubIndicator";
import { NAIRA } from "@/lib/ranking/metricUnits";
import { shuffle } from "@/lib/utils/shufflePick";
import type { EconomyHubData } from "@/lib/server/loadEconomyHubData";

/**
 * Random sample of states ranked by commercial signal (ports, minerals, IGR).
 */
export default function StatesToWatch({
  watch,
  sampleSize = 5,
}: {
  watch: EconomyHubData["watch"];
  sampleSize?: number;
}) {
  const [seed, setSeed] = useState(0);

  const rows = useMemo(() => {
    const topPool = watch.slice(0, Math.min(18, watch.length));
    const picked = shuffle(topPool).slice(0, Math.min(sampleSize, topPool.length));
    return picked.sort(
      (a, b) =>
        (b.ports - a.ports) ||
        (b.resources - a.resources) ||
        (b.igr ?? 0) - (a.igr ?? 0)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, sampleSize, seed]);

  const refresh = useCallback(() => setSeed((s) => s + 1), []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-body-sm text-text-secondary max-w-xl">
          A rotating sample from states with strong port, mineral, or IGR
          signals — not a fixed top-10 list.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-subtle bg-surface-card text-label-md font-semibold text-slate-700 hover:border-primary-container/40"
        >
          <span aria-hidden>↻</span>
          Refresh list
        </button>
      </div>

      <ol className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
        {rows.map((w, i) => (
          <li key={w.stateId}>
            <Link
              href={`/places/${w.slug}`}
              className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50"
            >
              <span className="w-6 shrink-0 font-mono text-body-sm text-slate-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-md font-semibold text-text-primary">
                  {w.name}
                </p>
                <p className="text-body-sm text-text-muted">{w.region}</p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                  {w.resources} mineral{w.resources === 1 ? "" : "s"}
                </span>
                {w.ports > 0 && (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800">
                    {w.ports} port{w.ports === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {w.igr != null && w.igrRank != null && (
                <div className="w-32 shrink-0 text-right">
                  <p className="font-mono text-body-sm font-semibold text-text-primary">
                    {formatHubValue(w.igr, NAIRA)}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    IGR rank #{w.igrRank}
                  </p>
                </div>
              )}
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-body-sm text-text-muted">
        <Link href="/data" className="font-semibold text-primary hover:underline">
          Full IGR rankings
        </Link>
      </p>

      <SourceNote
        className="mt-6"
        source="MSMD · NPA · NBS state financial profiles"
        updated="FY 2024 IGR"
      />
    </div>
  );
}
