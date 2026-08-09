import Link from "next/link";
import {
  Clapperboard,
  ImageIcon,
  Send,
  Gem,
  BarChart3,
  Activity,
  Sparkles,
  CalendarDays,
  Share2,
  Eye,
  Heart,
  MessageCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Trophy,
  PieChart as PieChartIcon,
  Users,
  Lightbulb,
} from "lucide-react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { FramesMark } from "@/components/brand/FramesMark";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatSparkCard } from "@/components/dashboard/stat-spark-card";
import { MobileStatList } from "@/components/dashboard/mobile-stat-list";
import { DashboardMobileTabs } from "@/components/dashboard/dashboard-mobile-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { NotificationBell, type AttentionItem } from "@/components/dashboard/notification-bell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  gatherPublishedPostInsights,
  summarizeInsights,
  buildDailyInsightsSeries,
  rankTopPosts,
  summarizePlatformEngagementRates,
  generateCreativeInsights,
  type PublishedPostInsightResult,
} from "@/lib/agents/results-agent";
import { formatInsightNumber } from "@/lib/content/format-insights";
import { TopVideosList, type TopVideoWithMedia } from "@/components/dashboard/top-videos-list";
import { EngagementRateRings, type PlatformRingData } from "@/components/dashboard/engagement-rate-rings";
import { FollowerGrowthChart, type FollowerSeries } from "@/components/dashboard/follower-growth-chart";
import { CreativeInsightsList } from "@/components/dashboard/creative-insights-list";
import { UpcomingPublications, type UpcomingItem } from "@/components/dashboard/upcoming-publications";
import { fetchAccountFollowers } from "@/lib/social/insights";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";
import type { Tables } from "@/lib/supabase/types";

// A beta trial with no cron/queue to send a reminder email needs the
// dashboard itself to surface "this is ending" before it lapses silently.
const BETA_ENDING_SOON_DAYS = 3;

/**
 * No notifications table exists (and there's no cron to keep one fresh) —
 * so the bell shows things that already need attention right now, computed
 * live from tables that already exist: content stuck in review or failed,
 * interactions nobody replied to, and a beta trial about to end.
 */
async function getAttentionItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  subscription: Tables<"subscriptions"> | null,
): Promise<AttentionItem[]> {
  const [{ data: reviewItems }, { data: failedItems }, { data: interactions }] = await Promise.all([
    supabase.from("content_calendar").select("id, topic").eq("business_id", businessId).eq("status", "en_revision").limit(5),
    supabase.from("content_calendar").select("id, topic").eq("business_id", businessId).eq("status", "fallida").limit(5),
    supabase
      .from("social_interactions")
      .select("id, author_name, platform")
      .eq("business_id", businessId)
      .eq("reply_status", "necesita_revision")
      .limit(5),
  ]);

  const iconClass = "h-3.5 w-3.5";
  const items: AttentionItem[] = [];

  for (const item of reviewItems ?? []) {
    items.push({
      id: `review-${item.id}`,
      href: "/dashboard/publicaciones",
      label: "En revisión",
      detail: `"${item.topic}" necesita tu aprobación`,
      icon: <AlertTriangle className={iconClass} strokeWidth={1.75} />,
    });
  }
  for (const item of failedItems ?? []) {
    items.push({
      id: `failed-${item.id}`,
      href: "/dashboard/publicaciones",
      label: "Generación fallida",
      detail: `"${item.topic}" no se pudo generar`,
      icon: <XCircle className={iconClass} strokeWidth={1.75} />,
    });
  }
  for (const item of interactions ?? []) {
    items.push({
      id: `interaction-${item.id}`,
      href: "/dashboard/redes-sociales",
      label: "Necesita respuesta",
      detail: `${item.author_name ?? "Alguien"} en ${SOCIAL_PLATFORM_LABELS[item.platform]}`,
      icon: <MessageCircle className={iconClass} strokeWidth={1.75} />,
    });
  }
  if (subscription?.is_beta_trial && subscription.current_period_end) {
    const daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86_400_000);
    if (daysLeft >= 0 && daysLeft <= BETA_ENDING_SOON_DAYS) {
      items.push({
        id: "beta-ending",
        href: "/dashboard/plan",
        label: "Tu mes gratis termina pronto",
        detail: daysLeft === 0 ? "Termina hoy" : daysLeft === 1 ? "Termina mañana" : `Quedan ${daysLeft} días`,
        icon: <Gem className={iconClass} strokeWidth={1.75} />,
      });
    }
  }

  return items;
}

// Below this, the Agente Creativo has too little to work with — it falls
// back to generic prompts instead of grounding output in what the business
// actually looks like. Matches the reference-image cap already used in
// generateMediaForContent (publicaciones/actions.ts).
const LOW_PHOTO_THRESHOLD = 3;

// The dashboard home draws its stat tiles AND its chart from one fetch —
// no reason to pay the Meta/TikTok API cost twice. Bounded to the trailing
// 30 days (matches the chart's widest range option) with a hard cap on
// post count to stay well under any platform rate limit.
const INSIGHTS_WINDOW_DAYS = 30;
const MAX_POSTS_FOR_INSIGHTS = 40;
const FOLLOWER_HISTORY_DAYS = 30;

/** Bounded to a trailing window instead of a flat post count so the
 * results can also be aggregated into a daily chart series. */
async function getPublishedInsightsResults(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<PublishedPostInsightResult[]> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - INSIGHTS_WINDOW_DAYS);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  const { data: publishedItems } = await supabase
    .from("content_calendar")
    .select("id, topic, scheduled_date, published_platform, external_post_id, content_kind")
    .eq("business_id", businessId)
    .eq("status", "publicada")
    .not("external_post_id", "is", null)
    .gte("scheduled_date", windowStartStr)
    .order("scheduled_date", { ascending: false })
    .limit(MAX_POSTS_FOR_INSIGHTS);

  const publishedWithPost = (publishedItems ?? []).filter(
    (item): item is typeof item & { published_platform: SocialPlatform; external_post_id: string } =>
      item.published_platform !== null && item.external_post_id !== null,
  );
  if (publishedWithPost.length === 0) return [];

  const platforms = Array.from(new Set(publishedWithPost.map((item) => item.published_platform)));
  const { data: connections } = await supabase
    .from("social_connections")
    .select("id, platform")
    .eq("business_id", businessId)
    .in("platform", platforms);

  const serviceRole = createServiceRoleClient();
  const connectionIds = (connections ?? []).map((c) => c.id);
  const { data: tokenRows } = connectionIds.length
    ? await serviceRole.from("social_connection_tokens").select("connection_id, access_token").in("connection_id", connectionIds)
    : { data: [] };

  const connectionIdByPlatform = new Map((connections ?? []).map((c) => [c.platform, c.id]));
  const tokenByConnectionId = new Map((tokenRows ?? []).map((t) => [t.connection_id, t.access_token]));

  const postsToFetch = publishedWithPost
    .map((item) => {
      const connectionId = connectionIdByPlatform.get(item.published_platform);
      const accessToken = connectionId ? tokenByConnectionId.get(connectionId) : undefined;
      if (!accessToken) return null;
      return {
        itemId: item.id,
        topic: item.topic,
        scheduledDate: item.scheduled_date,
        platform: item.published_platform,
        contentKind: item.content_kind,
        externalPostId: item.external_post_id,
        accessToken,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (postsToFetch.length === 0) return [];

  return gatherPublishedPostInsights(postsToFetch);
}

/**
 * Captures today's follower count for every connection (best-effort, one
 * bad platform call doesn't block the others) and reads back the real
 * history accumulated so far. There's no way to backfill past counts —
 * Meta/TikTok don't expose that — so this only ever grows forward from
 * whenever a business first loads the dashboard.
 */
async function captureAndFetchFollowerSeries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  connections: { id: string; platform: SocialPlatform; external_account_id: string }[],
): Promise<FollowerSeries[]> {
  if (connections.length === 0) return [];

  const serviceRole = createServiceRoleClient();
  const connectionIds = connections.map((c) => c.id);
  const { data: tokenRows } = await serviceRole
    .from("social_connection_tokens")
    .select("connection_id, access_token")
    .in("connection_id", connectionIds);
  const tokenByConnectionId = new Map((tokenRows ?? []).map((t) => [t.connection_id, t.access_token]));

  const todayStr = new Date().toISOString().slice(0, 10);

  await Promise.all(
    connections.map(async (conn) => {
      const accessToken = tokenByConnectionId.get(conn.id);
      if (!accessToken) return;
      try {
        const followers = await fetchAccountFollowers(conn.platform, accessToken, conn.external_account_id);
        if (followers === null) return;
        await serviceRole.from("social_follower_snapshots").upsert(
          {
            business_id: businessId,
            connection_id: conn.id,
            platform: conn.platform,
            followers_count: followers,
            captured_date: todayStr,
          },
          { onConflict: "connection_id,captured_date" },
        );
      } catch (err) {
        console.error(`fetchAccountFollowers failed for connection ${conn.id}`, err);
      }
    }),
  );

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - FOLLOWER_HISTORY_DAYS);
  const { data: snapshots } = await supabase
    .from("social_follower_snapshots")
    .select("platform, followers_count, captured_date")
    .eq("business_id", businessId)
    .gte("captured_date", windowStart.toISOString().slice(0, 10))
    .order("captured_date", { ascending: true });

  const byPlatform = new Map<SocialPlatform, { date: string; followers: number }[]>();
  for (const row of snapshots ?? []) {
    const arr = byPlatform.get(row.platform) ?? [];
    arr.push({ date: row.captured_date, followers: row.followers_count });
    byPlatform.set(row.platform, arr);
  }

  return connections.map((conn) => {
    const points = byPlatform.get(conn.platform) ?? [];
    const currentFollowers = points.length > 0 ? points[points.length - 1].followers : 0;
    return { platform: conn.platform, currentFollowers, points };
  });
}

/** Real week-over-week follower growth for one platform — null (not 0)
 * when there's no snapshot from 7 days ago yet, since "no data" and "no
 * growth" are different claims. */
function weeklyFollowerGrowthPct(series: FollowerSeries): number | null {
  const weekAgoStr = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const weekAgoPoint = series.points.find((p) => p.date === weekAgoStr);
  if (!weekAgoPoint || weekAgoPoint.followers === 0) return null;
  return Math.round(((series.currentFollowers - weekAgoPoint.followers) / weekAgoPoint.followers) * 1000) / 10;
}

function daysAgoStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function weeklyChangePct(current: number, weekAgo: number | null): number | null {
  if (weekAgo === null || weekAgo === 0) return null;
  return Math.round(((current - weekAgo) / weekAgo) * 1000) / 10;
}

/** Total followers across every connected platform per day, forward-filled
 * between snapshots (a day without a fresh snapshot didn't necessarily
 * lose followers — carrying the last known real value forward is closer
 * to the truth than dropping to zero). Days before the very first
 * snapshot stay at 0, which the caller only renders once there are 2+
 * real snapshot dates to begin with. */
function buildFollowersDailySparkline(followerSeries: FollowerSeries[], days: number): number[] {
  const totalsByDate = new Map<string, number>();
  for (const s of followerSeries) {
    for (const p of s.points) {
      totalsByDate.set(p.date, (totalsByDate.get(p.date) ?? 0) + p.followers);
    }
  }
  const points: number[] = [];
  let lastKnown = 0;
  for (let i = days - 1; i >= 0; i--) {
    const key = daysAgoStr(i);
    lastKnown = totalsByDate.get(key) ?? lastKnown;
    points.push(lastKnown);
  }
  return points;
}

/** Real per-day sum of one insights field across every published post —
 * zero-filled honestly, since a day with no posts really did have zero
 * likes/comments/impressions that day. */
function buildDailyMetricSparkline(
  results: PublishedPostInsightResult[],
  days: number,
  pick: (insights: { likes: number | null; comments: number | null; impressions: number | null; shares: number | null }) => number | null,
): number[] {
  const byDate = new Map<string, number>();
  for (const result of results) {
    if (!result.insights) continue;
    const value = pick(result.insights);
    if (value === null) continue;
    byDate.set(result.scheduledDate, (byDate.get(result.scheduledDate) ?? 0) + value);
  }
  const points: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    points.push(byDate.get(daysAgoStr(i)) ?? 0);
  }
  return points;
}

/** Compares the sum of the trailing 7 days to the 7 days before that —
 * null when there isn't a full two-week window yet, or when the prior
 * week was entirely zero (a percentage against zero isn't a real number). */
function weekOverWeekSumChangePct(daily: number[]): number | null {
  if (daily.length < 14) return null;
  const last7 = daily.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = daily.slice(-14, -7).reduce((a, b) => a + b, 0);
  if (prev7 === 0) return null;
  return Math.round(((last7 - prev7) / prev7) * 1000) / 10;
}

/** Real generated media (fal.ai output URL) for a batch of content_calendar
 * rows — same job-status/ordering pattern getContentDetail already uses
 * (publicaciones/actions.ts), just batched across a few items at once
 * instead of fetched one at a time. Used for both the top-videos thumbnails
 * and the upcoming-publications previews. */
async function getMediaUrlsForItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemIds: string[],
): Promise<Map<string, string>> {
  if (itemIds.length === 0) return new Map();
  const { data } = await supabase
    .from("generations")
    .select("content_calendar_id, storage_path, created_at")
    .in("content_calendar_id", itemIds)
    .eq("job_status", "completed")
    .not("storage_path", "is", null)
    .order("created_at", { ascending: false });

  const media = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.content_calendar_id && row.storage_path && !media.has(row.content_calendar_id)) {
      media.set(row.content_calendar_id, row.storage_path);
    }
  }
  return media;
}

const MAX_UPCOMING_ITEMS = 4;

async function getUpcomingContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<UpcomingItem[]> {
  const { data } = await supabase
    .from("content_calendar")
    .select("id, topic, content_kind, scheduled_date, recommended_publish_time")
    .eq("business_id", businessId)
    .in("status", ["pendiente", "generada"])
    .gte("scheduled_date", daysAgoStr(0))
    .order("scheduled_date", { ascending: true })
    .limit(MAX_UPCOMING_ITEMS);

  const items = data ?? [];
  if (items.length === 0) return [];

  const media = await getMediaUrlsForItems(
    supabase,
    items.map((i) => i.id),
  );

  return items.map((item) => ({
    id: item.id,
    topic: item.topic,
    contentKind: item.content_kind,
    scheduledDate: item.scheduled_date,
    recommendedPublishTime: item.recommended_publish_time,
    mediaUrl: media.get(item.id) ?? null,
  }));
}

function firstNameFromEmail(email: string | undefined) {
  if (!email) return "";
  return email.split("@")[0];
}

const ACTIVITY_VERBS: Record<Tables<"content_calendar">["status"], string> = {
  pendiente: "Se generó un guion para",
  generada: "Se generó la pieza",
  en_revision: "Está en revisión:",
  publicada: "Se publicó",
  fallida: "Falló la generación de",
};

const activityDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const todayFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DashboardHomePage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const periodMonth = new Date();
  periodMonth.setDate(1);
  const periodMonthStr = periodMonth.toISOString().slice(0, 10);

  const [
    { data: subscription },
    { data: usage },
    { count: videosCount },
    { count: imagesCount },
    { count: scheduledCount },
    { data: recentActivity },
    { data: connections },
    { count: anyContentCount },
    { count: publishedCount },
    { count: photoCount },
  ] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("business_id", business.id).maybeSingle(),
    supabase
      .from("usage_counters")
      .select("*")
      .eq("business_id", business.id)
      .eq("period_month", periodMonthStr)
      .maybeSingle(),
    supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("content_kind", "video"),
    supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("content_kind", "imagen"),
    supabase
      .from("content_calendar")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .in("status", ["pendiente", "generada"]),
    supabase
      .from("content_calendar")
      .select("id, topic, status, content_kind, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("social_connections")
      .select("id, platform, external_account_id")
      .eq("business_id", business.id),
    supabase
      .from("content_calendar")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("content_calendar")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "publicada"),
    supabase
      .from("brand_assets")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("asset_type", "photo"),
  ]);

  const allConnections = connections ?? [];
  const connectionsCount = allConnections.length;
  const hasNoConnections = connectionsCount === 0;
  const hasPublishedContent = (publishedCount ?? 0) > 0;
  const hasLowPhotoCount = (photoCount ?? 0) < LOW_PHOTO_THRESHOLD;

  // Only worth the live Meta/TikTok calls when there's actually something
  // published to ask about.
  const [insightsResults, attentionItems, followerSeries, upcomingContent] = await Promise.all([
    hasPublishedContent ? getPublishedInsightsResults(supabase, business.id) : Promise.resolve([]),
    getAttentionItems(supabase, business.id, subscription),
    captureAndFetchFollowerSeries(supabase, business.id, allConnections),
    getUpcomingContent(supabase, business.id),
  ]);
  const insightsSummary = insightsResults.length > 0 ? summarizeInsights(insightsResults) : null;
  const chartData = buildDailyInsightsSeries(insightsResults, INSIGHTS_WINDOW_DAYS);
  const topVideos = rankTopPosts(insightsResults, 3, "video");
  const topVideoMedia = await getMediaUrlsForItems(
    supabase,
    topVideos.map((v) => v.itemId),
  );
  const topVideosWithMedia: TopVideoWithMedia[] = topVideos.map((v) => ({ ...v, mediaUrl: topVideoMedia.get(v.itemId) ?? null }));
  const creativeInsights = generateCreativeInsights(insightsResults, topVideos[0] ?? null);

  const platformEngagementRates = summarizePlatformEngagementRates(insightsResults);
  const followerGrowthByPlatform = new Map(followerSeries.map((s) => [s.platform, weeklyFollowerGrowthPct(s)]));
  const platformRings: PlatformRingData[] = platformEngagementRates.map((rate) => ({
    ...rate,
    followerGrowthPct: followerGrowthByPlatform.get(rate.platform) ?? null,
  }));

  // Top stat row: real daily sparklines + a real week-over-week % change,
  // each only shown once there's enough real history to make the
  // comparison honest (see showTrend / the null-guards in the helpers).
  const totalFollowersToday = followerSeries.reduce((sum, s) => sum + s.currentFollowers, 0);
  const followersWeekAgoStr = daysAgoStr(7);
  const followersWeekAgoValues = followerSeries.map((s) => s.points.find((p) => p.date === followersWeekAgoStr)?.followers);
  const totalFollowersWeekAgo = followersWeekAgoValues.every((v) => v !== undefined)
    ? followersWeekAgoValues.reduce<number>((sum, v) => sum + (v ?? 0), 0)
    : null;
  const followersChangePct = weeklyChangePct(totalFollowersToday, totalFollowersWeekAgo);
  const followersShowTrend = followerSeries.some((s) => new Set(s.points.map((p) => p.date)).size >= 2);
  const followersSparkline = buildFollowersDailySparkline(followerSeries, INSIGHTS_WINDOW_DAYS);

  const likesSparkline = buildDailyMetricSparkline(insightsResults, INSIGHTS_WINDOW_DAYS, (i) => i.likes);
  const commentsSparkline = buildDailyMetricSparkline(insightsResults, INSIGHTS_WINDOW_DAYS, (i) => i.comments);
  const alcanceSparkline = chartData.map((d) => d.alcance);
  const likesChangePct = weekOverWeekSumChangePct(likesSparkline);
  const commentsChangePct = weekOverWeekSumChangePct(commentsSparkline);
  const alcanceChangePct = weekOverWeekSumChangePct(alcanceSparkline);

  const onboardingSteps = [
    { label: "Elige tu plan", href: "/dashboard/plan", done: Boolean(subscription), icon: Gem },
    { label: "Conecta una red social", href: "/dashboard/redes-sociales", done: !hasNoConnections, icon: Share2 },
    {
      label: "Genera tu primer contenido",
      href: "/dashboard/generar-contenido",
      done: (anyContentCount ?? 0) > 0,
      icon: Sparkles,
    },
    { label: "Publica tu primera pieza", href: "/dashboard/publicaciones", done: hasPublishedContent, icon: Send },
  ];

  const displayName = (user?.user_metadata?.full_name as string | undefined) || firstNameFromEmail(user?.email);
  const videosUsed = usage?.videos_used ?? 0;
  const imagesUsed = usage?.images_used ?? 0;

  // Resultados first — a business owner opening the dashboard wants to
  // know "is this working", not the raw generation count, so results
  // lead the page instead of sharing a row with unrelated stats.
  const statsSection = (
    <>
      {hasPublishedContent || allConnections.length > 0 ? (
        <div>
          <MobileStatList
            rows={[
              {
                icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
                label: "Seguidores",
                value: totalFollowersToday.toLocaleString("es-MX"),
                changePct: followersChangePct,
                showTrend: followersShowTrend,
              },
              {
                icon: <Heart className="h-4 w-4" strokeWidth={1.75} />,
                label: "Likes",
                value: formatInsightNumber(insightsSummary?.totalLikes ?? null),
                changePct: likesChangePct,
                showTrend: hasPublishedContent,
              },
              {
                icon: <MessageCircle className="h-4 w-4" strokeWidth={1.75} />,
                label: "Comentarios",
                value: formatInsightNumber(insightsSummary?.totalComments ?? null),
                changePct: commentsChangePct,
                showTrend: hasPublishedContent,
              },
              {
                icon: <Eye className="h-4 w-4" strokeWidth={1.75} />,
                label: "Alcance",
                value: formatInsightNumber(insightsSummary?.totalImpressions ?? null),
                changePct: alcanceChangePct,
                showTrend: hasPublishedContent,
              },
            ]}
          />
          <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <StatSparkCard
              icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
              label="Seguidores"
              value={totalFollowersToday.toLocaleString("es-MX")}
              sparkline={followersSparkline}
              changePct={followersChangePct}
              showTrend={followersShowTrend}
            />
            <StatSparkCard
              icon={<Heart className="h-4 w-4" strokeWidth={1.75} />}
              label="Likes"
              value={formatInsightNumber(insightsSummary?.totalLikes ?? null)}
              sparkline={likesSparkline}
              changePct={likesChangePct}
              showTrend={hasPublishedContent}
            />
            <StatSparkCard
              icon={<MessageCircle className="h-4 w-4" strokeWidth={1.75} />}
              label="Comentarios"
              value={formatInsightNumber(insightsSummary?.totalComments ?? null)}
              sparkline={commentsSparkline}
              changePct={commentsChangePct}
              showTrend={hasPublishedContent}
            />
            <StatSparkCard
              icon={<Eye className="h-4 w-4" strokeWidth={1.75} />}
              label="Alcance"
              value={formatInsightNumber(insightsSummary?.totalImpressions ?? null)}
              sparkline={alcanceSparkline}
              changePct={alcanceChangePct}
              showTrend={hasPublishedContent}
            />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <EmptyState
              icon={BarChart3}
              title="Todavía no hay datos que mostrar"
              description="Conecta tus redes sociales y publica tu primera pieza para empezar a ver alcance y engagement aquí."
              action={
                <Link href="/dashboard/redes-sociales">
                  <Button size="sm">
                    <Share2 className="h-4 w-4" />
                    Conectar redes sociales
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Subscription status now lives only in PlanBanner (dashboard/layout.tsx,
          shown when it actually needs attention) — repeating it here as a
          stat tile when everything's fine was just noise. These 4 tiles are
          the same size/weight, all real counts already queried above. */}
      <div>
        <MobileStatList
          rows={[
            { icon: <Clapperboard className="h-4 w-4" strokeWidth={1.75} />, label: "Videos generados", value: `${videosCount ?? 0} · ${videosUsed} este mes` },
            { icon: <ImageIcon className="h-4 w-4" strokeWidth={1.75} />, label: "Imágenes generadas", value: `${imagesCount ?? 0} · ${imagesUsed} este mes` },
            { icon: <Send className="h-4 w-4" strokeWidth={1.75} />, label: "Programadas", value: String(scheduledCount ?? 0) },
            { icon: <Share2 className="h-4 w-4" strokeWidth={1.75} />, label: "Redes conectadas", value: String(connectionsCount ?? 0) },
          ]}
        />
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={Clapperboard}
            label="VIDEOS GENERADOS"
            value={String(videosCount ?? 0)}
            sublabel={`${videosUsed} este mes`}
          />
          <StatCard
            icon={ImageIcon}
            label="IMÁGENES GENERADAS"
            value={String(imagesCount ?? 0)}
            sublabel={`${imagesUsed} este mes`}
          />
          <StatCard
            icon={Send}
            label="PROGRAMADAS"
            value={String(scheduledCount ?? 0)}
            sublabel={scheduledCount ? "en camino" : "sin piezas en cola"}
          />
          <StatCard
            icon={Share2}
            label="REDES CONECTADAS"
            value={String(connectionsCount ?? 0)}
            sublabel={connectionsCount ? "activas" : "sin conectar"}
          />
        </div>
      </div>
    </>
  );

  // Chart/video/insight sections are heavy (recharts, video thumbnails) and
  // are the reason the mobile page needed so much scroll — on mobile each
  // lives behind its own tab (DashboardMobileTabs only mounts the active
  // tab) instead of always being on-screen. Desktop is unaffected: these
  // same elements are reused as-is in the unconditional flow below.
  const chartsRow = (allConnections.length > 0 || hasPublishedContent) && (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      {allConnections.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
            <CardTitle>Crecimiento de seguidores</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <FollowerGrowthChart series={followerSeries} />
          </CardContent>
        </Card>
      )}

      {hasPublishedContent && (
        <Card>
          <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
            <CardTitle>Rendimiento por red social</CardTitle>
            <PieChartIcon className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <EngagementRateRings data={platformRings} />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const topVideosSection = hasPublishedContent && (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle>Top 3 videos más virales</CardTitle>
        <Trophy className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <TopVideosList posts={topVideosWithMedia} />
      </CardContent>
    </Card>
  );

  const creativeInsightsCard = hasPublishedContent && (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle>Insights de tu Agente Creativo</CardTitle>
        <Lightbulb className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <CreativeInsightsList insights={creativeInsights} />
      </CardContent>
    </Card>
  );

  const upcomingPublicationsCard = (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle>Próximas publicaciones</CardTitle>
        <Link href="/dashboard/calendario" className="text-xs font-medium text-accent hover:underline">
          Ver calendario
        </Link>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <UpcomingPublications items={upcomingContent} />
      </CardContent>
    </Card>
  );

  // Desktop keeps these two side by side (unchanged); mobile regroups them
  // into different tabs below, so this pairing is desktop-only now.
  const insightsRow = (hasPublishedContent || upcomingContent.length > 0) && (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      {creativeInsightsCard}
      {upcomingPublicationsCard}
    </div>
  );

  const actividadReciente = (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle>Actividad reciente</CardTitle>
        <Activity className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {recentActivity && recentActivity.length > 0 ? (
          <div className="flex flex-col divide-y divide-zinc-100">
            {recentActivity.map((item) => {
              const Icon = item.content_kind === "video" ? Clapperboard : ImageIcon;
              return (
                <div key={item.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 sm:gap-3 sm:py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] sm:h-8 sm:w-8">
                    <Icon className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-700">
                      {ACTIVITY_VERBS[item.status]}{" "}
                      <span className="font-medium text-zinc-900">&ldquo;{item.topic}&rdquo;</span>
                    </p>
                    <p className="text-xs text-zinc-400">
                      {activityDateFormatter.format(new Date(item.created_at))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fixed, honest tips instead of a generic EmptyState block —
             same two things onboarding already asks for, just surfaced
             here too since this is the first thing a new owner sees. */
          <div className="flex flex-col divide-y divide-zinc-100">
            <div className="flex items-center gap-2.5 py-2.5 first:pt-0 sm:gap-3 sm:py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] sm:h-8 sm:w-8">
                <Activity className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" strokeWidth={1.75} />
              </span>
              <p className="text-sm text-zinc-500">
                Aún no hay actividad — aquí vas a ver cada generación, publicación y revisión.
              </p>
            </div>
            {hasNoConnections && (
              <Link href="/dashboard/redes-sociales" className="flex items-center gap-2.5 py-2.5 sm:gap-3 sm:py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] sm:h-8 sm:w-8">
                  <Share2 className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" strokeWidth={1.75} />
                </span>
                <p className="text-sm text-zinc-700">
                  Conecta tus redes sociales — así podemos publicar por ti automáticamente.
                </p>
              </Link>
            )}
            {(anyContentCount ?? 0) === 0 && (
              <Link href="/dashboard/generar-contenido" className="flex items-center gap-2.5 py-2.5 last:pb-0 sm:gap-3 sm:py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] sm:h-8 sm:w-8">
                  <Sparkles className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" strokeWidth={1.75} />
                </span>
                <p className="text-sm text-zinc-700">Genera tu primer contenido con el Agente Creativo.</p>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <div className="animate-fade-in-up flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
            <FramesMark className="h-4 w-4 text-accent" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
              Hola{displayName ? `, ${displayName}` : ""} 👋
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Este es el resumen de <span className="font-medium text-zinc-700">{business.name}</span>.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium capitalize text-zinc-500 sm:flex">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
            {todayFormatter.format(new Date())}
          </span>
          <NotificationBell items={attentionItems} />
        </div>
      </div>

      <OnboardingChecklist steps={onboardingSteps} className="animate-fade-in-up" />

      {hasLowPhotoCount && (
        <Alert variant="info" className="animate-fade-in-up">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Tu Agente Creativo tiene pocas fotos de referencia ({photoCount ?? 0} de {LOW_PHOTO_THRESHOLD}{" "}
              recomendadas) — sube más de tu negocio para que el contenido generado se vea menos genérico.
            </span>
            <Link href="/dashboard/galeria" className="shrink-0">
              <Button variant="secondary" size="sm">
                Subir fotos
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Mobile: 2 tabs — Resumen (stats + recent activity) and Analíticas
          (chart, top videos, insights, upcoming) — both live inside this
          same /dashboard page, not a separate route. Desktop below is
          unaffected, same linear flow as always. */}
      <DashboardMobileTabs
        tabs={[
          {
            key: "resumen",
            label: "Resumen",
            content: (
              <div className="flex flex-col gap-4">
                {statsSection}
                {actividadReciente}
              </div>
            ),
          },
          {
            key: "analiticas",
            label: "Analíticas",
            content: (
              <div className="flex flex-col gap-4">
                {chartsRow}
                {topVideosSection}
                {creativeInsightsCard}
                {upcomingPublicationsCard}
              </div>
            ),
          },
        ]}
      />

      <div className="hidden sm:flex sm:flex-col sm:gap-8">
        <div className="animate-fade-in-up stagger-1">{statsSection}</div>
        <div className="animate-fade-in-up stagger-3">{chartsRow}</div>
        <div className="animate-fade-in-up stagger-3">{topVideosSection}</div>
        <div className="animate-fade-in-up stagger-3">{insightsRow}</div>
        <div className="animate-fade-in-up stagger-4">{actividadReciente}</div>
      </div>
    </div>
  );
}
