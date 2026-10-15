import { festivalDayRange, monthIndex } from "@/lib/festivals";
import {
  loadFestivalsCalendar,
  type Festival,
} from "@/lib/server/loadFestivalsCalendar";

export type LandingFestivalFeature = {
  id: string;
  name: string;
  /** Card badge, stating the timing relative to today. */
  badge: string;
  /** Location and dates, e.g. `Cross River State · 27–31 December`. */
  meta: string;
  category: string;
  /** Original illustration for the event, or `null` when none is drawn yet. */
  image: string | null;
  imageAlt: string | null;
  href: string;
};

const DECEMBER = 11;

/** Original, self-drawn illustrations only — no web photography. */
const ILLUSTRATION_BY_ID: Record<string, { src: string; alt: string }> = {
  "calabar-carnival": {
    src: "/images/calabar-carnival.svg",
    alt: "Stylised illustration of the Calabar Carnival: costumed dancers in tall feathered headdresses and flowing bands parading under bunting and confetti against a warm evening sky.",
  },
  "osun-osogbo-festival": {
    src: "/images/osun-osogbo-grove.svg",
    alt: "Illustration of worshippers in ceremonial white and indigo cloth at the riverbank of the Osun-Osogbo Sacred Grove, with brass offerings and ancient rainforest canopy behind them.",
  },
};

/** The December celebration with the widest run — currently the Calabar Carnival. */
function decemberFeature(events: Festival[]): Festival | null {
  const december = events.filter((e) => monthIndex(e.window) === DECEMBER);
  if (december.length === 0) return null;
  return [...december].sort(
    (a, b) => b.endDay - b.startDay - (a.endDay - a.startDay) || b.startDay - a.startDay
  )[0];
}

/** Nearest festival that has not started yet, counting forward from the month. */
function nearestUpcoming(events: Festival[], currentIndex: number): Festival | null {
  if (currentIndex < 0) return null;
  const ranked = [...events]
    .map((e) => ({ event: e, monthsAway: (monthIndex(e.window) - currentIndex + 12) % 12 }))
    .filter(({ monthsAway }) => monthsAway > 0)
    .sort((a, b) => a.monthsAway - b.monthsAway || a.event.startDay - b.event.startDay);
  return ranked[0]?.event ?? null;
}

/**
 * Chooses the festival the landing card features. The card is pinned to the
 * December marquee celebration (the Calabar Carnival): it reads as upcoming
 * until December, becomes "this month" during December, and only once December
 * has fully passed falls back to the next festival still ahead in the data.
 *
 * The feature is data-driven — nothing about the event is hard-coded here.
 */
export function loadLandingFestivalFeature(
  now = new Date()
): LandingFestivalFeature | null {
  const events = loadFestivalsCalendar(now).events;
  if (events.length === 0) return null;

  const currentIndex = monthIndex(
    now.toLocaleString("en-NG", { month: "long" })
  );

  const december = decemberFeature(events);
  let feature: Festival;
  let badge: string;

  if (currentIndex === DECEMBER && december) {
    feature = december;
    badge = "Happening this month";
  } else if (currentIndex === 0) {
    feature = nearestUpcoming(events, currentIndex) ?? december ?? events[0];
    badge = `Coming in ${feature.window}`;
  } else if (december) {
    feature = december;
    badge = "Coming in December";
  } else {
    feature = nearestUpcoming(events, currentIndex) ?? events[0];
    badge =
      monthIndex(feature.window) === currentIndex
        ? "Happening this month"
        : `Coming in ${feature.window}`;
  }

  const art = ILLUSTRATION_BY_ID[feature.id] ?? null;

  return {
    id: feature.id,
    name: feature.name,
    badge,
    meta: `${feature.stateName} State · ${festivalDayRange(feature)} ${feature.window}`,
    category: feature.category,
    image: art?.src ?? null,
    imageAlt: art?.alt ?? null,
    href: "/travel#festivals",
  };
}
