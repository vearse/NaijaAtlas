"use client";

import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubBreadcrumb from "@/components/hub/HubBreadcrumb";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import StatTile from "@/components/hub/StatTile";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import { IconTrend } from "@/components/landing/icons";
import MineralBrowseSpotlight from "@/components/economy/MineralBrowseSpotlight";
import FarmingBeltSpotlight from "@/components/economy/FarmingBeltSpotlight";
import PortsDirectory from "@/components/economy/PortsDirectory";
import StatesToWatch from "@/components/economy/StatesToWatch";
import EnergyGrid from "@/components/economy/EnergyGrid";
import type { EconomyHubData } from "@/lib/server/loadEconomyHubData";
import type { PowerData } from "@/lib/server/loadPowerData";

export default function EconomyHubClient(
  data: EconomyHubData & { power: PowerData }
) {
  const activePorts = data.ports.filter((p) => p.status === "active").length;
  const proposedPorts = data.ports.length - activePorts;

  const slugByStateId = Object.fromEntries(
    data.watch.map((w) => [w.name, w.slug])
  );

  return (
    <HubShell canvas="economy">
      <HubHeader
        active="economy"
        primaryCta={{ label: "Browse minerals", href: "#minerals" }}
      />
      <HubBreadcrumb
        trail={[{ label: "Home", href: "/" }, { label: "Economy" }]}
      />

      <main className="mx-auto max-w-[1200px] px-4 md:px-8">
        {/* Hero */}
        <section className="space-y-4 pt-8">
          <div className="flex flex-col gap-6 pt-2 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-metric-teal/20 bg-metric-teal-tint px-2.5 py-1 font-label-caps text-label-caps text-metric-teal">
                <span className="h-2 w-2 animate-pulse rounded-full bg-metric-teal" />
                ECONOMY &amp; TRADE
              </span>
              <h1 className="font-landing-display text-display-hero tracking-tight text-text-primary">
                Find opportunities.
              </h1>
              <p className="max-w-2xl text-body-lg leading-relaxed text-text-secondary">
                Explore verified commercial intelligence on solid minerals,
                active ports, grid power plants, and agricultural belts across
                Nigeria&rsquo;s {data.stateCount} states and the FCT.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-border-subtle bg-surface-card p-3.5 shadow-sm md:self-auto">
              <span className="rounded-lg bg-primary-tint-light p-2 text-primary">
                <IconTrend className="w-5 h-5" />
              </span>
              <div>
                <div className="font-label-caps text-label-caps text-text-muted">
                  Metric refresh
                </div>
                <div className="font-headline-sm text-headline-sm font-bold text-text-primary">
                  {data.stateCount}/37 tracked
                </div>
              </div>
              <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Mineral entries"
              value={data.resources.length.toString()}
              hint="Commercial deposits"
            />
            <StatTile
              label="Operating ports"
              value={activePorts.toString()}
              hint={`${proposedPorts} more proposed`}
            />
            <StatTile
              label="Agro belts"
              value={data.belts.length.toString()}
              hint="With crop data"
            />
            <StatTile
              label="States indexed"
              value={data.stateCount.toString()}
              hint="36 states + the FCT"
            />
          </div>
        </section>

        {/* Browse by sector — minerals spotlight */}
        <HubSection
          id="minerals"
          eyebrow="Solid minerals"
          title="Browse by sector"
          lede="Minerals first — shuffle to surface three catalogue entries at a time."
        >
          <MineralBrowseSpotlight resources={data.resources} />
        </HubSection>

        <HubSection
          eyebrow="Agriculture"
          title="Farming belt spotlight"
          lede="One agro-ecological belt at a time from the ecology catalogue."
        >
          <FarmingBeltSpotlight
            belts={data.belts}
            slugByStateId={slugByStateId}
          />
        </HubSection>

        {/* Ports */}
        <HubSection
          eyebrow="Maritime trade"
          title="Ports: what ships today, and what might"
          lede="Operating terminals and proposed deep-water hubs, kept clearly separate — a concession is not a port."
        >
          <PortsDirectory ports={data.ports} slugByStateId={slugByStateId} />
        </HubSection>

        {/* States to watch */}
        <HubSection
          eyebrow="Signal"
          title="States to watch"
          lede="Derived from the catalogues above rather than hand-picked: port complexes, mineral entries and IGR rank."
        >
          <StatesToWatch watch={data.watch} sampleSize={5} />
        </HubSection>

        {/* Maps */}
        <HubSection
          id="economy-map"
          bandClass="bg-primary-tint-light border-y border-primary/20"
          eyebrow="Geospatial economic layers"
          title="Economy map: minerals, ports, power and farming belts"
          lede="Overlay infrastructure corridors with geographic fidelity. Filter pipelines, active export terminals, mineral license concessions, and high-voltage transmission lines on Nigeria’s definitive spatial canvas."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard
              map="economy/resources"
              kicker={`${data.resources.length} minerals`}
            />
            <MapWorkspaceCard
              map="economy/ports"
              kicker={`${activePorts} active · ${proposedPorts} proposed`}
            />
          </div>
        </HubSection>

        {/* Energy */}
        <HubSection
          eyebrow="Energy grid"
          title="Hydropower and distribution"
          lede="Hydroelectric stations and the grid distribution companies, exactly as the lakes layer documents them."
        >
          <EnergyGrid power={data.power} slugByStateId={slugByStateId} />
        </HubSection>

        {/* Coverage honesty */}
        <section className="border-t border-border-subtle py-12">
          <h2 className="font-landing-display text-headline-lg text-text-primary">
            What this hub does not cover
          </h2>
          <div className="mt-4">
            <EmptyState
              title="Thermal generation, trade volumes and commodity prices"
              badge="No dataset"
              className="border-dashed"
            >
              The repository holds no gas or thermal plant inventory, no customs
              or export-volume series, and no commodity price feed. The IGR
              series on the{" "}
              <a href="/data" className="font-semibold text-primary hover:underline">
                data hub
              </a>{" "}
              is the closest verified revenue figure we have, so we do not
              estimate the rest.
            </EmptyState>
          </div>
          <SourceNote
            className="mt-6"
            source={data.sources}
            updated="Repository datasets"
          />
        </section>

      </main>

      <HubFooter />
    </HubShell>
  );
}
