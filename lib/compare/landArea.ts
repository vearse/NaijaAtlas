import type { CompareBundle } from "@/types/compare";
import { formatAreaKm2 } from "@/lib/map/metrics";

export function getStateLandAreaKm2(
  bundle: CompareBundle | undefined,
  stateId: string
): number | null {
  if (!bundle) return null;
  const row = bundle.stateData.general?.default?.[stateId];
  const v = row?.landAreaKm2;
  return typeof v === "number" ? v : null;
}

export function formatStateLandArea(
  bundle: CompareBundle | undefined,
  stateId: string,
  fallbackKm2?: number
): string {
  const fromData = getStateLandAreaKm2(bundle, stateId);
  if (fromData != null) return formatAreaKm2(fromData);
  if (fallbackKm2 != null) return formatAreaKm2(fallbackKm2);
  return "—";
}

export function totalLandAreaKm2(
  bundle: CompareBundle | undefined,
  stateIds: string[]
): number | null {
  if (!bundle) return null;
  let total = 0;
  let any = false;
  for (const id of stateIds) {
    const a = getStateLandAreaKm2(bundle, id);
    if (a != null) {
      total += a;
      any = true;
    }
  }
  return any ? total : null;
}
