"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import type { SearchEntry } from "@/types/location";
import { exploreUrlFromSearch } from "@/lib/landing/exploreUrlFromSearch";
import { IconArrow, IconSearch } from "@/components/landing/icons";

type Props = {
  spotlightOpen?: boolean;
  onSpotlightClose?: () => void;
};

export default function LandingSearch({
  spotlightOpen = false,
  onSpotlightClose,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        fuseRef.current = new Fuse(data, {
          keys: ["name", "stateName", "category"],
          threshold: 0.35,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (spotlightOpen) {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [spotlightOpen]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim() || !fuseRef.current) {
      setResults([]);
      setOpen(false);
      return;
    }
    const found = fuseRef.current.search(q, { limit: 8 }).map((r) => r.item);
    setResults(found);
    setOpen(found.length > 0);
  }, []);

  const pick = (entry: SearchEntry) => {
    setOpen(false);
    onSpotlightClose?.();
    router.push(exploreUrlFromSearch(entry));
  };

  const showDropdown = open && results.length > 0;
  const inSpotlight = spotlightOpen;

  return (
    <div className="relative w-full max-w-xl">
      <div
        className={`relative flex items-center w-full rounded-full bg-surface-card border border-border-subtle shadow-sm focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all ${
          inSpotlight ? "ring-2 ring-primary-container/30" : ""
        }`}
      >
        <span className="text-slate-400 ml-4 shrink-0">
          <IconSearch className="w-5 h-5" />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query && search(query)}
          placeholder="Search a state, LGA, festival, or candidate…"
          className="w-full bg-transparent border-0 py-3.5 px-3 text-body-md text-text-primary placeholder:text-slate-400 focus:ring-0 focus:outline-none"
          aria-label="Search Nigeria"
          autoComplete="off"
        />
        <div className="mr-2 flex items-center gap-2">
          <kbd className="hidden sm:inline-block px-2.5 py-1 text-[11px] text-text-muted bg-slate-100 border border-border-subtle rounded-md shadow-inner">
            ⌘K
          </kbd>
          <button
            type="button"
            aria-label="Search submit"
            onClick={() => query && search(query)}
            className="bg-primary-container hover:bg-primary text-white p-2.5 rounded-full flex items-center justify-center transition-colors shadow-sm active:scale-95"
          >
            <IconArrow className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {showDropdown && (
        <ul
          className="absolute z-50 mt-2 w-full rounded-xl border border-border-subtle bg-surface-card shadow-2xl overflow-hidden"
          role="listbox"
        >
          {results.map((entry) => (
            <li key={`${entry.level}-${entry.id}`}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-body-sm text-text-primary border-b border-slate-100 last:border-0"
                onMouseDown={() => pick(entry)}
              >
                <span className="font-medium">{entry.name}</span>
                {entry.stateName && (
                  <span className="text-text-muted ml-2">
                    · {entry.stateName}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!inSpotlight && null}
    </div>
  );
}
