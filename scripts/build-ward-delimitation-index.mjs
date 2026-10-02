/**
 * Build a compact ward-level delimitation index.
 *
 * `polling-unit-index.json` is ~51 MB with one row per polling unit, and
 * `polling-units.json` is ~27 MB — both far too large to touch from a page
 * request. The Civic hub only needs to answer "which ward is code 01/01/01/005
 * in?", so we collapse the 176k rows down to one entry per ward (8.8k) and keep
 * it in data/ for server-side reads.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "data/locations/polling-unit-index.json");
const outPath = path.join(
  root,
  "data/locations/ward-delimitation-index.json"
);

if (!fs.existsSync(indexPath)) {
  console.warn("build-ward-delimitation-index: index missing, skip");
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
const rows = raw.pollingUnits ?? [];

/** `01/01/01/005` -> `01/01/01` */
function wardKey(delimitation) {
  if (typeof delimitation !== "string") return null;
  const parts = delimitation.split("/");
  if (parts.length < 3) return null;
  return parts.slice(0, 3).join("/");
}

const wards = {};

for (const row of rows) {
  const key = wardKey(row.delimitation);
  if (!key || !row.wardId) continue;
  const existing = wards[key];
  if (existing) {
    existing.pollingUnits += 1;
    continue;
  }
  wards[key] = {
    stateId: row.stateId,
    stateName: row.stateName,
    lgaId: row.lgaId,
    lgaName: row.lgaName,
    wardId: row.wardId,
    wardName: row.wardName,
    pollingUnits: 1,
  };
}

const out = {
  source: raw.metadata?.source ?? null,
  scrapedAt: raw.metadata?.scrapedAt ?? null,
  totals: {
    wards: Object.keys(wards).length,
    pollingUnits: rows.length,
  },
  wards,
};

fs.writeFileSync(outPath, JSON.stringify(out));

console.log(
  `ward delimitation index: ${Object.keys(wards).length} wards from ${rows.length} units`
);
