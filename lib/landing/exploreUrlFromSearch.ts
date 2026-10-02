import type { SearchEntry } from "@/types/location";

/** Build an /explore URL that mirrors UrlSync query conventions. */
export function exploreUrlFromSearch(entry: SearchEntry): string {
  const params = new URLSearchParams();
  params.set("map", "minimal");

  if (entry.level === "country") {
    return `/explore?${params.toString()}`;
  }

  if (entry.level === "state" || entry.level === "state-note") {
    const stateId = entry.level === "state" ? entry.id : entry.parentId;
    if (stateId) params.set("states", stateId);
    return `/explore?${params.toString()}`;
  }

  if (entry.level === "lga" && entry.parentId) {
    params.set("states", entry.parentId);
    params.set("lgas", "1");
    params.set("lga", entry.id);
    return `/explore?${params.toString()}`;
  }

  if (entry.level === "metro" && entry.stateIds?.length) {
    params.set("states", entry.stateIds.join(","));
    params.set("lgas", "1");
    return `/explore?${params.toString()}`;
  }

  if (entry.layerId) {
    params.set("lens", "learn");
    return `/explore?${params.toString()}`;
  }

  if (entry.parentId) {
    params.set("states", entry.parentId);
  }

  return `/explore?${params.toString()}`;
}
