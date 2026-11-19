"use client";

import { useCallback, useState } from "react";
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
import SponsorsBand from "@/components/landing/SponsorsBand";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingSearch from "@/components/landing/LandingSearch";
import NigeriaHighlights from "@/components/land/NigeriaHighlights";
import RandomStoryModal from "@/components/land/RandomStoryModal";
import WikipediaReaderModal from "@/components/map/WikipediaReaderModal";
import { useLandingSpotlight } from "@/components/landing/useLandingSpotlight";
import type { LandingPageData } from "@/lib/landing/landingPageTypes";
import type { LandingDailyTeaser } from "@/lib/server/loadLandingDailyTeaser";
import type { LandingFestivalFeature } from "@/lib/server/loadLandingFestivalFeature";
import type { HubCountryNote } from "@/lib/server/loadLandHubData";

export default function LandingPageClient(
  props: LandingPageData & {
    dailyTeaser: LandingDailyTeaser | null;
    festivalFeature: LandingFestivalFeature | null;
    highlights: HubCountryNote[];
  }
) {
  const { open, close, toggle } = useLandingSpotlight();
  const [randomStory, setRandomStory] = useState<HubCountryNote | null>(null);

  const pickStory = useCallback(
    (excludeTitle?: string) => {
      const pool = props.highlights.filter((n) => n.title !== excludeTitle);
      const source = pool.length > 0 ? pool : props.highlights;
      return source[Math.floor(Math.random() * source.length)] ?? null;
    },
    [props.highlights]
  );

  const openRandomStory = useCallback(() => {
    setRandomStory(pickStory());
  }, [pickStory]);

  const selectStory = useCallback((note: HubCountryNote) => {
    setRandomStory(note);
  }, []);

  const nextRandomStory = useCallback(() => {
    setRandomStory((current) => pickStory(current?.title));
  }, [pickStory]);

  const closeRandomStory = useCallback(() => setRandomStory(null), []);

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

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-16">
        <LandingHero
          spotlightOpen={false}
          onSpotlightClose={close}
          states={Object.values(props.statesByRegion).flat()}
        />
        <LiveNowStrip dailyTeaser={props.dailyTeaser} festivalFeature={props.festivalFeature} />
        <SectionDoorsGrid
          totalPollingUnits={props.totalPollingUnits}
          culturalGroupCount={props.ethnicGroupCount}
        />
        <PlacesExplorer
          regions={props.regions}
          statesByRegion={props.statesByRegion}
          totalPollingUnits={props.totalPollingUnits}
        />
        {props.highlights.length > 0 && (
          <section id="nigeria-highlights" className="mt-28 scroll-mt-24">
            <div className="mb-8">
              <span className="text-label-caps uppercase text-primary block mb-2">
                Nigeria highlights
              </span>
              <h2 className="font-landing-display text-headline-xl text-text-primary font-extrabold">
                Stories behind the map
              </h2>
              <p className="mt-2 max-w-2xl text-body-md text-text-secondary">
                History, culture and geography notes from across Nigeria.
              </p>
            </div>
            <NigeriaHighlights
              notes={props.highlights}
              onRandomStory={openRandomStory}
              onSelectStory={selectStory}
            />
          </section>
        )}
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
        <SponsorsBand />
      </main>

      <LandingFooter />
      <RandomStoryModal
        story={randomStory}
        onClose={closeRandomStory}
        onAnother={nextRandomStory}
      />
      <WikipediaReaderModal />
    </LandingShell>
  );
}
