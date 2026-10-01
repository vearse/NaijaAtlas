"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { useWikiReader } from "@/hooks/useWikiReader";
import type { StateOverviewData } from "@/lib/server/stateOverview";
import type { WikiNote } from "@/types/location";

const NOTE_CATEGORY_STYLES: Record<string, string> = {
  history: "bg-sky-50 text-sky-700 border-sky-200",
  culture: "bg-violet-50 text-violet-700 border-violet-200",
  economy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  geography: "bg-amber-50 text-amber-700 border-amber-200",
  festival: "bg-pink-50 text-pink-700 border-pink-200",
  institution: "bg-orange-50 text-orange-700 border-orange-200",
};

function formatPeriod(period: NonNullable<WikiNote["period"]>): string | null {
  const months = period.months?.length ? period.months.join("/") : null;
  if (period.frequency && months) return `${months} · ${period.frequency}`;
  return period.frequency ?? months;
}

type Props = {
  overview: StateOverviewData;
  /** `preview` is the hub teaser with a map and a profile CTA; `full` lists everything. */
  variant?: "preview" | "full";
  accent?: string;
};

export default function StateOverviewPanel({
  overview: o,
  variant = "preview",
  accent = "#7c3aed",
}: Props) {
  const reduceMotion = useReducedMotion();
  const { openArticle } = useWikiReader();
  const preview = variant === "preview";
  const notes = preview ? o.notes.slice(0, 3) : o.notes;
  const metros = preview ? o.metros.slice(0, 2) : o.metros;

  const details = (
    <div className="min-w-0 space-y-6">
      {preview && (
        <p className="text-body-md leading-relaxed text-text-secondary">{o.description}</p>
      )}

      {o.languages.length > 0 && (
        <div>
          <h4 className="text-label-caps uppercase tracking-wider text-text-muted">
            Languages spoken
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {o.languages.map((lang) => (
              <button
                key={lang.name}
                type="button"
                onClick={() => openArticle(lang.wikiUrl, lang.name)}
                className="rounded-full border px-3 py-1 text-body-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color: accent, borderColor: `${accent}33`, backgroundColor: `${accent}14` }}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {o.majorCities.length > 0 && (
        <div>
          <h4 className="text-label-caps uppercase tracking-wider text-text-muted">
            Major cities
          </h4>
          <p className="mt-1.5 text-body-sm font-semibold text-text-primary">
            {o.majorCities.join(" · ")}
          </p>
        </div>
      )}

      {notes.length > 0 && (
        <div>
          <h4 className="text-label-caps uppercase tracking-wider text-text-muted">
            What to explore · learn
          </h4>
          <ul className={`mt-2 grid gap-2 ${preview ? "" : "md:grid-cols-2"}`}>
            {notes.map((n, i) => {
              const period = n.period ? formatPeriod(n.period) : null;
              return (
                <li key={`${n.title}-${i}`} className="rounded-xl border border-border-subtle bg-white px-3.5 py-3">
                  <button
                    type="button"
                    onClick={() => openArticle(n.url, n.title)}
                    className="group flex flex-wrap items-center gap-1.5 text-left text-body-sm font-semibold text-text-primary"
                  >
                    <span className="group-hover:text-primary">{n.title}</span>
                    <span
                      className={`rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                        NOTE_CATEGORY_STYLES[n.category] ?? "border-border-subtle bg-slate-50 text-text-secondary"
                      }`}
                    >
                      {n.category}
                    </span>
                  </button>
                  <p className="mt-1 text-[12px] leading-snug text-text-secondary">{n.note}</p>
                  {(period || n.locations?.length) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                      {period && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-px font-medium text-amber-700">
                          {period}
                        </span>
                      )}
                      {n.locations?.slice(0, 3).map((loc) => (
                        <span
                          key={loc.name}
                          className="rounded-full border border-sky-200 bg-sky-50 px-1.5 py-px font-medium text-sky-700"
                        >
                          {loc.name}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {metros.length > 0 && (
        <div>
          <h4 className="text-label-caps uppercase tracking-wider text-text-muted">
            Metro areas
          </h4>
          <ul className="mt-2 space-y-2">
            {metros.map((m) => (
              <li key={m.id} className="rounded-xl border border-border-subtle bg-slate-50/70 px-3.5 py-3">
                <p className="text-body-sm font-semibold text-text-primary">{m.name}</p>
                {m.description && (
                  <p className={`mt-0.5 text-[12px] text-text-secondary ${preview ? "line-clamp-2" : ""}`}>
                    {m.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview && (
        <Link
          href={`/places/${o.slug}`}
          className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-label-md font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Open the full {o.name} profile
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );

  if (!preview) return details;

  return (
    <div className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={o.id}
          className="grid gap-0 lg:grid-cols-12"
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -8 },
                transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
              })}
        >
          <div className="relative bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6 landing-topo-grid lg:col-span-5">
            <NigeriaThumb
              source="states"
              highlight={[o.id]}
              accent={accent}
              className="mx-auto h-64 w-full"
              title={`${o.name} on the map`}
            />
            <div className="mt-4 rounded-2xl border border-white/80 bg-white/85 p-5 shadow-lg backdrop-blur">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-label-caps uppercase" style={{ color: accent }}>
                    Selected state
                  </span>
                  <h3 className="font-landing-display text-headline-md text-text-primary">
                    {o.name}
                  </h3>
                  {o.nickname && (
                    <p className="text-body-sm italic text-text-muted">{o.nickname}</p>
                  )}
                </div>
                <span className="shrink-0 rounded bg-emerald-100 px-2.5 py-1 text-label-caps text-primary-container">
                  {o.region}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-body-sm">
                <div>
                  <dt className="text-[11px] uppercase text-text-muted">Capital</dt>
                  <dd className="font-semibold text-text-primary">{o.capital ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase text-text-muted">Created</dt>
                  <dd className="font-semibold text-text-primary">{o.founded ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="p-6 lg:col-span-7">{details}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
