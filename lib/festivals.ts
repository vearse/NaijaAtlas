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
  /**
   * Month-only entries (state-notes) carry no fixed day, so the chip shows the
   * recorded months and frequency instead of a day range.
   */
  dateLabel?: string;
  /** Sub-type from the source note, e.g. `masquerade`. */
  variant?: string;
  /** State id, so map links can target `/people/map?states=NG-xx`. */
  stateId?: string;
  /** Towns the celebration is held in. */
  locations?: string[];
  sourceUrl?: string | null;
  /** Which catalogue the entry came from. */
  origin?: "catalogue" | "state-notes";
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