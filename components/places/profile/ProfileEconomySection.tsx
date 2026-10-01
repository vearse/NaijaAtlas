"use client";

import Link from "next/link";
import ProfileSection from "./ProfileSection";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import { formatNaira, formatNumber } from "@/lib/places/formatters";
import { IconArrow, IconFinance, IconTrend } from "@/components/landing/icons";

type Props = {
  insights: StateProfileInsights | null;
  stateName: string;
  stateId: string;
};

/** Economy & trade — fiscal capacity figures from the verified economy sheet. */
export default function ProfileEconomySection({ insights, stateName, stateId }: Props) {
  const econ = insights?.economy;

  const cards = [
    {
      title: "Internal revenue",
      value: econ?.igr ? formatNaira(econ.igr) : "Not published",
      note: "Internally generated revenue, 2024",
      icon: <IconFinance className="h-5 w-5" />,
    },
    {
      title: "State GDP",
      value: econ?.stateGdp ? formatNaira(econ.stateGdp) : "Not published",
      note: "Nominal, latest published year",
      icon: <IconTrend className="h-5 w-5" />,
    },
    {
      title: "Poverty headcount",
      value: econ?.povertyRate != null ? `${econ.povertyRate}%` : "Not published",
      note: "Multidimensional poverty index",
      icon: <IconTrend className="h-5 w-5" />,
    },
    {
      title: "Unemployment",
      value: econ?.unemploymentRate != null ? `${econ.unemploymentRate}%` : "Not published",
      note: "NBS revised labour force survey",
      icon: <IconTrend className="h-5 w-5" />,
    },
  ];

  const published = cards.filter((c) => c.value !== "Not published").length;

  return (
    <ProfileSection
      id="economy"
      tone="emerald"
      kicker="Macroeconomic driver & fiscal capacity"
      title="Economy & trade"
      action={
        <Link
          href={`/explore?lens=invest&states=${stateId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-surface-card px-4 py-2.5 text-label-md font-bold text-text-primary transition-colors hover:border-emerald-400"
        >
          Open economy map
          <IconArrow className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-emerald-100 bg-surface-card p-5"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              {card.icon}
            </span>
            <p className="mt-3 text-label-caps uppercase text-text-muted">
              {card.title}
            </p>
            <p className="mt-1 font-display text-headline-md font-bold tabular-nums text-text-primary">
              {card.value}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">{card.note}</p>
          </div>
        ))}
      </div>

      {econ?.stateGdpPerCapita || econ?.underemploymentRate != null ? (
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 rounded-2xl border border-emerald-100 bg-surface-card px-5 py-4 text-body-sm">
          {econ.stateGdpPerCapita ? (
            <div>
              <dt className="text-text-muted">GDP per capita</dt>
              <dd className="font-semibold tabular-nums text-text-primary">
                {formatNaira(econ.stateGdpPerCapita)}
              </dd>
            </div>
          ) : null}
          {econ.underemploymentRate != null ? (
            <div>
              <dt className="text-text-muted">Underemployment</dt>
              <dd className="font-semibold tabular-nums text-text-primary">
                {econ.underemploymentRate}%
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <p className="mt-5 text-xs text-text-muted">
        {published > 0
          ? `${published} of ${cards.length} fiscal indicators are published for ${stateName} in the compare registry.`
          : `No fiscal indicators are published for ${stateName} yet — use the invest lens to browse sector data.`}
        {insights?.demographics.population
          ? ` Population base: ${formatNumber(insights.demographics.population)}.`
          : ""}
      </p>
    </ProfileSection>
  );
}