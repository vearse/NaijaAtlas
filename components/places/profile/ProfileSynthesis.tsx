"use client";

import Link from "next/link";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import type { StateContent } from "@/types/location";
import { formatNumber } from "@/lib/places/formatters";
import { IconArrow, IconMap } from "@/components/landing/icons";

/**
 * Geopolitical synthesis + bordering territories + civic quick facts, mirroring
 * the reference overview band. Every value is read from the compare registry, so
 * the block collapses to the fields a state actually has.
 */
export default function ProfileSynthesis({ insights, content, stateName, stateId }: {
  insights: StateProfileInsights | null;
  content: StateContent;
  stateName: string;
  stateId: string;
}) {
  const geo = insights?.geography;
  const general = insights?.general;

  const borders: { label: string; value: string }[] = [
    geo?.borderingStates.length
      ? { label: "Land borders", value: geo.borderingStates.join(", ") }
      : null,
    geo?.hasCoastline ? { label: "Southern littoral", value: "Atlantic Ocean" } : null,
    geo?.hasIntlBorder ? { label: "International border", value: "Republic of Benin" } : null,
  ].filter((b): b is { label: string; value: string } => b !== null);

  const quickFacts: { label: string; value: string }[] = [
    general?.yearCreated ? { label: "Date created", value: general.yearCreated } : null,
    general?.nickname ? { label: "Known as", value: general.nickname } : null,
    { label: "Population", value: insights?.demographics.population ? `~${formatNumber(insights.demographics.population)}` : "Not published" },
    {
      label: "Climate classification",
      value: geo?.hasCoastline ? "Tropical Wet & Dry (Aw)" : "Tropical Wet & Dry / Savanna",
    },
    { label: "LGAs", value: formatNumber(stateId ? content.lgaCount : 0) },
    geo?.distanceToAbujaKm
      ? { label: "Distance to Abuja", value: `${formatNumber(geo.distanceToAbujaKm)} km` }
      : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p className="text-label-caps uppercase text-text-muted">
          Geopolitical synthesis
        </p>
        <h2 className="mt-1 font-landing-display text-headline-xl text-text-primary">
          {stateName} in the federation
        </h2>
        <p className="mt-3 text-body-md leading-relaxed text-text-secondary">
          {content.description}
        </p>

        {borders.length ? (
          <>
            <h3 className="mt-6 text-label-md font-bold uppercase tracking-wide text-text-secondary">
              Bordering territories &amp; maritime boundaries
            </h3>
            <ul className="mt-2 space-y-1.5">
              {borders.map((b) => (
                <li key={b.label} className="flex items-baseline justify-between gap-3 text-body-sm">
                  <span className="text-text-muted">{b.label}</span>
                  <span className="text-right font-semibold text-text-primary">{b.value}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
          <p className="text-label-caps uppercase text-text-muted">Quick facts</p>
          <dl className="mt-3 space-y-2">
            {quickFacts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-3 border-b border-border-subtle/70 pb-2 last:border-0 last:pb-0"
              >
                <dt className="text-body-sm text-text-muted">{fact.label}</dt>
                <dd className="text-right text-body-sm font-semibold text-text-primary">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/places#compare`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-tint-light"
            >
              Compare states
              <IconArrow className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/places/map?states=${stateId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-slate-50"
            >
              <IconMap className="h-3.5 w-3.5" />
              Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}