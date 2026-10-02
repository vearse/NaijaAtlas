"use client";

import Link from "next/link";
import ProfileSection from "./ProfileSection";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import type { Festival } from "@/lib/server/loadFestivalsCalendar";
import type { PlacesLandFeature } from "@/lib/server/loadPlacesPageData";
import {
  IconArrow,
  IconLandmark,
  IconPlane,
} from "@/components/landing/icons";

type Props = {
  insights: StateProfileInsights | null;
  festivals: Festival[];
  landFeatures: PlacesLandFeature[];
  stateName: string;
  stateId: string;
};

/**
 * Travel & heritage. The destination cards reuse the curated festival calendar
 * and the Places land-feature registry, so a state shows only what the atlas
 * actually has on file instead of invented attractions.
 */
export default function ProfileTravelSection({
  insights,
  festivals,
  landFeatures,
  stateName,
  stateId,
}: Props) {
  const siteNotes = (insights?.notes ?? []).filter(
    (n) => n.type === "site" || n.category === "geography"
  );

  const cards = [
    ...festivals.map((f) => ({
      id: f.id,
      kicker: `${f.category} · ${f.stateName}`,
      name: f.name,
      metric: `${f.window} ${f.startDay}–${f.endDay}`,
      body: f.summary,
      href: `/travel#festivals`,
    })),
    ...siteNotes.map((n) => ({
      id: `note-${n.title}`,
      kicker: n.category === "geography" ? "Place" : "Site",
      name: n.title,
      metric: "Verified atlas intel",
      body: n.note,
      href: n.url,
    })),
    ...landFeatures.slice(0, 2).map((f) => ({
      id: `land-${f.id}`,
      kicker: "Landmark",
      name: f.name,
      metric: `${f.metric} · ${f.badge}`,
      body: f.summary,
      href: f.exploreHref,
    })),
  ];

  return (
    <ProfileSection
      id="travel"
      kicker="Heritage & leisure exploration"
      title="Travel & tourism"
      action={
        <Link
          href={`/travel/map?states=${stateId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-4 py-2.5 text-label-md font-bold text-text-primary transition-colors hover:border-primary-container/50"
        >
          <IconPlane className="h-4 w-4" />
          Open travel map
          <IconArrow className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {cards.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.slice(0, 6).map((card) =>
            card.href ? (
              <li key={card.id}>
                <a
                  href={card.href}
                  target={card.href.startsWith("http") ? "_blank" : undefined}
                  rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface-card p-5 transition-colors hover:border-primary-container/50"
                >
                  <CardBody kicker={card.kicker} name={card.name} metric={card.metric} body={card.body} />
                </a>
              </li>
            ) : (
              <li key={card.id}>
                <div className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface-card p-5">
                  <CardBody kicker={card.kicker} name={card.name} metric={card.metric} body={card.body} />
                </div>
              </li>
            )
          )}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-slate-50 px-6 py-10 text-center">
          <IconLandmark className="mx-auto h-6 w-6 text-text-muted" />
          <p className="mt-3 text-body-md font-semibold text-text-primary">
            No curated destinations for {stateName} yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-body-sm text-text-secondary">
            The atlas is still sourcing festivals, landmarks and heritage trails
            for this state. Open the tourist lens to browse mapped places instead.
          </p>
          <Link
            href={`/travel/map?states=${stateId}`}
            className="mt-4 inline-flex items-center gap-2 text-label-md font-bold text-primary hover:underline"
          >
            Browse the tourist lens
            <IconArrow className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <p className="mt-5 text-xs text-text-muted">
        Attraction entries are curated from the atlas knowledge base and are not a
        live booking feed.
      </p>
    </ProfileSection>
  );
}

function CardBody({
  kicker,
  name,
  metric,
  body,
}: {
  kicker: string;
  name: string;
  metric: string;
  body: string;
}) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
        {kicker}
      </span>
      <h3 className="mt-3 font-headline-sm text-headline-sm font-bold text-text-primary">
        {name}
      </h3>
      <p className="mt-0.5 text-xs text-text-muted">{metric}</p>
      <p className="mt-2 line-clamp-4 text-body-sm text-text-secondary">{body}</p>
    </>
  );
}