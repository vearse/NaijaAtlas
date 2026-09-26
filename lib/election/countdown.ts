/**
 * Countdown formatting for the election date.
 *
 * The card must re-render as time passes, so callers pass `now` explicitly
 * (defaults to the current time) and re-run on an interval.
 */

export interface Countdown {
  /** Whole days remaining; negative once the date has passed. */
  days: number;
  /** e.g. "3 months", "6 weeks", "4 days" — null when under a day remains. */
  relative: string | null;
  /** True once the election date has arrived. */
  past: boolean;
}

const MS_PER_DAY = 86_400_000;

function parseElectionDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : new Date(ms);
}

/** Days remaining until `isoDate`; negative after it has passed. */
export function daysUntil(isoDate: string | undefined, now = Date.now()): number | null {
  const target = parseElectionDate(isoDate);
  if (!target) return null;
  return Math.ceil((target.getTime() - now) / MS_PER_DAY);
}

/**
 * Human phrasing for the remaining time. Uses whole months up to ~90 days,
 * then weeks, then days, so "4 months" never renders as "0 months".
 */
export function countdownTo(
  isoDate: string | undefined,
  now = Date.now()
): Countdown | null {
  const days = daysUntil(isoDate, now);
  if (days == null) return null;
  if (days <= 0) return { days, relative: null, past: true };

  let relative: string;
  if (days >= 28) {
    const months = Math.round(days / 30.44);
    relative = `${months} ${months === 1 ? "month" : "months"}`;
  } else if (days >= 7) {
    const weeks = Math.floor(days / 7);
    relative = `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  } else {
    relative = `${days} ${days === 1 ? "day" : "days"}`;
  }
  return { days, relative, past: false };
}

/** "16 Jan 2027" — stable, locale-independent, for the card subtitle. */
export function formatElectionDate(isoDate: string | undefined): string {
  const target = parseElectionDate(isoDate);
  if (!target) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${target.getUTCDate()} ${months[target.getUTCMonth()]} ${target.getUTCFullYear()}`;
}
