import { type KeyDate } from "./key-date-utils";
import { getUpcomingMexicoKeyDates } from "./mexico-key-dates";
import { getUpcomingUsKeyDates } from "./us-key-dates";

export type { KeyDate };

/** Frames only has a real, verified commercial calendar for these two
 * markets (see mexico-key-dates.ts / us-key-dates.ts) — anything else
 * (país left as "Otro", or not set) falls back to Mexico's, matching the
 * product's default positioning until a business's actual country has a
 * calendar of its own. */
export function isUsBusiness(country: string | null): boolean {
  return country === "Estados Unidos";
}

/** Picks the right region's commercial calendar for the strategy agent's
 * key-dates prompt section — see buildKeyDatesSection in strategy-script-agent.ts. */
export function getUpcomingKeyDates(country: string | null, startDate: string, days: number): KeyDate[] {
  return isUsBusiness(country) ? getUpcomingUsKeyDates(startDate, days) : getUpcomingMexicoKeyDates(startDate, days);
}

/** Region label used in the prompt header ("Fechas clave de México/Estados
 * Unidos dentro de este rango..."). */
export function keyDatesRegionLabel(country: string | null): string {
  return isUsBusiness(country) ? "Estados Unidos" : "México";
}
