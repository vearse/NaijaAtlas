"use client";

import { useCallback, useState } from "react";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import PlanARouteCard, { type Mode } from "@/components/travel/PlanARouteCard";
import StickyRouteBar from "@/components/travel/StickyRouteBar";
import TopMetroCities from "@/components/travel/TopMetroCities";
import FestivalsCalendar from "@/components/travel/FestivalsCalendar";
import MetroCities from "@/components/travel/MetroCities";
import PlacesBrowser from "@/components/travel/PlacesBrowser";
import type { TravelHubData } from "@/lib/server/loadTravelHubData";
import type { FestivalsCalendarData } from "@/lib/server/loadFestivalsCalendar";

const DEFAULT_FROM = "city-lagos";
const DEFAULT_TO = "place-obudu-mountain-resort";

export default function TravelHubClient({
  data,
  festivals,
}: {
  data: TravelHubData;
  festivals: FestivalsCalendarData;
}) {
  const hasPlace = (id: string) =>
    data.cities.some((c) => c.id === id) || data.destinations.some((d) => d.id === id);
  const [fromId, setFromId] = useState(
    hasPlace(DEFAULT_FROM) ? DEFAULT_FROM : (data.cities[0]?.id ?? "")
  );
  const [toId, setToId] = useState(
    hasPlace(DEFAULT_TO) ? DEFAULT_TO : (data.destinations[0]?.id ?? "")
  );
  const [mode, setMode] = useState<Mode>("Drive");

  /**
   * Every pick made on the page lands in the planner. The sticky bar and the
   * full card read the same state, so the destination updates wherever the
   * reader happens to be.
   */
  const routeTo = useCallback((placeId: string) => setToId(placeId), []);

  const routeToCity = useCallback(
    (cityName: string) => {
      const city = data.cities.find((c) => c.name === cityName);
      if (city) setToId(city.id);
    },
    [data.cities]
  );

  return (
    <HubShell canvas="warm">
      <HubHeader
        active="travel"
        primaryCta={{ label: "Plan a route", href: "#plan-a-route" }}
      />
      <HubBreadcrumb
        trail={[{ label: "Home", href: "/" }, { label: "Travel" }]}
      />

      {/* Bottom padding keeps the sticky route bar clear of the last section. */}
      <main className="mx-auto max-w-[1200px] space-y-16 px-6 pb-32 pt-8">
        <section className="pt-4">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-heritage-amber-tint px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-heritage-amber">
            <span className="h-1.5 w-1.5 rounded-full bg-heritage-amber" />
            TRAVEL &amp; HERITAGE
          </span>
          <h1 className="font-landing-display text-headline-xl tracking-tight text-text-primary">
            Plan a trip.
          </h1>
          <p className="mt-2 max-w-3xl text-body-lg text-text-secondary">
            Mountain resorts, waterfalls, ancient cities and buzzing metros.
            Pick where you&rsquo;re starting, choose where you&rsquo;re going,
            and let the map take it from there.
          </p>
        </section>

        <PlanARouteCard
          cities={data.cities}
          destinations={data.destinations}
          fromId={fromId}
          toId={toId}
          onFromChange={setFromId}
          onToChange={setToId}
          mode={mode}
          onModeChange={setMode}
        />

        <TopMetroCities metros={data.metros} onRouteTo={routeToCity} />

        <HubSection
          id="cities-tours"
          eyebrow="Cities & tours"
          title="Find your kind of place"
          lede="Switch between tour destinations and cities, then narrow it down by category."
        >
          <PlacesBrowser data={data} onRouteTo={routeTo} />
        </HubSection>

        <MetroCities metros={data.metros} onRouteTo={routeToCity} />

        <FestivalsCalendar calendar={festivals} />

        <HubSection
          eyebrow="Geopolitical intelligence"
          title="Travel maps"
          lede="Places on the map, and turn-by-turn routes between documented cities."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard map="travel/places" kicker="Tourist lens" />
            <MapWorkspaceCard
              map="travel/directions"
              kicker="City to city routes"
              hrefOptions={{ basemap: "osm" }}
            />
          </div>
        </HubSection>

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
              No accommodation, airline or fare data is in the repository. Trip
              times in the planner are estimates from straight-line distance;
              the directions map draws the actual road route.
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
          <SourceNote
            className="mt-6"
            source={data.sources}
            updated="Repository catalogues"
          />
        </section>
      </main>

      <StickyRouteBar
        cities={data.cities}
        destinations={data.destinations}
        fromId={fromId}
        toId={toId}
        onFromChange={setFromId}
        onToChange={setToId}
        mode={mode}
        onModeChange={setMode}
        revealAfterId="destinations"
        plannerId="plan-a-route"
      />

      <HubFooter />
    </HubShell>
  );
}