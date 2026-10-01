"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type HubSwitcherItem = {
  href: string;
  label: string;
  tone: "primary" | "neutral" | "amber" | "rose" | "sky" | "slate";
  dot?: string;
  icon?: React.ReactNode;
};

type Props = {
  items: HubSwitcherItem[];
  /** Uppercase caption rendered to the left of the pills. */
  label?: string;
  /** Small source note pinned to the right edge of the bar. */
  note?: string;
  /** Offset from the viewport top, matching the sticky header height. */
  offsetClassName?: string;
  containerClassName?: string;
  /** Optional node pinned to the left edge, e.g. a breadcrumb. */
  leading?: React.ReactNode;
  /** `segmented` nests the pills in one slate track (the Places/Land bar). */
  variant?: "pill" | "segmented";
};

const TONE_PILL: Record<HubSwitcherItem["tone"], string> = {
  primary:
    "bg-primary-tint-light text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  rose: "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100",
  sky: "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100",
  amber:
    "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
  slate: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
  neutral:
    "text-text-secondary hover:text-text-primary hover:bg-slate-100 border-transparent",
};

export default function HubSectionSwitcher({
  items,
  label,
  note,
  offsetClassName = "top-16",
  containerClassName = "max-w-7xl px-6",
  leading,
  variant = "pill",
}: Props) {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => {
        const id = item.href.replace("#", "");
        return id ? document.getElementById(id) : null;
      })
      .filter((el): el is HTMLElement => Boolean(el));

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHref(`#${visible[0].target.id}`);
      },
      { rootMargin: "-124px 0px -55% 0px", threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      className={`sticky ${offsetClassName} z-40 border-b border-border-subtle bg-surface-card/95 backdrop-blur-md shadow-sm`}
    >
      <div
        className={`${containerClassName} flex items-center justify-between gap-4 py-2.5`}
      >
        {leading ? (
          <div className="hidden shrink-0 items-center gap-2 text-body-sm font-body-sm text-text-muted md:flex">
            {leading}
          </div>
        ) : null}

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {label ? (
            <span className="mr-2 whitespace-nowrap font-label-caps text-label-caps text-text-muted">
              {label}
            </span>
          ) : null}
          <div
            className={
              variant === "segmented"
                ? "flex items-center gap-1 rounded-full border border-border-subtle bg-slate-100 p-1"
                : "flex items-center gap-2"
            }
          >
            {items.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "true" : undefined}
                  className={
                    variant === "segmented"
                      ? `whitespace-nowrap rounded-full px-3.5 py-1 text-body-sm font-body-sm transition-all ${
                          active
                            ? "bg-surface-card text-primary font-semibold shadow-sm"
                            : "text-text-secondary hover:text-text-primary"
                        }`
                      : `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-label-md text-label-md transition-colors ${
                          active
                            ? item.tone === "neutral"
                              ? "border-border-subtle bg-slate-100 font-semibold text-text-primary shadow-xs"
                              : TONE_PILL[item.tone]
                            : TONE_PILL[item.tone]
                        } ${active ? "shadow-xs" : ""}`
                  }
                >
                  {item.dot ? (
                    <span
                      className={`h-2 w-2 rounded-full ${item.dot}`}
                      aria-hidden
                    />
                  ) : null}
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {note ? (
          <div className="hidden items-center gap-2 text-body-sm font-body-sm text-text-muted lg:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-primary-container" />
            <span>{note}</span>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
