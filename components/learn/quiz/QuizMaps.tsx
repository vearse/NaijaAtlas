"use client";

import { useEffect, useMemo, useState } from "react";
import { NIGERIA_STATE_PATHS, NIGERIA_VIEW_BOX } from "@/data/geo/hubThumbs";
import { projectLgaSvg, type LgaFeatureCollection, type StateLgaSvg } from "@/lib/geo/projectLgaSvg";
import PickMap, { type ShapeState } from "@/components/learn/quiz/PickMap";

const lgaCache = new Map<string, Promise<StateLgaSvg | null>>();

function loadLgaSvg(stateId: string): Promise<StateLgaSvg | null> {
  if (!lgaCache.has(stateId)) {
    lgaCache.set(
      stateId,
      fetch(`/geo/lgas/${stateId}.geojson`)
        .then((r) => (r.ok ? (r.json() as Promise<LgaFeatureCollection>) : null))
        .then((geo) => (geo ? projectLgaSvg(geo) : null))
        .catch(() => {
          lgaCache.delete(stateId);
          return null;
        })
    );
  }
  return lgaCache.get(stateId)!;
}

export function useStateLgaSvg(stateId: string | null | undefined) {
  const [data, setData] = useState<{ id: string; svg: StateLgaSvg | null } | null>(null);
  useEffect(() => {
    if (!stateId) return;
    let live = true;
    loadLgaSvg(stateId).then((svg) => live && setData({ id: stateId, svg }));
    return () => {
      live = false;
    };
  }, [stateId]);
  return data && data.id === stateId ? data.svg : undefined;
}

/** Warms the cache so the next LGA map appears instantly. */
export function prefetchLgaSvg(stateId: string | null | undefined) {
  if (stateId) void loadLgaSvg(stateId);
}

type MapCommon = {
  stateOf: (id: string) => ShapeState;
  onPick?: (id: string) => void;
  interactive?: boolean;
  focusId?: string | null;
  labels?: string[];
  pulseId?: string | null;
  showHoverName?: boolean;
  className?: string;
};

export function QuizStateMap({
  names,
  ...rest
}: MapCommon & { names: Map<string, string> }) {
  const shapes = useMemo(
    () => NIGERIA_STATE_PATHS.map((p) => ({ id: p.key, d: p.d, name: names.get(p.key) ?? p.key })),
    [names]
  );
  return <PickMap shapes={shapes} viewBox={NIGERIA_VIEW_BOX} ariaLabel="Map of Nigeria's states" {...rest} />;
}

export function QuizLgaMap({ stateId, stateName, ...rest }: MapCommon & { stateId: string; stateName: string }) {
  const svg = useStateLgaSvg(stateId);
  const shapes = useMemo(() => svg?.lgas.map((l) => ({ id: l.id, d: l.d, name: l.name })) ?? [], [svg]);
  if (svg === undefined) {
    return (
      <div className={`flex items-center justify-center ${rest.className ?? ""}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-primary-container" />
      </div>
    );
  }
  if (!svg) {
    return (
      <div className={`flex items-center justify-center text-sm text-text-muted ${rest.className ?? ""}`}>
        LGA map for {stateName} is unavailable.
      </div>
    );
  }
  return <PickMap shapes={shapes} viewBox={svg.viewBox} ariaLabel={`LGAs of ${stateName}`} {...rest} />;
}
