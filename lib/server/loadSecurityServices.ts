import fs from "fs";
import path from "path";
import type { SecurityBranch } from "@/types/overlay";

export type SecurityServiceSource = { label: string; url: string };

export type SecurityServiceTraining = { name: string; note: string };

export type SecurityService = {
  id: SecurityBranch;
  name: string;
  role: string;
  established: string;
  hq: string;
  description: string;
  /** Commissioned ranks, highest first. */
  officerRanks: string[];
  /** Other ranks (NCOs and enlisted), highest first. */
  enlistedRanks: string[];
  training: SecurityServiceTraining[];
  sources: SecurityServiceSource[];
};

export type RankEquivalence = { army: string; navy: string; airforce: string };

export type SecurityServicesData = {
  /** ISO date the service-level reference was checked against its sources. */
  lastVerified: string | null;
  services: SecurityService[];
  officerEquivalence: RankEquivalence[];
  enlistedEquivalence: RankEquivalence[];
};

const EMPTY: SecurityServicesData = {
  lastVerified: null,
  services: [],
  officerEquivalence: [],
  enlistedEquivalence: [],
};

/**
 * Service-level reference for the Security lookup: the role, headquarters,
 * founding and rank ladders of the Army, Navy and Air Force, plus their
 * training institutions. Ranks are text only — no insignia are reproduced.
 *
 * Kept separate from `security.json` (the formation catalogue) so the
 * formation roster and the map layer are untouched by this reference data.
 */
export function loadSecurityServices(root = process.cwd()): SecurityServicesData {
  const file = path.join(root, "data/overlays/catalog/services.json");
  if (!fs.existsSync(file)) return EMPTY;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<SecurityServicesData>;
    return {
      lastVerified: typeof parsed.lastVerified === "string" ? parsed.lastVerified : null,
      services: Array.isArray(parsed.services) ? parsed.services : [],
      officerEquivalence: Array.isArray(parsed.officerEquivalence)
        ? parsed.officerEquivalence
        : [],
      enlistedEquivalence: Array.isArray(parsed.enlistedEquivalence)
        ? parsed.enlistedEquivalence
        : [],
    };
  } catch {
    return EMPTY;
  }
}
