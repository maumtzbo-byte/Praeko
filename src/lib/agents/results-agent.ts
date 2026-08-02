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
