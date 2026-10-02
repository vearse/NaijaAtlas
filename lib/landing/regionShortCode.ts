const REGION_SHORT: Record<string, string> = {
  "NG-SW": "SW",
  "NG-SE": "SE",
  "NG-SS": "SS",
  "NG-NC": "NC",
  "NG-NE": "NE",
  "NG-NW": "NW",
};

export function regionShortCode(regionId: string): string {
  return REGION_SHORT[regionId] ?? regionId.replace("NG-", "");
}
