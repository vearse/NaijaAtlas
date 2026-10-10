import type { ZoneBoardProps } from "@/components/zones/ZoneBoard";
import type { CompareBundle } from "@/types/compare";
import type { RegionLocation, StateLocation } from "@/types/location";
import { buildRankingSnapshot } from "@/lib/ranking/computeRanking";
import { findRankingField } from "@/lib/ranking/rankingFields";
import type { RankingCategoryId, RankingSnapshot } from "@/lib/ranking/types";
import { formatMetricDisplay } from "@/lib/ranking/parseMetricValue";

const ADDITIVE_KEYS = new Set([
  "population",
  "igr",
  "faacAllocation",
  "totalRevenue",
  "vatAllocation",
  "debtStock",
  "capitalExpenditure",
  "recurrentExpenditure",
  "stateGdp",
  "outOfSchoolChildren",
]);

function zoneAggregateValue(
  snapshot: RankingSnapshot,
  stateIds: string[],
  fieldKey: string
): number | null {
  const rows = snapshot.entries.filter((e) => stateIds.includes(e.stateId));
  if (rows.length === 0) return null;
  if (ADDITIVE_KEYS.has(fieldKey)) {
    return rows.reduce((n, r) => n + r.value, 0);
  }
  return rows.reduce((n, r) => n + r.value, 0) / rows.length;
}

const ZONE_ACCENT = "#008751";

export function buildRankingZoneBoard(
  bundle: CompareBundle,
  states: StateLocation[],
  regions: RegionLocation[],
  categoryId: RankingCategoryId,
  fieldKey: string,
  period: string
): ZoneBoardProps | null {
  const field = findRankingField(bundle, categoryId, fieldKey);
  if (!field) return null;

  const snapshot = buildRankingSnapshot(
    bundle,
    states,
    categoryId,
    fieldKey,
    period
  );
  if (!snapshot || !snapshot.hasData) return null;

  const higherIsBetter = field.highlight !== "min";
  const nameById = new Map(states.map((s) => [s.id, s.name]));

  const zoneStats = regions.map((region) => {
    const value = zoneAggregateValue(snapshot, region.stateIds, fieldKey);
    const stateRows = snapshot.entries
      .filter((e) => region.stateIds.includes(e.stateId))
      .sort((a, b) =>
        higherIsBetter ? b.value - a.value : a.value - b.value
      );
    const top = stateRows[0];
    const bottom = stateRows[stateRows.length - 1];
    return {
      region,
      value,
      top,
      bottom,
      stateNames: region.stateIds.map((id) => nameById.get(id) ?? id),
    };
  });

  const rankedZones = zoneStats
    .filter((z) => z.value != null)
    .sort((a, b) =>
      higherIsBetter
        ? (b.value ?? 0) - (a.value ?? 0)
        : (a.value ?? 0) - (b.value ?? 0)
    );

  const topZone = rankedZones[0];
  const chipLabel = topZone
    ? `Top zone: ${topZone.region.name}`
    : "By zone";

  return {
    kicker: `STATE RANKINGS · ${field.label.toUpperCase()}`,
    title: `${field.label} by zone`,
    subtitle: `${snapshot.periodLabel} · ${ADDITIVE_KEYS.has(fieldKey) ? "Zone totals" : "Zone averages"} · ${snapshot.directionLabel}`,
    summaryChips: [],
    zones: zoneStats.map((z) => {
      const rows: ZoneBoardProps["zones"][0]["rows"] = [];
      if (z.top) {
        rows.push({
          label: z.top.stateName,
          sub: "Highest in zone",
          value: z.top.value,
          display: z.top.display,
          color: "#126638",
        });
      }
      if (z.bottom && z.bottom.stateId !== z.top?.stateId) {
        rows.push({
          label: z.bottom.stateName,
          sub: "Lowest in zone",
          value: z.bottom.value,
          display: z.bottom.display,
          color: "#94a3b8",
        });
      }
      if (z.value != null) {
        rows.push({
          label: ADDITIVE_KEYS.has(fieldKey) ? "Zone total" : "Zone average",
          sub: field.label,
          value: z.value,
          display: formatMetricDisplay(z.value),
          color: ZONE_ACCENT,
        });
      }

      const badgeLabel = z.top
        ? `TOP: ${z.top.stateName.split(" ")[0]}`
        : "—";

      return {
        id: z.region.id,
        name: z.region.name,
        members: z.stateNames,
        badge: { label: badgeLabel, color: ZONE_ACCENT },
        rows: rows.sort((a, b) => b.value - a.value),
        accent: z.region.color ?? ZONE_ACCENT,
        note:
          z.value != null
            ? `${ADDITIVE_KEYS.has(fieldKey) ? "Total" : "Average"}: ${formatMetricDisplay(z.value)}`
            : undefined,
      };
    }),
  };
}
