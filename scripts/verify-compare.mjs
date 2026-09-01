import fs from "fs";
import path from "path";

const root = process.cwd();
const manifestPath = path.join(root, "data/compare/manifest.json");
const statesPath = path.join(root, "data/compare/states");
const countryPath = path.join(root, "data/compare/country");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const statesJson = JSON.parse(
  fs.readFileSync(path.join(root, "data/locations/states.json"), "utf-8")
);
const STATE_IDS = statesJson.map((s) => s.id).sort();
const COUNTRY_ID = "NG";

const PLACEHOLDER = new Set(["—", "-", "", null, undefined]);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function resolvePath(baseDir, category, period) {
  if (!category.temporal) {
    return path.join(baseDir, category.dataFile);
  }
  const rel = category.dataPath.replace("{period}", period);
  return path.join(baseDir, rel);
}

function dataFieldKeys(category) {
  return category.fields.filter((f) => f.source === "data").map((f) => f.key);
}

function isPlaceholder(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return PLACEHOLDER.has(value.trim());
  if (typeof value === "number") return false;
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((v) => isPlaceholder(v?.name));
  }
  if (typeof value === "object" && value !== null && "name" in value) {
    return isPlaceholder(value.name);
  }
  return false;
}

let errors = [];
let warnings = [];
let placeholderCount = 0;
let totalFields = 0;

function validateBundle(scope, categories, baseDir, locationIds) {
  for (const category of categories) {
    const periods = category.temporal
      ? (category.periods ?? []).map((p) => p.id)
      : ["default"];

    for (const period of periods) {
      const filePath = resolvePath(baseDir, category, period);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing file: ${path.relative(root, filePath)}`);
        continue;
      }

      const data = loadJson(filePath);
      const keys = dataFieldKeys(category);

      for (const locId of locationIds) {
        if (!data[locId]) {
          errors.push(
            `Missing location ${locId} in ${path.relative(root, filePath)}`
          );
          continue;
        }
        for (const key of keys) {
          totalFields++;
          if (!(key in data[locId])) {
            errors.push(
              `Missing field "${key}" for ${locId} in ${path.relative(root, filePath)}`
            );
          } else if (isPlaceholder(data[locId][key])) {
            placeholderCount++;
          }
        }
      }
    }
  }
}

validateBundle(
  "state",
  manifest.stateCategories,
  statesPath,
  STATE_IDS
);
validateBundle(
  "country",
  manifest.countryCategories,
  countryPath,
  [COUNTRY_ID]
);

if (errors.length) {
  console.error("\n❌ Compare data validation failed:\n");
  errors.slice(0, 30).forEach((e) => console.error(`   - ${e}`));
  if (errors.length > 30) {
    console.error(`   … and ${errors.length - 30} more`);
  }
  console.error("\nRun: npm run build:compare\n");
  process.exit(1);
}

const placeholderPct =
  totalFields > 0 ? Math.round((placeholderCount / totalFields) * 100) : 0;

if (placeholderPct >= 60) {
  warnings.push(
    `${placeholderPct}% of data fields are placeholders (— / null) — backfill source CSVs when ready`
  );
}

console.log(`✓ Compare bundles valid (${STATE_IDS.length} states, ${totalFields} data fields checked)`);
if (warnings.length) {
  console.warn("\n⚠ Compare data warnings:");
  warnings.forEach((w) => console.warn(`   - ${w}`));
}
