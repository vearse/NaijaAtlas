"use client";

import LandingShell from "@/components/landing/LandingShell";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import LiveNowStrip from "@/components/landing/LiveNowStrip";
import SectionDoorsGrid from "@/components/landing/SectionDoorsGrid";
import PlacesExplorer from "@/components/landing/PlacesExplorer";
import PeopleSpotlight from "@/components/landing/PeopleSpotlight";
import MetricsBand from "@/components/landing/MetricsBand";
import PollingFinderCta from "@/components/landing/PollingFinderCta";
import OpenCivicSources from "@/components/landing/OpenCivicSources";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingSearch from "@/components/landing/LandingSearch";
import { useLandingSpotlight } from "@/components/landing/useLandingSpotlight";
import type { LandingPageData } from "@/lib/landing/landingPageTypes";

export default function LandingPageClient(props: LandingPageData) {
  const { open, close, toggle } = useLandingSpotlight();

  return (
    <LandingShell>
      <LandingHeader onSearchOpen={toggle} />

      {open && (
        <div
          className="fixed inset-0 z-[55] flex items-start justify-center pt-[14vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div className="relative w-full max-w-xl">
            <LandingSearch spotlightOpen onSpotlightClose={close} />
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-16">
        <LandingHero spotlightOpen={false} onSpotlightClose={close} />
        <LiveNowStrip />
        <SectionDoorsGrid
          totalPollingUnits={props.totalPollingUnits}
          culturalGroupCount={props.ethnicGroupCount}
        />
        <PlacesExplorer
          regions={props.regions}
          statesByRegion={props.statesByRegion}
        />
        <PeopleSpotlight
          spotlight={props.ethnicSpotlight}
          totalCount={props.ethnicGroupCount}
        />
        <MetricsBand
          lgaCount={props.lgaCount}
          totalPollingUnits={props.totalPollingUnits}
          ethnicGroupCount={props.ethnicGroupCount}
        />
        <OpenCivicSources />
        <PollingFinderCta />
      </main>

      <LandingFooter />
    </LandingShell>
  );
}
