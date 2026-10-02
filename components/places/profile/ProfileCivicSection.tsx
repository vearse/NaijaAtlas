"use client";

import Link from "next/link";
import Image from "next/image";
import ProfileSection from "./ProfileSection";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import { formatNumber } from "@/lib/places/formatters";
import {
  IconArrow,
  IconSearch,
  IconVote,
} from "@/components/landing/icons";

type Props = {
  insights: StateProfileInsights | null;
  stateName: string;
  stateId: string;
  lgaCount: number;
  pollingUnitCount: number;
  senateSeatCount: number;
};

/** Civic governance & elections — the 2023–2027 assembly register plus INEC figures. */
export default function ProfileCivicSection({
  insights,
  stateName,
  stateId,
  lgaCount,
  pollingUnitCount,
  senateSeatCount,
}: Props) {
  const gov = insights?.governance;

  return (
    <ProfileSection
      id="civic"
      kicker="Democratic representation"
      title="Civic governance & elections"
      action={
        <Link
          href={`/civic/polling-units?states=${stateId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-4 py-2.5 text-label-md font-bold text-primary transition-colors hover:border-primary-container/50"
        >
          <IconSearch className="h-4 w-4" />
          Find my polling unit in {stateName}
        </Link>
      }
    >
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {gov?.governor ? (
            <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
              <p className="text-label-caps uppercase text-text-muted">Governor</p>
              <div className="mt-3 flex items-center gap-4">
                {gov.governor.imageUrl ? (
                  <Image
                    src={gov.governor.imageUrl}
                    alt={gov.governor.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-tint-light font-display text-headline-sm font-bold text-primary">
                    {gov.governor.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-headline-sm text-headline-sm font-bold text-text-primary">
                    {gov.governor.name}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    {gov.governor.party} · {gov.governor.role}
                  </p>
                </div>
              </div>
              {gov.deputyGovernor ? (
                <p className="mt-4 border-t border-border-subtle pt-3 text-body-sm text-text-secondary">
                  Deputy:{" "}
                  <span className="font-semibold text-text-primary">
                    {gov.deputyGovernor.name}
                  </span>{" "}
                  ({gov.deputyGovernor.party})
                </p>
              ) : null}
              {gov.assemblySpeaker ? (
                <p className="mt-1.5 text-body-sm text-text-secondary">
                  Assembly speaker:{" "}
                  <span className="font-semibold text-text-primary">
                    {gov.assemblySpeaker.name}
                  </span>{" "}
                  ({gov.assemblySpeaker.party})
                </p>
              ) : null}
              <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-text-muted">
                Register: 2023–2027 National Assembly. Replacements are not tracked
                here.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-subtle bg-slate-50 px-5 py-8 text-center text-body-sm text-text-secondary">
              Office holders for {stateName} are not in the register yet.
            </div>
          )}
        </div>

        <div className="space-y-5 lg:col-span-7">
          <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
                Senate delegation
              </h3>
              <span className="rounded-full bg-primary-tint-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                {senateSeatCount || gov?.senators.length || 0} districts
              </span>
            </div>
            {gov?.senators.length ? (
              <ul className="mt-3 divide-y divide-border-subtle">
                {gov.senators.map((senator) => (
                  <li
                    key={`${senator.name}-${senator.role}`}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body-md font-semibold text-text-primary">
                        {senator.name}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {senator.role.replace(/^Senator\s*/i, "")}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                      {senator.party}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-body-sm text-text-secondary">
                No senators listed for {stateName}.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat term="LGAs" value={formatNumber(lgaCount)} note="tier 3" />
            <Stat
              term="Assembly seats"
              value={gov?.stateAssemblySeats ? formatNumber(gov.stateAssemblySeats) : "—"}
              note="state house"
            />
            <Stat
              term="House seats"
              value={gov?.houseSeats ? formatNumber(gov.houseSeats) : "—"}
              note={gov?.housePartySplit ?? "House of Reps"}
            />
            <Stat term="Polling units" value={formatNumber(pollingUnitCount)} note="INEC" />
          </div>

          <Link
            href={`/civic/map/elections?states=${stateId}`}
            className="inline-flex items-center gap-2 text-label-md font-bold text-primary hover:underline"
          >
            <IconVote className="h-4 w-4" />
            Open the {stateName} election map
            <IconArrow className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </ProfileSection>
  );
}

function Stat({ term, value, note }: { term: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-card p-4 text-center">
      <p className="text-label-caps uppercase text-text-muted">{term}</p>
      <p className="mt-1 font-display text-headline-md font-bold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="text-[11px] text-text-muted">{note}</p>
    </div>
  );
}