import type { PoliticsLookups } from "@/types/politics";

/** Distinct fills for senatorial districts (cycles for 109 districts). */
export const SENATORIAL_DISTRICT_PALETTE = [
  "#008751",
  "#0d9488",
  "#0891b2",
  "#0284c7",
  "#6366f1",
  "#7c3aed",
  "#9333ea",
  "#c026d3",
  "#db2777",
  "#e11d48",
  "#ea580c",
  "#ca8a04",
  "#65a30d",
  "#059669",
  "#14b8a6",
  "#6BA368",
  "#5B8FA8",
  "#A8BF7A",
  "#688EB5",
  "#D4896A",
] as const;

export function colorForSenatorialIndex(index: number): string {
  return SENATORIAL_DISTRICT_PALETTE[
    index % SENATORIAL_DISTRICT_PALETTE.length
  ];
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
