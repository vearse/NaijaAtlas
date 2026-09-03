"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Fuse from "fuse.js";
import { useMapStore } from "@/lib/store/mapStore";
import type { SearchEntry } from "@/types/location";

export default function LocationSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);
  const { selectStates, setSelectedLga } = useMapStore();

  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setIndex(data);
        fuseRef.current = new Fuse(data, {
          keys: ["name", "stateName", "regionName"],
          threshold: 0.35,
          includeScore: true,
        });
      });
  }, []);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim() || !fuseRef.current) {
      setResults([]);
      return;
    }
    const found = fuseRef.current.search(q, { limit: 8 }).map((r) => r.item);
    setResults(found);
    setOpen(true);
  }, []);

  const selectResult = (entry: SearchEntry) => {
    setOpen(false);
    setQuery(entry.name);
    if (entry.level === "state") {
      selectStates([entry.id]);
    } else if (entry.level === "lga" && entry.parentId) {
      selectStates([entry.parentId]);
      setTimeout(() => setSelectedLga(entry.id), 300);
    } else if (entry.level === "country") {
      useMapStore.getState().reset();
    }
  };

  return (
    <div className="relative w-full">
      <label htmlFor="location-search" className="sr-only">
        Search states and LGAs
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>
        <input
          id="location-search"
          type="search"
          placeholder="Search states & LGAs…"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query && setOpen(true)}
          className="w-full rounded-xl border border-slate-200 bg-white/95 backdrop-blur pl-10 pr-4 py-2.5 text-sm shadow-sm min-h-[42px] focus:outline-none focus:ring-2 focus:ring-ng-green/40"
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
          role="listbox"
        >
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => selectResult(r)}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-2"
              >
                <span className="font-medium text-slate-800">{r.name}</span>
                <span className="text-xs text-slate-500 shrink-0">
                  {r.level === "lga" && r.stateName
                    ? `${r.stateName} · LGA`
                    : r.level === "state"
                      ? `${r.regionName ?? "State"}`
                      : "Country"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
