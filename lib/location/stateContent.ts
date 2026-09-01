import type { StateContent, StateLocation } from "@/types/location";

/** Build panel content when states.json entry is missing from content bundle */
export function fallbackStateContent(location: StateLocation): StateContent {
  return {
    id: location.id,
    name: location.name,
    region: location.regionName,
    capital: null,
    lgaCount: location.lgaCount,
    description: `${location.name} is a state in Nigeria's ${location.regionName} geopolitical zone.`,
  };
}

export function resolveStateContent(
  location: StateLocation,
  stateContent: StateContent[]
): StateContent {
  return (
    stateContent.find((c) => c.id === location.id) ??
    fallbackStateContent(location)
  );
}
