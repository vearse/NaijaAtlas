"use client";

import GetDirectionsButton from "@/components/directions/GetDirectionsButton";
import type { StateOverlayItem } from "@/lib/lenses/stateOverlayItems";

interface OverlayItemListProps {
  title: string;
  items: StateOverlayItem[];
  onSelect: (item: StateOverlayItem) => void;
  openWikiModal: (url: string, title?: string) => void;
  fallbackLonLat?: [number, number] | null;
}

export default function OverlayItemList({
  title,
  items,
  onSelect,
  openWikiModal,
  fallbackLonLat,
}: OverlayItemListProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {title} ({items.length})
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-100 px-3 py-2.5"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="group w-full text-left"
            >
              <span className="flex items-center flex-wrap gap-1.5 text-sm font-semibold text-slate-800 group-hover:text-ng-green">
                {item.name}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.category}
                </span>
              </span>
            </button>
            {item.summary && (
              <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-3">
                {item.summary}
              </p>
            )}
            <div className="flex justify-between">  
              {item.wikiUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openWikiModal(item.wikiUrl!, item.name);
                  }}
                  className="mt-1.5 text-[11px] font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900"
                >
                  Wikipedia
                </button>
              )}
              <div className="mt-2">
                <GetDirectionsButton
                  name={item.name}
                  lonLat={
                    item.lon != null && item.lat != null
                      ? [item.lon, item.lat]
                      : fallbackLonLat
                  }
                  kind="overlay"
                  label="Get directions"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}