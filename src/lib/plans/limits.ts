/**
 * Mirrors the `plans` table (supabase/migrations/0001_init.sql). Kept as a
 * typed constant so the frontend can render plan cards and the backend can
 * validate limits without a round trip for data that never changes at
 * runtime — the database row stays the source of truth for billing.
 */
export type PlanKey = "basico" | "pro" | "max";

export interface PlanLimits {
  key: PlanKey;
  displayName: string;
  priceUsdCents: number;
  imagesPerMonth: number;
  videosPerMonth: number;
  /** Average seconds per video the month's videos must respect. */
  videoAvgSeconds: number;
  /** Hard per-video ceiling — never exceed this even for a single piece. */
  videoMaxSeconds: number;
  videoProvider: "kling-3.0-pro" | "seedance-2.0-standard-720p";
  burnsSubtitles: boolean;
  socialNetworkLimit: number;
  hasOptimizedSchedule: boolean;
  hasAnalyticsDashboard: boolean;
  hasPriorityQueue: boolean;
  hasWatermarkFreeDownloads: boolean;
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  basico: {
    key: "basico",
    displayName: "Básico",
    priceUsdCents: 9900,
    imagesPerMonth: 22,
    videosPerMonth: 8,
    videoAvgSeconds: 10,
    videoMaxSeconds: 10,
    videoProvider: "kling-3.0-pro",
    burnsSubtitles: false,
    socialNetworkLimit: 1,
    hasOptimizedSchedule: false,
    hasAnalyticsDashboard: false,
    hasPriorityQueue: false,
    hasWatermarkFreeDownloads: false,
  },
  pro: {
    key: "pro",
    displayName: "Pro",
    priceUsdCents: 19900,
    imagesPerMonth: 15,
    videosPerMonth: 15,
    videoAvgSeconds: 15,
    videoMaxSeconds: 25,
    videoProvider: "kling-3.0-pro",
    burnsSubtitles: true,
    socialNetworkLimit: 3,
    hasOptimizedSchedule: true,
    hasAnalyticsDashboard: true,
    hasPriorityQueue: false,
    hasWatermarkFreeDownloads: false,
  },
  max: {
    key: "max",
    displayName: "Max",
    priceUsdCents: 39900,
    imagesPerMonth: 8,
    videosPerMonth: 22,
    videoAvgSeconds: 20,
    videoMaxSeconds: 30,
    videoProvider: "seedance-2.0-standard-720p",
    burnsSubtitles: true,
    socialNetworkLimit: 3,
    hasOptimizedSchedule: true,
    hasAnalyticsDashboard: true,
    hasPriorityQueue: true,
    hasWatermarkFreeDownloads: true,
  },
};

/** Seconds-of-video budget for the month: videos_del_mes × duración_promedio. */
export function monthlySecondsBudget(plan: PlanLimits): number {
  return plan.videosPerMonth * plan.videoAvgSeconds;
}

/**
 * Whether generating a video of `requestedSeconds` fits the plan's budget,
 * given `secondsUsedSoFar` and `videosUsedSoFar` this month.
 *
 * Modeled as a single seconds-of-video pool for the month
 * (monthlySecondsBudget), not a per-video average check — a single piece may
 * run up to videoMaxSeconds as long as the accumulated pool has room, which
 * naturally forces shorter videos later in the month to compensate.
 */
export function canGenerateVideo(
  plan: PlanLimits,
  {
    requestedSeconds,
    secondsUsedSoFar,
    videosUsedSoFar,
  }: { requestedSeconds: number; secondsUsedSoFar: number; videosUsedSoFar: number },
): { allowed: boolean; reason?: string } {
  if (videosUsedSoFar >= plan.videosPerMonth) {
    return { allowed: false, reason: "monthly_video_count_exceeded" };
  }
  if (requestedSeconds > plan.videoMaxSeconds) {
    return { allowed: false, reason: "exceeds_per_video_cap" };
  }
  if (secondsUsedSoFar + requestedSeconds > monthlySecondsBudget(plan)) {
    return { allowed: false, reason: "exceeds_monthly_seconds_budget" };
  }

  return { allowed: true };
}
