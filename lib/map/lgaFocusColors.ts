import { colorForSenatorialIndex } from "@/lib/politics/senatorialColors";
import type { MetroMapView } from "@/lib/map/metroMapViews";

/** Neutral LGA fill while a metro/group focus is active (matches election fallback). */
export const METRO_LGA_NEUTRAL = "#cbd5e1";

export function enrichLgaMetroFocus(
  data: GeoJSON.FeatureCollection,
  memberLgaIds: string[],
  accentColor: string
): GeoJSON.FeatureCollection {
  const members = new Set(memberLgaIds);
  return {
    type: "FeatureCollection",
    features: data.features.map((feature, index) => {
      const id = String(feature.properties?.id ?? `idx-${index}`);
      const fillColor = members.has(id) ? accentColor : METRO_LGA_NEUTRAL;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          fillColor,
        },
      };
    }),
  };
}

/** Multiple metros on one state layer — later views win on overlapping LGAs. */
export function enrichLgaMetroMapViews(
  data: GeoJSON.FeatureCollection,
  stateId: string,
  views: MetroMapView[]
): GeoJSON.FeatureCollection {
  const active = views.filter((v) => v.stateIds.includes(stateId));
  if (active.length === 0) {
    return {
      type: "FeatureCollection",
      features: data.features.map((feature, index) => ({
        ...feature,
        properties: {
          ...feature.properties,
          fillColor: METRO_LGA_NEUTRAL,
        },
      })),
    };
  }

  const colorByLga = new Map<string, string>();
  for (const view of active) {
    if (view.lgaIds.length === 0) continue;
    const accent = colorForSenatorialIndex(view.colorIndex);
    for (const lgaId of view.lgaIds) {
      colorByLga.set(lgaId, accent);
    }
  }

  return {
    type: "FeatureCollection",
    features: data.features.map((feature, index) => {
      const id = String(feature.properties?.id ?? `idx-${index}`);
      const fillColor = colorByLga.get(id) ?? METRO_LGA_NEUTRAL;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          fillColor,
        },
      };
    }),
  };
}
