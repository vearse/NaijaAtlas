"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  fetchWikipediaArticle,
  type WikipediaArticle,
} from "@/lib/wikipedia/fetchArticle";

function WikiArticleBody({
  loading,
  error,
  article,
}: {
  loading: boolean;
  error: string | null;
  article: WikipediaArticle | null;
}) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[70vh] text-slate-500 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
        <p className="text-sm">Loading article…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <iframe
        srcDoc={article.html}
        title={article.title}
        className="w-full flex-1 min-h-0 border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
      <p className="shrink-0 text-[11px] text-slate-400 px-1 pt-2 border-t border-slate-100">
        Full article from Wikipedia under CC BY-SA.
      </p>
    </div>
  );
}

function WikiModalHeader({
  heading,
  pageUrl,
  onClose,
}: {
  heading: string;
  pageUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 bg-gradient-to-r from-white to-sky-50/80">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
          Deep dive · Wikipedia
        </p>
        <h2 className="text-sm lg:text-lg font-bold text-slate-900 truncate">
          {heading}
        </h2>
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-0.5 text-xs font-medium text-sky-700 hover:text-sky-900 underline underline-offset-2"
        >
          Open on Wikipedia
          <span aria-hidden>↗</span>
        </a>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 h-9 w-9 lg:h-10 lg:w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xl leading-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

/** App-level Wikipedia reader — mounted once in ExplorerShell. */
export default function WikipediaReaderModal() {
  const wikiModal = useMapStore((s) => s.wikiModal);
  const closeWikiModal = useMapStore((s) => s.closeWikiModal);

  const open = wikiModal !== null;
  const wikiUrl = wikiModal?.url ?? null;
  const featureName = wikiModal?.title;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<WikipediaArticle | null>(null);

  useEffect(() => {
    if (!open || !wikiUrl) {
      setArticle(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setArticle(null);

    void fetchWikipediaArticle(wikiUrl)
      .then((result) => {
        if (!cancelled) setArticle(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load Wikipedia article"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, wikiUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWikiModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeWikiModal]);

  if (!open || !wikiUrl) return null;

  const heading = article?.title ?? featureName ?? "Wikipedia";

  return (
    <>
      <button
        type="button"
        aria-label="Close deep dive"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:bg-black/45"
        onClick={closeWikiModal}
      />

      {/* Mobile — tall reader shell (~85%+ viewport) */}
      <div
        className="fixed inset-x-2 top-[3vh] sm:inset-x-3 sm:top-[4vh] z-[60] lg:hidden flex flex-col h-[min(94dvh,880px)] min-h-[85dvh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label={`Wikipedia: ${heading}`}
      >
        <WikiModalHeader
          heading={heading}
          pageUrl={wikiUrl}
          onClose={closeWikiModal}
        />
        <div className="flex-1 overflow-hidden flex flex-col px-4 py-3 min-h-0">
          <WikiArticleBody loading={loading} error={error} article={article} />
        </div>
      </div>

      {/* Desktop — same footprint as DesktopCompareModal */}
      <div
        className="fixed inset-0 z-[60] hidden lg:flex items-center justify-center p-6 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Wikipedia: ${heading}`}
      >
        <div className="pointer-events-auto w-full max-w-4xl h-[min(92vh,880px)] min-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in">
          <WikiModalHeader
            heading={heading}
            pageUrl={wikiUrl}
            onClose={closeWikiModal}
          />
          <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 min-h-0">
            <WikiArticleBody loading={loading} error={error} article={article} />
          </div>
        </div>
      </div>
    </>
  );
}
