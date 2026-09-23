"use client";

import { useState } from "react";
import type { PoliticsBundle, PollingUnitCountsBundle } from "@/types/politics";
import type { LgaLocation } from "@/types/location";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useMapStore } from "@/lib/store/mapStore";
import MobileBottomSheet from "@/components/location/MobileBottomSheet";
import PollingUnitLocator from "./PollingUnitLocator";
import ElectionDistrictPicker from "./ElectionDistrictPicker";
import ElectionDistrictDetail from "./ElectionDistrictDetail";
import PresidentialCandidatesDetail from "./PresidentialCandidatesDetail";

interface ElectionPanelProps {
  politics: PoliticsBundle;
  pollingCounts: PollingUnitCountsBundle;
  lgas: LgaLocation[];
}

export default function ElectionPanel({
  politics,
  pollingCounts,
  lgas,
}: ElectionPanelProps) {
  const isMobile = useIsMobile();
  const mobileSheet = useMapStore((s) => s.mobileSheet);
  const openMobileSheet = useMapStore((s) => s.openMobileSheet);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const selectedSenatorialDistrictId = useMapStore(
    (s) => s.selectedSenatorialDistrictId
  );
  const district = selectedSenatorialDistrictId
    ? politics.lookups.districtById[selectedSenatorialDistrictId]
    : null;

  const [viewPresidential, setViewPresidential] = useState(false);

  const inDistrictPhase = Boolean(selectedSenatorialDistrictId && district);
  const inPresidentialPhase = viewPresidential && !inDistrictPhase;

  if (selectedSenatorialDistrictId && viewPresidential) {
    setViewPresidential(false);
  }

  const openPresidential = () => setViewPresidential(true);

  const browsePhase = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/50 lg:block hidden shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
          2027 elections · Browse
        </p>
        <h2 className="text-lg font-bold text-slate-900">Find & explore</h2>
        <p className="text-xs text-slate-500 mt-1">
          Polling unit lookup and senatorial districts
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <PollingUnitLocator
          pollingCounts={pollingCounts}
          lgas={lgas}
          politics={politics}
          onShowPresidential={openPresidential}
        />
        <ElectionDistrictPicker
          politics={politics}
          onShowPresidential={openPresidential}
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

  const inner = inDistrictPhase
    ? districtPhase
    : inPresidentialPhase
      ? presidentialPhase
      : browsePhase;

  const sheetTitle = inDistrictPhase
    ? district?.name ?? "District"
    : inPresidentialPhase
      ? "Presidential candidates"
      : "2027 Elections";
  const sheetSubtitle = inDistrictPhase
    ? `${district?.state} · Candidates`
    : inPresidentialPhase
      ? `${politics.presidential.candidates.length} tickets · ${politics.presidential.election.election_date ?? "2027"}`
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
          {inDistrictPhase
            ? district?.name ?? "Election"
            : inPresidentialPhase
              ? "Presidential candidates"
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
        <div className="flex flex-col max-h-[75vh] min-h-[40vh]">{inner}</div>
      </MobileBottomSheet>
    );
  }

  return (
    <aside className="w-full lg:w-[400px] xl:w-[420px] shrink-0 border-l border-slate-200/80 bg-white flex flex-col min-h-0 hidden lg:flex">
      {inner}
    </aside>
  );
}
