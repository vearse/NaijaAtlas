"use client";

import { useMemo, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import type { HubCountryNote } from "@/lib/server/loadLandHubData";

const CATEGORY_ORDER = [
  "history",
  "culture",
  "geography",
  "economy",
  "institution",
  "festival",
];

const CATEGORY_STYLES: Record<string, string> = {
  history: "bg-sky-50 text-sky-700 border-sky-200",
  culture: "bg-violet-50 text-violet-700 border-violet-200",
  festival: "bg-pink-50 text-pink-700 border-pink-200",
  institution: "bg-orange-50 text-orange-700 border-orange-200",
  geography: "bg-amber-50 text-amber-700 border-amber-200",
  economy: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PAGE = 6;

/** Country notes from the atlas overview, shown as browsable highlight cards. */
export default function NigeriaHighlights({ notes }: { notes: HubCountryNote[] }) {
  const openWikiModal = useMapStore((s) => s.openWikiModal);
  const [category, setCategory] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE);

  const categories = useMemo(() => {
    const present = new Set(notes.map((n) => n.category));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    for (const c of present) if (!ordered.includes(c)) ordered.push(c);
    return ordered;
  }, [notes]);

  const filtered = useMemo(
    () => (category === "all" ? notes : notes.filter((n) => n.category === category)),
    [notes, category]
  );

  const choose = (c: string) => {
    setCategory(c);
    setVisible(PAGE);
  };

  if (notes.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {["all", ...categories].map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              type="button"
              onClick={() => choose(c)}
              aria-pressed={active}
              className={`h-9 rounded-full border px-4 text-body-sm font-semibold capitalize transition-colors ${
                active
                  ? "border-primary-container bg-primary-container text-white"
                  : "border-border-subtle bg-surface-card text-text-secondary hover:border-slate-300 hover:text-text-primary"
              }`}
            >
              {c === "all" ? "All highlights" : c}
            </button>
          );
        })}
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, visible).map((n) => (
          <li
            key={n.title}
            className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
          >
            <span
              className={`w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                CATEGORY_STYLES[n.category] ?? "bg-slate-50 text-text-secondary border-border-subtle"
              }`}
            >
              {n.category}
            </span>
            <h3 className="mt-3 font-landing-display text-headline-sm text-text-primary">
              {n.title}
            </h3>
            <p className="mt-2 flex-1 text-body-sm text-text-secondary">{n.note}</p>
            {n.url && (
              <button
                type="button"
                onClick={() => openWikiModal(n.url, n.title)}
                className="mt-4 text-left text-body-sm font-semibold text-primary hover:underline"
              >
                Read the story &rarr;
              </button>
            )}
          </li>
        ))}
      </ul>

      {visible < filtered.length && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className="inline-flex h-11 items-center rounded-xl border border-primary-container px-5 text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Show more highlights
          </button>
        </div>
      )}
    </div>
  );
}
