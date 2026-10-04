import fs from "node:fs";
import path from "node:path";
import {
  projectLgaSvg,
  type LgaFeatureCollection,
  type StateLgaSvg,
} from "@/lib/geo/projectLgaSvg";

export type { StateLgaShape, StateLgaSvg } from "@/lib/geo/projectLgaSvg";

/** LGA polygons of one state, projected to SVG paths (equirectangular, lat-corrected). */
export function loadStateLgaSvg(stateId: string): StateLgaSvg | null {
  const file = path.join(process.cwd(), "public/geo/lgas", `${stateId}.geojson`);
  if (!fs.existsSync(file)) return null;
  return projectLgaSvg(JSON.parse(fs.readFileSync(file, "utf8")) as LgaFeatureCollection);
}
