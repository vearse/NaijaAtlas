/** Shared festival shape and month ordering, safe to import from client components. */

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

export const FESTIVAL_MONTHS = [
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

export function monthIndex(window: string): number {
  return FESTIVAL_MONTHS.indexOf(window.trim().toLowerCase());
}

export function festivalDayRange(festival: Festival): string {
  return festival.endDay > festival.startDay
    ? `${festival.startDay}–${festival.endDay}`
    : String(festival.startDay);
}