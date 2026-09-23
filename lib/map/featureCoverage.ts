import { resolveStateIdsFromNames } from "@/lib/map/featureMapViews";

interface ResourceSite {
  state?: string;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseObjectArray<T>(value: unknown): T[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // ignore
  }
  return [];
}

/** Collect human-readable state names from overlay catalog / feature properties. */
export function collectCoverageStateNames(
  props: Record<string, unknown>
): string[] {
  const names = new Set<string>();
  for (const n of parseStringArray(props.statesCrossed)) names.add(n);
  for (const n of parseStringArray(props.coversStates)) names.add(n);
  for (const n of parseStringArray(props.coastalStates)) names.add(n);
  if (typeof props.stateName === "string" && props.stateName.trim()) {
    names.add(props.stateName);
  }
  const sites = parseObjectArray<ResourceSite>(props.locations);
  for (const site of sites) {
    if (typeof site.state === "string" && site.state.trim()) {
      names.add(site.state);
    }
  }
  return [...names];
}

export function resolveCoverageStateIds(
  props: Record<string, unknown>
): string[] {
  return resolveStateIdsFromNames(collectCoverageStateNames(props));
}

/** Show “View on map” when coverage spans multiple states or multiple resource sites. */
export function shouldOfferViewOnMap(
  props: Record<string, unknown>,
  stateIds: string[]
): boolean {
  if (stateIds.length >= 2) return true;
  const sites = parseObjectArray<ResourceSite>(props.locations);
  if (sites.length >= 2 && stateIds.length >= 1) return true;
  if (parseStringArray(props.coversStates).length >= 2 && stateIds.length >= 1) {
    return true;
  }
  if (
    props.featureKind === "power-distributor" &&
    stateIds.length >= 1 &&
    parseStringArray(props.statesCrossed).length >= 2
  ) {
    return true;
  }
  if (
    props.waterwayClass === "military" &&
    parseStringArray(props.coversStates).length >= 2 &&
    stateIds.length >= 1
  ) {
    return true;
  }
  return false;
}
