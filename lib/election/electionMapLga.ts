import { isElectionResultsMapActive } from "@/lib/election/electionResultsMapActive";
import type { MapSelectionState, MapTypeId } from "@/lib/store/mapStore";

/** 2027 mode: senatorial colours on LGAs when states are selected. */
export function electionSenatorialDistrictsActive(
  state: Pick<
    MapSelectionState,
    "mapType" | "electionResultsYear" | "electionResultsOffice"
  >
): boolean {
  return (
    state.mapType === "election" && !isElectionResultsMapActive(state)
  );
}

export function shouldRenderLgaLayers(
  mapType: MapTypeId,
  electionResultsYear: number | null,
  electionResultsOffice: MapSelectionState["electionResultsOffice"]
): boolean {
  if (mapType === "ranking") return false;
  if (mapType === "election") {
    return electionSenatorialDistrictsActive({
      mapType,
      electionResultsYear,
      electionResultsOffice,
    });
  }
  return true;
}
