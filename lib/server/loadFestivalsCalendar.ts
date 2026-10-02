import fs from "fs";
import path from "path";
import { monthIndex, type Festival, type FestivalTone } from "@/lib/festivals";
import type { StateNotesMap, WikiNote } from "@/types/location";

export type { Festival, FestivalTone } from "@/lib/festivals";

export type FestivalsCalendarData = {
  events: Festival[];
  /** Events running in the current month, or the next ones when the month is quiet. */
  featured: Festival[];
  /** True when `featured` genuinely run this month rather than being upcoming. */
  isCurrentMonth: boolean;
  monthLabel: string;
  total: number;
};

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readFestivals(root = process.cwd()): Festival[] {
  const file = path.join(root, "data/festivals.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as Festival[];
}

const MONTH_ABBR: Record<string, string> = {
  jan: "january",
  feb: "february",
  mar: "march",
  apr: "april",
  may: "may",
  jun: "june",
  jul: "july",
  aug: "august",
  sep: "september",
  oct: "october",
  nov: "november",
  dec: "december",
};

const TONE_BY_TYPE: { match: string; tone: FestivalTone }[] = [
  { match: "masquerade", tone: "amber" },
  { match: "festival", tone: "primary" },
  { match: "carnival", tone: "amber" },
];

/** Human-readable badge for the note sub-type, e.g. `masquerade` → `Masquerade`. */
function titleCase(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed;
}

/**
 * Turn a `state-notes` festival note into a calendar entry. These carry the month
 * window and frequency but no fixed day, so the day fields fall back to the 1st
 * and `dateLabel` keeps the chip honest.
 */
function festivalFromNote(
  stateId: string,
  stateName: string,
  note: WikiNote,
  index: number
): Festival | null {
  const months = note.period?.months?.filter(Boolean) ?? [];
  const first = months[0];
  if (!first) return null;
  const window = MONTH_ABBR[first.slice(0, 3).toLowerCase()];
  if (!window || monthIndex(window) < 0) return null;

  const variant = note.type ?? "festival";
  const tone =
    TONE_BY_TYPE.find((t) => variant.includes(t.match))?.tone ??
    (index % 2 === 0 ? "primary" : "slate");
  const locations = (note.locations ?? [])
    .map((l) => l.name)
    .filter(Boolean);
  const frequency = note.period?.frequency
    ? titleCase(note.period.frequency)
    : null;

  return {
    id: `note-${stateId}-${note.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: note.title,
    month: window.slice(0, 3),
    window,
    startDay: 1,
    endDay: 1,
    stateName,
    venue: locations.length ? locations.slice(0, 3).join(" · ") : "State-wide",
    category: titleCase(variant),
    tone,
    summary: note.note,
    dateLabel: [months.join("/"), frequency].filter(Boolean).join(" · "),
    variant,
    stateId,
    locations,
    sourceUrl: note.url,
    origin: "state-notes",
  };
}

let noteFestivals: Festival[] | null = null;

/**
 * Celebrations recorded as `state-notes` festival notes, keyed to their state.
 * The dated `data/festivals.json` catalogue is short by design; these notes carry
 * the majors the People hub was missing.
 */
export function loadStateNoteFestivals(root = process.cwd()): Festival[] {
  if (noteFestivals) return noteFestivals;
  const notes = loadJson<StateNotesMap>(
    path.join(root, "data/content/state-notes.json")
  );
  const states = loadJson<{ id: string; name: string }[]>(
    path.join(root, "data/locations/states.json")
  );
  const nameById = new Map(states.map((s) => [s.id, s.name]));

  const out: Festival[] = [];
  for (const [stateId, stateNotes] of Object.entries(notes)) {
    const stateName = nameById.get(stateId);
    if (!stateName) continue;
    stateNotes
      .filter((n) => n.category === "festival")
      .forEach((note, i) => {
        const festival = festivalFromNote(stateId, stateName, note, i);
        if (festival) out.push(festival);
      });
  }
  noteFestivals = out;
  return out;
}

/** The dated catalogue plus every state-note celebration, de-duplicated by id. */
export function loadAllFestivals(root = process.cwd()): Festival[] {
  const states = loadJson<{ id: string; name: string }[]>(
    path.join(root, "data/locations/states.json")
  );
  const idByName = new Map(
    states.map((s) => [s.name.trim().toLowerCase(), s.id] as const)
  );
  const withStateId = readFestivals(root).map((f) => ({
    ...f,
    stateId:
      f.stateId ?? idByName.get(f.stateName.trim().toLowerCase()) ?? undefined,
  }));

  const seen = new Set<string>();
  return [...withStateId, ...loadStateNoteFestivals(root)].filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}

/** Festival entries for one state, used by the Places state profile travel tab. */
export function loadStateFestivals(stateName: string, root = process.cwd()): Festival[] {
  const target = stateName.trim().toLowerCase();
  return loadAllFestivals(root)
    .filter((e) => e.stateName.trim().toLowerCase() === target)
    .sort(
      (a, b) => monthIndex(a.window) - monthIndex(b.window) || a.startDay - b.startDay
    );
}

export function loadFestivalsCalendar(now = new Date()): FestivalsCalendarData {
  const events = readFestivals();
  const currentMonth = now.toLocaleString("en-NG", { month: "long" }).toLowerCase();
  const currentIndex = monthIndex(currentMonth);

  const thisMonth = events.filter(
    (e) => e.window.toLowerCase() === currentMonth
  );

  const upcoming = [...events].sort((a, b) => {
    const monthsAway = (m: string) =>
      ((monthIndex(m) - currentIndex + 12) % 12) || 0;
    return (
      monthsAway(a.window) - monthsAway(b.window) || a.startDay - b.startDay
    );
  });

  // This month's events lead the list; the nearest upcoming ones top it up so
  // the section never renders a one-row calendar. Every row carries its own
  // month chip, so upcoming entries stay visually distinct.
  const featured = [...thisMonth];
  for (const event of upcoming) {
    if (featured.length >= 5) break;
    if (!featured.some((f) => f.id === event.id)) featured.push(event);
  }

  const nextMonth =
    featured[0] && featured[0].window.toLowerCase() !== currentMonth
      ? featured[0].window
      : null;

  return {
    events,
    featured,
    isCurrentMonth: thisMonth.length > 0,
    monthLabel:
      nextMonth ??
      now.toLocaleString("en-NG", { month: "long", year: "numeric" }),
    total: events.length,
  };
}