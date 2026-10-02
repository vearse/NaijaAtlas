import { loadCompareBundle } from "@/lib/compare/loadCompareBundle";
import { getCategories, getCategoryData } from "@/lib/compare/compareUtils";
import { getRankingFields } from "@/lib/ranking/rankingFields";
import { parseMetricValue, formatMetricDisplay } from "@/lib/ranking/parseMetricValue";
import { unitForField } from "@/lib/ranking/metricUnits";
import type { HubIndicator, HubIndicatorCell } from "@/lib/ranking/hubIndicator";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";

/**
 * The compare bundle declares 33 state indicators, but the source CSVs reserve
 * those columns rather than filling them. We only ship indicators with real
 * values, and report the rest separately as reserved-but-uncollected.
 */
type StateMeta = { id: string; name: string; region: string; slug: string };

function buildStateMeta(): StateMeta[] {
  const { states } = loadExplorerPageData(process.cwd());
  return states
    .map((s) => ({
      id: s.id,
      name: s.name,
      region: s.regionName,
      slug: s.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildIndicators(states: StateMeta[]) {
  const bundle = loadCompareBundle(process.cwd());
  const fields = getRankingFields(bundle);
  const indicators: HubIndicator[] = [];
  const reserved: { key: string; label: string; categoryId: string }[] = [];

  for (const catId of ["economy", "social"] as const) {
    const cat = getCategories(bundle, "state").find((c) => c.id === catId);
    if (!cat) continue;

    for (const field of fields.filter((f) => f.categoryId === catId)) {
      const series: Record<string, Record<string, HubIndicatorCell>> = {};
      const periods: { id: string; label: string; count: number }[] = [];

      for (const period of cat.periods ?? []) {
        const data = getCategoryData(bundle, "state", catId, period.id);
        const cells: Record<string, HubIndicatorCell> = {};
        let count = 0;
        for (const s of states) {
          const raw = (data[s.id] as Record<string, unknown> | undefined)?.[
            field.fieldKey
          ];
          const value = parseMetricValue(raw);
          if (value == null) continue;
          cells[s.id] = { v: value, d: formatMetricDisplay(raw) };
          count += 1;
        }
        if (count > 0) {
          series[period.id] = cells;
          periods.push({ id: period.id, label: period.label, count });
        }
      }

      if (periods.length === 0) {
        reserved.push({
          key: field.fieldKey,
          label: field.label,
          categoryId: catId,
        });
        continue;
      }

      const latest = periods[periods.length - 1];
      indicators.push({
        key: `${catId}.${field.fieldKey}`,
        categoryId: catId,
        fieldKey: field.fieldKey,
        label: field.label,
        highlight: field.highlight,
        footnote: field.footnote,
        unit: unitForField(field.fieldKey, field.label),
        periods,
        series,
        defaultPeriod: latest.id,
        sourceNote: cat.sourceNote ?? "",
      });
    }
  }

  return { indicators, reserved, sourceNotes: {} as Record<string, string> };
}

export type DataHubData = {
  states: StateMeta[];
  indicators: HubIndicator[];
  /** Declared in the schema but empty in every source CSV. */
  reserved: { key: string; label: string; categoryId: string }[];
  economySource: string;
  socialSource: string;
  stateCount: number;
};

let cache: DataHubData | null = null;

export function loadDataHubData(): DataHubData {
  if (cache) return cache;

  const states = buildStateMeta();
  const { indicators, reserved } = buildIndicators(states);
  const bundle = loadCompareBundle(process.cwd());
  const manifestCategories = getCategories(bundle, "state");
  const sourceFor = (id: string) =>
    manifestCategories.find((c) => c.id === id)?.sourceNote ?? "";

  cache = {
    states,
    indicators,
    reserved,
    economySource: sourceFor("economy"),
    socialSource: sourceFor("social"),
    stateCount: states.length,
  };
  return cache;
}
