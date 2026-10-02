"use client";

import type { ReactNode } from "react";

/**
 * The profile design tints each subject band (land = sky, economy = emerald,
 * data = amber). The tabbed shell keeps every band inside `main`, so the tint is
 * applied to an inset rounded panel rather than a full-bleed strip.
 */
const TONES = {
  plain: "border-border-subtle bg-surface-card",
  sky: "border-sky-100 bg-[#f0f9ff]",
  emerald: "border-emerald-100 bg-[#ecfdf5]",
  amber: "border-amber-100 bg-[#fff7ed]",
  slate: "border-border-subtle bg-slate-100/70",
} as const;

export type ProfileSectionTone = keyof typeof TONES;

export default function ProfileSection({
  id,
  kicker,
  title,
  lede,
  tone = "plain",
  action,
  children,
}: {
  id?: string;
  kicker?: string;
  title: string;
  lede?: string;
  tone?: ProfileSectionTone;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-3xl border px-5 py-7 md:px-8 md:py-9 ${TONES[tone]}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {kicker ? (
            <p className="text-label-caps uppercase text-text-muted">{kicker}</p>
          ) : null}
          <h2 className="mt-1 font-landing-display text-headline-xl text-text-primary">
            {title}
          </h2>
          {lede ? (
            <p className="mt-2 max-w-2xl text-body-md text-text-secondary">{lede}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}