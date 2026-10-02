"use client";

import { useMemo } from "react";
import StatTile from "@/components/hub/StatTile";
import SourceNote from "@/components/hub/SourceNote";
import {
  rankHubIndicator,
  medianOf,
  sumOf,
  formatHubValue,
  type HubIndicator,
} from "@/lib/ranking/hubIndicator";

type StateMeta = { id: string; name: string; region: string; slug: string };

/**
 * National pulse. Built only from aggregates we can actually compute: IGR is a
 * currency figure, so the 37 states sum; the social indicators are rates, so
 * the hub reports the median and the range rather than inventing a national
 * average.
 */
export default function NationalPulse({
  indicators,
  states,
}: {
  indicators: HubIndicator[];
  states: StateMeta[];
}) {
  const pulse = useMemo(() => {
    const by = (key: string) => indicators.find((i) => i.key === key);
    const igr = by("economy.igr");
    const perCapita = by("economy.igrPerCapita");
    const literacy = by("social.literacyRate");
    const primary = by("social.primaryEnrollment");

    const rank = (i: HubIndicator | undefined) =>
      i ? rankHubIndicator(i, i.defaultPeriod, states) : null;

    const igrR = rank(igr);
    const pcR = rank(perCapita);
    const litR = rank(literacy);
    const priR = rank(primary);

    const igrTotals =
      igr && igrR
        ? (["2022", "2023", "2024"] as const)
            .map((p) => ({ p, total: sumOf(rankHubIndicator(igr, p, states)!) }))
            .filter((x) => x.total > 0)
        : [];

    const first = igrTotals[0];
    const last = igrTotals[igrTotals.length - 1];
    const igrGrowth =
      first && last && first.p !== last.p
        ? (last.total / first.total - 1) * 100
        : null;

    const litMedian = litR ? medianOf(litR) : null;
    const litSpread =
      litR && litR.rows.length > 1
        ? litR.range.high.value - litR.range.low.value
        : null;

    return {
      igrTotal: igrR ? sumOf(igrR) : null,
      igrUnit: igr?.unit,
      igrYears: igr?.periods.length ?? 0,
      igrGrowth,
      igrFirstYear: first?.p,
      igrLatestYear: last?.p,
      igrLeader: igrR?.leader,
      pcRows: pcR?.rows.length ?? 0,
      pcState: pcR?.rows[0]?.stateName,
      pcValue: pcR?.rows[0]?.value ?? null,
      pcUnit: perCapita?.unit,
      litMedian,
      litUnit: literacy?.unit,
      litPeriod: litR?.periodLabel,
      litSpread,
      litHigh: litR?.range.high.stateName,
      litLow: litR?.range.low.stateName,
      priMedian: priR ? medianOf(priR) : null,
      priUnit: primary?.unit,
      priPeriod: priR?.periodLabel,
      priLeader: priR?.leader,
    };
  }, [indicators, states]);

  const tiles = [
    pulse.igrTotal != null && pulse.igrUnit
      ? {
          label: "State IGR, all states",
          value: formatHubValue(pulse.igrTotal, pulse.igrUnit),
          hint:
            pulse.igrGrowth != null
              ? `+${pulse.igrGrowth.toFixed(0)}% since ${pulse.igrFirstYear ?? ""}`.trim()
              : `${pulse.igrYears} fiscal years`,
        }
      : null,
    pulse.litMedian != null && pulse.litUnit
      ? {
          label: "Median literacy rate",
          value: formatHubValue(pulse.litMedian, pulse.litUnit),
          hint: `${pulse.litPeriod} · ${pulse.litLow} to ${pulse.litHigh}`,
        }
      : null,
    pulse.priMedian != null && pulse.priUnit
      ? {
          label: "Median primary enrolment",
          value: formatHubValue(pulse.priMedian, pulse.priUnit),
          hint: pulse.priLeader
            ? `Highest: ${pulse.priLeader.stateName}`
            : pulse.priPeriod ?? undefined,
        }
      : null,
    pulse.pcValue != null && pulse.pcUnit
      ? {
          label: "IGR per capita, top state",
          value: formatHubValue(pulse.pcValue, pulse.pcUnit),
          hint: `${pulse.pcState} · only ${pulse.pcRows} states reported`,
        }
      : null,
  ].filter((t): t is NonNullable<typeof t> => t != null);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} hint={t.hint} />
        ))}
      </div>
      <SourceNote
        className="mt-6"
        source="NBS state financial profiles · NBS/MICS social indicators"
        updated="FY 2022–2024 · 2021 social survey"
      />
    </div>
  );
}
