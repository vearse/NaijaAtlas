import type { PollingUnitShardEntry } from "@/types/politics";

let delimitationCache: Record<
  string,
  { stateId: string; puId: string }
> | null = null;

export async function fetchDelimitationIndex(): Promise<
  Record<string, { stateId: string; puId: string }>
> {
  if (delimitationCache) return delimitationCache;
  const res = await fetch("/data/polling-units/delimitation-index.json");
  if (!res.ok) throw new Error("Delimitation index unavailable");
  delimitationCache = (await res.json()) as Record<
    string,
    { stateId: string; puId: string }
  >;
  return delimitationCache;
}

const stateShardCache = new Map<string, PollingUnitShardEntry[]>();

export async function fetchPollingUnitsForState(
  stateId: string
): Promise<PollingUnitShardEntry[]> {
  const cached = stateShardCache.get(stateId);
  if (cached) return cached;
  const res = await fetch(`/data/polling-units/by-state/${stateId}.json`);
  if (!res.ok) throw new Error(`Polling units for ${stateId} unavailable`);
  const data = (await res.json()) as PollingUnitShardEntry[];
  stateShardCache.set(stateId, data);
  return data;
}

export async function resolvePollingUnitByDelimitation(
  delimitation: string
): Promise<{ stateId: string; unit: PollingUnitShardEntry } | null> {
  const index = await fetchDelimitationIndex();
  const hit = index[delimitation];
  if (!hit) return null;
  const units = await fetchPollingUnitsForState(hit.stateId);
  const unit = units.find((u) => u.id === hit.puId);
  if (!unit) return null;
  return { stateId: hit.stateId, unit };
}
