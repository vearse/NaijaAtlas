import { loadExplorerPageData } from "@/lib/server/loadExplorerPageData";
import { getCategoryData } from "@/lib/compare/compareUtils";
import { resolveStateContent } from "@/lib/location/stateContent";
import type { StateLanguage, WikiNote } from "@/types/location";

/**
 * The atlas state panel's overview (StateDetails), flattened for the hubs: the
 * People preview shows a slice of it and `/places/[state]` shows all of it.
 */
export type StateOverviewGroup = {
  id: string;
  name: string;
  /** `metro-area` for conurbations, `cultural-group` for peoples and homelands. */
  groupType: string;
  description: string;
  /** LGAs the group covers, as catalogued. */
  memberCount: number;
  confidence: string;
};

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
  /** Every catalogued group in the state: metros *and* cultural groups. */
  groups: StateOverviewGroup[];
  /** Cultural institutions — chieftaincies, kingdoms, title holders (state-notes). */
  institutions: WikiNote[];
  /** Major celebrations recorded for the state (state-notes). */
  celebrations: WikiNote[];
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
    const notes = explorer.stateNotes[state.id] ?? [];
    const stateGroups = explorer.metroGroups.filter((g) =>
      g.stateIds.includes(state.id)
    );
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
      notes,
      metros: stateGroups
        .filter((m) => m.groupType === "metro-area")
        .map((m) => ({ id: m.id, name: m.name, description: m.description })),
      // Metro areas alone left most states empty, so the panel reads every
      // catalogued group: conurbations plus the cultural groups and homelands.
      groups: stateGroups
        .map((g) => ({
          id: g.id,
          name: g.name,
          groupType: g.groupType,
          description: g.description,
          memberCount: g.memberIds?.length ?? 0,
          confidence: g.confidence ?? "medium",
        }))
        .sort(
          (a, b) =>
            a.groupType.localeCompare(b.groupType) ||
            b.memberCount - a.memberCount ||
            a.name.localeCompare(b.name)
        ),
      institutions: notes.filter((n) => n.category === "institution"),
      celebrations: notes.filter((n) => n.category === "festival"),
    };
  }
  cache = out;
  return cache;
}