"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { HubBelt } from "@/lib/server/loadEconomyHubData";
import { shuffle } from "@/lib/utils/shufflePick";

export default function FarmingBeltSpotlight({
  belts,
  slugByStateId,
}: {
  belts: HubBelt[];
  slugByStateId: Record<string, string>;
}) {
  const [seed, setSeed] = useState(0);

  const belt = useMemo(() => {
    if (!belts.length) return null;
    const ordered = shuffle(belts);
    return ordered[seed % ordered.length] ?? ordered[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [belts, seed]);

  const reshuffle = useCallback(() => setSeed((s) => s + 1), []);

  if (!belt) {
    return (
      <p className="text-body-sm text-text-muted">No farming belt data yet.</p>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-label-caps text-amber-800 tracking-wider">
            Agriculture belt
          </span>
          <h3 className="font-landing-display text-headline-md text-text-primary mt-1">
            {belt.name}
          </h3>
          <p className="text-body-sm text-text-secondary mt-2 max-w-2xl">
            {belt.summary}
          </p>
        </div>
        <button
          type="button"
          onClick={reshuffle}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-200 bg-surface-card text-label-md font-semibold text-amber-900 hover:bg-amber-50"
        >
          <span aria-hidden>↻</span>
          Another belt
        </button>
      </div>

      {belt.crops.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {belt.crops.slice(0, 8).map((c) => (
            <li
              key={c}
              className="rounded-full border border-amber-200 bg-surface-card px-3 py-1 text-body-sm text-slate-700"
            >
              {c}
            </li>
          ))}
        </ul>
      )}

      {belt.agriculture && (
        <p className="mt-4 text-body-sm text-text-secondary">{belt.agriculture}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {belt.states.slice(0, 8).map((name) => (
          <Link
            key={name}
            href={`/places/${slugByStateId[name] ?? name.toLowerCase()}`}
            className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container"
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}
