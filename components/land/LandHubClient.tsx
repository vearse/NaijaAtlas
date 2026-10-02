"use client";

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
import RegionGrid from "@/components/land/RegionGrid";
import WikipediaReaderModal from "@/components/map/WikipediaReaderModal";
import type { LandHubData } from "@/lib/server/loadLandHubData";

export default function LandHubClient(data: LandHubData) {
  const stateSlugByName = data.slugByStateName;

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
        <LandHero regions={data.regions} />

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
          <NigeriaHighlights notes={data.highlights} />
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
      <WikipediaReaderModal />
    </HubShell>
  );
}
