import ExplorerShell from "@/components/ExplorerShell";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";

export default function ExplorePage() {
  const data = loadExplorerPageData();

  return <ExplorerShell {...data} />;
}
