import type { CompareBundle } from "@/types/compare";
import type { RankingCategoryId } from "@/lib/ranking/types";
import { buildRankingSnapshot } from "@/lib/ranking/computeRanking";
import { getCategories, getCategoryData } from "@/lib/compare/compareUtils";
import { getRankingFields } from "@/lib/ranking/rankingFields";
import { parseMetricValue } from "@/lib/ranking/parseMetricValue";
import type { StateLocation } from "@/types/location";

export const DEFAULT_RANKING: {
  categoryId: RankingCategoryId;
  fieldKey: string;
  period: string;
} = {
  categoryId: "economy",
  fieldKey: "igr",
  period: "2023",
};

export function resolveDefaultRankingMetric(
  bundle: CompareBundle,
  states: StateLocation[]
): { categoryId: RankingCategoryId; fieldKey: string; period: string } {
  const trySnap = buildRankingSnapshot(
    bundle,
    states,
    DEFAULT_RANKING.categoryId,
    DEFAULT_RANKING.fieldKey,
    DEFAULT_RANKING.period
  );
  if (trySnap?.hasData) return DEFAULT_RANKING;

  const social = buildRankingSnapshot(
    bundle,
    states,
    "social",
    "literacyRate",
    "2021"
  );
  if (social?.hasData) {
    return { categoryId: "social", fieldKey: "literacyRate", period: "2021" };
  }
  return DEFAULT_RANKING;
}

/** Count cells with a real (non-placeholder) value for a field in a period. */
function countRealValues(
  data: ReturnType<typeof getCategoryData>,
  fieldKey: string
): number {
  let n = 0;
  for (const row of Object.values(data)) {
    if (parseMetricValue(row?.[fieldKey]) != null) n++;
  }
  return n;
}

/**
 * Pick the field + period a category tab should land on.
 *
 * Some declared periods ship as placeholder-only bundles (e.g. social 2018 and
 * 2023 are all "—"), so carrying the current period across a category switch
 * would open an empty panel. Prefer the period already in use when it has real
 * data, else the category default, else whichever period has the most data.
 */
export function resolveCategoryLanding(
  bundle: CompareBundle,
  categoryId: RankingCategoryId,
  preferredFieldKey?: string,
  preferredPeriod?: string
): { fieldKey: string; period: string } {
  const fields = getRankingFields(bundle).filter(
    (f) => f.categoryId === categoryId
  );
  const fieldKey =
    fields.find((f) => f.fieldKey === preferredFieldKey)?.fieldKey ??
    fields[0]?.fieldKey ??
    "";
  if (!fieldKey) return { fieldKey, period: preferredPeriod ?? "" };

  const category = getCategories(bundle, "state").find(
    (c) => c.id === categoryId
  );
  const periods = category?.periods ?? [];

  let period = "";
  if (periods.length === 0) {
    period = "default";
  } else if (
    preferredPeriod &&
    periods.some((p) => p.id === preferredPeriod) &&
    countRealValues(getCategoryData(bundle, "state", categoryId, preferredPeriod), fieldKey) > 0
  ) {
    period = preferredPeriod;
  } else {
    const fallback = category?.defaultPeriod;
    const candidates = fallback
      ? [fallback, ...periods.map((p) => p.id).filter((id) => id !== fallback)]
      : periods.map((p) => p.id);
    period =
      candidates.find(
        (id) =>
          countRealValues(
            getCategoryData(bundle, "state", categoryId, id),
            fieldKey
          ) > 0
      ) ?? candidates[0];
  }

  return { fieldKey, period };
}
