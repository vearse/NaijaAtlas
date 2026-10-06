import type { SecurityBranch } from "@/types/overlay";
import type { HubFormation } from "@/lib/server/loadSecurityData";

export type SecurityBranchMeta = {
  id: SecurityBranch;
  label: string;
  icon: string;
  tagline: string;
  wash: string;
};

/** Branch chips for the security lookup, mirroring the metro vibe browser. */
export const SECURITY_BRANCHES_META: SecurityBranchMeta[] = [
  {
    id: "army",
    label: "Army",
    icon: "🪖",
    tagline: "Divisional HQs, Army HQ and the Guards Brigade.",
    wash: "from-lime-50",
  },
  {
    id: "navy",
    label: "Navy",
    icon: "⚓",
    tagline: "Naval Commands covering the coastline.",
    wash: "from-blue-50",
  },
  {
    id: "airforce",
    label: "Air Force",
    icon: "✈",
    tagline: "Air Force HQ, commands and air bases.",
    wash: "from-sky-50",
  },
];

export const SECURITY_BRANCH_META_BY_ID = Object.fromEntries(
  SECURITY_BRANCHES_META.map((b) => [b.id, b])
) as Record<SecurityBranch, SecurityBranchMeta>;

/** One-line coverage label, e.g. `12 states` or `national`. */
export function formationCoverage(f: HubFormation): string {
  if (f.states.length === 37 || f.states.length === 0) return "National";
  return `${f.states.length} state${f.states.length === 1 ? "" : "s"}`;
}

export function formationTypeLabel(f: HubFormation): string {
  return f.type || f.category.replace(/-/g, " ");
}