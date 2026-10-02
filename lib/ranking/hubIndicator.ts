import { formatMetricDisplay } from "@/lib/ranking/parseMetricValue";
import { buildChoroplethScale, colorForValue, legendFromScale } from "@/lib/ranking/choroplethScale";
import { formatMetricNumber, unitForField, type MetricUnit } from "@/lib/ranking/metricUnits";

/** One state, one period, one metric. `v` is null when the CSV cell is empty. */
export type HubIndicatorCell = { v: number | null; d: string };

export type HubIndicator = {
  /** Stable id, e.g. `economy.igr`. */
  key: string;
  categoryId: "economy" | "social";
  fieldKey: string;
  label: string;
  /** "max" = higher is better, "min" = lower is better, "none" = neutral. */
  highlight: "max" | "min" | "none";
  footnote?: string;
  unit: MetricUnit;
  /** Period id → label, only periods that actually carry values. */
  periods: { id: string; label: string; count: number }[];
  /** Period id → stateId → cell. */
  series: Record<string, Record<string, HubIndicatorCell>>;
  /** Default period: the latest one with any data. */
  defaultPeriod: string;
  sourceNote: string;
};

export type HubIndicatorRow = {
  stateId: string;
  stateName: string;
  regionName: string;
  value: number;
  display: string;
  rank: number;
};

export type HubIndicatorRanking = {
  indicator: HubIndicator;
  period: string;
  periodLabel: string;
  rows: HubIndicatorRow[];
  /** States with no value for this period. */
  missing: { stateId: string; stateName: string }[];
  fillByStateId: Record<string, string>;
  legend: { color: string; label: string }[];
  directionLabel: string;
  /** Best performer, for the headline callout. */
  leader?: HubIndicatorRow;
  /** Spread between first and last, in display terms. */
  range: { low: HubIndicatorRow; high: HubIndicatorRow };
};

/**
 * Rank one indicator for one period. Only indicators whose cells are non-empty
 * reach this point, so `rows` is always the states that actually reported.
 */
export function rankHubIndicator(
  indicator: HubIndicator,
  period: string,
  meta: { id: string; name: string; region: string }[]
): HubIndicatorRanking | null {
  const cells = indicator.series[period];
  if (!cells) return null;

  const higherIsBetter = indicator.highlight !== "min";
  const rows: HubIndicatorRow[] = [];
  const missing: { stateId: string; stateName: string }[] = [];

  for (const m of meta) {
    const cell = cells[m.id];
    if (!cell || cell.v == null) {
      missing.push({ stateId: m.id, stateName: m.name });
      continue;
    }
    rows.push({
      stateId: m.id,
      stateName: m.name,
      regionName: m.region,
      value: cell.v,
      display: cell.d,
      rank: 0,
    });
  }

  if (rows.length === 0) return null;

  rows.sort((a, b) => (higherIsBetter ? b.value - a.value : a.value - b.value));
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  const { breaks, colors } = buildChoroplethScale(rows.map((r) => r.value));
  const fillByStateId: Record<string, string> = {};
  for (const r of rows) {
    fillByStateId[r.stateId] = colorForValue(r.value, breaks, colors);
  }

  const periodLabel =
    indicator.periods.find((p) => p.id === period)?.label ?? period;

  return {
    indicator,
    period,
    periodLabel,
    rows,
    missing,
    fillByStateId,
    legend: legendFromScale(breaks, colors, (n) =>
      formatMetricNumber(n, indicator.unit)
    ),
    directionLabel: higherIsBetter ? "Higher is better" : "Lower is better",
    leader: higherIsBetter ? rows[0] : rows[rows.length - 1],
    range: {
      low: higherIsBetter ? rows[rows.length - 1] : rows[0],
      high: higherIsBetter ? rows[0] : rows[rows.length - 1],
    },
  };
}

/** Median of the reported values, for the national pulse. */
export function medianOf(ranking: HubIndicatorRanking): number | null {
  if (ranking.rows.length === 0) return null;
  const values = ranking.rows.map((r) => r.value).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[mid - 1] + values[mid]) / 2
    : values[mid];
}

/** Sum of a currency indicator across reporting states. */
export function sumOf(ranking: HubIndicatorRanking): number {
  return ranking.rows.reduce((total, r) => total + r.value, 0);
}

/**
 * Precise compact formatting for hub tables. The source CSVs round to two
 * significant figures ("40 Billion"), which collapses neighbouring states onto
 * the same string, so tables use this instead and keep the published string
 * for the detail view.
 */
export function formatHubValue(value: number, unit: MetricUnit): string {
  if (unit.kind === "prefix" && unit.token === "₦") {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `₦${(value / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `₦${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `₦${(value / 1e6).toFixed(2)}M`;
    return `₦${Math.round(value).toLocaleString("en-NG")}`;
  }
  if (unit.kind === "suffix" && unit.token === " per 1,000") {
    return `${value.toFixed(1)}${unit.token}`;
  }
  if (unit.kind === "suffix" && unit.token === "%") {
    return `${value.toFixed(1)}%`;
  }
  return Math.round(value).toLocaleString("en-NG");
}

export { unitForField };
