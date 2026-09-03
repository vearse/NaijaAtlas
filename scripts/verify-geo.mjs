import fs from "fs";
import path from "path";

const required = [
  "public/geo/nigeria-adm0.geojson",
  "public/geo/nigeria-adm1.geojson",
  "public/geo/regions.geojson",
  "public/geo/neighbors.geojson",
  "public/geo/overlays/rivers.geojson",
  "public/geo/overlays/lakes.geojson",
  "public/geo/overlays/creeks.geojson",
  "public/geo/overlays/coast.geojson",
  "public/geo/overlays/landforms.geojson",
  "public/geo/overlays/cities.geojson",
  "public/geo/lgas/NG-LA.geojson",
];

const root = process.cwd();
const missing = required.filter((f) => !fs.existsSync(path.join(root, f)));

if (missing.length) {
  console.error("\n❌ Missing geo assets required for build:\n");
  missing.forEach((f) => console.error(`   - ${f}`));
  console.error("\nRun: npm run build:geo\n");
  process.exit(1);
}

console.log("✓ Geo assets present");
