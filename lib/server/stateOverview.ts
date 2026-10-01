import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { getCategoryData } from "@/lib/compare/compareUtils";
import { resolveStateContent } from "@/lib/location/stateContent";
import type { StateLanguage, WikiNote } from "@/types/location";

/**
 * The atlas state panel's overview (StateDetails), flattened for the hubs: the
 * People preview shows a slice of it and `/places/[state]` shows all of it.
 */
export type StateOverviewData = {
  id: string;
  name: string;
  slug: string;
  region: string;
  capital: string | null;
  nickname: string | null;
  founded: string | null;
  description: string;
  languages: StateLanguage[];
  majorCities: string[];
  notes: WikiNote[];
  metros: { id: string; name: string; description: string }[];
};

const text = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

let cache: Record<string, StateOverviewData> | null = null;

export function loadStateOverviews(root = process.cwd()): Record<string, StateOverviewData> {
  if (cache) return cache;
  const explorer = loadExplorerPageData(root);
  const general = getCategoryData(explorer.compareBundle, "state", "general", "default");

  const out: Record<string, StateOverviewData> = {};
  for (const state of explorer.states) {
    const content = resolveStateContent(state, explorer.stateContent);
    const row = (general[state.id] ?? {}) as Record<string, unknown>;
    out[state.id] = {
      id: state.id,
      name: state.name,
      slug: state.slug,
      region: content.region || state.regionName,
      capital: text(row.capital) ?? content.capital,
      nickname: text(row.nickname),
      founded: text(row.yearCreated),
      description: content.description,
      languages: content.languages,
      majorCities: (text(row.majorCities) ?? "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: explorer.stateNotes[state.id] ?? [],
      metros: explorer.metroGroups
        .filter((m) => m.groupType === "metro-area" && m.stateIds.includes(state.id))
        .map((m) => ({ id: m.id, name: m.name, description: m.description })),
    };
  }
  cache = out;
  return out;
}
