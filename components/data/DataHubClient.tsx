"use client";

import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubSectionSwitcher from "@/components/hub/HubSectionSwitcher";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import SourceNote from "@/components/hub/SourceNote";
import NationalPulse from "@/components/data/NationalPulse";
import IgrTrend from "@/components/data/IgrTrend";
import IndicatorExplorer from "@/components/data/IndicatorExplorer";
import IndicatorDirectory from "@/components/data/IndicatorDirectory";
import type { DataHubData } from "@/lib/server/loadDataHubData";

export default function DataHubClient(data: DataHubData) {
  const { indicators, states, reserved } = data;
  const slugByStateId = Object.fromEntries(
    states.map((s) => [s.id, s.slug])
  );
  const igr = indicators.find((i) => i.key === "economy.igr") ?? null;

  return (
    <HubShell>
      <HubHeader
        active="data"
        primaryCta={{ label: "Browse indicators", href: "#indicators" }}
      />
      <HubSectionSwitcher
        label="Jump to domain:"
        containerClassName="max-w-[1280px] px-4 md:px-8"
        items={[
          {
            href: "#economy",
            label: "Economy",
            tone: "primary",
            dot: "bg-primary-container",
          },
          {
            href: "#social",
            label: "Social & Demographics",
            tone: "rose",
            dot: "bg-alert-coral",
          },
          {
            href: "#more",
            label: "More Indicators",
            tone: "sky",
            dot: "bg-sky-600",
          },
          {
            href: "#sources",
            label: "Methodology & Sources",
            tone: "slate",
          },
        ]}
      />

      <main className="mx-auto max-w-[1280px] px-4 md:px-6">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border-subtle bg-gradient-to-b from-emerald-50 via-[#f7fdfa] to-[#f8fafc] pt-10 pb-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
            aria-hidden
          >
            <div className="absolute inset-0 landing-contour-overlay-dark" />
          </div>
          <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col gap-6 px-4 md:flex-row md:items-end md:justify-between md:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100/80 px-3 py-1 text-label-caps text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                DATA INTELLIGENCE
              </span>
              <h1 className="mt-5 max-w-3xl font-landing-display text-headline-xl-mobile tracking-tight text-text-primary md:text-display-hero">
                How every state{" "}
                <span className="text-primary-container">measures up.</span>
              </h1>
              <p className="mt-4 max-w-xl text-body-lg leading-relaxed text-text-secondary">
                Revenue, literacy, health and more, ranked and mapped straight
                from official records. Nothing is modelled or estimated.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a
                href="#pulse"
                className="inline-flex h-11 items-center rounded-xl bg-primary-container px-5 text-label-md font-semibold text-white hover:bg-[#006d40]"
              >
                See the headlines
              </a>
              <a
                href="/data/map/rankings"
                className="inline-flex h-11 items-center rounded-xl border border-primary-container bg-white px-5 text-label-md font-semibold text-primary hover:bg-emerald-50"
              >
                Rankings map
              </a>
            </div>
          </div>
        </section>

        {/* National pulse */}
        <HubSection
          id="pulse"
          eyebrow="National pulse"
          title="The headlines that matter"
          lede="Aggregates we can actually compute: IGR sums across states, while the social indicators are rates, so we report the median and the spread."
        >
          <NationalPulse indicators={indicators} states={states} />
        </HubSection>

        {/* IGR deep dive */}
        {igr && (
          <HubSection
            id="economy"
            eyebrow="Economy"
            title="State revenue, year by year"
            lede="Internally Generated Revenue is the one series in this dataset with a full multi-year history, so it gets the trend treatment."
          >
            <IgrTrend
              indicator={igr}
              states={states}
              slugByStateId={slugByStateId}
            />
          </HubSection>
        )}

        {/* Indicator explorer — economy */}
        <HubSection
          id="indicators"
          eyebrow="Ranked"
          title="Rank any indicator"
          lede="Pick a metric and a period. The choropleth, the leaderboard and the table all use the same scale as the map."
        >
          <IndicatorExplorer
            indicators={indicators}
            states={states}
            categoryId="economy"
            initialIndicatorKey="economy.igr"
            slugByStateId={slugByStateId}
          />
        </HubSection>

        {/* Indicator explorer — social */}
        <HubSection
          id="social"
          eyebrow="Social &amp; human capital"
          title="Education and health indicators"
        >
          <IndicatorExplorer
            indicators={indicators}
            states={states}
            categoryId="social"
            initialIndicatorKey="social.literacyRate"
            slugByStateId={slugByStateId}
          />
        </HubSection>

        {/* Directory */}
        <HubSection
          id="more"
          eyebrow="Directory"
          title="Every indicator, and the ones we don’t have"
          lede="The complete list of what this dataset contains, including the reserved columns that are still empty."
        >
          <IndicatorDirectory indicators={indicators} reserved={reserved} />
        </HubSection>

        {/* Maps */}
        <HubSection
          eyebrow="Geopolitical intelligence"
          title="Take it to the map"
          lede="The hub shows the ranking; the map shows the geography."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard map="data/rankings" kicker="Choropleth by indicator" />
            <MapWorkspaceCard map="data/compare" kicker="Side-by-side states" />
          </div>
        </HubSection>

        {/* Methodology */}
        <section id="sources" className="scroll-mt-40 border-t border-border-subtle py-12">
          <h2 className="font-landing-display text-headline-lg text-text-primary">
            Sources &amp; methodology
          </h2>
          <div className="mt-4 grid gap-6 text-body-sm text-text-secondary md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-text-primary">Where it comes from</h3>
              <p className="mt-1">{data.economySource || "NBS"}</p>
              <p className="mt-2">{data.socialSource || "NBS / MICS"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">How we rank</h3>
              <p className="mt-1">
                States are sorted by the raw parsed value, not the rounded string
                the CSV stores, so neighbouring states never tie by formatting.
                The choropleth uses the same breaks as the table.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">What we don’t do</h3>
              <p className="mt-1">
                We don’t average rates into a national figure, and we don’t
                treat an empty cell as a zero. {reserved.length} reserved
                columns are listed as uncollected rather than shown as data.
              </p>
            </div>
          </div>
          <SourceNote
            className="mt-6"
            source="NBS · NBS/MICS · BudgIT"
            updated="FY 2022–2024 · 2021"
          />
        </section>
      </main>

      <HubFooter />
    </HubShell>
  );
}
