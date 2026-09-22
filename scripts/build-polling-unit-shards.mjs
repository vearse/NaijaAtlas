/**
 * Build public polling-unit shards from data/locations/polling-unit-index.json
 * (run in prebuild when full geo pipeline was not executed).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "data/locations/polling-unit-index.json");

if (!fs.existsSync(indexPath)) {
  console.warn("build-polling-unit-shards: index missing, skip");
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
const index = raw.pollingUnits ?? [];

const delimitationIndex = {};
const byState = {};

for (const row of index) {
  if (row.delimitation) {
    delimitationIndex[row.delimitation] = {
      stateId: row.stateId,
      puId: row.id,
    };
  }
  if (!byState[row.stateId]) byState[row.stateId] = [];
  byState[row.stateId].push({
    id: row.id,
    delimitation: row.delimitation,
    name: row.name,
    abbreviation: row.abbreviation,
    wardId: row.wardId,
    wardName: row.wardName,
    lgaId: row.lgaId,
    lgaName: row.lgaName,
    status: row.status,
  });
}

const outDir = path.join(root, "public/data/polling-units/by-state");
fs.mkdirSync(outDir, { recursive: true });
for (const [stateId, rows] of Object.entries(byState)) {
  fs.writeFileSync(
    path.join(outDir, `${stateId}.json`),
    JSON.stringify(rows)
  );
}
fs.mkdirSync(path.join(root, "public/data/polling-units"), { recursive: true });
fs.writeFileSync(
  path.join(root, "public/data/polling-units/delimitation-index.json"),
  JSON.stringify(delimitationIndex)
);

console.log(
  `polling-unit shards: ${Object.keys(byState).length} states, ${index.length} units`
);
