"use client";

import { useEffect, useMemo, useState } from "react";
import type { CivicSenatorialLookups } from "@/lib/server/loadCivicHubData";
import { colorForSenatorialIndex } from "@/lib/politics/senatorialColors";

type Ring = number[][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

export type DistrictMapRegionMode = "senatorial" | "constituency";

const WIDTH = 600;

function pathsFromGeo(
  geo: { features: { properties: Record<string, string>; geometry: Geometry }[] },
  lookups: CivicSenatorialLookups,
  highlightRegionId: string | null,
  regionMode: DistrictMapRegionMode
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
    const constituencyId = lookups.lgaToConstituencyId[id] ?? "";
    const regionId =
      regionMode === "constituency" ? constituencyId : districtId;
    const colorIdx =
      regionMode === "constituency"
        ? (lookups.constituencyColorIndex[constituencyId] ?? 0)
        : (lookups.districtColorIndex[districtId] ?? 0);
    const base = colorForSenatorialIndex(colorIdx);
    const highlighted =
      highlightRegionId && regionId === highlightRegionId;
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
      constituencyId,
      regionId,
      d,
      fill: highlighted ? "#043828" : base,
      opacity: highlightRegionId && !highlighted ? 0.38 : 0.88,
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
  highlightRegionId,
  regionMode = "senatorial",
  onSelectDistrict,
  onHoverRegion,
  className = "",
}: {
  stateId: string;
  stateName: string;
  lookups: CivicSenatorialLookups;
  /** @deprecated use highlightRegionId */
  highlightDistrictId?: string | null;
  highlightRegionId?: string | null;
  regionMode?: DistrictMapRegionMode;
  onSelectDistrict?: (districtId: string) => void;
  onHoverRegion?: (regionId: string | null) => void;
  className?: string;
}) {
  const activeHighlight =
    highlightRegionId ?? highlightDistrictId ?? null;

  const [geo, setGeo] = useState<{
    features: { properties: Record<string, string>; geometry: Geometry }[];
  } | null>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);

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

  const effectiveHighlight = hoverRegion ?? activeHighlight;

  const model = useMemo(() => {
    if (!geo) return null;
    return pathsFromGeo(geo, lookups, effectiveHighlight, regionMode);
  }, [geo, lookups, effectiveHighlight, regionMode]);

  const hoveredLga = model?.lgas.find((l) => l.regionId === hoverRegion);
  const regionLabel = (regionId: string | null | undefined) => {
    if (!regionId) return null;
    if (regionMode === "constituency") {
      return lookups.constituencyById[regionId]?.name ?? null;
    }
    return lookups.districtById[regionId]?.name ?? null;
  };

  const captionRegion =
    regionLabel(hoverRegion ?? activeHighlight) ??
    (regionMode === "constituency"
      ? "Federal constituencies"
      : "Senatorial districts");

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
        aria-label={`${stateName} ${
          regionMode === "constituency"
            ? "federal constituencies"
            : "senatorial districts"
        }`}
      >
        {model.lgas.map((l) => {
          const inHoverGroup =
            hoverRegion && l.regionId === hoverRegion;
          const inHighlightGroup =
            effectiveHighlight && l.regionId === effectiveHighlight;
          return (
            <path
              key={l.id}
              d={l.d}
              fill={
                inHoverGroup
                  ? "#008751"
                  : inHighlightGroup
                    ? l.fill
                    : l.fill
              }
              fillOpacity={
                hoverRegion
                  ? inHoverGroup
                    ? 0.95
                    : 0.35
                  : effectiveHighlight
                    ? inHighlightGroup
                      ? 0.92
                      : l.opacity
                    : l.opacity
              }
              stroke={inHoverGroup || inHighlightGroup ? "#004d2e" : "#ffffff"}
              strokeWidth={inHoverGroup ? 1.8 : 1.1}
              strokeLinejoin="round"
              onMouseEnter={() => {
                if (!l.regionId) return;
                setHoverRegion(l.regionId);
                onHoverRegion?.(l.regionId);
              }}
              onMouseLeave={() => {
                setHoverRegion(null);
                onHoverRegion?.(null);
              }}
              onClick={
                onSelectDistrict && l.districtId
                  ? () => onSelectDistrict(l.districtId)
                  : undefined
              }
              className={onSelectDistrict ? "cursor-pointer" : undefined}
            >
              <title>
                {l.name}
                {regionLabel(l.regionId) ? ` · ${regionLabel(l.regionId)}` : ""}
              </title>
            </path>
          );
        })}
      </svg>
      <figcaption className="absolute bottom-2 left-2 right-2 rounded-lg border border-border-subtle bg-white/95 px-3 py-1.5 text-[11px] shadow-sm">
        <span className="font-semibold text-text-primary">
          {hoveredLga?.name ?? captionRegion}
        </span>
        <span className="text-text-muted">
          {hoverRegion || activeHighlight
            ? regionLabel(hoverRegion ?? activeHighlight)
              ? ` · ${regionLabel(hoverRegion ?? activeHighlight)}`
              : ""
            : regionMode === "constituency"
              ? " · LGA colours by federal constituency"
              : " · LGA colours by senatorial district"}
        </span>
      </figcaption>
    </figure>
  );
}
