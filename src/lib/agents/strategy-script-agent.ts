import type { ContentFormat, ContentKind } from "@/lib/content/types";

/**
 * Output contract for the combined agente de estrategia + agente de guiones
 * (spec 1.3): one Claude call per month, brand profile + plan budget in,
 * a full day-by-day calendar out as structured JSON (tool use), so it can
 * be rendered directly and inserted into content_calendar.
 */
export interface StrategyDayPlan {
  date: string; // ISO date, e.g. "2026-08-01"
  contentKind: ContentKind;
  format: ContentFormat;
  topic: string;
  script: string;
  /** Only set when contentKind is "video"; must respect the plan's budget
   *  (see src/lib/plans/limits.ts canGenerateVideo). */
  targetDurationSeconds?: number;
  recommendedPublishTime: string; // "HH:MM", 24h
}

export interface MonthlyStrategyPlan {
  days: StrategyDayPlan[];
}

/**
 * Builds and runs the monthly strategy + script generation. Not implemented
 * yet — pending ANTHROPIC_API_KEY. When implemented, this:
 *   1. Loads the business's brand_profiles row + brand_assets library.
 *   2. Loads the plan's limits (src/lib/plans/limits.ts) to size the budget.
 *   3. Calls Claude with tool use, forcing output to MonthlyStrategyPlan.
 *   4. Validates every video day against canGenerateVideo before returning.
 */
export async function generateMonthlyStrategy(): Promise<MonthlyStrategyPlan> {
  throw new Error("Not implemented yet — pending ANTHROPIC_API_KEY.");
}
