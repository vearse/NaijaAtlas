"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  OVERLAY_LAYER_GUIDES,
  OVERLAY_LAYER_LABELS,
  type OverlayLayerId,
  type SelectedOverlayFeature,
} from "@/types/overlay";
import { OVERLAY_REGISTRY } from "@/lib/map/overlayRegistry";
import { getTourGeoJSON } from "@/lib/map/tourCatalog";

interface GuideFeature {
  id: string;
  name: string;
  properties: Record<string, unknown>;
  geometry?: GeoJSON.Geometry | null;
}

const MAX_VISIBLE = 8;

function toGuideFeatures(json: unknown): GuideFeature[] {
  const fc = (json as { features?: unknown[] } | null)?.features;
  if (!Array.isArray(fc)) return [];
  const out: GuideFeature[] = [];
  for (const raw of fc) {
    const f = raw as {
      id?: string | number;
      geometry?: GeoJSON.Geometry;
      properties?: Record<string, unknown>;
    };
    const props = f?.properties ?? {};
    if (props.kind === "ocean" || props.interactive === false) continue;
    const id = String(props.id ?? f?.id ?? "");
    const name =
      typeof props.name === "string" && props.name.trim() ? props.name : "";
    if (!id || !name) continue;
    out.push({
      id,
      name,
      properties: props,
      geometry: f?.geometry ?? null,
    });
  }
  return out;
}

function useLayerFeatures(layerId: OverlayLayerId) {
  const [features, setFeatures] = useState<GuideFeature[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    setFeatures(null);
    setShowAll(false);
    fetch(OVERLAY_REGISTRY[layerId].geoPath)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!alive) return;
        const base = toGuideFeatures(json);
        if (layerId === "cities") {
          const tours = getTourGeoJSON().features.map((f) => {
            const props = (f.properties ?? {}) as Record<string, unknown>;
            return {
              id: String(props.id ?? ""),
              name: String(props.name ?? ""),
              properties: props,
              geometry: (f.geometry ?? null) as GeoJSON.Geometry | null,
            };
          });
          setFeatures([...base, ...tours]);
        } else {
          setFeatures(base);
        }
      })
      .catch(() => {
        if (alive) setFeatures([]);
      });
    return () => {
      alive = false;
    };
  }, [layerId]);

  const visibleCount = showAll ? features?.length ?? 0 : MAX_VISIBLE;

  return { features, visibleCount, showAll, setShowAll };
}

export default function OverlayLayerGuidePanel({
  layerId,
}: {
  layerId: OverlayLayerId;
}) {
  const clearOverlayGuide = useMapStore((s) => s.clearOverlayGuide);
  const setSelectedOverlay = useMapStore((s) => s.setSelectedOverlay);
  const guide = OVERLAY_LAYER_GUIDES[layerId];
  const meta = OVERLAY_LAYER_LABELS[layerId];
  const { features, visibleCount, showAll, setShowAll } =
    useLayerFeatures(layerId);

  const openFeature = (f: GuideFeature) => {
    const feature: SelectedOverlayFeature = {
      id: f.id,
      layerId,
      name: f.name,
      properties: f.properties,
      geometry: f.geometry,
    };
    setSelectedOverlay(feature);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {meta.label} layer · guide
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{guide.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => clearOverlayGuide()}
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close layer guide"
        >
          Close
        </button>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{guide.summary}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{guide.description}</p>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            What&apos;s on this layer
          </p>
          <ul className="space-y-1.5">
            {guide.includes.map((item) => (
              <li
                key={item}
                className="text-sm text-slate-700 pl-3 relative leading-relaxed"
              >
                <span className="absolute left-0 top-2 h-1 w-1 rounded-full bg-ng-green" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Map legend
          </p>
          <ul className="space-y-1">
            {guide.legend.map((item) => (
              <li key={item} className="text-xs text-slate-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-500 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 leading-relaxed">
        <span className="font-semibold text-emerald-800">Tip · </span>
        {guide.tip}
      </p>

      <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Explore {meta.short} features
          </p>
          {features != null && features.length > 0 && (
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">
              {features.length} on map
            </span>
          )}
        </div>

        {features == null && (
          <p className="text-xs text-slate-400 px-0.5 py-1">Loading features…</p>
        )}

        {features != null && features.length === 0 && (
          <p className="text-xs text-slate-400 px-0.5 py-1">
            No listable features on this layer.
          </p>
        )}

        {features != null && features.length > 0 && (
          <>
            <ul className="space-y-1">
              {features.slice(0, visibleCount).map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => openFeature(f)}
                    className="w-full group flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-left hover:border-ng-green/30 hover:bg-emerald-50/60 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {f.name}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-slate-400 group-hover:text-ng-green"
                    >
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {features.length > MAX_VISIBLE && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-ng-green/30 hover:text-ng-green transition-colors"
              >
                {showAll ? "Show fewer" : `Show all ${features.length} features`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}