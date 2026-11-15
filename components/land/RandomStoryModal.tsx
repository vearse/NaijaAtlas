"use client";

import { useEffect } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import type { HubCountryNote } from "@/lib/server/loadLandHubData";

const CATEGORY_STYLES: Record<string, string> = {
  history: "bg-sky-50 text-sky-700 border-sky-200",
  culture: "bg-violet-50 text-violet-700 border-violet-200",
  festival: "bg-pink-50 text-pink-700 border-pink-200",
  institution: "bg-orange-50 text-orange-700 border-orange-200",
  geography: "bg-amber-50 text-amber-700 border-amber-200",
  economy: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function ShuffleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}

/** A single random country story, shown as a lightweight modal on the Land hub. */
export default function RandomStoryModal({
  story,
  onClose,
  onAnother,
}: {
  story: HubCountryNote | null;
  onClose: () => void;
  onAnother: () => void;
}) {
  const openWikiModal = useMapStore((s) => s.openWikiModal);

  useEffect(() => {
    if (!story) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [story, onClose]);

  if (!story) return null;

  const readOnWikipedia = () => {
    if (!story.url) return;
    onClose();
    openWikiModal(story.url, story.title);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close random story"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Random story: ${story.title}`}
          className="pointer-events-auto flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-3xl border border-border-subtle bg-surface-card shadow-2xl animate-scale-in"
        >
          <div className="bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-6 py-7 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-label-caps uppercase text-primary">
                  Random story · Nigeria
                </p>
                <h2 className="mt-2 font-landing-display text-headline-xl tracking-tight text-text-primary">
                  {story.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-xl leading-none text-text-secondary shadow-sm transition-colors hover:bg-white hover:text-text-primary"
              >
                ×
              </button>
            </div>
            <span
              className={`mt-4 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                CATEGORY_STYLES[story.category] ??
                "bg-slate-50 text-text-secondary border-border-subtle"
              }`}
            >
              {story.category}
            </span>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <p className="text-body-lg leading-relaxed text-text-secondary">
              {story.note}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onAnother}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-container px-5 text-label-md font-semibold text-white transition-colors hover:bg-[#006d40]"
              >
                <ShuffleIcon />
                Another story
              </button>
              {story.url && (
                <button
                  type="button"
                  onClick={readOnWikipedia}
                  className="inline-flex h-11 items-center rounded-xl border border-border-subtle px-5 text-label-md font-semibold text-text-secondary transition-colors hover:border-primary-container hover:text-primary"
                >
                  Read on Wikipedia ↗
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
