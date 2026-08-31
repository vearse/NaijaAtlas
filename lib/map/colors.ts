/** Region tint colors for state fills at country view */
export const REGION_FILL: Record<string, string> = {
  "NG-NC": "#e8eaf6",
  "NG-NE": "#f3e8ff",
  "NG-NW": "#f5f0ff",
  "NG-SE": "#ecfdf5",
  "NG-SS": "#ecfeff",
  "NG-SW": "#fffbeb",
};

/** Earth-tone palette — assigned cyclically to LGAs */
export const LGA_PALETTE = [
  "#7cb87c",
  "#8fbc8f",
  "#a8c686",
  "#c2b280",
  "#9bb898",
  "#6ba3be",
  "#89a96d",
  "#b5c99a",
  "#d4a574",
  "#5a9e6f",
  "#84b882",
  "#c9b896",
  "#7eb09a",
  "#a4c4a0",
  "#96b57c",
  "#6eae8a",
  "#b8a878",
  "#8aab76",
  "#7ec4a3",
  "#c5d4a0",
];

export function colorForIndex(index: number, palette = LGA_PALETTE): string {
  return palette[index % palette.length];
}
