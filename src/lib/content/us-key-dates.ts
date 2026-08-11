/**
 * Agente de Tendencias / Fechas Clave: a static commercial calendar for the
 * United States, mirroring mexico-key-dates.ts — used instead of it when a
 * business's país is "Estados Unidos" (see key-dates.ts's dispatcher).
 *
 * Same caveats as the Mexico calendar: variable-date entries (Black Friday,
 * Cyber Monday, and every "nth weekday" holiday below) are computed from the
 * well-known federal/commercial scheduling rule for that date, which gets
 * the right day every year — this isn't a guess, unlike Mexico's Buen
 * Fin/Hot Sale, which retailers re-announce annually. No quincena
 * equivalent here — US paydays vary by employer (weekly/biweekly/monthly),
 * there's no single cultural spending-spike pattern like Mexico's 15th/last
 * day to encode as a real, verifiable fact.
 */
import { type KeyDate, nthWeekdayOfMonth, lastWeekdayOfMonth } from "./key-date-utils";

interface FixedKeyDate {
  month: number; // 1-12
  day: number;
  name: string;
  angle: string;
}

const FIXED_KEY_DATES: FixedKeyDate[] = [
  { month: 1, day: 1, name: "New Year's Day", angle: "fresh-start offers, new year promotions, resolution-driven products/services" },
  { month: 2, day: 14, name: "Valentine's Day", angle: "gifts, couples experiences, romantic promotions" },
  { month: 7, day: 4, name: "Independence Day", angle: "patriotic branding, cookouts, summer sales, closed or special hours" },
  { month: 8, day: 15, name: "Back to School", angle: "school/office supplies, family promotions (approximate window, mid-to-late August)" },
  { month: 10, day: 31, name: "Halloween", angle: "costumes, candy, family/spooky-themed content, highly shareable" },
  { month: 11, day: 11, name: "Veterans Day", angle: "recognition of veterans, some retailers run discounts for veterans/military" },
  { month: 12, day: 25, name: "Christmas Day", angle: "closed or special hours, last-minute holiday shopping wrap-up" },
  { month: 12, day: 31, name: "New Year's Eve", angle: "year-end close, customer thank-you, year in review" },
];

/** Variable-date holidays/commercial windows, computed per year. */
function variableKeyDatesForYear(year: number): KeyDate[] {
  const mlkDay = nthWeekdayOfMonth(year, 1, 1, 3); // 3rd Monday of January
  const presidentsDay = nthWeekdayOfMonth(year, 2, 1, 3); // 3rd Monday of February
  const mothersDay = nthWeekdayOfMonth(year, 5, 0, 2); // 2nd Sunday of May
  const memorialDay = lastWeekdayOfMonth(year, 5, 1); // last Monday of May
  const fathersDay = nthWeekdayOfMonth(year, 6, 0, 3); // 3rd Sunday of June
  const laborDay = nthWeekdayOfMonth(year, 9, 1, 1); // 1st Monday of September
  const thanksgiving = nthWeekdayOfMonth(year, 11, 4, 4); // 4th Thursday of November

  const blackFriday = new Date(thanksgiving);
  blackFriday.setUTCDate(blackFriday.getUTCDate() + 1);

  const cyberMonday = new Date(thanksgiving);
  cyberMonday.setUTCDate(cyberMonday.getUTCDate() + 4);

  return [
    { date: mlkDay.toISOString().slice(0, 10), name: "Martin Luther King Jr. Day", angle: "community-focused messaging, some retailers run sales", approximate: true },
    { date: presidentsDay.toISOString().slice(0, 10), name: "Presidents' Day", angle: "long weekend, common furniture/mattress/retail sale weekend", approximate: true },
    { date: mothersDay.toISOString().slice(0, 10), name: "Mother's Day", angle: "gifts, experiences, one of the strongest retail spending days of the year", approximate: true },
    { date: memorialDay.toISOString().slice(0, 10), name: "Memorial Day", angle: "long weekend, summer-kickoff sales, cookouts", approximate: true },
    { date: fathersDay.toISOString().slice(0, 10), name: "Father's Day", angle: "gifts, experiences, promotions for dads", approximate: true },
    { date: laborDay.toISOString().slice(0, 10), name: "Labor Day", angle: "long weekend, end-of-summer sales, closed or special hours", approximate: true },
    { date: thanksgiving.toISOString().slice(0, 10), name: "Thanksgiving", angle: "closed or special hours, gratitude messaging, family gathering content", approximate: true },
    { date: blackFriday.toISOString().slice(0, 10), name: "Black Friday", angle: "the single biggest US shopping day of the year — deep discounts, doorbusters", approximate: true },
    { date: cyberMonday.toISOString().slice(0, 10), name: "Cyber Monday", angle: "online-exclusive deals, digital close to the Black Friday weekend", approximate: true },
  ];
}

/** All US key dates (fixed + variable) falling within [startDate, startDate
 * + days), inclusive of the start day. Mirrors getUpcomingMexicoKeyDates in
 * mexico-key-dates.ts — see that file for the shared span-year-boundary logic. */
export function getUpcomingUsKeyDates(startDate: string, days: number): KeyDate[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days);

  const years = new Set([start.getUTCFullYear(), end.getUTCFullYear()]);
  const candidates: KeyDate[] = [];

  for (const year of years) {
    for (const fixed of FIXED_KEY_DATES) {
      candidates.push({
        date: new Date(Date.UTC(year, fixed.month - 1, fixed.day)).toISOString().slice(0, 10),
        name: fixed.name,
        angle: fixed.angle,
        approximate: false,
      });
    }
    candidates.push(...variableKeyDatesForYear(year));
  }

  return candidates
    .filter((d) => {
      const t = new Date(`${d.date}T00:00:00Z`).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
