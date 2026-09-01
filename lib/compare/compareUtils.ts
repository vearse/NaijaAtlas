import type {
  CompareBundle,
  CompareCategoryDef,
  CompareDataBundle,
} from "@/types/compare";

export function getCategoryData(
  bundle: CompareBundle,
  scope: "state" | "country",
  categoryId: string,
  period: string
): CompareDataBundle {
  const store = scope === "state" ? bundle.stateData : bundle.countryData;
  const categoryData = store[categoryId];
  if (!categoryData) return {};
  return categoryData[period] ?? categoryData.default ?? {};
}

export function getCategories(
  bundle: CompareBundle,
  scope: "state" | "country"
): CompareCategoryDef[] {
  return scope === "state"
    ? bundle.manifest.stateCategories
    : bundle.manifest.countryCategories;
}

export function defaultPeriodForCategory(
  category: CompareCategoryDef
): string {
  if (!category.temporal) return "default";
  return (
    category.defaultPeriod ??
    category.periods?.[0]?.id ??
    "default"
  );
}
