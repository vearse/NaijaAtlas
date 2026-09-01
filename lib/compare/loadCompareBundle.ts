import fs from "fs";
import path from "path";
import type { CompareBundle, CompareCategoryDef, CompareDataBundle, CompareManifest } from "@/types/compare";

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function compareRoot(root: string): string {
  return path.join(root, "data/compare");
}

function resolveDataPath(
  baseDir: string,
  category: CompareCategoryDef,
  period?: string
): string | null {
  if (!category.temporal) {
    return category.dataFile
      ? path.join(baseDir, category.dataFile)
      : null;
  }
  if (!category.dataPath || !period) return null;
  const rel = category.dataPath.replace("{period}", period);
  return path.join(baseDir, rel);
}

function loadCategoryData(
  baseDir: string,
  category: CompareCategoryDef
): Record<string, CompareDataBundle> {
  const result: Record<string, CompareDataBundle> = {};

  if (!category.temporal) {
    const filePath = resolveDataPath(baseDir, category);
    if (filePath && fs.existsSync(filePath)) {
      result.default = loadJson<CompareDataBundle>(filePath);
    }
    return result;
  }

  for (const period of category.periods ?? []) {
    const filePath = resolveDataPath(baseDir, category, period.id);
    if (filePath && fs.existsSync(filePath)) {
      result[period.id] = loadJson<CompareDataBundle>(filePath);
    }
  }
  return result;
}

export function loadCompareBundle(root: string): CompareBundle {
  const manifest = loadJson<CompareManifest>(
    path.join(compareRoot(root), "manifest.json")
  );

  const stateData: CompareBundle["stateData"] = {};
  for (const category of manifest.stateCategories) {
    stateData[category.id] = loadCategoryData(
      path.join(compareRoot(root), "states"),
      category
    );
  }

  const countryData: CompareBundle["countryData"] = {};
  for (const category of manifest.countryCategories) {
    countryData[category.id] = loadCategoryData(
      path.join(compareRoot(root), "country"),
      category
    );
  }

  return { manifest, stateData, countryData };
}
