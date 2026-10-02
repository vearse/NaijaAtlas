"use client";

import Image from "next/image";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import GroupDirectory from "@/components/people/GroupDirectory";
import LanguageTable from "@/components/people/LanguageTable";
import FestivalList from "@/components/people/FestivalList";
import type { PeopleHubData } from "@/lib/server/loadPeopleHubData";
import type { Festival } from "@/lib/festivals";

export default function PeopleHubClient({
  festivals,
  ...data
}: PeopleHubData & { festivals: Festival[] }) {
  return (
    <HubShell>
      <HubHeader
        active="people"
        primaryCta={{ label: "Browse groups", href: "#groups" }}
      />
      <HubBreadcrumb
        trail={[
          { label: "People", href: "/people" },
          { label: "Cultures &amp; languages" },
        ]}
      />

      <main className="mx-auto max-w-[1280px] px-4 md:px-6">
        <section className="pt-8 md:pt-10">
          <div className="relative h-[420px] overflow-hidden rounded-3xl border border-border-subtle shadow-sm md:h-[480px]">
            <Image
              src="/images/people-hero.jpg"
              alt="Nigerian family and friends laughing together at a market street"
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover object-right"
            />
            {/* Brand green wash so the hero reads as one piece with the atlas. */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/25 via-transparent to-primary-container/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-label-caps text-primary-container">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                PEOPLE &amp; CULTURE
              </span>
              <h1 className="mt-5 max-w-xl font-landing-display text-headline-xl-mobile tracking-tight text-text-primary md:text-display-hero">
                The people, not the numbers.
              </h1>
              <p className="mt-4 max-w-md text-body-lg text-text-secondary">
                Hundreds of languages, kingdoms and communities share one map.
                Pick a state to meet the people who call it home.
              </p>
              <a
                href="#groups"
                className="mt-6 inline-flex h-11 w-fit items-center rounded-xl bg-primary-container px-5 text-label-md font-semibold text-white transition-colors hover:bg-primary"
              >
                Explore a state
              </a>
            </div>
          </div>
        </section>

        <HubSection
          id="groups"
          eyebrow="State by state"
          title="Languages, peoples and stories"
          lede="Choose a state to meet the cultural groups found there, then read the state profile behind them."
        >
          <GroupDirectory data={data} />
        </HubSection>

        {/* Festivals sit directly after the state detail they explain. */}
        <HubSection
          id="festivals"
          eyebrow="Celebrations"
          title="Festivals &amp; cultural gatherings"
          lede="The recurring festivals that mark Nigeria's calendar year, across every state in the catalogue."
        >
          <FestivalList festivals={festivals} />
        </HubSection>

        {/* Languages */}
        <HubSection
          eyebrow="Language"
          title="Languages by state"
          lede="The headline languages recorded in each state profile."
        >
          <LanguageTable
            languages={data.languages}
            slugByStateId={data.slugByStateId}
          />
        </HubSection>

        {/* Map */}
        <HubSection
          eyebrow="Geopolitical intelligence"
          title="Homelands map"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard
              map="people/groups"
              kicker="Cultural groups"
            />
            <MapWorkspaceCard
              map="land/zones"
              kicker="Zone context"
            />
          </div>
        </HubSection>

        {/* Coverage */}
        <section className="border-t border-border-subtle py-12">
          <h2 className="font-landing-display text-headline-lg text-text-primary">
            What this hub does not cover
          </h2>
          <div className="mt-4">
            <EmptyState
              title="Homeland polygons on the map"
              badge="No layer"
              className="border-dashed"
            >
              The atlas can highlight states and LGAs, but it has no drawn
              homeland boundaries to render &mdash; cultural areas are not
              administrative units, and the dataset stores state and LGA
              references rather than geometry. The homelands card therefore
              links to a map of the states involved, not of borders we do not
              have.
            </EmptyState>
          </div>
          <p className="mt-4 max-w-3xl text-body-sm text-text-muted">
            Group boundaries and confidence ratings are reproduced from the
            catalogue. Descriptions are summaries of documented sources, not
            claims about who belongs to a group.
          </p>
          <SourceNote
            className="mt-6"
            source={data.sources}
            updated="Repository catalogues"
          />
        </section>
      </main>

      <HubFooter />
    </HubShell>
  );
}
