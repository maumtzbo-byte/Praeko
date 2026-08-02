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

/** TODO(verify): Meta periodically renames/retires insight metrics (e.g.
 * "impressions" is being phased out on some edges in favor of "views") —
 * confirm this metric list against the current Graph API docs for the
 * relevant object type before going live. */
async function fetchFacebookPostInsights(pageAccessToken: string, postId: string): Promise<PostInsights> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${postId}/insights`);
  url.searchParams.set("metric", "post_impressions,post_engaged_users");
  url.searchParams.set("access_token", pageAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Facebook insights fetch failed: ${res.status} ${await res.text()}`);
  const { data } = (await res.json()) as { data: { name: string; values: { value: number }[] }[] };

  const byName = new Map(data.map((d) => [d.name, d.values[0]?.value ?? null]));
  return {
    impressions: byName.get("post_impressions") ?? null,
    likes: null,
    comments: null,
    shares: null,
  };
}

async function fetchInstagramMediaInsights(pageAccessToken: string, mediaId: string): Promise<PostInsights> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/insights`);
  url.searchParams.set("metric", "impressions,reach,likes,comments,shares,saved");
  url.searchParams.set("access_token", pageAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Instagram insights fetch failed: ${res.status} ${await res.text()}`);
  const { data } = (await res.json()) as { data: { name: string; values: { value: number }[] }[] };

  const byName = new Map(data.map((d) => [d.name, d.values[0]?.value ?? null]));
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
  }
}
