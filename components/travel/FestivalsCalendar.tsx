"use client";

import Link from "next/link";
import type { Festival, FestivalsCalendarData } from "@/lib/server/loadFestivalsCalendar";
import { festivalDayRange } from "@/lib/festivals";
import { IconMap } from "@/components/landing/icons";
import { useWikiReader } from "@/hooks/useWikiReader";

const TONE_BADGE: Record<Festival["tone"], string> = {
  primary: "bg-slate-100 text-text-secondary",
  amber: "bg-heritage-amber-tint text-heritage-amber border border-amber-200",
  slate: "bg-slate-100 text-text-secondary",
};

const TONE_CHIP: Record<Festival["tone"], string> = {
  primary:
    "bg-primary-tint-light border-primary/20 text-primary border",
  amber: "bg-surface-base border-border-subtle text-text-muted border",
  slate: "bg-surface-base border-border-subtle text-text-muted border",
};

function dayLabel(festival: Festival) {
  return festival.dateLabel ?? festivalDayRange(festival);
}

export default function FestivalsCalendar({
  calendar,
}: {
  calendar: FestivalsCalendarData;
}) {
  const { featured, isCurrentMonth, monthLabel, total } = calendar;
  const { openByName, resolving } = useWikiReader();

  if (featured.length === 0) return null;

  return (
    <section className="space-y-6" id="festivals">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-landing-display text-headline-lg tracking-tight text-text-primary">
            {isCurrentMonth ? "This month" : `Coming up in ${monthLabel}`}:
            Festivals &amp; Cultural Gatherings
          </h2>
          <p className="text-body-md text-text-secondary">
            Recurring national festivals and cultural gatherings, grouped by the
            month they run in.
          </p>
        </div>
        <div className="shrink-0 text-body-sm text-text-muted">
          Showing {featured.length} of {total} tracked events
        </div>
      </div>

      <div className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
        {featured.map((festival) => (
          <div
            key={festival.id}
            className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:p-5 md:flex-row md:items-center"
          >
            <div className="flex items-start gap-4 sm:items-center">
              <div
                className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-lg border text-center ${TONE_CHIP[festival.tone]}`}
              >
                <span className="font-label-caps text-label-caps font-bold uppercase">
                  {festival.month}
                </span>
                <span className="font-headline-sm text-headline-sm font-bold leading-none text-text-primary">
                  {dayLabel(festival)}
                </span>
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">
                    {festival.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 font-label-caps text-label-caps ${TONE_BADGE[festival.tone]}`}
                  >
                    {festival.category}
                  </span>
                </div>
                <p className="text-body-sm text-text-secondary">
                  {festival.stateName} ({festival.venue})
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 self-end md:self-center">
              <button
                type="button"
                onClick={() => void openByName(festival.name)}
                disabled={resolving === festival.name}
                className="inline-flex items-center gap-1 font-label-md text-label-md text-primary transition-opacity hover:underline disabled:opacity-60"
              >
                {resolving === festival.name ? "Loading…" : "Read more"}
              </button>
              <span className="text-slate-300" aria-hidden>
                |
              </span>
              <Link
                href={`/people?festival=${festival.id}`}
                className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline"
              >
                View festival in People
                <span aria-hidden>&rarr;</span>
              </Link>
              <span className="text-slate-300" aria-hidden>
                |
              </span>
              <Link
                href={`/travel/map?states=${festival.stateName}`}
                className="inline-flex items-center gap-1 font-label-md text-label-md text-text-secondary transition-colors hover:text-text-primary"
              >
                <IconMap className="w-4 h-4" />
                On map
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}