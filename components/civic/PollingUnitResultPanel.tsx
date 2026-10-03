"use client";

import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { PollingUnitMatch } from "@/app/(marketing)/civic/actions";

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type BallotOffice = "president" | "governor" | "senate" | "reps";

type Props = {
  match: PollingUnitMatch;
  onOpenCandidates?: (office: BallotOffice) => void;
};

function BallotRow({
  kicker,
  kickerClass,
  title,
  detail,
  mapHref,
  onSeeCandidates,
}: {
  kicker: string;
  kickerClass: string;
  title: string;
  detail: string;
  mapHref: string;
  onSeeCandidates?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-slate-50 p-3.5 transition-colors hover:border-slate-300">
      <div className="min-w-0 space-y-0.5">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${kickerClass}`}
        >
          {kicker}
        </span>
        <p className="text-[17px] font-bold leading-snug text-text-primary">
          {title}
        </p>
        <p className="text-body-sm text-text-secondary">{detail}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href={mapHref}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-primary hover:bg-slate-100"
          title="View on map"
        >
          <span aria-hidden className="text-lg">
            ⊕
          </span>
        </Link>
        {onSeeCandidates ? (
          <button
            type="button"
            onClick={onSeeCandidates}
            className="whitespace-nowrap text-label-md font-semibold text-primary hover:underline"
          >
            See candidates →
          </button>
        ) : (
          <Link
            href="#candidates"
            className="whitespace-nowrap text-label-md font-semibold text-primary hover:underline"
          >
            See candidates →
          </Link>
        )}
      </div>
    </div>
  );
}

/** Full-width PU result + “On your ballot” — matches civic Stitch canvas. */
export default function PollingUnitResultPanel({
  match,
  onOpenCandidates,
}: Props) {
  const { hit, district, constituencies } = match;
  const primaryConstituency = constituencies[0];
  const mapBase = sectionMapHref("civic/elections", {
    stateIds: [hit.stateId],
    senatorialDistrictId: district?.id,
  });

  const headline = `${titleCase(hit.wardName)} · ${titleCase(hit.lgaName)} LGA · ${hit.stateName} State`;
  const directionsQuery = encodeURIComponent(
    `${titleCase(hit.wardName)}, ${titleCase(hit.lgaName)}, ${hit.stateName}, Nigeria`
  );
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${directionsQuery}`;

  return (
    <div className="col-span-12 space-y-6 rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-container/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Ward located
            </span>
            <span className="rounded-full border border-border-subtle bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
              {hit.wardPollingUnits.toLocaleString()} polling units in ward
            </span>
          </div>
          <h2 className="mt-2 text-headline-md font-bold text-text-primary">
            {headline}
          </h2>
          <p className="mt-1 text-body-md text-text-secondary">
            {hit.wardPollingUnits.toLocaleString()} polling units in this ward ·{" "}
            {hit.lgaWardCount} wards in {titleCase(hit.lgaName)} LGA
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/civic#find`;
              void navigator.clipboard?.writeText(url);
            }}
            className="rounded-lg border border-border-subtle bg-surface-card p-2.5 text-text-secondary transition-colors hover:bg-slate-50 hover:text-text-primary"
            title="Share"
          >
            Share
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Senatorial district
          </p>
          <p className="mt-1 text-sm font-bold text-text-primary">
            {district?.name ?? "Not mapped"}
          </p>
          {district && (
            <p className="mt-1 text-[11px] text-text-muted">
              {district.lgaNames.length} LGAs in district
            </p>
          )}
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
            Federal constituency
          </p>
          <p className="mt-1 text-sm font-bold text-text-primary">
            {primaryConstituency?.name ?? "Not mapped"}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">House of Reps seat</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Registration ward
          </p>
          <p className="mt-1 text-sm font-bold text-text-primary">
            {titleCase(hit.wardName)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Ward ID {hit.wardId}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={mapBase}
          className="inline-flex h-11 items-center rounded-xl bg-primary-container px-5 text-label-md font-semibold text-white hover:bg-[#006d40]"
        >
          Visit on election map
        </Link>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center rounded-xl border border-primary-container px-5 text-label-md font-semibold text-primary hover:bg-emerald-50"
        >
          Get directions
        </a>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-border-subtle bg-slate-50 p-4 lg:col-span-5">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-border-subtle bg-white">
            <NigeriaThumb
              source="states"
              highlight={[hit.stateId]}
              className="h-full w-full"
              title={`${hit.stateName} highlighted`}
            />
            <span className="absolute bottom-2 left-2 rounded border border-border-subtle bg-surface-card/90 px-2.5 py-1 text-[11px] font-semibold text-text-secondary backdrop-blur">
              {hit.stateName} · {titleCase(hit.lgaName)}
            </span>
          </div>
          <Link
            href={mapBase}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container text-label-md font-semibold text-white shadow-xs transition-colors hover:bg-[#006d40]"
          >
            Open on election map
            <span aria-hidden>→</span>
          </Link>
          <div className="flex flex-wrap justify-between gap-2 text-body-sm text-text-secondary">
            <Link
              href={sectionMapHref("civic/elections", { stateIds: [hit.stateId] })}
              className="hover:text-primary"
            >
              State view
            </Link>
            <Link href={`/places/${hit.stateSlug}`} className="hover:text-primary">
              {hit.stateName} profile
            </Link>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-headline-sm font-bold text-text-primary">
              On your ballot
            </h3>
            <span className="text-label-caps text-text-muted">4 offices</span>
          </div>
          <div className="space-y-3">
            <BallotRow
              kicker="Federal jurisdiction"
              kickerClass="text-primary"
              title="President of the Federal Republic"
              detail="Nationwide single electorate"
              mapHref={sectionMapHref("civic/elections")}
              onSeeCandidates={
                onOpenCandidates
                  ? () => onOpenCandidates("president")
                  : undefined
              }
            />
            <BallotRow
              kicker="State executive"
              kickerClass="text-secondary"
              title={`Governor · ${hit.stateName} State`}
              detail={`${hit.lgaWardCount} wards in ${titleCase(hit.lgaName)} LGA`}
              mapHref={sectionMapHref("civic/elections", {
                stateIds: [hit.stateId],
              })}
              onSeeCandidates={
                onOpenCandidates
                  ? () => onOpenCandidates("governor")
                  : undefined
              }
            />
            {district && (
              <BallotRow
                kicker="Upper chamber"
                kickerClass="text-amber-700"
                title={`Senator · ${district.name} Senatorial District`}
                detail={district.lgaNames.slice(0, 5).join(", ")}
                mapHref={sectionMapHref("civic/elections", {
                  senatorialDistrictId: district.id,
                  stateIds: [hit.stateId],
                })}
                onSeeCandidates={
                  onOpenCandidates
                    ? () => onOpenCandidates("senate")
                    : undefined
                }
              />
            )}
            {primaryConstituency && (
              <BallotRow
                kicker="Lower chamber"
                kickerClass="text-slate-500"
                title={`Representative · ${primaryConstituency.name}`}
                detail={`Federal constituency · ${hit.stateName}`}
                mapHref={sectionMapHref("civic/elections", {
                  senatorialDistrictId: district?.id,
                  stateIds: [hit.stateId],
                })}
                onSeeCandidates={
                  onOpenCandidates
                    ? () => onOpenCandidates("reps")
                    : undefined
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { BallotOffice };
