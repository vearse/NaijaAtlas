"use client";

import Link from "next/link";
import ProfileSection from "./ProfileSection";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import type { PlacesLandFeature } from "@/lib/server/loadPlacesPageData";
import { formatNumber } from "@/lib/places/formatters";
import {
  IconArrow,
  IconLandmark,
  IconMap,
  IconWater,
} from "@/components/landing/icons";

/**
 * Physical geography & hydrology. Relief and coastline read from the geography
 * sheet; the named water bodies and landforms come from the Places land-feature
 * registry, so a state only ever lists features the atlas actually carries.
 */
export default function ProfileLandSection({
  insights,
  landFeatures,
  stateName,
  stateId,
}: {
  insights: StateProfileInsights | null;
  landFeatures: PlacesLandFeature[];
  stateName: string;
  stateId: string;
}) {
  const geo = insights?.geography;
  const area = insights?.general.landAreaKm2 ?? null;
  const waters = landFeatures.filter((f) => f.tone === "sky");
  const landforms = landFeatures.filter((f) => f.tone !== "sky");

  return (
    <ProfileSection
      id="land"
      tone="sky"
      kicker="Physical geography & hydrology"
      title="Land & waters"
      action={
        <Link
          href={`/places/map?states=${stateId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-surface-card px-4 py-2.5 text-label-md font-bold text-text-primary transition-colors hover:border-sky-400"
        >
          <IconMap className="h-4 w-4" />
          See terrain on Places map
          <IconArrow className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <FactCard
          icon={<IconLandmark className="h-5 w-5" />}
          title="Relief & boundaries"
          body={
            <>
              {area ? (
                <p>
                  {stateName} covers{" "}
                  <strong className="text-text-primary">
                    {formatNumber(area)} km²
                  </strong>{" "}
                  of territory
                  {insights?.general.nickname ? (
                    <>
                      {" "}
                      — the {insights.general.nickname}
                    </>
                  ) : null}
                  .
                </p>
              ) : null}
              <p>
                Land area:{" "}
                <strong className="text-text-primary">
                  {area ? `${formatNumber(area)} km²` : "not published"}
                </strong>
                {insights?.demographics.populationDensity ? (
                  <>
                    {" · "}
                    {formatNumber(insights.demographics.populationDensity)} people/km²
                  </>
                ) : null}
              </p>
              {geo?.borderingStates.length ? (
                <p>
                  Borders{" "}
                  <strong className="text-text-primary">
                    {geo.borderingStates.join(", ")}
                  </strong>
                  .
                </p>
              ) : null}
              {geo?.largestLga || geo?.smallestLga ? (
                <p className="text-text-muted">
                  Largest LGA {geo.largestLga ?? "—"}
                  {geo.smallestLga ? ` · smallest ${geo.smallestLga}` : null}
                </p>
              ) : null}
            </>
          }
        />

        <FactCard
          icon={<IconWater className="h-5 w-5" />}
          title="Major water bodies"
          body={
            waters.length ? (
              <ul className="space-y-1.5">
                {waters.slice(0, 4).map((f) => (
                  <li key={f.id} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                    <span>
                      <strong className="text-text-primary">{f.name}</strong>
                      <span className="block text-xs text-text-muted">
                        {f.metric} · {f.badge}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No inland water bodies are charted for {stateName} in the atlas yet —
                open the physical map to browse the national waterway layer.
              </p>
            )
          }
        />

        <FactCard
          icon={<IconMap className="h-5 w-5" />}
          title="Coastline & littoral"
          body={
            <>
              <p>
                Coastline:{" "}
                <strong className="text-text-primary">
                  {geo?.hasCoastline ? "Yes" : "Landlocked"}
                </strong>
              </p>
              <p>
                International border:{" "}
                <strong className="text-text-primary">
                  {geo?.hasIntlBorder ? "Yes" : "No"}
                </strong>
              </p>
              {geo?.distanceToAbujaKm ? (
                <p>
                  {formatNumber(geo.distanceToAbujaKm)} km to Abuja by road
                </p>
              ) : null}
              {landforms.length ? (
                <p className="text-text-muted">
                  Charted landforms: {landforms.map((f) => f.name).join(", ")}
                </p>
              ) : null}
            </>
          }
        />
      </div>

      {landFeatures.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {landFeatures.map((f) => (
            <li key={f.id}>
              <Link
                href={f.exploreHref}
                className="flex h-full items-start gap-3 rounded-2xl border border-sky-100 bg-surface-card p-4 transition-colors hover:border-sky-300"
              >
                <span
                  className={`mt-0.5 shrink-0 ${f.tone === "sky" ? "text-sky-600" : "text-lime-600"}`}
                >
                  {f.tone === "sky" ? <IconWater /> : <IconLandmark />}
                </span>
                <span className="min-w-0">
                  <span className="block text-label-md font-bold text-text-primary">
                    {f.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    {f.metric} · {f.badge}
                  </span>
                  <span className="mt-1.5 block text-body-sm text-text-secondary">
                    {f.summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </ProfileSection>
  );
}

function FactCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-surface-card p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        {icon}
      </span>
      <h3 className="mt-3 font-headline-sm text-headline-sm font-bold text-text-primary">
        {title}
      </h3>
      <div className="mt-2 space-y-1.5 text-body-sm text-text-secondary">{body}</div>
    </div>
  );
}