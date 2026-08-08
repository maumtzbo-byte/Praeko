import { fetchPostInsights, type PostInsights } from "@/lib/social/insights";
import type { SocialPlatform } from "@/lib/social";
import type { Database } from "@/lib/supabase/types";

type ContentKind = Database["public"]["Enums"]["content_kind"];

export interface PublishedPostForInsights {
  itemId: string;
  topic: string;
  scheduledDate: string;
  platform: SocialPlatform;
  contentKind: ContentKind;
  externalPostId: string;
  accessToken: string;
}

export interface PublishedPostInsightResult {
  itemId: string;
  topic: string;
  scheduledDate: string;
  platform: SocialPlatform;
  contentKind: ContentKind;
  insights: PostInsights | null;
}

/**
 * Agente de Resultados: fetches engagement for each already-published post
 * in parallel and fails open per-post — one platform's API hiccup shouldn't
 * blank out every other post's numbers, it should just leave that one post
 * showing "sin datos" instead of a number.
 */
export async function gatherPublishedPostInsights(
  posts: PublishedPostForInsights[],
): Promise<PublishedPostInsightResult[]> {
  return Promise.all(
    posts.map(async (post) => {
      try {
        const insights = await fetchPostInsights(post.platform, post.accessToken, post.externalPostId);
        return {
          itemId: post.itemId,
          topic: post.topic,
          scheduledDate: post.scheduledDate,
          platform: post.platform,
          contentKind: post.contentKind,
          insights,
        };
      } catch (err) {
        console.error(`fetchPostInsights failed for content_calendar ${post.itemId}`, err);
        return {
          itemId: post.itemId,
          topic: post.topic,
          scheduledDate: post.scheduledDate,
          platform: post.platform,
          contentKind: post.contentKind,
          insights: null,
        };
      }
    }),
  );
}

export interface InsightsSummary {
  totalPosts: number;
  totalImpressions: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  totalShares: number | null;
}

function sumField(results: PublishedPostInsightResult[], field: keyof PostInsights): number | null {
  const values = results.map((r) => r.insights?.[field]).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0);
}

export function summarizeInsights(results: PublishedPostInsightResult[]): InsightsSummary {
  return {
    totalPosts: results.length,
    totalImpressions: sumField(results, "impressions"),
    totalLikes: sumField(results, "likes"),
    totalComments: sumField(results, "comments"),
    totalShares: sumField(results, "shares"),
  };
}

export interface DailyInsightsPoint {
  date: string;
  alcance: number;
  interacciones: number;
}

/**
 * Aggregates real per-post insights by scheduled_date over the trailing
 * `days` window, including days with zero published posts as real zeros.
 * There's no daily-metrics table to read a time series from, so this is
 * the only honest one available: real dates and real per-post sums, not a
 * synthesized trend.
 */
export function buildDailyInsightsSeries(results: PublishedPostInsightResult[], days: number): DailyInsightsPoint[] {
  const byDate = new Map<string, { alcance: number; interacciones: number }>();
  for (const result of results) {
    if (!result.insights) continue;
    const entry = byDate.get(result.scheduledDate) ?? { alcance: 0, interacciones: 0 };
    entry.alcance += result.insights.impressions ?? 0;
    entry.interacciones += (result.insights.likes ?? 0) + (result.insights.comments ?? 0) + (result.insights.shares ?? 0);
    byDate.set(result.scheduledDate, entry);
  }

  const points: DailyInsightsPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = byDate.get(dateStr);
    points.push({ date: dateStr, alcance: entry?.alcance ?? 0, interacciones: entry?.interacciones ?? 0 });
  }
  return points;
}

export interface DailyEngagementBreakdown {
  date: string;
  likes: number;
  comentarios: number;
}

/** Same trailing-window/real-zeros shape as buildDailyInsightsSeries, but
 * split into likes vs. comments instead of one combined "interacciones" —
 * Analíticas wants the more granular breakdown, the dashboard home teaser
 * doesn't need the extra line. */
export function buildDailyEngagementBreakdown(results: PublishedPostInsightResult[], days: number): DailyEngagementBreakdown[] {
  const byDate = new Map<string, { likes: number; comentarios: number }>();
  for (const result of results) {
    if (!result.insights) continue;
    const entry = byDate.get(result.scheduledDate) ?? { likes: 0, comentarios: 0 };
    entry.likes += result.insights.likes ?? 0;
    entry.comentarios += result.insights.comments ?? 0;
    byDate.set(result.scheduledDate, entry);
  }

  const points: DailyEngagementBreakdown[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = byDate.get(dateStr);
    points.push({ date: dateStr, likes: entry?.likes ?? 0, comentarios: entry?.comentarios ?? 0 });
  }
  return points;
}

function engagementScore(insights: PostInsights | null): number | null {
  if (!insights) return null;
  const { likes, comments, shares } = insights;
  if (likes === null && comments === null && shares === null) return null;
  return (likes ?? 0) + (comments ?? 0) + (shares ?? 0);
}

export interface TopPost {
  itemId: string;
  topic: string;
  platform: SocialPlatform;
  scheduledDate: string;
  engagement: number;
  impressions: number | null;
}

/** Ranks by real engagement (likes+comments+shares), not impressions —
 * "viral" reads as audience response, not just reach. Posts with no
 * insights at all (fetch failed or platform doesn't return these fields)
 * are excluded rather than ranked as 0, since 0 would misrepresent
 * "unknown" as "nobody engaged". */
export function rankTopPosts(
  results: PublishedPostInsightResult[],
  limit: number,
  contentKind?: ContentKind,
): TopPost[] {
  return results
    .filter((r) => (contentKind ? r.contentKind === contentKind : true))
    .map((r) => ({ result: r, engagement: engagementScore(r.insights) }))
    .filter((r): r is { result: PublishedPostInsightResult; engagement: number } => r.engagement !== null)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit)
    .map(({ result, engagement }) => ({
      itemId: result.itemId,
      topic: result.topic,
      platform: result.platform,
      scheduledDate: result.scheduledDate,
      engagement,
      impressions: result.insights?.impressions ?? null,
    }));
}

export interface PlatformBreakdown {
  platform: SocialPlatform;
  engagement: number;
  percentage: number;
}

/** Same engagement metric as rankTopPosts, summed per platform — "best
 * network" means where the audience actually responds, not just where
 * more was posted. Platforms with zero measurable engagement (no
 * successful insights fetch) are left out rather than shown as 0%. */
export function summarizeByPlatform(results: PublishedPostInsightResult[]): PlatformBreakdown[] {
  const byPlatform = new Map<SocialPlatform, number>();
  for (const result of results) {
    const score = engagementScore(result.insights);
    if (score === null) continue;
    byPlatform.set(result.platform, (byPlatform.get(result.platform) ?? 0) + score);
  }

  const total = Array.from(byPlatform.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Array.from(byPlatform.entries())
    .map(([platform, engagement]) => ({
      platform,
      engagement,
      percentage: Math.round((engagement / total) * 100),
    }))
    .sort((a, b) => b.engagement - a.engagement);
}
