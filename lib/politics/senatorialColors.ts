import type { PoliticsLookups } from "@/types/politics";
import { LGA_PALETTE } from "@/lib/map/colors";

/**
 * Distinct fills for senatorial districts (cycles for 109 districts).
 * Reuses the LGA earth-tone pool — interleaved hues (green / tan / blue /
 * ochre) keep neighbouring districts visually distinct, with only a single
 * soft terracotta instead of several near-identical reds.
 */
export const SENATORIAL_DISTRICT_PALETTE = LGA_PALETTE;

export function colorForSenatorialIndex(index: number): string {
  return LGA_PALETTE[index % LGA_PALETTE.length];
}

export function colorForDistrict(
  lookups: PoliticsLookups,
  districtId: string
): string {
  const idx = lookups.districtColorIndex[districtId] ?? 0;
  return colorForSenatorialIndex(idx);
}

export function enrichLgaSenatorialColors(
  data: GeoJSON.FeatureCollection,
  lookups: PoliticsLookups
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.features.map((feature, index) => {
      const id = String(feature.properties?.id ?? `idx-${index}`);
      const districtId = lookups.lgaToSenatorialDistrictId[id];
      const fillColor = districtId
        ? colorForDistrict(lookups, districtId)
        : "#cbd5e1";
      return {
        ...feature,
        properties: {
          ...feature.properties,
          fillColor,
          senatorialDistrictId: districtId ?? "",
        },
      };
    }),
  };
}
