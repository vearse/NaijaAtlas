import type { CompareBundle, CompareHighlight } from "@/types/compare";
import type { RankingCategoryId, RankingFieldDef } from "@/lib/ranking/types";

const RANKING_CATEGORIES: RankingCategoryId[] = ["economy", "social"];

export function getRankingFields(bundle: CompareBundle): RankingFieldDef[] {
  const out: RankingFieldDef[] = [];
  for (const cat of bundle.manifest.stateCategories) {
    if (!RANKING_CATEGORIES.includes(cat.id as RankingCategoryId)) continue;
    for (const field of cat.fields) {
      if (field.source !== "data") continue;
      out.push({
        categoryId: cat.id as RankingCategoryId,
        fieldKey: field.key,
        label: field.label,
        highlight: field.highlight === "min" || field.highlight === "max"
          ? field.highlight
          : "max",
        footnote: field.footnote,
      });
    }
  }
  return out;
}

export function findRankingField(
  bundle: CompareBundle,
  categoryId: RankingCategoryId,
  fieldKey: string
): RankingFieldDef | null {
  return (
    getRankingFields(bundle).find(
      (f) => f.categoryId === categoryId && f.fieldKey === fieldKey
    ) ?? null
  );
}

export function defaultHighlightForField(
  fieldKey: string
): CompareHighlight {
  if (
    fieldKey.includes("mortality") ||
    fieldKey.includes("poverty") ||
    fieldKey.includes("unemployment") ||
    fieldKey.includes("debt") ||
    fieldKey.includes("stunting") ||
    fieldKey === "outOfSchoolChildren"
  ) {
    return "min";
  }
  return "max";
}
