/**
 * Extract cultural-group entries from data/content/metro.json
 * into data/content/ethnic-groups.json (homelands catalog for People).
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const metroPath = path.join(root, "data/content/metro.json");
const outPath = path.join(root, "data/content/ethnic-groups.json");

const metro = JSON.parse(fs.readFileSync(metroPath, "utf-8"));
const groups = metro.filter((g) => g.groupType === "cultural-group");

if (groups.length === 0) {
  console.error("No cultural-group entries found in metro.json");
  process.exit(1);
}

const payload = {
  schemaVersion: 1,
  source: "data/content/metro.json",
  groupType: "cultural-group",
  generatedAt: new Date().toISOString().slice(0, 10),
  count: groups.length,
  groups,
};

fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
console.log(`Wrote ${groups.length} ethnic homelands to ${outPath}`);
