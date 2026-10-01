"use client";

import Link from "next/link";
import ProfileSection from "./ProfileSection";
import type { StateProfileInsights } from "@/lib/server/stateProfileInsights";
import type { StateContent } from "@/types/location";
import { formatNumber } from "@/lib/places/formatters";
import {
  IconArrow,
  IconExternal,
  IconLandmark,
  IconUsers,
} from "@/components/landing/icons";

type Props = {
  insights: StateProfileInsights | null;
  content: StateContent;
  stateName: string;
  stateId: string;
};

/**
 * People & culture. Languages and cities come from the verified general sheet;
 * the cultural notes are the curated `state-notes` entries, each linked to its
 * source so nothing on the profile is unsourced copy.
 */
export default function ProfilePeopleSection({
  insights,
  content,
  stateName,
  stateId,
}: Props) {
  const languages =
    insights?.general.languages.length
      ? insights.general.languages
      : content.languages.map((l) => l.name);
  const cities = insights?.general.majorCities ?? [];
  const notes = insights?.notes ?? [];
  const cultural = notes.filter((n) =>
    ["culture", "festival", "institution", "history"].includes(
      n.category ?? n.type ?? ""
    )
  );
  const wikiByLanguage = new Map(content.languages.map((l) => [l.name, l.wikiUrl]));

  return (
    <ProfileSection
      id="people"
      kicker="Demography & living heritage"
      title="People & culture"
      action={
        <Link
          href={`/explore?states=${stateId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-4 py-2.5 text-label-md font-bold text-text-primary transition-colors hover:border-primary-container/50"
        >
          <IconUsers className="h-4 w-4" />
          More on People
          <IconArrow className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
          <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
            {stateName} at a glance
          </h3>
          <dl className="mt-3 space-y-2 text-body-sm">
            <Row
              term="Population"
              value={
                insights?.demographics.population
                  ? `${formatNumber(insights.demographics.population)}${
                      insights.demographics.populationYear
                        ? ` (${insights.demographics.populationYear} est.)`
                        : ""
                    }`
                  : "Not published"
              }
            />
            <Row
              term="Density"
              value={
                insights?.demographics.populationDensity
                  ? `${formatNumber(insights.demographics.populationDensity)}/km²`
                  : "Not published"
              }
            />
            <Row term="Languages" value={languages.length ? languages.join(", ") : "—"} />
            <Row term="Urban share" value={insights?.demographics.urbanPercent ? `${insights.demographics.urbanPercent}%` : "Not published"} />
          </dl>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
          <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
            Major cities &amp; towns
          </h3>
          {cities.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {cities.map((city) => (
                <li
                  key={city}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-body-sm font-semibold text-text-secondary"
                >
                  {city}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-body-sm text-text-secondary">
              City-level gazetteer entries for {stateName} are not loaded yet.
            </p>
          )}
          <h3 className="mt-5 font-headline-sm text-headline-sm font-bold text-text-primary">
            Language links
          </h3>
          <ul className="mt-2 space-y-1.5">
            {languages.map((lang) => (
              <li key={lang}>
                {wikiByLanguage.get(lang) ? (
                  <a
                    href={wikiByLanguage.get(lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
                  >
                    {lang}
                    <IconExternal className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-body-sm font-semibold text-text-secondary">
                    {lang}
                  </span>
                )}
              </li>
            ))}
            {!languages.length ? (
              <li className="text-body-sm text-text-muted">No language entry.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
          <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
            Heritage notes
          </h3>
          {cultural.length ? (
            <ul className="mt-3 space-y-3">
              {cultural.slice(0, 5).map((note) => (
                <li key={note.title} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-label-md font-bold text-text-primary">
                    {note.title}
                  </p>
                  <p className="mt-0.5 line-clamp-3 text-xs text-text-secondary">
                    {note.note}
                  </p>
                  {note.url ? (
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      Source
                      <IconExternal className="h-3 w-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-body-sm text-text-secondary">
              No cultural or heritage notes are curated for {stateName} yet.
            </p>
          )}
        </div>
      </div>

      {notes.length ? (
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border-subtle bg-slate-100/70 px-5 py-4">
          <IconLandmark className="h-4 w-4 shrink-0 text-text-muted" />
          <p className="text-body-sm text-text-secondary">
            {notes.length} verified heritage{" "}
            {notes.length === 1 ? "entry" : "entries"} for {stateName}, drawn from
            the atlas knowledge base.
          </p>
        </div>
      ) : null}
    </ProfileSection>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-text-muted">{term}</dt>
      <dd className="text-right font-semibold text-text-primary">{value}</dd>
    </div>
  );
}