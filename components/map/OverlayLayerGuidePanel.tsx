"use client";

import { useEffect, useMemo, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  OVERLAY_LAYER_GUIDES,
  OVERLAY_LAYER_LABELS,
  PROPOSED_ARMY_DIVISION_OPT_IN_GROUP,
  PROPOSED_PORT_OPT_IN_GROUP,
  SECURITY_BRANCHES,
  SECURITY_BRANCH_LABELS,
  type OverlayLayerId,
  type SecurityBranch,
  type SelectedOverlayFeature,
} from "@/types/overlay";
import { flyToOverlayFeature } from "@/lib/map/flyToOverlayFeature";
import { OVERLAY_REGISTRY } from "@/lib/map/overlayRegistry";
import { getTourGeoJSON } from "@/lib/map/tourCatalog";

interface GuideFeature {
  id: string;
  name: string;
  properties: Record<string, unknown>;
  geometry?: GeoJSON.Geometry | null;
}

const MAX_VISIBLE = 8;

interface OptInGroup {
  groupId: string;
  title: string;
  blurb: string;
  features: GuideFeature[];
}

/**
 * One row per distinct feature id.
 *
 * Some layers render a single feature as many GeoJSON features that share one
 * id — landforms, for example, are 162 scattered sample points across 39
 * landforms, exactly one of which is flagged `isLabelAnchor`. Listing every
 * point produced duplicate rows and duplicate React keys, so collapse them and
 * keep the label-anchor geometry, which is the canonical point for the feature.
 */
function toGuideFeatures(json: unknown): GuideFeature[] {
  const fc = (json as { features?: unknown[] } | null)?.features;
  if (!Array.isArray(fc)) return [];
  const byId = new Map<string, GuideFeature>();
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
    const existing = byId.get(id);
    // Keep the first sighting unless this one is the label anchor.
    if (existing && props.isLabelAnchor !== true) continue;
    byId.set(id, {
      id,
      name,
      properties: props,
      geometry: f?.geometry ?? null,
    });
  }
  return [...byId.values()];
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

/** Features flagged `optInGroup` are excluded from the default list and the
 * default map filter. They surface only through their own reveal section.
 */
function groupOptInFeatures(
  features: GuideFeature[] | null,
  groupId: string
): GuideFeature[] {
  if (!features) return [];
  return features.filter((f) => f.properties.optInGroup === groupId);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function OverlayLayerGuidePanel({
  layerId,
}: {
  layerId: OverlayLayerId;
}) {
  const clearOverlayGuide = useMapStore((s) => s.clearOverlayGuide);
  const setSelectedOverlay = useMapStore((s) => s.setSelectedOverlay);
  const toggleOverlay = useMapStore((s) => s.toggleOverlay);
  const revealedOptInGroups = useMapStore((s) => s.revealedOptInGroups);
  const toggleOptInGroup = useMapStore((s) => s.toggleOptInGroup);
  const guide = OVERLAY_LAYER_GUIDES[layerId];
  const meta = OVERLAY_LAYER_LABELS[layerId];
  const { features, visibleCount, showAll, setShowAll } =
    useLayerFeatures(layerId);

  const optInGroups = useMemo<OptInGroup[]>(() => {
    const groups: OptInGroup[] = [];
    if (layerId === "lakes") {
      groups.push({
        groupId: PROPOSED_PORT_OPT_IN_GROUP,
        title: "Proposed & upcoming ports",
        blurb:
          "Greenfield and planned deep sea ports that are not yet operating. Reveal them to plot their sites on the map, then open any one for its MOU, approval and status record.",
        features: groupOptInFeatures(features, PROPOSED_PORT_OPT_IN_GROUP),
      });
    }
    if (layerId === "security") {
      groups.push({
        groupId: PROPOSED_ARMY_DIVISION_OPT_IN_GROUP,
        title: "New Army divisions (forming)",
        blurb:
          "Divisional headquarters approved in the Nigerian Army's 2026 expansion from eight to twelve divisions, but not yet at full operational capability. Reveal them to plot the new headquarters, then open any one for its area of responsibility and phasing.",
        features: groupOptInFeatures(
          features,
          PROPOSED_ARMY_DIVISION_OPT_IN_GROUP
        ),
      });
    }
    return groups.filter((g) => g.features.length > 0);
  }, [features, layerId]);

  // Opt-in rows have their own section, so keep them out of the default list.
  const defaultFeatures = useMemo(
    () =>
      (features ?? []).filter(
        (f) => f.properties.optInGroup === undefined
      ),
    [features]
  );

  const securityByBranch = useMemo(() => {
    if (layerId !== "security") return null;
    const groups = new Map<SecurityBranch, GuideFeature[]>();
    for (const branch of SECURITY_BRANCHES) groups.set(branch, []);
    for (const f of defaultFeatures) {
      const raw = f.properties.militaryBranch;
      if (
        typeof raw === "string" &&
        (SECURITY_BRANCHES as readonly string[]).includes(raw)
      ) {
        groups.get(raw as SecurityBranch)!.push(f);
      }
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [defaultFeatures, layerId]);

  const openFeature = (f: GuideFeature) => {
    const feature: SelectedOverlayFeature = {
      id: f.id,
      layerId,
      name: f.name,
      properties: f.properties,
      geometry: f.geometry,
    };
    setSelectedOverlay(feature);
    const map = useMapStore.getState().mapInstance;
    if (map) flyToOverlayFeature(map, feature);
  };

  const revealGroup = (groupId: string) => {
    if (!useMapStore.getState().activeOverlays.has(layerId)) {
      toggleOverlay(layerId);
    }
    toggleOptInGroup(groupId);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
            {meta.label} layer · guide
          </p>
          <h2 className="text-2xl font-bold text-text-primary">{guide.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => clearOverlayGuide()}
          className="shrink-0 rounded-lg border border-border-subtle px-2.5 py-1 text-xs font-medium text-text-muted hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close layer guide"
        >
          Close
        </button>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{guide.summary}</p>
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
              <li key={item} className="text-xs text-text-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-text-muted rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 leading-relaxed">
        <span className="font-semibold text-emerald-800">Tip · </span>
        {guide.tip}
      </p>

      <div className="rounded-xl border border-slate-100 bg-surface-card p-3 space-y-2">
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

        {defaultFeatures.length > 0 && securityByBranch && (
          <div className="space-y-4">
            {SECURITY_BRANCHES.map((branch) => {
              const branchFeatures = securityByBranch.get(branch) ?? [];
              if (branchFeatures.length === 0) return null;
              const branchMeta = SECURITY_BRANCH_LABELS[branch];
              return (
                <div key={branch} className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-0.5">
                    {branchMeta.short}
                    <span className="ml-1.5 font-medium tabular-nums">
                      {branchFeatures.length}
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {branchFeatures.map((f) => (
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
                </div>
              );
            })}
          </div>
        )}

        {defaultFeatures.length > 0 && !securityByBranch && (
          <>
            <ul className="space-y-1">
              {defaultFeatures.slice(0, visibleCount).map((f) => (
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
            {defaultFeatures.length > MAX_VISIBLE && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-ng-green/30 hover:text-ng-green transition-colors"
              >
                {showAll
                  ? "Show fewer"
                  : `Show all ${defaultFeatures.length} features`}
              </button>
            )}
          </>
        )}
      </div>

      {optInGroups.map((group) => {
        const revealed = revealedOptInGroups.has(group.groupId);
        return (
          <div
            key={group.groupId}
            className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2 px-0.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                  Not on the map by default
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {group.title}
                  <span className="ml-1.5 text-xs font-medium text-slate-400 tabular-nums">
                    {group.features.length}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => revealGroup(group.groupId)}
                aria-pressed={revealed}
                className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  revealed
                    ? "border-violet-300 bg-surface-card text-violet-700 hover:border-violet-400"
                    : "border-violet-300 bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                {revealed ? "Hide from map" : "Show on map"}
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed px-0.5">
              {group.blurb}
            </p>

            {revealed && (
              <ul className="space-y-1">
                {group.features.map((f) => {
                  const status = text(f.properties.status);
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => openFeature(f)}
                        className="w-full group flex items-start justify-between gap-2 rounded-lg border border-violet-100 bg-surface-card px-3 py-2 text-left hover:border-violet-300 hover:bg-violet-50/60 transition-colors"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-700 truncate">
                            {f.name}
                          </span>
                          {status && (
                            <span className="block text-[11px] text-text-muted truncate">
                              {status}
                            </span>
                          )}
                        </span>
                        <span
                          aria-hidden
                          className="shrink-0 mt-0.5 text-slate-400 group-hover:text-violet-700"
                        >
                          →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}