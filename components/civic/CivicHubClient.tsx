"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import HubSectionSwitcher from "@/components/hub/HubSectionSwitcher";
import HubSection from "@/components/hub/HubSection";
import MapWorkspaceCard from "@/components/hub/MapWorkspaceCard";
import ElectionCountdown from "@/components/civic/ElectionCountdown";
import PollingUnitFinder from "@/components/civic/PollingUnitFinder";
import PollingUnitResultPanel, {
  type BallotOffice,
} from "@/components/civic/PollingUnitResultPanel";
import CandidateRoster, {
  type RosterPosition,
} from "@/components/civic/CandidateRoster";
import WhoRepresents from "@/components/civic/WhoRepresents";
import AssemblyExplainer from "@/components/civic/AssemblyExplainer";
import EmptyState from "@/components/hub/EmptyState";
import type { CivicHubData } from "@/lib/server/loadCivicHubData";
import type { FindPollingUnitResult } from "@/app/(marketing)/civic/actions";
import { useToastStore } from "@/lib/store/toastStore";

function pickDefaultStateId(states: CivicHubData["states"]): string {
  if (states.length === 0) return "NG-LA";
  const idx = Math.floor(Math.random() * states.length);
  return states[idx]?.id ?? states[0].id;
}

export default function CivicHubClient(data: CivicHubData) {
  const { totals, election, states, lgas } = data;

  const [finderResult, setFinderResult] = useState<FindPollingUnitResult | null>(
    null
  );
  const [rosterStateId, setRosterStateId] = useState(() =>
    pickDefaultStateId(states)
  );
  const [rosterPosition, setRosterPosition] = useState<RosterPosition>("president");

  const lgaSearchRows = useMemo(
    () =>
      lgas.map((l) => ({
        id: l.id,
        name: l.name,
        stateId: l.stateId,
        stateName:
          states.find((s) => s.id === l.stateId)?.name ??
          l.stateId.replace("NG-", ""),
      })),
    [lgas, states]
  );

  const pushToast = useToastStore((s) => s.pushToast);

  const handleResultChange = useCallback(
    (result: FindPollingUnitResult | null) => {
      setFinderResult(result);
      if (result?.primary) {
        setRosterStateId(result.primary.hit.stateId);
        pushToast(
          `Polling unit found — ${result.primary.hit.wardName}, ${result.primary.hit.lgaName}`,
          "success"
        );
        return;
      }
      if (!result) return;
      if (result.note) {
        pushToast(result.note, "tip");
        return;
      }
      if (result.query) {
        pushToast("No polling unit found for that lookup.", "info");
      }
    },
    [pushToast]
  );

  const openCandidatesFromBallot = useCallback((office: BallotOffice) => {
    setRosterPosition(office);
    document.getElementById("candidates")?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:px-6">
        <section id="find" className="scroll-mt-28">
          <div>
            <span className="mb-1 block font-label-caps text-label-caps uppercase tracking-widest text-text-muted">
              Civic &amp; Elections
            </span>
            <h1 className="font-landing-display text-headline-xl-mobile leading-tight tracking-tight text-text-primary md:text-display-hero">
              Find where you vote.
            </h1>
            <p className="mt-2 max-w-2xl text-body-md text-text-secondary">
              Locate your official biometric polling unit, senatorial district,
              and federal constituency ahead of the {election.year} General
              Elections.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="min-w-0 flex-1">
              <PollingUnitFinder
                stateCount={totals.states}
                pollingUnitTotal={totals.pollingUnits}
                lgaRows={lgaSearchRows}
                onResultChange={handleResultChange}
              />
            </div>
            <div className="w-full shrink-0 lg:w-[min(100%,340px)]">
              <ElectionCountdown
                date={election.date}
                year={election.year}
                source={election.source ?? "INEC"}
                className="h-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">

            {finderResult?.note && !finderResult.primary && (
              <p
                className="col-span-12 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900"
                role="alert"
              >
                {finderResult.note}
              </p>
            )}

            {finderResult?.primary && (
              <div className="col-span-12">
                <PollingUnitResultPanel
                  match={finderResult.primary}
                  onOpenCandidates={openCandidatesFromBallot}
                />
              </div>
            )}

            {finderResult &&
              !finderResult.primary &&
              !finderResult.note &&
              finderResult.query && (
                <div className="col-span-12">
                  <EmptyState title="No match for that lookup" badge="No result">
                    Try a PU code from your voter card, or browse by LGA and
                    ward.
                  </EmptyState>
                </div>
              )}

            {finderResult && finderResult.alternatives.length > 0 && (
              <div className="col-span-12 rounded-2xl border border-border-subtle bg-surface-card p-5">
                <p className="text-label-caps text-text-muted">Other matches</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {finderResult.alternatives.map((alt) => (
                    <li key={alt.hit.wardId}>
                      <button
                        type="button"
                        onClick={() =>
                          setFinderResult({
                            ...finderResult,
                            primary: alt,
                            alternatives: [],
                          })
                        }
                        className="w-full rounded-xl border border-border-subtle px-4 py-3 text-left text-body-sm hover:border-primary-container/50 hover:bg-emerald-50/50"
                      >
                        <span className="font-semibold text-text-primary">
                          {alt.hit.wardName}
                        </span>
                        <span className="block text-text-muted">
                          {alt.hit.lgaName} · {alt.hit.stateName}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <HubSection
          id="candidates"
          eyebrow="Electoral roster"
          title={`${election.year} candidates`}
          lede="Every declared candidate, by office and state. Non-partisan by design — the roster only reports what INEC published."
        >
          <CandidateRoster
            senateRaces={data.senateRaces}
            repsRaces={data.repsRaces}
            presidential={data.presidential}
            states={data.states}
            offices={data.offices}
            electionYear={election.year}
            stateId={rosterStateId}
            onStateIdChange={setRosterStateId}
            position={rosterPosition}
            onPositionChange={setRosterPosition}
            senatorialLookups={data.senatorialLookups}
          />
        </HubSection>

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

        <HubSection
          id="maps"
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

        <HubSection
          id="national-assembly"
          eyebrow="Civic education"
          title="How the National Assembly works"
        >
          <AssemblyExplainer
            senateSeats={totals.senatorialDistricts}
            houseSeats={totals.federalConstituencies}
            assemblyUrl="/places"
          />
        </HubSection>

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
