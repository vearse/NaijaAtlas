import type { CompareBundle } from "@/types/compare";
import type { LgaLocation } from "@/types/location";

/** Capitals whose LGA name differs from the city name in compare data. */
const CAPITAL_LGA_OVERRIDES: Record<string, string> = {
  "NG-BY": "Yenegoa",
  "NG-DE": "Oshimili South",
  "NG-ED": "Oredo",
  "NG-FC": "Abuja Municipal",
  "NG-NI": "Bosso",
};

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchCapitalLga(
  stateId: string,
  capital: string,
  lgas: LgaLocation[]
): string | null {
  const override = CAPITAL_LGA_OVERRIDES[stateId];
  if (override) {
    const hit = lgas.find(
      (l) => l.parentId === stateId && l.name === override
    );
    if (hit) return hit.id;
  }

  const stateLgas = lgas.filter((l) => l.parentId === stateId);
  const target = normalizeName(capital);

  const exact = stateLgas.find((l) => normalizeName(l.name) === target);
  if (exact) return exact.id;

  const partial = stateLgas.find((l) => {
    const n = normalizeName(l.name);
    return n.includes(target) || target.includes(n);
  });
  if (partial) return partial.id;

  const firstWord = capital.split(/[\s-]/)[0];
  if (firstWord.length >= 4) {
    const prefix = normalizeName(firstWord);
    const byPrefix = stateLgas.find((l) =>
      normalizeName(l.name).startsWith(prefix)
    );
    if (byPrefix) return byPrefix.id;
  }

  return null;
}

/** Map state id → capital LGA id (for default label on LGA view). */
export function buildCapitalLgaIdMap(
  lgas: LgaLocation[],
  compareBundle: CompareBundle
): ReadonlyMap<string, string> {
  const general = compareBundle.stateData.general?.default ?? {};
  const map = new Map<string, string>();

  for (const [stateId, row] of Object.entries(general)) {
    const capital = row.capital;
    if (typeof capital !== "string" || !capital || capital === "—") continue;
    const lgaId = matchCapitalLga(stateId, capital, lgas);
    if (lgaId) map.set(stateId, lgaId);
  }

  return map;
}

export function shouldShowLgaLabel(
  lgaId: string,
  stateId: string,
  capitalLgaByState: ReadonlyMap<string, string>,
  showAllStateIds: Set<string>,
  labeledLgaIds: Set<string>
): boolean {
  if (showAllStateIds.has(stateId)) return true;
  if (capitalLgaByState.get(stateId) === lgaId) return true;
  if (labeledLgaIds.has(lgaId)) return true;
  return false;
}
