"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Fuse from "fuse.js";
import { useMapStore } from "@/lib/store/mapStore";
import type { SearchEntry, OverlayLevel } from "@/types/location";
import type { OverlayLayerId } from "@/types/overlay";

const OVERLAY_LEVELS = new Set<OverlayLevel>([
  "landform",
  "resource",
  "city",
  "lake",
  "waterway",
  "coast",
]);

function isOverlayLevel(level: string): level is OverlayLevel {
  return (OVERLAY_LEVELS as Set<string>).has(level);
}

const LEVEL_EMOJI: Record<string, string> = {
  country: "🇳🇬",
  state: "🗺️",
  lga: "🏘️",
  landform: "🏔️",
  resource: "⛏️",
  city: "🏙️",
  lake: "💧",
  waterway: "🌊",
  coast: "🌊",
};

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
          keys: [
            { name: "name", weight: 0.6 },
            { name: "stateName", weight: 0.18 },
            { name: "regionName", weight: 0.12 },
            { name: "typeLabel", weight: 0.1 },
          ],
          threshold: 0.38,
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
    const found = fuseRef.current.search(q, { limit: 10 }).map((r) => r.item);
    setResults(found);
    setOpen(true);
  }, []);

  const selectResult = (entry: SearchEntry) => {
    setOpen(false);
    setQuery(entry.name);

    const store = useMapStore.getState();
    const map = store.mapInstance;

    if (entry.level === "state") {
      selectStates([entry.id]);
      if (map && entry.bbox) {
        const b = entry.bbox;
        map.fitBounds(
          [
            [b[0], b[1]],
            [b[2], b[3]],
          ],
          { padding: 40, duration: 400 }
        );
      }
      return;
    }

    if (entry.level === "lga" && entry.parentId) {
      selectStates([entry.parentId]);
      setTimeout(() => setSelectedLga(entry.id), 300);
      if (map && entry.bbox) {
        const b = entry.bbox;
        setTimeout(() => {
          map.fitBounds(
            [
              [b[0], b[1]],
              [b[2], b[3]],
            ],
            { padding: 30, duration: 400 }
          );
        }, 400);
      }
      return;
    }

    if (entry.level === "country") {
      store.reset();
      if (map) {
        map.fitBounds(
          [
            [2.7, 4.1],
            [14.7, 13.9],
          ],
          { padding: 30, duration: 400 }
        );
      }
      return;
    }

    if (isOverlayLevel(entry.level) && entry.layerId) {
      const layerId = entry.layerId as OverlayLayerId;
      if (!store.activeOverlays.has(layerId)) {
        store.toggleOverlay(layerId);
      }

      if (map && entry.centroid) {
        map.flyTo({
          center: [entry.centroid[0], entry.centroid[1]],
          zoom: Math.max((map.getZoom() ?? 5), 6.5),
          speed: 0.9,
        });
      }

      setTimeout(() => {
        const cat = useMapStore.getState();
        const liveMap = cat.mapInstance;
        const props: Record<string, unknown> = {};
        if (entry.summary) props.summary = entry.summary;
        if (entry.typeLabel) props.type = entry.typeLabel;

        cat.setSelectedOverlay({
          id: entry.id,
          layerId,
          name: entry.name,
          properties: props,
        });

        if (liveMap && entry.centroid) {
          const layers = cat.activeOverlays;
          const layerIds: string[] = [];
          for (const lid of layers) {
            if (lid === "cities") layerIds.push("overlay-cities-points");
            else if (lid === "resources") layerIds.push("overlay-resources-points");
            else if (lid === "landforms") layerIds.push("overlay-landforms-points");
            else if (lid === "lakes") layerIds.push("overlay-lakes-points", "overlay-lakes-poly");
          }
          const hits = liveMap.queryRenderedFeatures(
            liveMap.project([entry.centroid![0], entry.centroid![1]]),
            { layers: layerIds }
          );
          if (hits.length) {
            const hit = hits[0];
            const overlayLayerId = (hit.layer.id.startsWith("overlay-")
              ? hit.layer.id.slice("overlay-".length).split("-")[0]
              : layerId) as OverlayLayerId;
            const validLayers: OverlayLayerId[] = ["waterways", "lakes", "coast", "landforms", "cities", "resources"];
            const resolvedLayer = validLayers.includes(overlayLayerId)
              ? overlayLayerId
              : layerId;
            cat.setSelectedOverlay({
              id: String(hit.properties?.id ?? entry.id),
              layerId: resolvedLayer,
              name: String(hit.properties?.name ?? entry.name),
              properties: (hit.properties as Record<string, unknown>) ?? props,
            });
          }
        }
      }, 500);
    }
  };

  function resultLabel(entry: SearchEntry): string {
    if (entry.level === "lga" && entry.stateName) {
      return `${entry.stateName} · LGA`;
    }
    if (entry.level === "state") {
      return entry.regionName ?? "State";
    }
    if (entry.level === "country") {
      return "Country";
    }
    if (isOverlayLevel(entry.level) && entry.typeLabel) {
      return entry.stateName ? `${entry.stateName} · ${entry.typeLabel}` : entry.typeLabel;
    }
    if (entry.level === "city" && entry.typeLabel) return entry.typeLabel;
    if (entry.level === "resource" && entry.typeLabel) return entry.typeLabel;
    if (entry.level === "landform" && entry.typeLabel) return entry.typeLabel;
    if (entry.level === "lake" && entry.typeLabel) return entry.typeLabel;
    return entry.stateName ?? "";
  }

  return (
    <div className="relative w-full">
      <label htmlFor="location-search" className="sr-only">
        Search states, LGAs, landmarks & minerals
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>
        <input
          id="location-search"
          type="search"
          placeholder="Search states, LGAs, landmarks & minerals…"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query && setOpen(true)}
          className="w-full rounded-xl border border-slate-200 bg-white/95 backdrop-blur pl-10 pr-4 py-2.5 text-sm shadow-sm min-h-[42px] focus:outline-none focus:ring-2 focus:ring-ng-green/40"
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto"
          role="listbox"
        >
          {results.map((r) => (
            <li key={`${r.level}-${r.id}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => selectResult(r)}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0" aria-hidden>
                    {LEVEL_EMOJI[r.level] ?? "📍"}
                  </span>
                  <span className="font-medium text-slate-800 truncate">{r.name}</span>
                </span>
                <span className="text-xs text-slate-500 shrink-0 text-right">
                  {resultLabel(r)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
