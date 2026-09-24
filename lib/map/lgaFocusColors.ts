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
