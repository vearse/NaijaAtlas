import fs from "fs";
import path from "path";

export type FestivalTone = "primary" | "amber" | "slate";

export type Festival = {
  id: string;
  name: string;
  /** Short month token used on the date chip, e.g. `OCT`. */
  month: string;
  /** Long month name, used to decide whether the event is in the current month. */
  window: string;
  startDay: number;
  endDay: number;
  stateName: string;
  venue: string;
  category: string;
  tone: FestivalTone;
  summary: string;
};

export type FestivalsCalendarData = {
  events: Festival[];
  /** Events running in the current month, or the next ones when the month is quiet. */
  featured: Festival[];
  /** True when `featured` genuinely run this month rather than being upcoming. */
  isCurrentMonth: boolean;
  monthLabel: string;
  total: number;
};

const MONTH_ORDER = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function readFestivals(root = process.cwd()): Festival[] {
  const file = path.join(root, "data/festivals.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as Festival[];
}

/** Festival entries for one state, used by the Places state profile travel tab. */
export function loadStateFestivals(stateName: string, root = process.cwd()): Festival[] {
  const target = stateName.trim().toLowerCase();
  return readFestivals(root)
    .filter((e) => e.stateName.trim().toLowerCase() === target)
    .sort((a, b) => a.startDay - b.startDay);
}

export function loadFestivalsCalendar(now = new Date()): FestivalsCalendarData {
  const events = readFestivals();
  const currentMonth = now.toLocaleString("en-NG", { month: "long" }).toLowerCase();
  const currentIndex = MONTH_ORDER.indexOf(currentMonth);

  const thisMonth = events.filter(
    (e) => e.window.toLowerCase() === currentMonth
  );

  const upcoming = [...events].sort((a, b) => {
    const monthsAway = (m: string) =>
      ((MONTH_ORDER.indexOf(m.toLowerCase()) - currentIndex + 12) % 12) || 0;
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