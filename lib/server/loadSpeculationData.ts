import {
  availablePresidentialResultYears,
  loadAllPresidentialResults,
  loadPresidentialResults,
} from "@/lib/server/loadElectionResults";
import { loadAllRegisteredVoters } from "@/lib/server/loadRegisteredVoters";
import { loadPartyDirectory } from "@/lib/server/loadPartyDirectory";
import type { SpeculationData } from "@/types/politics";

/**
 * The speculation map uses the latest official register (2023) for vote
 * projections. Older registers and results only supply turnout defaults.
 */
export function loadSpeculationData(root = process.cwd()): SpeculationData {
  const registeredVotersByYear = loadAllRegisteredVoters(root);
  const registeredYears = Object.keys(registeredVotersByYear)
    .map(Number)
    .sort((a, b) => b - a);
  const resultYears = availablePresidentialResultYears(root);
  const latestYear =
    registeredYears.find((year) => resultYears.includes(year)) ??
    resultYears[0];
  if (latestYear == null) {
    throw new Error("Speculation needs at least one presidential result set");
  }

  return {
    latestResults: loadPresidentialResults(latestYear, root),
    resultsByYear: loadAllPresidentialResults(root),
    registeredVotersByYear,
    partyDirectory: loadPartyDirectory(root),
  };
}
