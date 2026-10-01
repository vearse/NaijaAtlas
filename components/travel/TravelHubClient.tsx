"use client";

import { useState } from "react";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import StatTile from "@/components/hub/StatTile";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import PlanARouteCard from "@/components/travel/PlanARouteCard";
import TopDestinations from "@/components/travel/TopDestinations";
import FestivalsCalendar from "@/components/travel/FestivalsCalendar";
import CuratedItineraries from "@/components/travel/CuratedItineraries";
import type { TravelHubData } from "@/lib/server/loadTravelHubData";
import type { FestivalsCalendarData } from "@/lib/server/loadFestivalsCalendar";

export default function TravelHubClient({
  data,
  festivals,
}: {
  data: TravelHubData;
  festivals: FestivalsCalendarData;
}) {
  const topState = data.topStates[0];
  const featured = data.destinations.slice(0, 6);
  const [activeId, setActiveId] = useState(featured[0]?.id ?? "");

  return (
    <HubShell canvas="warm">
      <HubHeader
        active="travel"
        primaryCta={{ label: "Plan a route", href: "#plan-a-route" }}
      />
      <HubBreadcrumb
        trail={[{ label: "Home", href: "/" }, { label: "Travel" }]}
      />

      <main className="mx-auto max-w-[1200px] space-y-16 px-6 py-8">
        {/* 1. Hero */}
        <section className="pt-4">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-heritage-amber-tint px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-heritage-amber">
            <span className="h-1.5 w-1.5 rounded-full bg-heritage-amber" />
            TRAVEL &amp; HERITAGE
          </span>
          <h1 className="font-landing-display text-headline-xl tracking-tight text-text-primary">
            Plan a trip.
          </h1>
          <p className="mt-2 max-w-3xl text-body-lg text-text-secondary">
            Verified destinations, national parks, and seasonal cultural
            festivals across Nigeria&rsquo;s {data.counts.states} states and FCT.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Destinations"
              value={data.counts.destinations.toString()}
              hint={`${data.counts.categories} categories`}
            />
            <StatTile
              label="Cities"
              value={data.counts.cities.toString()}
              hint="All with coordinates"
            />
            <StatTile
              label="States covered"
              value={data.counts.states.toString()}
              hint={
                topState
                  ? `Most: ${topState.name} (${topState.count})`
                  : undefined
              }
            />
            <StatTile
              label="Festivals tracked"
              value={festivals.total.toString()}
              hint="Annual cultural calendar"
            />
          </div>
        </section>

        {/* 2. Plan a route */}
        <PlanARouteCard
          from={{
            label: "Murtala Muhammed Int'l Airport, Lagos (LOS)",
            icon: "takeoff",
          }}
          to={{ label: "Obudu Mountain Resort, Cross River", icon: "pin" }}
          distance="685 km"
          duration="9h 45m"
          via="Via A4 Highway & Calabar-Ikom Corridor"
          elevation="+1,575m"
          alert="Paved / Mountain Pass alert"
        />

        {/* 3. Top destinations */}
        <TopDestinations
          destinations={featured}
          activeId={activeId}
          onSelect={setActiveId}
        />

        {/* 4. Festivals & cultural gatherings */}
        <FestivalsCalendar calendar={festivals} />

        {/* 5. Curated itineraries */}
        <CuratedItineraries />

        {/* Maps */}
        <HubSection
          eyebrow="Geopolitical intelligence"
          title="Travel maps"
          lede="Places on the map, and turn-by-turn routes between documented cities."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard
              map="travel/places"
              kicker={`${data.counts.destinations} destinations`}
            />
            <MapWorkspaceCard
              map="travel/directions"
              kicker="City to city routes"
              hrefOptions={{ basemap: "osm" }}
            />
          </div>
        </HubSection>

        {/* Coverage */}
        <section className="border-t border-border-subtle py-12">
          <h2 className="font-landing-display text-headline-lg text-text-primary">
            What this hub does not cover
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <EmptyState
              title="Hotels, flights and fares"
              badge="No dataset"
              className="border-dashed"
            >
              No accommodation, airline or fare data is in the repository. The
              directions workspace is limited to the{" "}
              {data.counts.cities} cities that have documented coordinates.
            </EmptyState>
            <EmptyState
              title="Live festival dates"
              badge="Curated, not live"
              className="border-dashed"
            >
              The festival calendar tracks the recurring national dates that
              festivals are widely documented to hold, but exact dates shift each
              year. Confirm with the state tourism board before travelling.
            </EmptyState>
          </div>
          <p className="mt-4 max-w-3xl text-body-sm text-text-muted">
            Visitor notes, significance and population figures are reproduced
            from the catalogues as written, including their own approximations
            &mdash; they are estimates in the source, not verified counts.
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