/** Region tint colors for state fills at country view */
export const REGION_FILL: Record<string, string> = {
  "NG-NC": "#e8eaf6",
  "NG-NE": "#f3e8ff",
  "NG-NW": "#f5f0ff",
  "NG-SE": "#ecfdf5",
  "NG-SS": "#ecfeff",
  "NG-SW": "#fffbeb",
};

/**
 * Earth-tone palette for LGA fills — hues interleaved so neighbours
 * cycling through the pool stay visually distinct (green / tan / blue / ochre).
 */
export const LGA_PALETTE = [
  "#6BA368", // sage green
  "#C4A574", // wheat tan
  "#5B8FA8", // dusty blue
  "#A8BF7A", // yellow-green
  "#B8956B", // warm brown
  "#6AADA3", // teal
  "#8FAF6E", // olive
  "#D4C4A0", // cream
  "#688EB5", // slate blue
  "#7CB087", // mint
  "#C9B896", // sand
  "#5E9E78", // pine
  "#94B86A", // grass
  "#C2A882", // camel
  "#72A898", // seafoam
  "#D4896A", // terracotta
  "#9B8B72", // stone
  "#A3C986", // light olive
  "#8AAB76", // chartreuse
  "#BFA882", // gold tan
] as const;

export function colorForIndex(index: number, palette = LGA_PALETTE): string {
  return palette[index % palette.length];
}

/** Stable palette assignment sorted by LGA name within a state. */
export function assignLgaPaletteColors(
  features: GeoJSON.Feature[]
): Map<string, string> {
  const sorted = [...features].sort((a, b) => {
    const na = String(a.properties?.name ?? "");
    const nb = String(b.properties?.name ?? "");
    return na.localeCompare(nb);
  });

  const colorById = new Map<string, string>();
  sorted.forEach((feature, index) => {
    const id = String(feature.properties?.id ?? `idx-${index}`);
    colorById.set(id, colorForIndex(index));
  });
  return colorById;
}
