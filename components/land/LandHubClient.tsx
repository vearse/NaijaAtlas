"use client";

import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubSectionSwitcher from "@/components/hub/HubSectionSwitcher";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import StatTile from "@/components/hub/StatTile";
import SourceNote from "@/components/hub/SourceNote";
import LandExplorer from "@/components/land/LandExplorer";
import RegionGrid from "@/components/land/RegionGrid";
import type { LandHubData } from "@/lib/server/loadLandHubData";

export default function LandHubClient(data: LandHubData) {
  // The region and catalogue lists carry state names; the explorer loader
  // supplies the id → slug and name → id maps.
  const stateSlugByName = data.slugByStateName;

  return (
    <HubShell>
      <HubHeader
        active="land"
        primaryCta={{ label: "Explore the terrain", href: "#terrain" }}
      />
      <HubSectionSwitcher
        variant="segmented"
        containerClassName="max-w-[1280px] px-4 md:px-8"
        leading={
          <>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span className="text-slate-300" aria-hidden>
              &rsaquo;
            </span>
            <span className="font-medium text-text-primary">Places</span>
          </>
        }
        items={[
          { href: "#terrain", label: "Discover", tone: "neutral" },
          { href: "#zones", label: "Zones", tone: "neutral" },
          { href: "#map", label: "Land", tone: "neutral" },
        ]}
      />

      <main className="mx-auto max-w-[1280px] px-4 md:px-6">
        {/* Hero */}
        <section className="pt-12 md:pt-16">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-label-caps text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
              LAND &amp; PHYSICAL GEOGRAPHY
            </span>
            <span className="inline-flex rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-label-caps text-text-secondary">
              {data.counts.states} states
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl font-landing-display text-headline-xl-mobile tracking-tight text-text-primary md:text-display-hero">
            The shape of the country.
          </h1>
          <p className="mt-4 max-w-2xl text-body-lg text-text-secondary">
            Landforms, rivers, lakes and coastline from the relief and water
            catalogues — {data.counts.landforms} terrain features,{" "}
            {data.counts.rivers} waterways, {data.counts.lakes} lakes and
            lagoons, {data.counts.coast} coastal segments.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Terrain features"
              value={data.counts.landforms.toString()}
              hint="Plateaus, ranges, hills"
            />
            <StatTile
              label="Waterways"
              value={data.counts.rivers.toString()}
              hint={
                data.longestRiver
                  ? `${data.longestRiver.name} is the longest`
                  : "Catalogued rivers"
              }
            />
            <StatTile
              label="Lakes & lagoons"
              value={data.counts.lakes.toString()}
              hint={`${data.powerStations} hydro stations too`}
            />
            <StatTile
              label="Coastal segments"
              value={data.counts.coast.toString()}
              hint="Atlantic frontage"
            />
          </div>
        </section>

        {/* Explorer */}
        <HubSection
          id="terrain"
          eyebrow="Physical geography"
          title="Terrain, water and coast"
          lede="Browse the catalogues by kind. Every entry links to the states it crosses."
        >
          <LandExplorer
            data={data}
            slugByStateId={stateSlugByName}
            idByStateName={data.idByStateName}
          />
        </HubSection>

        {/* Zones */}
        <HubSection
          id="zones"
          eyebrow="Administrative zones"
          title="The six geopolitical zones"
          lede="Nigeria's standard six-zone grouping, with every member state."
        >
          <RegionGrid
            regions={data.regions}
            slugByStateId={stateSlugByName}
          />
        </HubSection>

        {/* Maps */}
        <HubSection
          id="map"
          eyebrow="Geopolitical intelligence"
          title="Take it to the map"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard
              map="land/physical"
              kicker="Relief, rivers, coast"
            />
            <MapWorkspaceCard map="land/zones" kicker="Six zones" />
          </div>
        </HubSection>

        <section className="border-t border-border-subtle py-12">
          <p className="max-w-3xl text-body-sm text-text-muted">
            Relief here is categorical: the catalogues describe landforms and
            waters, not a digital elevation model. The terrain map renders the
            same overlays the hub lists, and there is no elevation profile
            because the repository has no DEM to draw one from.
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
