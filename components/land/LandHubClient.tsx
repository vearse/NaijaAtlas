"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubSectionSwitcher from "@/components/hub/HubSectionSwitcher";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import SourceNote from "@/components/hub/SourceNote";
import LandHero from "@/components/land/LandHero";
import LandExplorer from "@/components/land/LandExplorer";
import NigeriaHighlights from "@/components/land/NigeriaHighlights";
import RandomStoryModal from "@/components/land/RandomStoryModal";
import RegionGrid from "@/components/land/RegionGrid";
import WikipediaReaderModal from "@/components/map/WikipediaReaderModal";
import type { HubCountryNote, LandHubData } from "@/lib/server/loadLandHubData";

export default function LandHubClient(data: LandHubData) {
  const stateSlugByName = data.slugByStateName;
  const [randomStory, setRandomStory] = useState<HubCountryNote | null>(null);

  const pickStory = useCallback(
    (excludeTitle?: string) => {
      const pool = data.highlights.filter((n) => n.title !== excludeTitle);
      const source = pool.length > 0 ? pool : data.highlights;
      return source[Math.floor(Math.random() * source.length)] ?? null;
    },
    [data.highlights]
  );

  const openRandomStory = useCallback(() => {
    setRandomStory(pickStory());
  }, [pickStory]);

  const nextRandomStory = useCallback(() => {
    setRandomStory((current) => pickStory(current?.title));
  }, [pickStory]);

  const closeRandomStory = useCallback(() => setRandomStory(null), []);

  const selectStory = useCallback((note: HubCountryNote) => {
    setRandomStory(note);
  }, []);

  return (
    <HubShell>
      <HubHeader
        active="land"
        primaryCta={{ label: "Explore the land", href: "#terrain" }}
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
            <span className="font-medium text-text-primary">Land</span>
          </>
        }
        items={[
          { href: "#overview", label: "Overview", tone: "neutral" },
          { href: "#terrain", label: "Land features", tone: "neutral" },
          { href: "#highlights", label: "Highlights", tone: "neutral" },
          { href: "#zones", label: "Zones", tone: "neutral" },
          { href: "#map", label: "Maps", tone: "neutral" },
        ]}
      />

      <main className="mx-auto max-w-[1280px] px-4 md:px-6">
        <LandHero regions={data.regions} onRandomStory={openRandomStory} />

        <HubSection
          id="terrain"
          eyebrow="Physical geography"
          title="Terrain, rivers, lakes and coast"
          lede="Pick a feature to see where it sits and which states it touches."
        >
          <LandExplorer data={data} slugByStateId={stateSlugByName} />
        </HubSection>

        <HubSection
          id="highlights"
          eyebrow="Nigeria highlights"
          title="Stories behind the map"
          lede="History, culture and geography notes from the atlas overview."
        >
          <NigeriaHighlights
            notes={data.highlights}
            onRandomStory={openRandomStory}
            onSelectStory={selectStory}
          />
        </HubSection>

        <HubSection
          id="zones"
          eyebrow="Administrative zones"
          title="The six geopolitical zones"
          lede="Nigeria's standard six-zone grouping, with every member state."
        >
          <RegionGrid regions={data.regions} slugByStateId={stateSlugByName} />
        </HubSection>

        <HubSection id="map" eyebrow="Map workspaces" title="Take it to the map">
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard map="land/physical" kicker="Relief, rivers, coast" />
            <MapWorkspaceCard map="data/compare" kicker="States & LGAs" />
          </div>
        </HubSection>

        <section className="border-t border-border-subtle py-12">
          <p className="max-w-3xl text-body-sm text-text-muted">
            Relief here is categorical: the catalogues describe landforms and
            waters, not a digital elevation model, so the terrain map shows the
            same features listed above.
          </p>
          <SourceNote className="mt-6" source={data.sources} updated="Repository catalogues" />
        </section>
      </main>

      <HubFooter />
      <RandomStoryModal
        story={randomStory}
        onClose={closeRandomStory}
        onAnother={nextRandomStory}
      />
      <WikipediaReaderModal />
    </HubShell>
  );
}
