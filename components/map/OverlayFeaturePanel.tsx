"use client";

import { type ReactNode, useMemo } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import { focusFromFeature } from "@/lib/map/overlayFocus";
import WikiDeepDiveLink from "@/components/map/WikiDeepDiveLink";
import GetDirectionsButton from "@/components/directions/GetDirectionsButton";
import ViewOnMapButton from "@/components/map/ViewOnMapButton";
import {
  resolveCoverageStateIds,
  shouldOfferViewOnMap,
} from "@/lib/map/featureCoverage";
import {
  CITY_CATEGORY_LABELS,
  LAKE_CATEGORY_LABELS,
  LANDFORM_SIZE_LABELS,
  LANDFORM_TYPE_LABELS,
  OVERLAY_LAYER_LABELS,
  POWER_FEATURE_KIND_LABELS,
  POWER_PLANT_CATEGORY_LABELS,
  COAST_CATEGORY_LABELS,
  COAST_ZONE_LABELS,
  RESOURCE_TYPE_LABELS,
  TOUR_CATEGORY_LABELS,
  SECURITY_FORMATION_CATEGORY_LABELS,
  type CityCategory,
  type CoastCategory,
  type LakeCategory,
  type LandformSizeTier,
  type LandformType,
  type PowerFeatureKind,
  type PowerPlantCategory,
  type ResourceType,
  type SelectedOverlayFeature,
  type SecurityFormationCategory,
} from "@/types/overlay";
import type { StateLocation } from "@/types/location";

interface OverlayFeaturePanelProps {
  feature: SelectedOverlayFeature;
  states: StateLocation[];
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseObjectArray<T>(value: unknown): T[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // ignore malformed strings
  }
  return [];
}

interface ResourceSite {
  state?: string;
  siteName?: string;
  lon?: number;
  lat?: number;
}

function truthy(value: string | null | undefined): value is string {
  return value != null && value !== "";
}

function text(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="text-sm text-slate-700 mt-0.5 leading-relaxed">{value}</dd>
    </div>
  );
}

/**
 * Renders a `statesCrossed`-style array, which arrives as a JSON string once
 * flattened into feature properties.
 */
function textArrayList(value: unknown): string | null {
  if (Array.isArray(value)) {
    const items = value.filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0
    );
    return items.length > 0 ? items.join(", ") : null;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return textArrayList(JSON.parse(value) as unknown);
    } catch {
      return value;
    }
  }
  return null;
}

/** Dated timeline entries rendered as `date — event` rows. */
function MilestoneList({ value }: { value: unknown }) {
  const raw = parseObjectArray<{ date?: string; event?: string }>(value);
  if (raw.length === 0) return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Timeline
      </dt>
      <dd>
        <ol className="space-y-1.5">
          {raw.map((m, i) => {
            const date = text(m.date);
            const event = text(m.event) ?? text(m);
            if (!event) return null;
            return (
              <li key={`${date}-${i}`} className="flex gap-2 text-sm text-slate-700">
                {date && (
                  <span className="shrink-0 w-[6.5rem] tabular-nums text-text-muted">
                    {date}
                  </span>
                )}
                <span className="leading-relaxed">{event}</span>
              </li>
            );
          })}
        </ol>
      </dd>
    </div>
  );
}

function ChipList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-0.5 text-xs text-slate-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-slate-700 leading-relaxed pl-3 relative">
            <span className="absolute left-0 top-2 h-1 w-1 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function cityCategoryMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return CITY_CATEGORY_LABELS[value as CityCategory] ?? null;
}

function lakeCategoryMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return LAKE_CATEGORY_LABELS[value as LakeCategory] ?? null;
}

function powerPlantCategoryMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return POWER_PLANT_CATEGORY_LABELS[value as PowerPlantCategory] ?? null;
}

/**
 * Regional dam schemes are often irrigation or water-supply projects rather than
 * grid-connected generating stations, so the popup says so explicitly instead
 * of implying they carry load.
 */
function gridConnectedLabel(props: Record<string, unknown>): ReactNode {
  const note = text(props.gridConnectedNote);
  if (note) return note;
  if (props.featureKind !== "power-plant") return null;
  return props.gridConnected === false
    ? "Not connected to the national grid."
    : "Grid-connected generating station.";
}

/**
 * Generation stations carry a technology badge, so only the non-generation
 * feature kinds (DisCo, substation, corridor) need a kind badge here.
 */
function powerFeatureKindMeta(value: unknown) {
  if (typeof value !== "string") return null;
  if (value === "power-plant") return null;
  return POWER_FEATURE_KIND_LABELS[value as PowerFeatureKind] ?? null;
}

/**
 * Corridor endpoints are resolved to readable node names at build time, so the
 * panel can label a line without the full node list.
 */
function gridLinkText(value: Record<string, unknown>): string {
  const from = text(value.fromName);
  const to = text(value.toName);
  if (from && to) return `${from} \u2194 ${to}`;
  return "";
}

function coastCategoryMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return COAST_CATEGORY_LABELS[value as CoastCategory] ?? null;
}

function coastZoneMeta(id: unknown, category: unknown) {
  if (category === "national") return COAST_ZONE_LABELS.national;
  if (category === "coast-zone") return COAST_ZONE_LABELS["coast-zone"];
  if (typeof id === "string" && id.startsWith("zone-")) {
    return COAST_ZONE_LABELS["coast-zone"];
  }
  return null;
}

function landformTypeMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return LANDFORM_TYPE_LABELS[value as LandformType] ?? null;
}

function landformSizeMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return LANDFORM_SIZE_LABELS[value as LandformSizeTier] ?? null;
}

function resourceTypeMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return RESOURCE_TYPE_LABELS[value as ResourceType] ?? null;
}

function militaryCategoryMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return SECURITY_FORMATION_CATEGORY_LABELS[value as SecurityFormationCategory] ?? null;
}

function capacityLabel(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? `${value.toLocaleString()} MW` : "Multipurpose (no generation)";
  }
  return text(value);
}

function finitePair(a: unknown, b: unknown): [number, number] | null {
  const lon = Number(a);
  const lat = Number(b);
  if (Number.isFinite(lon) && Number.isFinite(lat)) return [lon, lat];
  return null;
}

function coordsFromGeometry(geometry: GeoJSON.Geometry | null | undefined): [number, number] | null {
  if (!geometry) return null;
  const ring = (
    geom: GeoJSON.Geometry
  ): (GeoJSON.Position)[] | null => {
    if (geom.type === "Point") {
      return geom.coordinates.length >= 2 ? [geom.coordinates] : null;
    }
    if (geom.type === "LineString") {
      return geom.coordinates.length >= 2 ? geom.coordinates : null;
    }
    if (geom.type === "MultiLineString") {
      return geom.coordinates.flat();
    }
    if (geom.type === "Polygon") {
      return geom.coordinates[0] ?? null;
    }
    if (geom.type === "MultiPolygon") {
      return geom.coordinates.flat().flat();
    }
    if (geom.type === "MultiPoint") {
      return geom.coordinates;
    }
    if (geom.type === "GeometryCollection") {
      for (const child of geom.geometries) {
        const found = ring(child);
        if (found && found.length) return found;
      }
    }
    return null;
  };

  const coords = ring(geometry);
  if (!coords || coords.length === 0) return null;
  let lonSum = 0;
  let latSum = 0;
  let count = 0;
  for (const c of coords) {
    if (!Array.isArray(c) || c.length < 2) continue;
    const lon = Number(c[0]);
    const lat = Number(c[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      lonSum += lon;
      latSum += lat;
      count += 1;
    }
  }
  if (count === 0) return null;
  return [lonSum / count, latSum / count];
}

export default function OverlayFeaturePanel({
  feature,
  states,
}: OverlayFeaturePanelProps) {
  const {
    clearSelectedOverlay,
    showLgas,
    addSelectedState,
    mapType,
    overlayFeatureFocus,
    setOverlayFeatureFocus,
  } = useMapStore();
  const { layerId, name, properties: props } = feature;
  const focusSpec = useMemo(
    () => focusFromFeature(layerId, props as Record<string, unknown>),
    [layerId, props]
  );
  const focusDisabled = mapType === "election" || mapType === "ranking";
  const focusActive =
    focusSpec != null &&
    overlayFeatureFocus != null &&
    overlayFeatureFocus.layerId === focusSpec.layerId &&
    overlayFeatureFocus.matchKey === focusSpec.matchKey &&
    overlayFeatureFocus.matchValue === focusSpec.matchValue;
  const meta = OVERLAY_LAYER_LABELS[layerId];
  const cityCat = cityCategoryMeta(props.category);
  const isTour = props.isTour === true;
  const tourCat = isTour
    ? (TOUR_CATEGORY_LABELS[String(props.category ?? "")] ??
      TOUR_CATEGORY_LABELS["tour"])
    : null;
  const lakeCat = lakeCategoryMeta(props.lakeCategory);
  const plantCat = powerPlantCategoryMeta(props.plantCategory);
  const coastCat = coastCategoryMeta(props.coastCategory);
  const coastZone = coastZoneMeta(props.id, props.coastCategory);
  const landformType = landformTypeMeta(props.landformType);
  const landformSize = landformSizeMeta(props.sizeTier);
  const resourceType = resourceTypeMeta(props.resourceType);
  const militaryCat = militaryCategoryMeta(props.militaryCategory);
  const featureKind = text(props.featureKind);
  const powerKind = powerFeatureKindMeta(featureKind);

  const relatedStateNames = [
    ...parseStringArray(props.statesCrossed),
    ...parseStringArray(props.coversStates),
    ...parseStringArray(props.coastalStates),
  ];
  if (typeof props.stateName === "string" && props.stateName) {
    relatedStateNames.push(props.stateName);
  }
  const uniqueStateNames = [...new Set(relatedStateNames)];

  const relatedStates = uniqueStateNames
    .map((stateName) => states.find((s) => s.name === stateName))
    .filter((s): s is StateLocation => s != null);

  const unmatchedStateNames = uniqueStateNames.filter(
    (stateName) => !relatedStates.some((s) => s.name === stateName)
  );

  const coverageStateIds = resolveCoverageStateIds(
    props as Record<string, unknown>
  );
  const featureMapId = String(props.id ?? feature.id ?? name);
  const showViewOnMap =
    (layerId === "landforms" ||
      layerId === "ecology" ||
      layerId === "resources" ||
      layerId === "lakes" ||
      layerId === "power" ||
      layerId === "security" ||
      layerId === "waterways") &&
    shouldOfferViewOnMap(props as Record<string, unknown>, coverageStateIds);

  const wikiUrl = text(props.wikiUrl);
  const siteName = text(props.siteName);
  const resourceSites: ResourceSite[] =
    layerId === "resources"
      ? parseObjectArray<ResourceSite>(props.locations)
      : [];
  const resourceId = text(props.resourceId) ?? text(props.id) ?? name;
  const lengthKm =
    typeof props.lengthKm === "number"
      ? `${props.lengthKm.toLocaleString()} km`
      : text(props.lengthKm);
  const isProposedPort = text(props.coastCategory) === "proposed-port";
  const isProposedDivision =
    text(props.militaryCategory) === "proposed-army-division";
  const isSecurityFormation = featureKind === "security-formation";

  let toLonLat: [number, number] | null = null;
  {
    const geom = feature.geometry ?? props.geometry;
    toLonLat =
      finitePair(props.longitude, props.latitude) ??
      finitePair(props.lon, props.lat) ??
      coordsFromGeometry(geom as GeoJSON.Geometry | null | undefined) ??
      null;
  }

  const openResourceLocation = (site: ResourceSite, index: number) => {
    const lon = Number(site.lon);
    const lat = Number(site.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    const siteId = `${resourceId}-${index}`;
    const store = useMapStore.getState();
    store.setSelectedOverlay({
      id: siteId,
      layerId,
      name,
      properties: {
        ...props,
        id: siteId,
        resourceId,
        lon,
        lat,
        ...(site.state ? { stateName: site.state } : {}),
        ...(site.siteName ? { siteName: site.siteName } : {}),
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
    const map = store.mapInstance;
    if (map) {
      map.flyTo({
        center: [lon, lat],
        zoom: Math.max(map.getZoom() ?? 5, 9),
        speed: 0.9,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => useMapStore.getState().clearSelectedOverlay()}
            className="group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 rounded-md -ml-1 px-1 py-0.5 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label={`Back to ${meta.label} layer guide`}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-text-secondary"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {meta.label} layer
          </button>
          <h2 className="text-2xl font-bold text-text-primary">{name}</h2>
          {text(props.nickname) || siteName ? (
            <p className="text-sm text-text-muted mt-1">
              {[text(props.nickname), siteName].filter(truthy).join(" · ")}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tourCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: tourCat.color }}
              >
                {tourCat.label}
              </span>
            )}
            {!isTour && cityCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: cityCat.color }}
              >
                {cityCat.label}
              </span>
            )}
            {lakeCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: lakeCat.color }}
              >
                {lakeCat.label}
              </span>
            )}
            {landformType && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: landformType.color }}
              >
                {landformType.label}
              </span>
            )}
            {landformSize && (
              <span className="inline-flex items-center rounded-full border border-border-subtle bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
                {landformSize.label} · {landformSize.description}
              </span>
            )}
            {resourceType && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: resourceType.color }}
              >
                {resourceType.label}
              </span>
            )}
            {militaryCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: militaryCat.color }}
              >
                {militaryCat.branch} · {militaryCat.label}
              </span>
            )}
            {plantCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: plantCat.color }}
              >
                {plantCat.label}
              </span>
            )}
            {coastCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: coastCat.color }}
              >
                {coastCat.label}
              </span>
            )}
            {coastZone && !coastCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: coastZone.color }}
              >
                {coastZone.label}
              </span>
            )}
            {!plantCat && powerKind && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: powerKind.color }}
              >
                {powerKind.label}
              </span>
            )}
            {text(props.type) && (
              <span className="inline-flex items-center rounded-full border border-border-subtle bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
                {text(props.type)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => clearSelectedOverlay()}
          className="shrink-0 rounded-lg border border-border-subtle px-2.5 py-1 text-xs font-medium text-text-muted hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close overlay details"
        >
          Close
        </button>
      </div>

      {focusSpec && !focusDisabled && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOverlayFeatureFocus(focusSpec)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
              focusActive
                ? "border-ng-green bg-emerald-50 text-ng-green"
                : "border-border-subtle bg-surface-card text-slate-700 hover:border-slate-300"
            }`}
          >
            Focus: {focusSpec.label}
          </button>
          {focusActive && (
            <button
              type="button"
              onClick={() => setOverlayFeatureFocus(null)}
              className="rounded-full px-3 py-1 text-xs font-medium text-text-muted hover:text-slate-800"
            >
              Clear focus
            </button>
          )}
        </div>
      )}

      {text(props.summary) && (
        <p className="text-sm text-text-secondary leading-relaxed">{text(props.summary)}</p>
      )}

      {text(props.description) && (
        <p className="text-sm text-slate-700 leading-relaxed">{text(props.description)}</p>
      )}

      {resourceSites.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Locations ({resourceSites.length})
          </p>
          <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
            {resourceSites.map((site, i) => {
              const active =
                siteName === site.siteName ||
                String(text(props.id) ?? "") === `${resourceId}-${i}`;
              return (
                <button
                  key={`${i}-${site.siteName ?? site.state ?? ""}`}
                  type="button"
                  onClick={() => openResourceLocation(site, i)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-50 flex items-center justify-between gap-3 ${
                    active ? "bg-emerald-50" : ""
                  }`}
                >
                  <span className="text-slate-800 font-medium">
                    {site.siteName ?? site.state ?? "Site"}
                  </span>
                  <span className="text-xs text-text-muted shrink-0">
                    {site.state ?? ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isProposedPort && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
            Not yet operational
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {text(props.statusDetail) ?? text(props.status)}
          </p>
          {text(props.status) && (
            <p className="text-sm font-semibold text-violet-800">
              {text(props.status)}
            </p>
          )}
        </div>
      )}

      {isProposedDivision && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
            Approved · not yet fully operational
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {text(props.statusDetail) ?? text(props.status)}
          </p>
          {text(props.status) && (
            <p className="text-sm font-semibold text-violet-800">
              {text(props.status)}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {showViewOnMap && (
          <ViewOnMapButton
            featureId={featureMapId}
            label={name}
            stateIds={coverageStateIds}
          />
        )}
        <GetDirectionsButton
          name={name}
          lonLat={toLonLat}
          kind="overlay"
          label="Get directions"
          size="md"
        />
      </div>

      <dl className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        {isProposedPort && (
          <>
            <DetailRow label="Status" value={text(props.status)} />
            <DetailRow label="MOU signed" value={text(props.mouSigned)} />
            <DetailRow label="MOU parties" value={text(props.mouParties)} />
            <DetailRow
              label="What the MOU covers"
              value={text(props.mouSignificance)}
            />
            <DetailRow
              label="Estimated cost"
              value={text(props.estimatedCost)}
            />
            <DetailRow label="Capacity" value={text(props.capacity)} />
            <MilestoneList value={props.milestones} />
          </>
        )}
        {isProposedDivision && (
          <>
            <DetailRow label="Status" value={text(props.status)} />
            <DetailRow
              label="Implementation phase"
              value={text(props.phase)}
            />
            <DetailRow
              label="Area of responsibility"
              value={text(props.aorNote)}
            />
            <DetailRow
              label="States covered"
              value={textArrayList(props.statesCrossed)}
            />
            <DetailRow
              label="Approved"
              value={text(props.approvedOn)}
            />
            <DetailRow
              label="GOC appointed"
              value={text(props.gocAppointed)}
            />
            <DetailRow
              label="Authorising parties"
              value={text(props.mouParties)}
            />
            <DetailRow
              label="Basis of creation"
              value={text(props.mouSignificance)}
            />
            <MilestoneList value={props.milestones} />
          </>
        )}
        {isSecurityFormation && !isProposedDivision && (
          <>
            <DetailRow label="Service" value={militaryCat?.branch} />
            <DetailRow
              label="Area of responsibility"
              value={text(props.aorNote)}
            />
            <DetailRow
              label="States covered"
              value={textArrayList(props.statesCrossed)}
            />
            <DetailRow label="Nickname" value={text(props.nickname)} />
            <MilestoneList value={props.milestones} />
          </>
        )}
        <DetailRow label="Founded" value={text(props.founded)} />
        <DetailRow label="Length" value={lengthKm} />
        <DetailRow label="Installed capacity" value={capacityLabel(props.capacityMw)} />
        <DetailRow label="Units" value={text(props.units)} />
        <DetailRow label="Commissioned" value={text(props.commissioned)} />
        <DetailRow
          label="National grid"
          value={gridConnectedLabel(props)}
        />
        <DetailRow label="Operator" value={text(props.operator)} />
        <DetailRow label="Shareholding" value={text(props.shareholding)} />
        <DetailRow label="Voltage" value={text(props.voltageLabel)} />
        <DetailRow label="Grid role" value={text(props.role)} />
        <DetailRow label="Connected substations" value={gridLinkText(props)} />
        <DetailRow label="River" value={text(props.riverName)} />
        <DetailRow label="Dam" value={text(props.damName)} />
        <DetailRow label="Max depth" value={text(props.maxDepthNote)} />
        <DetailRow label="Course in Nigeria" value={text(props.lengthNote)} />
        <DetailRow label="Source" value={text(props.sourceNote)} />
        <DetailRow label="Mouth / outlet" value={text(props.mouthNote)} />
        <DetailRow label="Area" value={text(props.areaNote)} />
        <DetailRow label="Population" value={text(props.populationNote)} />
        <DetailRow label="Elevation" value={text(props.elevationNote)} />
        <DetailRow label="Mineral type" value={text(props.type)} />
        <DetailRow label="Proven reserves" value={text(props.reserveNote)} />
        <DetailRow label="Production" value={text(props.productionNote)} />
        <DetailRow label="Cargo / trade" value={text(props.cargoNote)} />
        <DetailRow label="Environment" value={text(props.environment)} />
        <DetailRow label="Climate" value={text(props.climate)} />
        <DetailRow label="Economy" value={text(props.economy)} />
        <DetailRow label="Ecology" value={text(props.ecology)} />
        <DetailRow label="Usage" value={text(props.usage)} />
        <DetailRow label="Landscape" value={text(props.character)} />
        <DetailRow label="Soil & agriculture" value={text(props.agriculture)} />
        <DetailRow label="Significance" value={text(props.significance)} />
      </dl>

      <BulletList label="Highlights" items={parseStringArray(props.highlights)} />
      <BulletList label="Downstream products" items={parseStringArray(props.products)} />
      <BulletList label="Major crops & vegetation" items={parseStringArray(props.crops)} />
      <BulletList label="Planting notes" items={parseStringArray(props.planting)} />
      <ChipList label="Landmarks" items={parseStringArray(props.landmarks)} />
      <ChipList label="Tributaries" items={parseStringArray(props.tributaries)} />

      {(relatedStates.length > 0 || unmatchedStateNames.length > 0) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Related states
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedStates.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => {
                  addSelectedState(state.id);
                  showLgas(state.id);
                }}
                className="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-xs font-medium text-slate-700 hover:border-ng-green/40 hover:bg-emerald-50 transition-colors"
              >
                {state.name}
              </button>
            ))}
            {unmatchedStateNames.map((stateName) => (
              <span
                key={stateName}
                className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-text-muted"
              >
                {stateName}
              </span>
            ))}
          </div>
        </div>
      )}

      {wikiUrl && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 mb-1">
            Deeper reading
          </p>
          <p className="text-xs text-text-secondary mb-2">
            Wikipedia has longer history, demographics, and references than this map card.
          </p>
          <WikiDeepDiveLink wikiUrl={wikiUrl} title={name} />
        </div>
      )}
    </div>
  );
}
