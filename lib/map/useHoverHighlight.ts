import type { Map } from "maplibre-gl";

export interface HoverTarget {
  source: string;
  id: string;
}

function hasSource(map: Map, source: string): boolean {
  try {
    return Boolean(map.getSource(source));
  } catch {
    return false;
  }
}

/** Imperative hover highlight — no React state on mousemove */
export function createHoverController(map: Map) {
  let current: HoverTarget | null = null;

  function clear() {
    if (!current) return;
    if (!hasSource(map, current.source)) {
      current = null;
      return;
    }
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
    if (!hasSource(map, source)) return;
    try {
      map.setFeatureState({ source, id }, { hover: true });
      current = { source, id };
    } catch {
      /* ignore */
    }
  }

  return { set, clear };
}
