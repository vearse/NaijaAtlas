/**
 * Governorship candidate rosters are published state by state. INEC has
 * released the final lists for the 28 states holding a governorship election
 * alongside the 2027 general election, so the feature is live — states without
 * a bundled list fall back to `STATE_ELECTION_INEC_NOTICE`.
 */
export const STATE_ELECTION_CANDIDATES_PUBLISHED = true;

export const STATE_ELECTION_INEC_NOTICE =
  "INEC has not yet published a governorship candidate list for this state. State lists appear here as they are released.";

/**
 * States whose governorship election does not fall on the 2027 general election
 * cycle. They vote off-cycle, so no 2027 INEC governorship candidate list
 * applies to them.
 */
export const OFF_CYCLE_GOVERNORSHIP_STATE_NAMES = [
  "Anambra",
  "Bayelsa",
  "Edo",
  "Ekiti",
  "Imo",
  "Kogi",
  "Ondo",
  "Osun",
] as const;

export const OFF_CYCLE_GOVERNORSHIP_STATE_IDS = new Set([
  "NG-AN", // Anambra
  "NG-BY", // Bayelsa
  "NG-ED", // Edo
  "NG-EK", // Ekiti
  "NG-IM", // Imo
  "NG-KO", // Kogi
  "NG-ON", // Ondo
  "NG-OS", // Osun
]);

const OFF_CYCLE_GOVERNORSHIP_STATE_NAME_SET = new Set<string>(
  OFF_CYCLE_GOVERNORSHIP_STATE_NAMES
);

/** Accepts either a state id (`NG-AN`) or a state name (`Anambra`). */
export function isOffCycleGovernorshipState(
  value?: string | null
): boolean {
  if (!value) return false;
  return (
    OFF_CYCLE_GOVERNORSHIP_STATE_IDS.has(value) ||
    OFF_CYCLE_GOVERNORSHIP_STATE_NAME_SET.has(value)
  );
}

/**
 * Notice for a state with no bundled governorship roster. Off-cycle states get
 * an explicit "no 2027 election" message instead of the generic INEC wording.
 */
export function governorshipStateNotice(
  stateName: string,
  stateId?: string | null
): string {
  if (
    isOffCycleGovernorshipState(stateId) ||
    isOffCycleGovernorshipState(stateName)
  ) {
    return `${stateName} does not hold a governorship election in 2027. Governorship elections here run on a separate off-cycle schedule, so no 2027 INEC governorship candidate list applies.`;
  }
  return STATE_ELECTION_INEC_NOTICE;
}
