import type { MapSelectionState } from "@/lib/store/mapStore";

export function isElectionResultsMapActive(
  state: Pick<
    MapSelectionState,
    "mapType" | "electionResultsYear" | "electionResultsOffice"
  >
): boolean {
  return (
    state.mapType === "election" &&
    state.electionResultsYear != null &&
    state.electionResultsOffice === "president"
  );
}
