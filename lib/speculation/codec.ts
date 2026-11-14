import { REQUIRED_PARTIES } from "./constants";
import { round1 } from "./calc";
import type { SpeculationScenario } from "./types";

interface CompactScenario {
  v: 1;
  p: string[];
  u: 0 | 1;
  /** [stateId, turnout, ...five shares] */
  s: [string, number, number, number, number, number, number][];
}

export interface DecodedScenario {
  scenario: SpeculationScenario;
  use2023ForUnset: boolean;
}

function toBase64Url(value: string): string {
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
    return atob(withPadding);
  } catch {
    return null;
  }
}

function isPartyList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === REQUIRED_PARTIES &&
    value.every((party) => typeof party === "string" && party.length > 0) &&
    new Set(value).size === REQUIRED_PARTIES
  );
}

export function encodeScenario(
  scenario: SpeculationScenario,
  use2023ForUnset: boolean
): string {
  const compact: CompactScenario = {
    v: 1,
    p: scenario.parties,
    u: use2023ForUnset ? 1 : 0,
    s: Object.values(scenario.states)
      .sort((a, b) => a.stateId.localeCompare(b.stateId))
      .map((state) => [
        state.stateId,
        round1(state.turnout),
        ...scenario.parties.map((party) => round1(state.shares[party] ?? 0)),
      ]) as CompactScenario["s"],
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeScenario(
  token: string,
  fallbackParties: string[] = []
): DecodedScenario | null {
  const json = fromBase64Url(token);
  if (!json) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const data = parsed as Partial<CompactScenario>;
  const parties = isPartyList(data.p)
    ? data.p
    : isPartyList(fallbackParties)
      ? fallbackParties
      : null;
  if (!parties) return null;
  if (!Array.isArray(data.s)) return null;

  const states: SpeculationScenario["states"] = {};
  for (const row of data.s) {
    if (!Array.isArray(row) || row.length < 2 + REQUIRED_PARTIES) continue;
    const stateId = row[0];
    if (typeof stateId !== "string" || !stateId.startsWith("NG-")) continue;
    const turnout = Number(row[1]);
    if (!Number.isFinite(turnout) || turnout < 1 || turnout > 100) continue;
    const shares: Record<string, number> = {};
    let valid = true;
    for (let i = 0; i < REQUIRED_PARTIES; i += 1) {
      const value = Number(row[i + 2]);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        valid = false;
        break;
      }
      shares[parties[i]] = round1(value);
    }
    if (!valid) continue;
    const total = Object.values(shares).reduce((sum, value) => sum + value, 0);
    if (total > 100 + 1e-6) continue;
    states[stateId] = { stateId, turnout: round1(turnout), shares };
  }

  if (Object.keys(states).length === 0 && data.s.length > 0) return null;

  return {
    scenario: { parties, states },
    use2023ForUnset: data.u !== 0,
  };
}
