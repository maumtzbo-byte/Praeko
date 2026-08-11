/** Shared by mexico-key-dates.ts and us-key-dates.ts — one calendar-math
 * helper and one output shape, so both regions' commercial calendars stay
 * structurally identical and the strategy agent can treat them
 * interchangeably (see key-dates.ts's dispatcher). */
export interface KeyDate {
  date: string; // ISO YYYY-MM-DD
  name: string;
  angle: string;
  approximate: boolean;
}

/** The nth (1-indexed) occurrence of `weekday` (0=domingo..6=sábado) in `month` of `year`. */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(Date.UTC(year, month - 1, day));
}

/** The last occurrence of `weekday` in `month` of `year` — e.g. US Memorial
 * Day (last Monday of May), which "nth from the start" can't express since
 * some years have a 5th occurrence and some don't. */
export function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastOfMonth = new Date(Date.UTC(year, month, 0));
  const lastWeekday = lastOfMonth.getUTCDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  lastOfMonth.setUTCDate(lastOfMonth.getUTCDate() - offset);
  return lastOfMonth;
}
