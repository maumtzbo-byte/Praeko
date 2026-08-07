import { fetchPostInsights, type PostInsights } from "@/lib/social/insights";
import type { SocialPlatform } from "@/lib/social";

export interface PublishedPostForInsights {
  itemId: string;
  topic: string;
  scheduledDate: string;
  platform: SocialPlatform;
  externalPostId: string;
  accessToken: string;
}

export interface PublishedPostInsightResult {
  itemId: string;
  topic: string;
  scheduledDate: string;
  platform: SocialPlatform;
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
          insights,
        };
      } catch (err) {
        console.error(`fetchPostInsights failed for content_calendar ${post.itemId}`, err);
        return {
          itemId: post.itemId,
          topic: post.topic,
          scheduledDate: post.scheduledDate,
          platform: post.platform,
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
