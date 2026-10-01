"use client";

import { useCallback, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  resolveWikipediaUrl,
  wikipediaUrlForTitle,
} from "@/lib/wikipedia/fetchArticle";

/**
 * Opens the app's existing Wikipedia reader from anywhere, including the
 * marketing hubs where it is not otherwise wired up.
 */
export function useWikiReader() {
  const openWikiModal = useMapStore((s) => s.openWikiModal);
  const [resolving, setResolving] = useState<string | null>(null);

  /** Open a known article URL in the reader. */
  const openArticle = useCallback(
    (url: string, title?: string) => openWikiModal(url, title),
    [openWikiModal]
  );

  /**
   * Open by plain name. Catalogue labels are descriptive more often than they
   * are exact article titles, so resolve through Wikipedia search first and
   * fall back to the guessed /wiki/ path when the lookup is unavailable.
   */
  const openByName = useCallback(
    async (name: string) => {
      setResolving(name);
      try {
        const url = await resolveWikipediaUrl(name);
        openWikiModal(url ?? wikipediaUrlForTitle(name), name);
      } catch {
        openWikiModal(wikipediaUrlForTitle(name), name);
      } finally {
        setResolving(null);
      }
    },
    [openWikiModal]
  );

  return { openArticle, openByName, resolving };
}