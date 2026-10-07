import {
  enrichPollingUnitMatch,
  type FindPollingUnitResult,
} from "@/app/(marketing)/civic/actions";
import type { PollingUnitShardEntry } from "@/types/politics";
import { useMapStore } from "@/lib/store/mapStore";

const STORAGE_KEY = "naijaatlas:civic-polling-unit";

export type PollingUnitSession = {
  savedAt: string;
  result: FindPollingUnitResult;
  unit: PollingUnitShardEntry | null;
};

export function readPollingUnitSession(): PollingUnitSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PollingUnitSession;
    if (!parsed?.result?.primary?.hit?.wardId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePollingUnitSession(session: PollingUnitSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota or private mode — ignore.
  }
}

export function clearPollingUnitSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Persist civic lookup + sync election-map polling unit when we have a shard row. */
export function commitPollingUnitSession(
  result: FindPollingUnitResult,
  unit: PollingUnitShardEntry | null
): void {
  if (!result.primary) return;
  writePollingUnitSession({
    savedAt: new Date().toISOString(),
    result,
    unit,
  });
  if (unit) {
    useMapStore.getState().setConfirmedPollingUnit(unit);
  }
}

export function restorePollingUnitSessionToStore(): PollingUnitSession | null {
  const session = readPollingUnitSession();
  if (!session) return null;
  if (session.unit) {
    useMapStore.getState().setConfirmedPollingUnit(session.unit);
  }
  return session;
}

/** Persist after election-map locator confirms a shard row. */
export async function commitPollingUnitFromShard(
  unit: PollingUnitShardEntry,
  mode: string,
  query: string
): Promise<FindPollingUnitResult | null> {
  const enriched = await enrichPollingUnitMatch(unit.wardId);
  if (!enriched?.primary) return null;
  const result: FindPollingUnitResult = {
    ...enriched,
    mode,
    query,
  };
  commitPollingUnitSession(result, unit);
  return result;
}
