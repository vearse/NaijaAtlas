"use client";

import Link from "next/link";
import type { PeopleHubData } from "@/lib/server/loadPeopleHubData";

/** The four spotlight cultures, with their documented LGA footprint. */
export default function CultureSpotlight({
  spotlight,
  slugByStateId,
}: {
  spotlight: PeopleHubData["spotlight"];
  slugByStateId: Record<string, string>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {spotlight.map((s) => {
        const stateIds = (s.exploreHref.match(/states=([\w-]+(?:%2C[\w-]+)*)/)?.[1] ?? "")
          .split(",")
          .map((x) => decodeURIComponent(x))
          .filter((x) => x.length > 0);

        return (
          <article
            key={s.id}
            className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm"
          >
            <p className="text-label-caps text-people-violet">{s.motifLabel}</p>
            <h3 className="mt-2 font-landing-display text-headline-lg text-text-primary">
              {s.name}
            </h3>
            <p className="mt-2 flex-1 text-body-md text-text-secondary">
              {s.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border-subtle bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                {s.homelandLgaCount} LGAs
              </span>
              <span className="rounded-full border border-border-subtle bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                {s.zonesLabel}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {stateIds.map((id) =>
                slugByStateId[id] ? (
                  <Link
                    key={id}
                    href={`/places/${slugByStateId[id]}`}
                    className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container hover:text-primary"
                  >
                    {slugByStateId[id].replace(/-/g, " ")}
                  </Link>
                ) : null
              )}
            </div>
            <Link
              href={s.exploreHref}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
            >
              Show on the map
            </Link>
          </article>
        );
      })}
    </div>
  );
}
