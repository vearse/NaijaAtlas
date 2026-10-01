"use client";

import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import StatTile from "@/components/hub/StatTile";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import CultureSpotlight from "@/components/people/CultureSpotlight";
import GroupDirectory from "@/components/people/GroupDirectory";
import LanguageTable from "@/components/people/LanguageTable";
import type { PeopleHubData } from "@/lib/server/loadPeopleHubData";

export default function PeopleHubClient(data: PeopleHubData) {
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
        {/* Hero */}
        <section className="pt-12 md:pt-16">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-label-caps text-violet-800">
              <span className="h-1.5 w-1.5 rounded-full bg-people-violet" />
              PEOPLE &amp; CULTURE
            </span>
            <span className="inline-flex rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-label-caps text-text-secondary">
              {data.counts.states} states covered
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl font-landing-display text-headline-xl-mobile tracking-tight text-text-primary md:text-display-hero">
            The people, not the numbers.
          </h1>
          <p className="mt-4 max-w-2xl text-body-lg text-text-secondary">
            {data.counts.groups} documented cultural groups across{" "}
            {data.counts.lgaAreas} LGA areas, {data.counts.languages} recorded
            languages, and the states each group is found in.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Cultural groups"
              value={data.counts.groups.toString()}
              hint="Documented in the catalogue"
            />
            <StatTile
              label="LGA areas"
              value={data.counts.lgaAreas.toString()}
              hint="Group homelands"
            />
            <StatTile
              label="Languages"
              value={data.counts.languages.toString()}
              hint="Across state profiles"
            />
            <StatTile
              label="States covered"
              value={data.counts.states.toString()}
              hint="Of 37"
            />
          </div>
        </section>

        {/* Spotlight */}
        <HubSection
          eyebrow="Spotlight"
          title="Four cultures to start with"
          lede="The four largest documented cultural groupings, with their LGA footprint and zone."
        >
          <CultureSpotlight
            spotlight={data.spotlight}
            slugByStateId={data.slugByStateId}
          />
        </HubSection>

        {/* Directory */}
        <HubSection
          id="groups"
          eyebrow="Directory"
          title="Cultural groups"
          lede="Search by group, community, state or language. Each entry carries its own confidence rating, because homelands are contested and our source says so."
        >
          <GroupDirectory data={data} />
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
              kicker={`${data.counts.groups} groups`}
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
