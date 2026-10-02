import type { StateLocation } from "@/types/location";

/**
 * Spellings that appear in the overlay catalogues but not in the canonical
 * state list. The catalogues were written against "Nasarawa" while the
 * authoritative location data uses "Nassarawa"; without this alias the
 * catalogue entry resolves to no state and the Places link 404s.
 */
const STATE_NAME_ALIASES: Record<string, string> = {
  Nasarawa: "Nassarawa",
  "Federal Capital Territory ": "Federal Capital Territory",
  FCT: "Federal Capital Territory",
  "Federal Capital Terr": "Federal Capital Territory",
  "River State": "Rivers",
  "Ogun State": "Ogun",
};

/**
 * Resolve a catalogue state name to a real state, tolerating the alias
 * spellings. Returns undefined when there is genuinely no match, so callers can
 * show the raw name instead of inventing a link.
 */
export function resolveStateByName(
  states: StateLocation[],
  rawName: string
): StateLocation | undefined {
  const name = rawName.trim();
  if (!name) return undefined;
  const direct = states.find((s) => s.name === name);
  if (direct) return direct;
  const aliased = STATE_NAME_ALIASES[name];
  if (aliased) {
    return states.find((s) => s.name === aliased);
  }
  const lower = name.toLowerCase();
  return states.find(
    (s) =>
      s.name.toLowerCase() === lower ||
      s.slug === lower.replace(/\s+/g, "-")
  );
}
