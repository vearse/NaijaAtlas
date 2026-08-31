import type { Map } from "maplibre-gl";

export interface HoverTarget {
  source: string;
  id: string;
}

/** Imperative hover highlight — no React state on mousemove */
export function createHoverController(map: Map) {
  let current: HoverTarget | null = null;

  function clear() {
    if (!current) return;
    try {
      map.setFeatureState(
        { source: current.source, id: current.id },
        { hover: false }
      );
    } catch {
      /* ignore */
    }
    current = null;
  }

  function set(source: string, id: string) {
    if (current?.source === source && current?.id === id) return;
    clear();
    try {
      map.setFeatureState({ source, id }, { hover: true });
      current = { source, id };
    } catch {
      /* ignore */
    }
  }

  return { set, clear };
}
