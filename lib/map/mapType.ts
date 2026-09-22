import type { MapTypeId } from "@/lib/store/mapStore";

export function parseMapTypeParam(param: string | null): MapTypeId {
  if (param === "osm") return "osm";
  if (param === "election" || param === "politics") return "election";
  return "minimal";
}
