import type { LgaLocation } from "@/types/location";

/**
 * A plan to show a group of LGAs on the map: which LGA features to
 * highlight, which state LGA layers to load, and where to fly to.
 *
 * Reusable for any LGA-based grouping: a metro area (its member LGAs), a
 * single LGA, a senatorial district or constituency (its LGAs), a state's
 * LGA subset, etc.
 */
export interface LgaFocusPlan {
  /** LGA ids to highlight (only those resolvable against `lgas`). */
  lgaIds: string[];
  /** State ids whose LGA layers must be loaded (parents of `lgaIds`). */
  stateIds: string[];
  /** Union bounding box of the highlighted LGAs (padded), or null if none resolved. */
  bounds: [[number, number], [number, number]] | null;
}

/**
 * Resolve an arbitrary list of LGA ids into an `LgaFocusPlan`.
 *
 * - LGA ids that don't resolve against `lgas` are skipped (they may be
 *   missing/renamed); `fallbackStateIds` keeps those cases viewable at
 *   state level rather than silently empty.
 * - `lgaIds` returned is the stable ordered list of resolved ids, so
 *   callers can compare plans (e.g. for toggle state).
 */
export function resolveLgaFocusPlan(
  lgaIds: string[],
  lgas: LgaLocation[],
  fallbackStateIds: string[] = []
): LgaFocusPlan {
  const byId = new Map(lgas.map((l) => [l.id, l]));
  const found: LgaLocation[] = [];
  for (const id of lgaIds) {
    const l = byId.get(id);
    if (l && l.bbox) found.push(l);
  }

  const stateIds = [
    ...new Set([
      ...found.map((l) => l.parentId).filter(Boolean),
      ...fallbackStateIds,
    ]),
  ];

  let bounds: LgaFocusPlan["bounds"] = null;
  if (found.length > 0) {
    let minLon = Infinity;
    let minLat = Infinity;
    let maxLon = -Infinity;
    let maxLat = -Infinity;
    for (const l of found) {
      const [w, s, e, n] = l.bbox;
      minLon = Math.min(minLon, w);
      minLat = Math.min(minLat, s);
      maxLon = Math.max(maxLon, e);
      maxLat = Math.max(maxLat, n);
    }
    const dx = (maxLon - minLon) * 0.1 || 0.05;
    const dy = (maxLat - minLat) * 0.1 || 0.04;
    bounds = [
      [minLon - dx, minLat - dy],
      [maxLon + dx, maxLat + dy],
    ];
  }

  return { lgaIds: found.map((l) => l.id), stateIds, bounds };
}

/** True when two plans cover the same set of LGA ids (set order-insensitive). */
export function sameLgaFocus(
  a: LgaFocusPlan | null,
  b: LgaFocusPlan | null
): boolean {
  if (!a || !b || a.lgaIds.length !== b.lgaIds.length) return false;
  const sortedA = [...a.lgaIds].sort();
  const sortedB = [...b.lgaIds].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}