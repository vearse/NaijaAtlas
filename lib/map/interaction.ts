/** MapLibre glyphs — required for any symbol/text layer */
export const MAP_GLYPHS =
  "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

/** Valid stacks on demotiles.maplibre.org (Bold/Regular return 404) */
export const MAP_FONT = "Noto Sans Regular";
export const MAP_FONT_EMPHASIS = "Open Sans Semibold";

export { LGA_PALETTE, REGION_FILL, colorForIndex } from "./colors";

/** Layers that receive pointer events — fills first so hover works on area, not just borders */
export const INTERACTIVE_LAYERS = {
  lgaFill: (stateId: string) => `lgas-${stateId}-fill`,
  lgaLine: (stateId: string) => `lgas-${stateId}-line`,
  lgaLabel: (stateId: string) => `lgas-${stateId}-labels`,
  stateFill: "states-fill",
  stateLabel: "states-labels",
  regionFill: "regions-fill",
} as const;

export function collectLgaLayerIds(
  lgaVisibleStateIds: Iterable<string>
): string[] {
  const ids: string[] = [];
  for (const sid of lgaVisibleStateIds) {
    ids.push(INTERACTIVE_LAYERS.lgaFill(sid));
    ids.push(INTERACTIVE_LAYERS.lgaLine(sid));
    ids.push(INTERACTIVE_LAYERS.lgaLabel(sid));
  }
  return ids;
}

export function queryPriorityLayers(lgaVisibleStateIds: Set<string>): string[] {
  return [
    ...collectLgaLayerIds(lgaVisibleStateIds),
    INTERACTIVE_LAYERS.stateFill,
    INTERACTIVE_LAYERS.stateLabel,
    INTERACTIVE_LAYERS.regionFill,
  ];
}
