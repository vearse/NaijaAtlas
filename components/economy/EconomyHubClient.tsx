"use client";

import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import SourceNote from "@/components/hub/SourceNote";
import EconomySectorBrowse from "@/components/economy/EconomySectorBrowse";
import AgricultureBeltSection from "@/components/economy/AgricultureBeltSection";
import PortsDirectory from "@/components/economy/PortsDirectory";
import StatesToWatch from "@/components/economy/StatesToWatch";
import EnergyGrid from "@/components/economy/EnergyGrid";
import type { EconomyHubData } from "@/lib/server/loadEconomyHubData";
import type { PowerData } from "@/lib/server/loadPowerData";

export default function EconomyHubClient(
  data: EconomyHubData & { power: PowerData }
) {
  const slugByStateName = Object.fromEntries(
    data.watch.map((w) => [w.name, w.slug])
  );

  return (
    <HubShell canvas="economy">
      <HubHeader
        active="economy"
        primaryCta={{ label: "Economy maps", href: "#economy-map" }}
      />
      <HubBreadcrumb
        trail={[{ label: "Home", href: "/" }, { label: "Economy" }]}
      />

      <main className="mx-auto max-w-[1200px] space-y-16 px-4 pb-16 md:px-8">
        <section className="space-y-4 pt-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-metric-teal/20 bg-metric-teal-tint px-2.5 py-1 font-label-caps text-label-caps text-metric-teal">
            <span className="h-2 w-2 animate-pulse rounded-full bg-metric-teal" />
            ECONOMY &amp; TRADE
          </span>
          <h1 className="max-w-3xl font-landing-display text-display-hero tracking-tight text-text-primary">
            Find opportunities.
          </h1>
          <p className="max-w-3xl text-body-lg leading-relaxed text-text-secondary">
            Solid minerals, Atlantic ports and agro-ecological belts from the
            Sahel to the Niger Delta — browse a sector to see where opportunity
            concentrates, then follow a farming belt on the map.
          </p>
        </section>

        <HubSection id="minerals" className="!pt-0">
          <EconomySectorBrowse
            resources={data.resources}
            mineralTypesShown={data.mineralTypesShown}
            ports={data.ports}
            distributors={data.power.distributors}
          />
        </HubSection>

        <HubSection
          id="agriculture"
          eyebrow="Agriculture belts"
          title="From savannah grain to forest tree crops"
          lede="Pick a belt to see its states, what it grows, and where it sits on the map."
        >
          <AgricultureBeltSection belts={data.belts} slugByStateName={slugByStateName} />
        </HubSection>

        <HubSection
          eyebrow="Maritime trade"
          title="Ports: what ships today, and what might"
          lede="Switch between operating terminals and proposed deep-water hubs."
        >
          <PortsDirectory ports={data.ports} slugByStateId={slugByStateName} />
        </HubSection>

        <HubSection
          eyebrow="Energy grid"
          title="Power generation and distribution"
          lede="Grid-connected generation plants and distribution companies from the power catalogue."
        >
          <EnergyGrid power={data.power} slugByStateId={slugByStateName} />
        </HubSection>

        <HubSection
          id="economy-map"
          eyebrow="Map workspaces"
          title="Economy maps"
          lede="Focused views for minerals, ports and power plants on the atlas."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <MapWorkspaceCard map="economy/resources" kicker="Minerals" />
            <MapWorkspaceCard map="economy/ports" kicker="Operating + proposed" />
            <MapWorkspaceCard map="economy/power" kicker="Power generation" />
          </div>
        </HubSection>

        <HubSection eyebrow="Sub-national signal" title="States to watch">
          <StatesToWatch watch={data.watch} sampleSize={6} />
        </HubSection>

        <section className="border-t border-border-subtle py-12">
          <h2 className="font-landing-display text-headline-lg text-text-primary">
            What this hub does not cover
          </h2>
          <div className="mt-4 rounded-2xl border border-dashed border-border-subtle bg-slate-50 px-5 py-4 text-body-sm text-text-secondary">
            <p>
              Power plants are listed by installed capacity only. Actual output,
              plant availability, gas supply and captive/solar/diesel generation
              are not covered.
            </p>
            <p className="mt-2">
              Customs trade volumes and live commodity prices are also outside
              this hub. See the{" "}
              <a href="/data" className="font-semibold text-primary hover:underline">
                data hub
              </a>{" "}
              for verified IGR rankings.
            </p>
          </div>
          <SourceNote
            className="mt-6"
            source={`${data.sources.minerals} · ${data.sources.ports} · ${data.sources.power}`}
            updated={`Last verified ${data.sources.lastVerified}`}
          />
        </section>
      </main>

      <HubFooter />
    </HubShell>
  );
}
