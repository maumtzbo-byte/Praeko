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

export interface PlatformEngagementRate {
  platform: SocialPlatform;
  engagementRatePct: number;
}

/** Real engagement rate per platform — interactions divided by
 * impressions, not a share of a company-wide total — so "91%" on one
 * platform and "64%" on another are each independently true, not forced
 * to sum to 100. A platform with no known impressions total is left out
 * rather than shown with a fabricated denominator. */
export function summarizePlatformEngagementRates(results: PublishedPostInsightResult[]): PlatformEngagementRate[] {
  const byPlatform = new Map<SocialPlatform, { impressions: number; interactions: number }>();
  for (const result of results) {
    if (!result.insights) continue;
    const { impressions, likes, comments, shares } = result.insights;
    if (!impressions) continue;
    const entry = byPlatform.get(result.platform) ?? { impressions: 0, interactions: 0 };
    entry.impressions += impressions;
    entry.interactions += (likes ?? 0) + (comments ?? 0) + (shares ?? 0);
    byPlatform.set(result.platform, entry);
  }

  return Array.from(byPlatform.entries())
    .map(([platform, { impressions, interactions }]) => ({
      platform,
      engagementRatePct: Math.round((interactions / impressions) * 1000) / 10,
    }))
    .sort((a, b) => b.engagementRatePct - a.engagementRatePct);
}

export interface CreativeInsight {
  kind: "content_kind" | "weekday" | "recommendation";
  title: string;
  description: string;
}

const WEEKDAY_LABELS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * Agente Creativo — real, small-sample-aware observations, not templated
 * copy. Every insight is only pushed when the underlying numbers actually
 * support the claim: video-vs-image needs at least 2 of each kind with
 * real engagement, the "best weekday" needs posts spread across at least
 * 3 different weekdays. An account too new for either just gets the
 * top-post recommendation, or nothing — never a plausible-sounding line
 * with no data behind it.
 */
export function generateCreativeInsights(results: PublishedPostInsightResult[], topPost: TopPost | null): CreativeInsight[] {
  const insights: CreativeInsight[] = [];

  const scored = results
    .map((r) => ({ contentKind: r.contentKind, scheduledDate: r.scheduledDate, score: engagementScore(r.insights) }))
    .filter((r): r is { contentKind: ContentKind; scheduledDate: string; score: number } => r.score !== null);

  const videoScores = scored.filter((r) => r.contentKind === "video").map((r) => r.score);
  const imageScores = scored.filter((r) => r.contentKind === "imagen").map((r) => r.score);
  if (videoScores.length >= 2 && imageScores.length >= 2) {
    const avgVideo = videoScores.reduce((a, b) => a + b, 0) / videoScores.length;
    const avgImage = imageScores.reduce((a, b) => a + b, 0) / imageScores.length;
    if (avgVideo > 0 && avgImage > 0 && avgVideo !== avgImage) {
      const videoWins = avgVideo > avgImage;
      const pct = Math.round((Math.abs(avgVideo - avgImage) / Math.min(avgVideo, avgImage)) * 100);
      insights.push({
        kind: "content_kind",
        title: videoWins
          ? `Tus videos generan ${pct}% más interacciones que tus imágenes`
          : `Tus imágenes generan ${pct}% más interacciones que tus videos`,
        description: `Promedio real: ${Math.round(avgVideo)} interacciones por video vs. ${Math.round(avgImage)} por imagen.`,
      });
    }
  }

  const byWeekday = new Map<number, number[]>();
  for (const r of scored) {
    const day = new Date(`${r.scheduledDate}T00:00:00`).getDay();
    const arr = byWeekday.get(day) ?? [];
    arr.push(r.score);
    byWeekday.set(day, arr);
  }
  if (byWeekday.size >= 3) {
    const best = Array.from(byWeekday.entries())
      .map(([day, dayScores]) => ({ day, avg: dayScores.reduce((a, b) => a + b, 0) / dayScores.length }))
      .sort((a, b) => b.avg - a.avg)[0];
    if (best.avg > 0) {
      const label = WEEKDAY_LABELS[best.day];
      insights.push({
        kind: "weekday",
        title: `Los ${label} son tu mejor día de la semana`,
        description: `Tus publicaciones en ${label} tienen, en promedio, más interacciones que el resto de tus días.`,
      });
    }
  }

  if (topPost) {
    insights.push({
      kind: "recommendation",
      title: "Recomendación",
      description: `Crea contenido similar a tu publicación más exitosa: "${topPost.topic}".`,
    });
  }

  return insights;
}
