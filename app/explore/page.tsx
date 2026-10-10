import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { loadAllPresidentialResults } from "@/lib/server/loadElectionResults";

export default function ExplorePage() {
  const data = loadExplorerPageData();
  const presidentialResultsByYear = loadAllPresidentialResults();

  return (
    <ExplorerShell
      {...data}
      presidentialResultsByYear={presidentialResultsByYear}
    />
  );
}
