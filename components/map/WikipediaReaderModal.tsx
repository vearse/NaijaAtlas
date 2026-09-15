"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  fetchWikipediaArticle,
  wikiTitleFromUrl,
  type WikipediaArticle,
} from "@/lib/wikipedia/fetchArticle";

interface WikiPage {
  url: string;
  title?: string;
}

function WikiArticleBody({
  loading,
  error,
  article,
  onNavigate,
}: {
  loading: boolean;
  error: string | null;
  article: WikipediaArticle | null;
  onNavigate: (url: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleLoaded = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const win = e.currentTarget.contentWindow;
    const doc = win?.document;
    if (!doc) return;

    doc.addEventListener(
      "click",
      (ev) => {
        const target = ev.target as Element | null;
        if (!target || typeof target.closest !== "function") return;
        const anchor = target.closest("a");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href) return;
        if (href.startsWith("#")) return;

        let resolved: URL;
        try {
          resolved = new URL(href, doc.baseURI);
        } catch {
          return;
        }
        if (!resolved.hostname.includes("wikipedia.org")) return;
        if (resolved.href === doc.baseURI) return;
        ev.preventDefault();
        ev.stopPropagation();
        onNavigate(resolved.href);
      },
      true
    );
  };

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
        ref={iframeRef}
        srcDoc={article.html}
        title={article.title}
        onLoad={handleLoaded}
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
  canGoBack,
  backLabel,
  onBack,
  onClose,
}: {
  heading: string;
  pageUrl: string;
  canGoBack: boolean;
  backLabel: string;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 bg-gradient-to-r from-white to-sky-50/80">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Deep dive · Wikipedia
          </p>
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
            >
              <span aria-hidden>←</span>
              {backLabel}
            </button>
          )}
        </div>
        <h2 className="text-sm lg:text-lg font-bold text-slate-900 truncate mt-0.5">
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
  const featureName = wikiModal?.title;

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<WikipediaArticle | null>(null);

  const current = pages.length > 0 ? pages[pages.length - 1] : null;
  const currentUrl = current?.url ?? null;
  const canGoBack = pages.length > 1;
  const primaryTitle = pages.length > 1 ? (pages[0].title ?? "Original article") : "";

  const navigateTo = useCallback((url: string) => {
    setPages((prev) => [
      ...prev,
      { url, title: wikiTitleFromUrl(url) ?? undefined },
    ]);
  }, []);

  const goBack = useCallback(() => {
    setPages((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  useEffect(() => {
    if (!wikiModal) {
      setPages([]);
      return;
    }
    setPages([{ url: wikiModal.url, title: wikiModal.title }]);
  }, [wikiModal]);

  useEffect(() => {
    if (!open || !currentUrl) {
      setArticle(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setArticle(null);

    void fetchWikipediaArticle(currentUrl)
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
  }, [open, currentUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWikiModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeWikiModal]);

  if (!open || !current) return null;

  const heading = article?.title ?? current?.title ?? featureName ?? "Wikipedia";

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
          pageUrl={current.url}
          canGoBack={canGoBack}
          backLabel={primaryTitle}
          onBack={goBack}
          onClose={closeWikiModal}
        />
        <div className="flex-1 overflow-hidden flex flex-col px-4 py-3 min-h-0">
          <WikiArticleBody
            loading={loading}
            error={error}
            article={article}
            onNavigate={navigateTo}
          />
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
            pageUrl={current.url}
            canGoBack={canGoBack}
            backLabel={primaryTitle}
            onBack={goBack}
            onClose={closeWikiModal}
          />
          <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 min-h-0">
            <WikiArticleBody
              loading={loading}
              error={error}
              article={article}
              onNavigate={navigateTo}
            />
          </div>
        </div>
      </div>
    </>
  );
}