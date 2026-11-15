"use client";

import { useEffect, useState } from "react";
import type { PoliticsBundle, PollingUnitCountsBundle } from "@/types/politics";
import type { LgaLocation } from "@/types/location";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useMapStore } from "@/lib/store/mapStore";
import MobileBottomSheet from "@/components/location/MobileBottomSheet";
import PollingUnitLocator from "./PollingUnitLocator";
import ElectionDistrictPicker from "./ElectionDistrictPicker";
import ElectionDistrictDetail from "./ElectionDistrictDetail";
import PresidentialCandidatesDetail from "./PresidentialCandidatesDetail";
import GovernorshipCandidatesDetail from "./GovernorshipCandidatesDetail";
import ElectionResultsMapPanel from "./ElectionResultsMapPanel";
import SpeculationPanel from "./SpeculationPanel";
import SpeculationModeSwitch from "./SpeculationModeSwitch";
import { isElectionResultsMapActive } from "@/lib/election/electionResultsMapActive";
import { useElectionModeSwitch } from "./ElectionResultsMapControls";
import { useSpeculationStore } from "@/lib/store/speculationStore";
import type { PresidentialResultsBundle, SpeculationData } from "@/types/politics";
import type { StateLocation } from "@/types/location";

interface ElectionPanelProps {
  politics: PoliticsBundle;
  pollingCounts: PollingUnitCountsBundle;
  lgas: LgaLocation[];
  presidentialResults?: PresidentialResultsBundle | null;
  resultYears?: number[];
  states?: StateLocation[];
  speculation?: SpeculationData;
  showSpeculationModeSwitch?: boolean;
}

export default function ElectionPanel({
  politics,
  pollingCounts,
  lgas,
  presidentialResults = null,
  resultYears = [],
  states = [],
  speculation,
  showSpeculationModeSwitch = true,
}: ElectionPanelProps) {
  const { showResults, showCurrent } = useElectionModeSwitch(resultYears);
  const electionResultsYear = useMapStore((s) => s.electionResultsYear);
  const electionResultsOffice = useMapStore((s) => s.electionResultsOffice);
  const mapType = useMapStore((s) => s.mapType);
  const resultsMapActive =
    presidentialResults &&
    isElectionResultsMapActive({
      mapType,
      electionResultsYear,
      electionResultsOffice,
    });
  const isMobile = useIsMobile();
  const mobileSheet = useMapStore((s) => s.mobileSheet);
  const openMobileSheet = useMapStore((s) => s.openMobileSheet);
  const speculationActive = useSpeculationStore((s) => s.active);
  const speculationPhase = useSpeculationStore((s) => s.phase);
  const setSpeculationActive = useSpeculationStore((s) => s.setActive);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const selectedSenatorialDistrictId = useMapStore(
    (s) => s.selectedSenatorialDistrictId
  );
  const district = selectedSenatorialDistrictId
    ? politics.lookups.districtById[selectedSenatorialDistrictId]
    : null;

  const [viewPresidential, setViewPresidential] = useState(false);
  const [viewGovernor, setViewGovernor] = useState(false);

  const inDistrictPhase = Boolean(selectedSenatorialDistrictId && district);
  const inPresidentialPhase =
    viewPresidential && !inDistrictPhase && !viewGovernor;
  const inGovernorPhase = viewGovernor && !inDistrictPhase;

  useEffect(() => {
    if (selectedSenatorialDistrictId && (viewPresidential || viewGovernor)) {
      setViewPresidential(false);
      setViewGovernor(false);
    }
  }, [selectedSenatorialDistrictId, viewPresidential, viewGovernor]);

  const openPresidential = () => {
    setViewGovernor(false);
    setViewPresidential(true);
  };
  const openGovernor = () => {
    setViewPresidential(false);
    setViewGovernor(true);
  };

  const browsePhase = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/50 lg:block hidden shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
          2027 elections · Browse
        </p>
        <h2 className="text-lg font-bold text-text-primary">Find & explore</h2>
        <p className="text-xs text-text-muted mt-1">
          Polling unit lookup and senatorial districts
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <PollingUnitLocator
          pollingCounts={pollingCounts}
          lgas={lgas}
          politics={politics}
        />
        <ElectionDistrictPicker
          politics={politics}
          onShowPresidential={openPresidential}
          onShowGovernor={openGovernor}
          onShowSpeculation={
            speculation
              ? () => {
                  setViewPresidential(false);
                  setViewGovernor(false);
                  setSpeculationActive(true);
                }
              : undefined
          }
        />
      </div>
    </div>
  );

  const districtPhase = (
    <ElectionDistrictDetail politics={politics} />
  );

  const presidentialPhase = (
    <PresidentialCandidatesDetail
      politics={politics}
      onBack={() => setViewPresidential(false)}
    />
  );

  const governorPhase = (
    <GovernorshipCandidatesDetail
      politics={politics}
      states={states}
      onBack={() => setViewGovernor(false)}
    />
  );

  const resultsPanel =
    resultsMapActive && presidentialResults ? (
      <ElectionResultsMapPanel
        results={presidentialResults}
        states={states}
        onBackToCurrent={showCurrent}
      />
    ) : null;

  const speculationPanel =
    speculation && speculationActive ? (
      <SpeculationPanel
        states={states}
        data={speculation}
        presidential={politics.presidential}
      />
    ) : null;

  const modeHeader =
    speculation && showSpeculationModeSwitch ? (
      <div className="shrink-0 border-b border-border-subtle bg-surface-card p-3">
        <SpeculationModeSwitch />
      </div>
    ) : speculation && speculationActive ? (
      <div className="shrink-0 border-b border-border-subtle bg-surface-card p-3">
        <button
          type="button"
          onClick={() => setSpeculationActive(false)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Back to candidates
        </button>
      </div>
    ) : null;

  const inner = speculationPanel
    ? speculationPanel
    : resultsPanel
      ? resultsPanel
      : inDistrictPhase
        ? districtPhase
        : inPresidentialPhase
          ? presidentialPhase
          : inGovernorPhase
            ? governorPhase
            : browsePhase;

  const resultsYear = presidentialResults?.election.year;
  const sheetTitle = speculationPanel
    ? "Presidential speculation"
    : resultsMapActive && resultsYear
      ? `${resultsYear} presidential results`
      : inDistrictPhase
        ? district?.name ?? "District"
        : inPresidentialPhase
          ? "Presidential candidates"
          : inGovernorPhase
            ? "Governorship candidates"
            : "2027 Elections";
  const sheetSubtitle = speculationPanel
    ? speculationPhase === "result"
      ? "National scenario · Projected from the 2023 register"
      : "Six tickets · State-by-state projection"
    : resultsMapActive && resultsYear && presidentialResults
      ? `State-by-state · ${presidentialResults.election.declaredBy}`
      : inDistrictPhase
        ? `${district?.state} · Candidates`
        : inPresidentialPhase
          ? `${politics.presidential.candidates.length} tickets · ${politics.presidential.election.election_date ?? "2027"}`
          : inGovernorPhase
            ? "State governorship tickets · INEC final list"
            : selectedStateIds.size > 0
              ? `${selectedStateIds.size} state(s) on map`
              : "Find polling unit & districts";

  if (isMobile) {
    if (mobileSheet === "hidden") {
      return (
        <button
          type="button"
          onClick={() => openMobileSheet()}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 lg:hidden rounded-full bg-ng-green px-4 py-2 text-sm font-semibold text-white shadow-lg flex items-center gap-2"
        >
          {speculationActive
            ? "Presidential speculation"
            : inDistrictPhase
              ? district?.name ?? "Election"
              : inPresidentialPhase
                ? "Presidential candidates"
                : inGovernorPhase
                  ? "Governorship candidates"
                  : "2027 Elections"}
        </button>
      );
    }

    return (
      <MobileBottomSheet
        title={sheetTitle}
        subtitle={sheetSubtitle}
        hasContent
      >
        <div className="flex flex-col max-h-[75vh] min-h-[40vh]">
          {modeHeader}
          <div className="flex-1 min-h-0">{inner}</div>
        </div>
      </MobileBottomSheet>
    );
  }

  return (
    <aside
      data-capture-root="panel"
      className="w-full lg:w-[var(--panel-w,400px)] xl:w-[var(--panel-wx,420px)] shrink-0 min-h-0 max-h-full border-l border-border-subtle/80 bg-surface-card flex flex-col h-full hidden lg:flex"
    >
      {modeHeader}
      <div className="flex-1 min-h-0">{inner}</div>
    </aside>
  );
}
