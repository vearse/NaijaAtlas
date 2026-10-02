/**
 * Precompute the static SVG paths used by the hub map thumbnails.
 *
 * `public/geo/regions.geojson` (72 KB) and `public/geo/nigeria-adm1.geojson`
 * (182 KB) cannot be read with `fs` from a client component, and importing them
 * into the bundle would ship half a megabyte of geometry. Hub pages only need a
 * silhouette, so we project both files once and emit a plain TS module.
 */
import fs from "fs";
import path from "path";
import {
  projectFeatureCollection,
  type GeoJsonFeatureCollection,
} from "../lib/geo/geoJsonToSvg";

const root = path.join(__dirname, "..");

type Source = { file: string; idKey: string; exportName: string };

const SOURCES: Source[] = [
  {
    file: "public/geo/regions.geojson",
    idKey: "id",
    exportName: "NIGERIA_REGION_PATHS",
  },
  {
    file: "public/geo/nigeria-adm1.geojson",
    idKey: "id",
    exportName: "NIGERIA_STATE_PATHS",
  },
];

const parts: string[] = [
  "/**",
  " * GENERATED FILE — do not edit. Run `npm run build:thumbs`.",
  " *",
  " * Projected outlines of the six geopolitical regions and the 37 states, used",
  " * by the static map thumbnails on the section hub pages.",
  " */",
  "",
  `export const NIGERIA_VIEW_BOX = "0 0 200 200";`,
  "",
  "export type HubThumbPath = {",
  "  /** Region or state id (`NG-SW`, `NG-LA`). */",
  "  key: string;",
  "  /** SVG path data in the NIGERIA_VIEW_BOX coordinate space. */",
  "  d: string;",
  "};",
  "",
];

for (const source of SOURCES) {
  const file = path.join(root, source.file);
  if (!fs.existsSync(file)) {
    console.warn(`build-hub-thumbs: ${source.file} missing, skip`);
    continue;
  }
  const collection = JSON.parse(
    fs.readFileSync(file, "utf-8")
  ) as GeoJsonFeatureCollection;
  const projected = projectFeatureCollection(collection, {
    idKey: source.idKey,
  });

  parts.push(`export const ${source.exportName}: HubThumbPath[] = [`);
  for (const feature of projected.features) {
    parts.push(`  { key: ${JSON.stringify(feature.key)}, d: ${JSON.stringify(feature.d)} },`);
  }
  parts.push("];", "");
}

const out = path.join(root, "data/geo/hubThumbs.ts");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, parts.join("\n"));

const size = fs.statSync(out).size;
console.log(
  `hub thumbs: ${SOURCES.map((s) => s.file).join(", ")} -> data/geo/hubThumbs.ts (${(size / 1024).toFixed(0)} KB)`
);
