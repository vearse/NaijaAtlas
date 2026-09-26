import type { CompareHighlight } from "@/types/compare";
import type { MetricUnit } from "@/lib/ranking/metricUnits";

export type RankingCategoryId = "economy" | "social";

export interface RankingFieldDef {
  categoryId: RankingCategoryId;
  fieldKey: string;
  label: string;
  highlight: CompareHighlight;
  /** Optional prose describing what the metric measures. */
  footnote?: string;
}

export interface RankingLegendStep {
  color: string;
  label: string;
}

export interface RankingEntry {
  stateId: string;
  stateName: string;
  value: number;
  display: string;
  rank: number | null;
}

export interface RankingSnapshot {
  field: RankingFieldDef;
  period: string;
  periodLabel: string;
  sourceNote: string;
  entries: RankingEntry[];
  noData: RankingEntry[];
  legendSteps: RankingLegendStep[];
  fillByStateId: Record<string, string>;
  /** Ranked stateId → 1-based rank, for map labels. No-data states are absent. */
  rankByStateId: Record<string, number>;
  /** Display unit for this metric (naira, percent, per-1,000, …). */
  unit: MetricUnit;
  missingStateIds: Set<string>;
  hasData: boolean;
  directionLabel: string;
}
