"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import type { SearchEntry } from "@/types/location";
import { exploreUrlFromSearch } from "@/lib/landing/exploreUrlFromSearch";
import { IconSearch } from "@/components/landing/icons";

const POPULAR = [
  { label: "Lagos", href: "/explore?map=minimal&states=NG-LA" },
  {
    label: "Osun-Osogbo Festival",
    href: "/explore?lens=tourist",
  },
  { label: "Kainji Lake", href: "/explore?lens=learn" },
  {
    label: "Senate districts",
    href: "/explore?map=election",
  },
];

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
        className={`relative flex items-center w-full rounded-full bg-surface-container-lowest/80 border border-outline-variant/60 shadow-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 backdrop-blur-lg transition-all ${
          inSpotlight ? "ring-2 ring-primary/30" : ""
        }`}
      >
        <span className="text-outline ml-4 shrink-0">
          <IconSearch className="w-5 h-5" />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query && search(query)}
          placeholder="Search a state, LGA, festival, candidate or polling unit…"
          className="w-full bg-transparent border-0 py-3.5 px-3 text-body-md text-on-surface placeholder:text-outline-variant focus:ring-0 focus:outline-none"
          aria-label="Search Nigeria"
          autoComplete="off"
        />
        <div className="mr-3 hidden sm:flex items-center">
          <kbd className="px-2.5 py-1 text-label-caps text-on-surface-variant bg-surface-container border border-outline-variant rounded-md">
            ⌘K
          </kbd>
        </div>
      </div>

      {showDropdown && (
        <ul
          className="absolute z-50 mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-high shadow-2xl overflow-hidden"
          role="listbox"
        >
          {results.map((entry) => (
            <li key={`${entry.level}-${entry.id}`}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-surface-container text-body-sm text-on-surface border-b border-outline-variant/20 last:border-0"
                onMouseDown={() => pick(entry)}
              >
                <span className="font-medium">{entry.name}</span>
                {entry.stateName && (
                  <span className="text-on-surface-variant ml-2">
                    · {entry.stateName}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!inSpotlight && (
        <div className="flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant pt-3">
          <span className="text-outline text-body-sm">Popular:</span>
          {POPULAR.map((p) => (
            <a
              key={p.label}
              href={p.href}
              className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-on-surface transition-colors text-body-sm"
            >
              {p.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
