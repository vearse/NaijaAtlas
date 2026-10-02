"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
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
import { PARTNER_JOIN_URL } from "@/lib/partners";

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
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <span className="font-label-caps uppercase tracking-wider text-heritage-amber">
                Partner with us
              </span>
              <h2 className="mt-1 font-landing-display text-headline-lg text-text-primary">
                Run a hotel, resort or travel place?
              </h2>
              <p className="mt-3 max-w-xl text-body-md text-text-secondary">
                The atlas maps every state, LGA, ward and cultural group in the
                country — but it does not list properties, and we would rather
                not list them badly. Hotels, lodges, resorts, restaurants and
                tour operators can join the hub with a verified profile that
                sits next to the state, people and festival data travellers are
                already reading.
              </p>
              <p className="mt-3 max-w-xl text-body-md text-text-secondary">
                Partnerships fund the map work and keep NaijaAtlas free for
                everyone. Reach us and we will send the partner details.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={PARTNER_JOIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-xl bg-primary-container px-5 text-label-md font-semibold text-white transition-colors hover:bg-primary"
                >
                  Become a partner
                  <span aria-hidden className="ml-2">
                    →
                  </span>
                </a>
                <Link
                  href="/places"
                  className="inline-flex h-11 items-center rounded-xl border border-border-subtle bg-surface-card px-5 text-label-md font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary"
                >
                  See how places are listed
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
                  What partners get
                </h3>
                <ul className="mt-3 space-y-2 text-body-sm text-text-secondary">
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    A profile in the Places and Travel hubs, linked to your
                    state, LGA and the nearest cultural groups.
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    A pin on the tourist and places maps, with directions from
                    the nearest documented city.
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    Placement next to the festivals and state profiles
                    travellers browse while planning.
                  </li>
                </ul>
              </div>
              <EmptyState
                title="Hotels, flights and fares"
                badge="Not in the atlas"
                className="border-dashed"
              >
                No accommodation, airline or fare data is in the repository.
                Trip times in the planner are estimates from straight-line
                distance; the directions map draws the actual road route.
              </EmptyState>
            </div>
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