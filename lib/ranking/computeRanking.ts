import type { CompareBundle } from "@/types/compare";
import type { StateLocation } from "@/types/location";
import { getCategoryData, getCategories } from "@/lib/compare/compareUtils";
import {
  colorForValue,
  buildChoroplethScale,
  legendFromScale,
} from "@/lib/ranking/choroplethScale";
import { formatMetricNumber, unitForField } from "@/lib/ranking/metricUnits";
import { findRankingField } from "@/lib/ranking/rankingFields";
import { formatMetricDisplay, parseMetricValue } from "@/lib/ranking/parseMetricValue";
import type { RankingCategoryId, RankingSnapshot } from "@/lib/ranking/types";

const MISSING_FILL = "#e2e8f0";

export function buildRankingSnapshot(
  bundle: CompareBundle,
  states: StateLocation[],
  categoryId: RankingCategoryId,
  fieldKey: string,
  period: string
): RankingSnapshot | null {
  const field = findRankingField(bundle, categoryId, fieldKey);
  if (!field) return null;

  const cat = getCategories(bundle, "state").find((c) => c.id === categoryId);
  const periodDef = cat?.periods?.find((p) => p.id === period);
  const data = getCategoryData(bundle, "state", categoryId, period);

  const withValues: {
    stateId: string;
    stateName: string;
    value: number;
    display: string;
  }[] = [];
  const noData: RankingSnapshot["noData"] = [];

  for (const state of states) {
    const row = data[state.id];
    const raw = row?.[fieldKey];
    const value = parseMetricValue(raw);
    const display = formatMetricDisplay(raw);
    if (value == null) {
      noData.push({
        stateId: state.id,
        stateName: state.name,
        value: 0,
        display,
        rank: null,
      });
      continue;
    }
    withValues.push({
      stateId: state.id,
      stateName: state.name,
      value,
      display,
    });
  }

  const higherIsBetter = field.highlight !== "min";
  withValues.sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );

  const entries = withValues.map((row, i) => ({
    ...row,
    rank: i + 1,
  }));

  const values = withValues.map((r) => r.value);
  const { breaks, colors } = buildChoroplethScale(values);
  const fillByStateId: Record<string, string> = {};
  const rankByStateId: Record<string, number> = {};
  const missingStateIds = new Set<string>();

  for (const state of states) {
    const row = entries.find((e) => e.stateId === state.id);
    if (!row) {
      missingStateIds.add(state.id);
      fillByStateId[state.id] = MISSING_FILL;
    } else {
      fillByStateId[state.id] = colorForValue(row.value, breaks, colors);
      if (row.rank != null) rankByStateId[state.id] = row.rank;
    }
  }

  const directionLabel = higherIsBetter
    ? "Higher is better"
    : "Lower is better";

  const unit = unitForField(field.fieldKey, field.label);

  return {
    field,
    period,
    periodLabel: periodDef?.label ?? period,
    sourceNote: cat?.sourceNote ?? "",
    entries,
    noData,
    legendSteps: legendFromScale(breaks, colors, (n) =>
      formatMetricNumber(n, unit)
    ),
    fillByStateId,
    rankByStateId,
    unit,
    missingStateIds,
    hasData: entries.length > 0,
    directionLabel,
  };
}
