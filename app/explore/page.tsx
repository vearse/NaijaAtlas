import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { loadAllPresidentialResults } from "@/lib/server/loadElectionResults";
import { loadSpeculationData } from "@/lib/server/loadSpeculationData";

export default function ExplorePage() {
  const data = loadExplorerPageData();
  const presidentialResultsByYear = loadAllPresidentialResults();
  const speculation = loadSpeculationData();

  return (
    <ExplorerShell
      {...data}
      presidentialResultsByYear={presidentialResultsByYear}
      speculation={speculation}
    />
  );
}
