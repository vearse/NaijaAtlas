import fs from "fs";
import path from "path";
import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { resolveStateByName } from "@/lib/location/resolveStateByName";
import {
  SECURITY_BRANCHES,
  SECURITY_BRANCH_LABELS,
  SECURITY_FORMATION_CATEGORIES,
  type SecurityBranch,
  type SecurityFormationCategory,
} from "@/types/overlay";

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export type HubFormation = {
  id: string;
  name: string;
  branch: SecurityBranch;
  category: SecurityFormationCategory;
  type: string;
  summary: string;
  description: string;
  status: string;
  statusDetail: string;
  phase: string;
  aorNote: string;
  approvedOn: string;
  gocAppointed: string;
  nickname: string;
  established: string;
  /** Approved but still forming toward Initial Operational Capability. */
  proposed: boolean;
  states: string[];
  stateIds: string[];
  lon: number | null;
  lat: number | null;
  highlights: string[];
  milestones: { date: string; event: string }[];
  wikiUrl: string;
};

export type SecurityBranchSummary = {
  branch: SecurityBranch;
  label: string;
  short: string;
  color: string;
  formations: HubFormation[];
};

export type SecurityData = {
  formations: HubFormation[];
  byBranch: SecurityBranchSummary[];
  establishedCount: number;
  proposedCount: number;
  stateIds: string[];
};

/**
 * Armed Forces formations for the Civic hub and the Security formations map
 * layer. Both read the same `security` catalogue, so the hub can never disagree
 * with the map about which formations exist or where they sit.
 *
 * The four divisions approved in July 2026 are included but flagged `proposed`,
 * because they are still forming toward Initial Operational Capability. The map
 * hides them until the reader reveals them.
 */
export function loadSecurityData(): SecurityData {
  const file = path.join(process.cwd(), "data/overlays/catalog/security.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as
    | Row[]
    | Record<string, Row>;
  const rows = Array.isArray(parsed) ? parsed : Object.values(parsed);

  const { states } = loadExplorerPageData(process.cwd());

  const formations: HubFormation[] = rows
    .map((r): HubFormation => {
      const st = strList(r.statesCrossed).length
        ? strList(r.statesCrossed)
        : strList(r.coversStates);
      const category = String(r.militaryCategory ?? "army-division");
      return {
        id: str(r.id),
        name: str(r.name),
        branch: SECURITY_BRANCHES.includes(r.militaryBranch as SecurityBranch)
          ? (r.militaryBranch as SecurityBranch)
          : "army",
        category: SECURITY_FORMATION_CATEGORIES.includes(
          category as SecurityFormationCategory
        )
          ? (category as SecurityFormationCategory)
          : "army-division",
        type: str(r.type),
        summary: str(r.summary),
        description: str(r.description),
        status: str(r.status),
        statusDetail: str(r.statusDetail),
        phase: str(r.phase),
        aorNote: str(r.aorNote),
        approvedOn: str(r.approvedOn),
        gocAppointed: str(r.gocAppointed),
        nickname: str(r.nickname),
        established: str(r.founded),
        proposed: category === "proposed-army-division",
        states: st,
        stateIds: st
          .map((n) => resolveStateByName(states, n)?.id)
          .filter((x): x is string => x != null),
        lon: num(r.lon),
        lat: num(r.lat),
        highlights: strList(r.highlights),
        milestones: Array.isArray(r.milestones)
          ? (r.milestones as Row[])
              .map((m) => ({ date: str(m.date), event: str(m.event) }))
              .filter((m) => m.date && m.event)
          : [],
        wikiUrl: str(r.wikiUrl),
      };
    })
    .sort(
      (a, b) =>
        Number(a.proposed) - Number(b.proposed) || a.name.localeCompare(b.name)
    );

  const byBranch = SECURITY_BRANCHES.map((branch) => {
    const meta = SECURITY_BRANCH_LABELS[branch];
    return {
      branch,
      label: meta.label,
      short: meta.short,
      color: meta.color,
      formations: formations.filter((f) => f.branch === branch),
    };
  }).filter((group) => group.formations.length > 0);

  return {
    formations,
    byBranch,
    establishedCount: formations.filter((f) => !f.proposed).length,
    proposedCount: formations.filter((f) => f.proposed).length,
    stateIds: [...new Set(formations.flatMap((f) => f.stateIds))],
  };
}