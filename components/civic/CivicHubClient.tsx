"use client";

import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubSectionSwitcher from "@/components/hub/HubSectionSwitcher";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import StatTile from "@/components/hub/StatTile";
import ElectionCountdown from "@/components/civic/ElectionCountdown";
import PollingUnitFinder from "@/components/civic/PollingUnitFinder";
import CandidateRoster from "@/components/civic/CandidateRoster";
import WhoRepresents from "@/components/civic/WhoRepresents";
import AssemblyExplainer from "@/components/civic/AssemblyExplainer";
import type { CivicHubData } from "@/lib/server/loadCivicHubData";

export default function CivicHubClient(data: CivicHubData) {
  const { totals, election } = data;

  return (
    <HubShell canvas="civic">
      <HubHeader
        active="civic"
        primaryCta={{ label: "Find polling unit", href: "#find" }}
      />
      <HubSectionSwitcher
        items={[
          { href: "#find", label: "Find my polling unit", tone: "primary" },
          { href: "#candidates", label: "Candidates", tone: "neutral" },
          { href: "#representatives", label: "Who represents me", tone: "neutral" },
          { href: "#maps", label: "Maps", tone: "neutral" },
          { href: "#national-assembly", label: "National Assembly", tone: "neutral" },
        ]}
        note="Source: INEC · Last updated October 2024"
      />

      <main className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Module 1 — hero + PU finder */}
        <section id="find" className="grid scroll-mt-28 grid-cols-12 gap-8 py-12 md:py-14">
          <div className="col-span-12 space-y-6 lg:col-span-7">
            <div>
              <span className="mb-1 block font-label-caps text-label-caps uppercase tracking-widest text-text-muted">
                Civic &amp; Elections
              </span>
              <h1 className="font-landing-display text-display-hero leading-tight tracking-tight text-text-primary">
                Find where you vote.
              </h1>
              <p className="mt-2 text-body-md text-text-secondary">
                Locate your official biometric polling unit, senatorial
                district, and federal constituency ahead of the{" "}
                {election.year} General Elections.
              </p>
            </div>

            <div>
              <PollingUnitFinder
                stateCount={totals.states}
                pollingUnitTotal={totals.pollingUnits}
              />
            </div>
          </div>

          <div className="col-span-12 space-y-6 lg:col-span-5">
            <ElectionCountdown
              date={election.date}
              year={election.year}
              source={election.source ?? "INEC"}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile
                label="Presidential tickets"
                value={totals.presidentialTickets.toString()}
                hint="INEC final list"
              />
              <StatTile
                label="Senate races"
                value={totals.senatorialDistricts.toString()}
                hint={`${totals.senateCandidates.toLocaleString()} candidates`}
              />
              <StatTile
                label="House races"
                value={totals.federalConstituencies.toString()}
                hint={`${totals.repsCandidates.toLocaleString()} candidates`}
              />
            </div>
          </div>
        </section>

        {/* Module 2 — candidates */}
        <HubSection
          id="candidates"
          eyebrow="Electoral roster"
          title={`${election.year} candidates`}
          lede="Every declared candidate, by office, state, LGA and party. Non-partisan by design — the roster only reports what INEC published."
        >
          <CandidateRoster
            senateRaces={data.senateRaces}
            repsRaces={data.repsRaces}
            presidential={data.presidential}
            states={data.states}
            lgas={data.lgas}
            electionYear={election.year}
          />
        </HubSection>

        {/* Module 3 — who represents me */}
        <HubSection
          id="representatives"
          eyebrow="Constituency lookup"
          title="Who represents me?"
          lede="Officeholders for the 10th National Assembly, straight from the INEC and NASS returns."
        >
          <WhoRepresents
            offices={data.offices}
            states={data.states}
            president={
              data.countryOffice.president
                ? {
                    name: data.countryOffice.president.name,
                    party: data.countryOffice.president.party,
                  }
                : null
            }
          />
        </HubSection>

        {/* Module 4 — map workspaces */}
        <HubSection
          eyebrow="Geopolitical intelligence"
          title="Map workspaces"
          lede="Focused maps, not the full atlas. Each card opens the election or security workspace with the right layers already on."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MapWorkspaceCard
              map="civic/elections"
              kicker={`${totals.pollingUnits.toLocaleString()} polling units`}
            />
            <MapWorkspaceCard
              map="civic/security"
              kicker="Divisions &amp; commands"
            />
          </div>
          <p className="mt-4 text-body-sm text-slate-400">
            Basemap: Minimal or Street only on map pages.
          </p>
        </HubSection>

        {/* Module 5 — how the assembly works */}
        <HubSection
          eyebrow="Civic education"
          title="How the National Assembly works"
        >
          <AssemblyExplainer
            senateSeats={totals.senatorialDistricts}
            houseSeats={totals.federalConstituencies}
            assemblyUrl="/places"
          />
        </HubSection>

        {/* Module 6 — trust */}
        <section className="border-t border-border-subtle py-12">
          <div className="flex flex-wrap items-center gap-2">
            {["INEC", "NASS", "NBS", "NPC"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-label-caps text-text-secondary"
              >
                {chip}
              </span>
            ))}
            <Link
              href="/data"
              className="ml-auto text-label-md font-semibold text-primary hover:underline"
            >
              Methodology &amp; sources →
            </Link>
          </div>
        </section>
      </main>

      <HubFooter />
    </HubShell>
  );
}
