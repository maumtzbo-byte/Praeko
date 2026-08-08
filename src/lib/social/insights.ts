import type { SocialPlatform } from "./types";

/**
 * Agente de Resultados: fetches engagement metrics for one already-published
 * post. Every field is nullable rather than defaulted to 0 — a metric the
 * platform didn't return means "unknown", not "zero engagement", and the UI
 * should be able to tell those apart.
 */
export interface PostInsights {
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
}

const GRAPH_VERSION = "v21.0";

const EMPTY_INSIGHTS: PostInsights = { impressions: null, likes: null, comments: null, shares: null };

/** Meta validates a post/media insights request as all-or-nothing: if even
 * one metric in the comma-separated list doesn't apply to that specific
 * object (varies by media_product_type — IMAGE/VIDEO/REELS/CAROUSEL_ALBUM
 * — and by Page type for Facebook), the WHOLE request is rejected, not just
 * the offending metric. Meta also periodically retires metrics outright
 * (confirmed: several Instagram insights metrics, "impressions" among them
 * for some media types, were deprecated in 2025) — so a hardcoded metric
 * list is inherently fragile against both problems at once, and there's no
 * single confirmable "correct" list that stays correct. queryInsights()
 * below tries the full list first and falls back to querying metrics one
 * at a time, keeping whichever ones Meta actually accepts instead of losing
 * every number for a post because one metric name was wrong or retired. */
async function queryInsights(
  url: URL,
  pageAccessToken: string,
  metrics: string[],
): Promise<Map<string, number | null>> {
  async function tryFetch(metric: string): Promise<Map<string, number | null> | null> {
    const attemptUrl = new URL(url);
    attemptUrl.searchParams.set("metric", metric);
    attemptUrl.searchParams.set("access_token", pageAccessToken);
    const res = await fetch(attemptUrl.toString());
    if (!res.ok) return null;
    const { data } = (await res.json()) as { data: { name: string; values: { value: number }[] }[] };
    return new Map(data.map((d) => [d.name, d.values[0]?.value ?? null]));
  }

  const combined = await tryFetch(metrics.join(","));
  if (combined) return combined;

  const byName = new Map<string, number | null>();
  for (const metric of metrics) {
    const single = await tryFetch(metric);
    if (single) for (const [name, value] of single) byName.set(name, value);
  }
  return byName;
}

async function fetchFacebookPostInsights(pageAccessToken: string, postId: string): Promise<PostInsights> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${postId}/insights`);
  const byName = await queryInsights(url, pageAccessToken, ["post_impressions", "post_engaged_users"]);
  return {
    impressions: byName.get("post_impressions") ?? null,
    likes: null,
    comments: null,
    shares: null,
  };
}

async function fetchInstagramMediaInsights(pageAccessToken: string, mediaId: string): Promise<PostInsights> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/insights`);
  const byName = await queryInsights(url, pageAccessToken, [
    "impressions",
    "reach",
    "likes",
    "comments",
    "shares",
    "saved",
  ]);
  return {
    impressions: byName.get("impressions") ?? byName.get("reach") ?? null,
    likes: byName.get("likes") ?? null,
    comments: byName.get("comments") ?? null,
    shares: byName.get("shares") ?? null,
  };
}

/** TikTok's publish flow returns a publish_id, not the resulting video's
 * id — this resolves one to the other via the status-fetch endpoint before
 * a metrics query is even possible. TODO(verify): confirm field names
 * against the current Content Posting / Display API docs. */
async function resolveTikTokVideoId(accessToken: string, publishId: string): Promise<string | null> {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ publish_id: publishId }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: { publicaly_available_post_id?: string[] } };
  return data.data?.publicaly_available_post_id?.[0] ?? null;
}

async function fetchTikTokVideoInsights(accessToken: string, publishId: string): Promise<PostInsights> {
  const videoId = await resolveTikTokVideoId(accessToken, publishId);
  if (!videoId) return EMPTY_INSIGHTS;

  const res = await fetch("https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ filters: { video_ids: [videoId] } }),
  });
  if (!res.ok) throw new Error(`TikTok video insights fetch failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    data?: { videos?: { like_count?: number; comment_count?: number; share_count?: number; view_count?: number }[] };
  };
  const video = data.data?.videos?.[0];
  if (!video) return EMPTY_INSIGHTS;

  return {
    impressions: video.view_count ?? null,
    likes: video.like_count ?? null,
    comments: video.comment_count ?? null,
    shares: video.share_count ?? null,
  };
}

export async function fetchPostInsights(
  platform: SocialPlatform,
  accessToken: string,
  externalPostId: string,
): Promise<PostInsights> {
  switch (platform) {
    case "facebook":
      return fetchFacebookPostInsights(accessToken, externalPostId);
    case "instagram":
      return fetchInstagramMediaInsights(accessToken, externalPostId);
    case "tiktok":
      return fetchTikTokVideoInsights(accessToken, externalPostId);
    case "google_business":
      // Reviews (fetchGoogleReviews in google-business.ts) aren't "post
      // insights" — different shape entirely. Exists so this switch stays
      // exhaustive against SocialPlatform; callers should never reach it.
      throw new Error("Google Business Profile no publica posts — usa fetchGoogleReviews.");
  }
}

async function fetchFacebookPageFollowers(pageAccessToken: string, pageId: string): Promise<number | null> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}`);
  url.searchParams.set("fields", "fan_count");
  url.searchParams.set("access_token", pageAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as { fan_count?: number };
  return data.fan_count ?? null;
}

async function fetchInstagramFollowers(pageAccessToken: string, igUserId: string): Promise<number | null> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}`);
  url.searchParams.set("fields", "followers_count");
  url.searchParams.set("access_token", pageAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as { followers_count?: number };
  return data.followers_count ?? null;
}

async function fetchTikTokFollowers(accessToken: string): Promise<number | null> {
  const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=follower_count", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: { user?: { follower_count?: number } } };
  return data.data?.user?.follower_count ?? null;
}

/**
 * Agente de Resultados — current follower count for a connected account.
 * Returns null (not 0) on any failure so a bad fetch never gets stored as
 * "lost every follower" in social_follower_snapshots; the caller should
 * skip writing a snapshot row entirely when this is null rather than
 * record a false number.
 */
export async function fetchAccountFollowers(
  platform: SocialPlatform,
  accessToken: string,
  externalAccountId: string,
): Promise<number | null> {
  switch (platform) {
    case "facebook":
      return fetchFacebookPageFollowers(accessToken, externalAccountId);
    case "instagram":
      return fetchInstagramFollowers(accessToken, externalAccountId);
    case "tiktok":
      return fetchTikTokFollowers(accessToken);
    case "google_business":
      return null;
  }
}
