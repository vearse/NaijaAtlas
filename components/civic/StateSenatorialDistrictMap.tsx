"use client";

import { useEffect, useMemo, useState } from "react";
import type { CivicSenatorialLookups } from "@/lib/server/loadCivicHubData";
import { colorForSenatorialIndex } from "@/lib/politics/senatorialColors";

type Ring = number[][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

const WIDTH = 600;

function pathsFromGeo(
  geo: { features: { properties: Record<string, string>; geometry: Geometry }[] },
  lookups: CivicSenatorialLookups,
  highlightDistrictId: string | null
) {
  const polys = (g: Geometry): Ring[][] =>
    g.type === "Polygon" ? [g.coordinates] : g.coordinates;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const f of geo.features) {
    for (const poly of polys(f.geometry)) {
      for (const [x, y] of poly[0]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!Number.isFinite(minX)) return null;

  const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
  const scale = WIDTH / ((maxX - minX) * k);
  const height = Math.round((maxY - minY) * scale);
  const pt = ([x, y]: number[]) =>
    `${Math.round((x - minX) * k * scale)},${Math.round((maxY - y) * scale)}`;

  const lgas = geo.features.map((f) => {
    const id = f.properties.id;
    const districtId = lookups.lgaToDistrictId[id] ?? "";
    const colorIdx = lookups.districtColorIndex[districtId] ?? 0;
    const base = colorForSenatorialIndex(colorIdx);
    const highlighted =
      highlightDistrictId && districtId === highlightDistrictId;
    const d = polys(f.geometry)
      .flatMap((poly) =>
        poly.map((ring) => {
          const pts: string[] = [];
          for (const c of ring) {
            const p = pt(c);
            if (pts[pts.length - 1] !== p) pts.push(p);
          }
          return `M${pts.join("L")}Z`;
        })
      )
      .join("");
    return {
      id,
      name: f.properties.name,
      districtId,
      d,
      fill: highlighted ? "#043828" : base,
      opacity: highlightDistrictId && !highlighted ? 0.45 : 0.88,
    };
  });

  return {
    viewBox: `-4 -4 ${WIDTH + 8} ${height + 8}`,
    lgas,
  };
}

export default function StateSenatorialDistrictMap({
  stateId,
  stateName,
  lookups,
  highlightDistrictId,
  onSelectDistrict,
  className = "",
}: {
  stateId: string;
  stateName: string;
  lookups: CivicSenatorialLookups;
  highlightDistrictId?: string | null;
  onSelectDistrict?: (districtId: string) => void;
  className?: string;
}) {
  const [geo, setGeo] = useState<{
    features: { properties: Record<string, string>; geometry: Geometry }[];
  } | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGeo(null);
    fetch(`/geo/lgas/${stateId}.geojson`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setGeo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stateId]);

  const model = useMemo(() => {
    if (!geo) return null;
    return pathsFromGeo(geo, lookups, highlightDistrictId ?? null);
  }, [geo, lookups, highlightDistrictId]);

  const hovered = model?.lgas.find((l) => l.id === hover);
  const districtName =
    hovered?.districtId
      ? lookups.districtById[hovered.districtId]?.name
      : highlightDistrictId
        ? lookups.districtById[highlightDistrictId]?.name
        : null;

  if (!model) {
    return (
      <div
        className={`flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-border-subtle bg-slate-50 text-xs text-text-muted ${className}`}
      >
        Loading district map…
      </div>
    );
  }

  return (
    <figure
      className={`relative overflow-hidden rounded-xl border border-border-subtle bg-slate-50 ${className}`}
    >
      <svg
        viewBox={model.viewBox}
        className="h-full w-full p-3"
        role="img"
        aria-label={`${stateName} senatorial districts`}
      >
        {model.lgas.map((l) => (
          <path
            key={l.id}
            d={l.d}
            fill={hover === l.id ? "#008751" : l.fill}
            fillOpacity={hover && hover !== l.id ? 0.4 : l.opacity}
            stroke="#ffffff"
            strokeWidth={1.1}
            strokeLinejoin="round"
            onMouseEnter={() => setHover(l.id)}
            onMouseLeave={() => setHover(null)}
            onClick={
              onSelectDistrict && l.districtId
                ? () => onSelectDistrict(l.districtId)
                : undefined
            }
            className={onSelectDistrict ? "cursor-pointer" : undefined}
          >
            <title>{l.name}</title>
          </path>
        ))}
      </svg>
      <figcaption className="absolute bottom-2 left-2 right-2 rounded-lg border border-border-subtle bg-white/95 px-3 py-1.5 text-[11px] shadow-sm">
        <span className="font-semibold text-text-primary">
          {hovered?.name ?? districtName ?? "Senatorial districts"}
        </span>
        <span className="text-text-muted">
          {hovered
            ? lookups.districtById[hovered.districtId]?.name
              ? ` · ${lookups.districtById[hovered.districtId]?.name}`
              : ""
            : " · LGA colours match election map"}
        </span>
      </figcaption>
    </figure>
  );
}
