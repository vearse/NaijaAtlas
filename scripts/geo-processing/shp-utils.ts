import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
// @ts-expect-error no types
import * as shapefile from "shapefile";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const ROOT = path.resolve(__dirname, "../..");

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function extractZip(zipPath: string, destDir: string): string {
  ensureDir(destDir);
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
  const shp = findFile(destDir, ".shp");
  if (!shp) throw new Error(`No .shp in ${zipPath}`);
  return shp;
}

function findFile(dir: string, ext: string): string | null {
  let fallback: string | null = null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(full, ext);
      if (found) return found;
    } else if (entry.name.endsWith(ext)) {
      if (entry.name.includes("polnda")) return full;
      if (!fallback) fallback = full;
    }
  }
  return fallback;
}

export async function readShapefile(shpPath: string): Promise<FeatureCollection> {
  const source = await shapefile.open(shpPath);
  const features: Feature[] = [];
  while (true) {
    const result = await source.read();
    if (result.done) break;
    features.push(result.value as Feature);
  }
  return { type: "FeatureCollection", features };
}

export function getProp(props: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = props[k] ?? props[k.toLowerCase()] ?? props[k.toUpperCase()];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

export function writeJson(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data));
}

export function writeGeoJson(filePath: string, fc: FeatureCollection) {
  writeJson(filePath, fc);
}

export function projectRoot(...segments: string[]) {
  return path.join(ROOT, ...segments);
}

export type GeoFeature = Feature<Geometry, Record<string, unknown>>;
