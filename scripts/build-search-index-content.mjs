import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (rel) => path.join(root, rel);

const read = (rel) => JSON.parse(readFileSync(p(rel), "utf-8"));

const base = read("public/search-index.json");
const metro = read("data/content/metro.json");
const stateNotes = read("data/content/state-notes.json");
const states = read("data/locations/states.json");

const stateById = new Map(states.map((s) => [s.id, s]));

const merged = base.filter(
  (e) => e.level !== "metro" && e.level !== "state-note"
);

for (const m of metro) {
  const firstState = m.stateIds?.[0]
    ? stateById.get(m.stateIds[0])
    : undefined;
  merged.push({
    id: m.id,
    name: m.name,
    level: "metro",
    parentId: null,
    stateIds: m.stateIds ?? [],
    memberIds: m.memberIds ?? [],
    stateName: firstState?.name,
    regionName: firstState?.regionName,
    typeLabel: "Metro area",
    summary: m.description ?? "",
  });
}

let noteId = 0;
for (const [stateId, notes] of Object.entries(stateNotes)) {
  const st = stateById.get(stateId);
  for (const n of notes ?? []) {
    merged.push({
      id: `note-${stateId}-${noteId++}`,
      name: n.title ?? "",
      level: "state-note",
      parentId: stateId,
      stateName: st?.name,
      regionName: st?.regionName,
      category: n.category,
      typeLabel: `${n.category ?? "note"} · note`,
      summary: n.note ?? "",
    });
  }
}

writeFileSync(p("public/search-index.json"), JSON.stringify(merged));
console.log(
  `search-index: ${base.length} → ${merged.length} entries (metro ${metro.length}, state-note ${
    noteId
  })`
);