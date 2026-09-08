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
  PieChart as PieChartIcon,
  Users,
  Lightbulb,
  ChevronRight,
  PlugZap,
  CalendarClock,
} from "lucide-react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { FramesMark } from "@/components/brand/FramesMark";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatSparkCard } from "@/components/dashboard/stat-spark-card";
import { StatIconCard } from "@/components/dashboard/stat-icon-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { NotificationBell, type AttentionItem } from "@/components/dashboard/notification-bell";
import { AttentionPanel } from "@/components/dashboard/attention-panel";
import { UpcomingQueue, type PiezaEnCola } from "@/components/dashboard/upcoming-queue";
import { PlasticStage } from "@/components/dashboard/plastic-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  gatherPublishedPostInsights,
  summarizeInsights,
  buildDailyInsightsSeries,
  rankTopPosts,
  summarizePlatformInteractionShare,
  generateCreativeInsights,
  type PublishedPostInsightResult,
} from "@/lib/agents/results-agent";
import { formatInsightNumber } from "@/lib/content/format-insights";
import { PlatformShareDonut } from "@/components/dashboard/platform-share-donut";
import { DailyInteractionsBarChart } from "@/components/dashboard/daily-interactions-bar-chart";
import { FollowerGrowthChart, type FollowerSeries } from "@/components/dashboard/follower-growth-chart";
import { FollowerGrowthHero } from "@/components/dashboard/follower-growth-hero";
import { CreativeInsightsList } from "@/components/dashboard/creative-insights-list";
import { fetchAccountFollowers } from "@/lib/social/insights";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";
import { getUpcomingKeyDates } from "@/lib/content/key-dates";
import type { Tables } from "@/lib/supabase/types";

// A beta trial with no cron/queue to send a reminder email needs the
// dashboard itself to surface "this is ending" before it lapses silently.
const BETA_ENDING_SOON_DAYS = 3;

// A dead connection is invisible until a publish fails, and by then the
// business has already concluded the product stopped working. Meta tokens
// can't be refreshed at all (no refresh flow exists), so the only fix is
// the owner reconnecting — which they have to be told to do, ahead of time.
const CONNECTION_EXPIRING_SOON_DAYS = 7;

// How far ahead the bell mentions a commercial date. Long enough to
// actually plan and shoot a campaign around it, short enough that it isn't
// noise — the campaign builder caps at 30 days anyway.
const KEY_DATE_LOOKAHEAD_DAYS = 21;

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
  country: string | null,
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
      tono: "pendiente" as const,
      detail: `"${item.topic}" necesita tu aprobación`,
      icon: <AlertTriangle className={iconClass} strokeWidth={1.75} />,
    });
  }
  for (const item of failedItems ?? []) {
    items.push({
      id: `failed-${item.id}`,
      href: "/dashboard/publicaciones",
      label: "Generación fallida",
      tono: "roto" as const,
      detail: `"${item.topic}" no se pudo generar`,
      icon: <XCircle className={iconClass} strokeWidth={1.75} />,
    });
  }
  for (const item of interactions ?? []) {
    items.push({
      id: `interaction-${item.id}`,
      href: "/dashboard/redes-sociales",
      label: "Necesita respuesta",
      tono: "pendiente" as const,
      detail: `${item.author_name ?? "Alguien"} en ${SOCIAL_PLATFORM_LABELS[item.platform]}`,
      icon: <MessageCircle className={iconClass} strokeWidth={1.75} />,
    });
  }
  // Connections that already broke, or are about to. The status flag is set
  // by getValidAccessToken (social/tokens.ts) the moment a refresh fails or
  // an unrefreshable token lapses; expires_at catches the ones still working
  // but running out. Tokens need the service-role client — social_
  // connection_tokens has no policy for end users on purpose (migration
  // 0010) — but the connection ids are all scoped to this business first.
  const { data: connections } = await supabase
    .from("social_connections")
    .select("id, platform, status")
    .eq("business_id", businessId);

  if (connections?.length) {
    const serviceRole = createServiceRoleClient();
    const { data: tokenRows } = await serviceRole
      .from("social_connection_tokens")
      .select("connection_id, expires_at")
      .in(
        "connection_id",
        connections.map((c) => c.id),
      );
    const expiryByConnection = new Map((tokenRows ?? []).map((t) => [t.connection_id, t.expires_at]));
    const soonCutoff = Date.now() + CONNECTION_EXPIRING_SOON_DAYS * 86_400_000;

    for (const connection of connections) {
      const expiresAt = expiryByConnection.get(connection.id) ?? null;
      const expiringSoon = expiresAt !== null && new Date(expiresAt).getTime() <= soonCutoff;
      if (connection.status !== "error" && !expiringSoon) continue;

      items.push({
        id: `connection-${connection.id}`,
        href: "/dashboard/redes-sociales",
        label: connection.status === "error" ? "Conexión caída" : "Conexión por vencer",
        tono: connection.status === "error" ? ("roto" as const) : ("pendiente" as const),
        detail:
          connection.status === "error"
            ? `Vuelve a conectar ${SOCIAL_PLATFORM_LABELS[connection.platform]} para seguir publicando`
            : `${SOCIAL_PLATFORM_LABELS[connection.platform]} necesita reconectarse pronto`,
        icon: <PlugZap className={iconClass} strokeWidth={1.75} />,
      });
    }
  }

  // Agente de Tendencias, en modo proactivo: el calendario comercial ya
  // existe, pero hasta ahora esperaba a que el dueño pidiera la campaña.
  // Avisar antes es lo que separa "herramienta" de "asistente".
  const today = new Date().toISOString().slice(0, 10);
  for (const keyDate of getUpcomingKeyDates(country, today, KEY_DATE_LOOKAHEAD_DAYS)) {
    const daysAway = Math.round((new Date(`${keyDate.date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
    // Quincena hits twice a month, every month — it's a timing hint for the
    // strategy agent, not news worth a notification.
    if (keyDate.name === "Quincena") continue;
    items.push({
      id: `keydate-${keyDate.date}-${keyDate.name}`,
      href: "/dashboard/campanas",
      label: keyDate.name,
      tono: "neutro" as const,
      detail:
        daysAway === 0
          ? "Es hoy — ¿armamos la campaña?"
          : daysAway === 1
            ? "Es mañana — ¿armamos la campaña?"
            : `En ${daysAway} días — ¿armamos la campaña?`,
      icon: <CalendarClock className={iconClass} strokeWidth={1.75} />,
    });
  }

  if (subscription?.is_beta_trial && subscription.current_period_end) {
    const daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86_400_000);
    if (daysLeft >= 0 && daysLeft <= BETA_ENDING_SOON_DAYS) {
      items.push({
        id: "beta-ending",
        href: "/dashboard/plan",
        label: "Tu mes gratis termina pronto",
        tono: "pendiente" as const,
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
// Wide enough to cover the mobile hero chart's "Este año" range option —
// this is just a bound on a Supabase read (real snapshots already
// accumulated), not another Meta/TikTok API call, so widening it is free.
const FOLLOWER_HISTORY_DAYS = 370;

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

function daysAgoStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function weeklyChangePct(current: number, weekAgo: number | null): number | null {
  if (weekAgo === null || weekAgo === 0) return null;
  return Math.round(((current - weekAgo) / weekAgo) * 1000) / 10;
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

function firstNameFromEmail(email: string | undefined) {
  if (!email) return "";
  return email.split("@")[0];
}

const ACTIVITY_STATUS_STYLES: Record<Tables<"content_calendar">["status"], { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-zinc-100 text-zinc-600" },
  generada: { label: "Generada", className: "bg-blue-50 text-blue-700" },
  en_revision: { label: "En revisión", className: "bg-amber-50 text-amber-700" },
  publicada: { label: "Publicada", className: "bg-emerald-50 text-emerald-700" },
  fallida: { label: "Fallida", className: "bg-red-50 text-red-700" },
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
    { data: colaProxima },
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
    // La cola de lo que viene, para UpcomingQueue. Ascendente y desde hoy:
    // es la única consulta de esta página que mira hacia adelante — todas
    // las demás cuentan o listan lo que ya pasó. Se excluyen "publicada"
    // (ya salió) y "fallida" (esa aparece como pendiente en el panel de
    // arriba, no como algo que va a salir).
    supabase
      .from("content_calendar")
      .select("id, topic, scheduled_date, recommended_publish_time, content_kind, format, status")
      .eq("business_id", business.id)
      .in("status", ["pendiente", "generada", "en_revision"])
      .gte("scheduled_date", new Date().toISOString().slice(0, 10))
      .order("scheduled_date", { ascending: true })
      .limit(4),
  ]);

  const allConnections = connections ?? [];
  const connectionsCount = allConnections.length;
  const hasNoConnections = connectionsCount === 0;
  const hasPublishedContent = (publishedCount ?? 0) > 0;
  const hasLowPhotoCount = (photoCount ?? 0) < LOW_PHOTO_THRESHOLD;

  // Only worth the live Meta/TikTok calls when there's actually something
  // published to ask about.
  const [insightsResults, attentionItems, followerSeries] = await Promise.all([
    hasPublishedContent ? getPublishedInsightsResults(supabase, business.id) : Promise.resolve([]),
    getAttentionItems(supabase, business.id, subscription, business.country),
    captureAndFetchFollowerSeries(supabase, business.id, allConnections),
  ]);
  const insightsSummary = insightsResults.length > 0 ? summarizeInsights(insightsResults) : null;
  const chartData = buildDailyInsightsSeries(insightsResults, INSIGHTS_WINDOW_DAYS);
  const topVideos = rankTopPosts(insightsResults, 3, "video");
  const creativeInsights = generateCreativeInsights(insightsResults, topVideos[0] ?? null);

  const platformInteractionShare = summarizePlatformInteractionShare(insightsResults);

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
      href: "/dashboard/publicaciones",
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
  const hasResultStats = hasPublishedContent || allConnections.length > 0;

  // Seguidores now leads via the mobile hero chart above this grid, so the
  // grid itself starts with Likes instead of repeating it first.
  const resultStatItems = [
    {
      icon: <Heart className="h-4 w-4" strokeWidth={1.75} />,
      label: "Likes",
      value: formatInsightNumber(insightsSummary?.totalLikes ?? null),
      changePct: likesChangePct,
      showTrend: hasPublishedContent,
      tone: "violet" as const,
    },
    {
      icon: <MessageCircle className="h-4 w-4" strokeWidth={1.75} />,
      label: "Comentarios",
      value: formatInsightNumber(insightsSummary?.totalComments ?? null),
      changePct: commentsChangePct,
      showTrend: hasPublishedContent,
      tone: "emerald" as const,
    },
    {
      icon: <Eye className="h-4 w-4" strokeWidth={1.75} />,
      label: "Alcance",
      value: formatInsightNumber(insightsSummary?.totalImpressions ?? null),
      changePct: alcanceChangePct,
      showTrend: hasPublishedContent,
      tone: "amber" as const,
    },
    {
      icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
      label: "Seguidores",
      value: totalFollowersToday.toLocaleString("es-MX"),
      changePct: followersChangePct,
      showTrend: followersShowTrend,
      tone: "blue" as const,
    },
  ];

  const productionStatRows = [
    { icon: <Clapperboard className="h-4 w-4" strokeWidth={1.75} />, label: "Videos generados", value: String(videosCount ?? 0), caption: `${videosUsed} este mes` },
    { icon: <ImageIcon className="h-4 w-4" strokeWidth={1.75} />, label: "Imágenes generadas", value: String(imagesCount ?? 0), caption: `${imagesUsed} este mes` },
    { icon: <Send className="h-4 w-4" strokeWidth={1.75} />, label: "Programadas", value: String(scheduledCount ?? 0), caption: null },
    { icon: <Share2 className="h-4 w-4" strokeWidth={1.75} />, label: "Redes conectadas", value: String(connectionsCount ?? 0), caption: null },
  ];

  const emptyStatsCard = (
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
  );

  // "Contenido generado": one card, compact icon+label+value items in a
  // single row — real counts already queried above, subscription status
  // stays in PlanBanner (dashboard/layout.tsx) instead of repeating here.
  const productionStatsCard = (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0">
        <CardTitle>Contenido generado</CardTitle>
        <ChevronRight className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-3 p-4">
        {productionStatRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              {row.icon}
            </span>
            <p className="text-xs text-zinc-500">{row.label}</p>
            <p className="text-base font-semibold text-zinc-950">{row.value}</p>
            {row.caption && <p className="text-xs text-zinc-400">• {row.caption}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  // Desktop only — mobile's stat grid, "Contenido generado" card, and
  // ordering live in mobileFlow below (matches the reference layout).
  const statsSection = (
      <div className="hidden lg:flex lg:flex-col lg:gap-6">
        {hasResultStats ? (
          <div className="grid grid-cols-4 gap-4">
            <StatSparkCard
              label="Seguidores"
              value={totalFollowersToday.toLocaleString("es-MX")}
              changePct={followersChangePct}
              showTrend={followersShowTrend}
            />
            <StatSparkCard
              label="Likes"
              value={formatInsightNumber(insightsSummary?.totalLikes ?? null)}
              changePct={likesChangePct}
              showTrend={hasPublishedContent}
            />
            <StatSparkCard
              label="Comentarios"
              value={formatInsightNumber(insightsSummary?.totalComments ?? null)}
              changePct={commentsChangePct}
              showTrend={hasPublishedContent}
            />
            <StatSparkCard
              label="Alcance"
              value={formatInsightNumber(insightsSummary?.totalImpressions ?? null)}
              changePct={alcanceChangePct}
              showTrend={hasPublishedContent}
            />
          </div>
        ) : (
          emptyStatsCard
        )}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Videos generados" value={String(videosCount ?? 0)} sublabel={`${videosUsed} este mes`} />
          <StatCard label="Imágenes generadas" value={String(imagesCount ?? 0)} sublabel={`${imagesUsed} este mes`} />
          <StatCard
            label="Programadas"
            value={String(scheduledCount ?? 0)}
            sublabel={scheduledCount ? "en camino" : "sin piezas en cola"}
          />
          <StatCard
            label="Redes conectadas"
            value={String(connectionsCount ?? 0)}
            sublabel={connectionsCount ? "activas" : "sin conectar"}
          />
        </div>
      </div>
  );

  const followerGrowthCard = allConnections.length > 0 && (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle className="text-sm sm:text-base">Crecimiento de seguidores</CardTitle>
        <TrendingUp className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <FollowerGrowthChart series={followerSeries} />
      </CardContent>
    </Card>
  );

  const dailyInteractionsCard = hasPublishedContent && (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle className="text-sm sm:text-base">Interacciones por día</CardTitle>
        <BarChart3 className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <DailyInteractionsBarChart points={chartData.slice(-14)} />
      </CardContent>
    </Card>
  );

  const platformShareCard = hasPublishedContent && (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle className="text-sm sm:text-base">Distribución por red</CardTitle>
        <PieChartIcon className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <PlatformShareDonut data={platformInteractionShare} />
      </CardContent>
    </Card>
  );

  const creativeInsightsCard = hasPublishedContent && (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle className="text-sm sm:text-base">Insights de tu Agente Creativo</CardTitle>
        <Lightbulb className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <CreativeInsightsList insights={creativeInsights} />
      </CardContent>
    </Card>
  );

  // Desktop only — the mobile hero chart, donut, and stat grid live in
  // mobileFlow below (matches the reference layout exactly).
  const chartsRow = (allConnections.length > 0 || hasPublishedContent) && (
    <div className="hidden lg:grid lg:grid-cols-4 lg:gap-4">
      {followerGrowthCard}
      {dailyInteractionsCard}
      {platformShareCard}
    </div>
  );

  const insightsRow = hasPublishedContent && <div className="hidden lg:block">{creativeInsightsCard}</div>;

  const actividadReciente = (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
        <CardTitle>Actividad reciente</CardTitle>
        <span className="flex items-center">
          <Activity className="hidden h-4 w-4 text-accent lg:block" />
          <ChevronRight className="h-4 w-4 text-zinc-400 lg:hidden" />
        </span>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {recentActivity && recentActivity.length > 0 ? (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-zinc-400">
                  <th className="pb-2 pr-4 font-medium">Contenido</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentActivity.map((item) => {
                  const status = ACTIVITY_STATUS_STYLES[item.status];
                  return (
                    <tr key={item.id}>
                      <td className="max-w-[220px] truncate py-2.5 pr-4 font-medium text-zinc-900">{item.topic}</td>
                      <td className="py-2.5 pr-4 text-zinc-500">{item.content_kind === "video" ? "Video" : "Imagen"}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-zinc-500">
                        {activityDateFormatter.format(new Date(item.created_at))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              <Link href="/dashboard/publicaciones" className="flex items-center gap-2.5 py-2.5 last:pb-0 sm:gap-3 sm:py-3">
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

  // Mobile: exact reference order — hero follower chart, stat grid,
  // donut (chart+legend side by side), "Contenido generado", then the
  // shared actividadReciente table below. Desktop is untouched —
  // statsSection/chartsRow/insightsRow above keep the Orion-reference
  // layout already approved for larger screens.
  const mobileFlow = (
    <div className="flex flex-col gap-4 lg:hidden">
      {allConnections.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle>Crecimiento de seguidores</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <FollowerGrowthHero series={followerSeries} />
          </CardContent>
        </Card>
      )}

      {hasResultStats ? (
        <div className="grid grid-cols-2 gap-3">
          {resultStatItems.map((item) => (
            <StatIconCard key={item.label} {...item} />
          ))}
        </div>
      ) : (
        emptyStatsCard
      )}

      {hasPublishedContent && (
        <Card>
          <CardHeader className="flex-row items-center justify-between p-4 pb-0">
            <CardTitle>Distribución por red</CardTitle>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent className="p-4">
            <PlatformShareDonut data={platformInteractionShare} layout="side-by-side" />
          </CardContent>
        </Card>
      )}

      {productionStatsCard}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
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

      {/* Las dos preguntas con las que el dueño abre Frames, arriba de
          todo y en las dos pantallas: "¿tengo que hacer algo?" y "¿qué va
          a salir?". Antes la primera vivía solo dentro de la campana y la
          segunda no se contestaba en ningún lado — el inicio abría con
          cuatro métricas de resultados que hoy, sin acceso a las de Meta,
          salen todas en guion. Las analíticas siguen abajo, que es donde
          las busca quien de verdad las quiere.

          PlasticStage es el fondo con profundidad: un pozo de luz arriba y
          un piso apenas más oscuro abajo. Sin él los paneles flotan sobre
          un gris plano y el relieve del plástico no se lee. */}
      <PlasticStage className="animate-fade-in-up stagger-1">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AttentionPanel items={attentionItems} />
          <UpcomingQueue piezas={(colaProxima ?? []) as PiezaEnCola[]} />
        </div>
      </PlasticStage>

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

      <div className="animate-fade-in-up stagger-1">{mobileFlow}</div>

      {/* Desktop: same continuous flow as before, unchanged (statsSection/
          chartsRow/insightsRow are each already gated to lg: internally). */}
      <div className="animate-fade-in-up stagger-1">{statsSection}</div>
      <div className="animate-fade-in-up stagger-2">{chartsRow}</div>
      <div className="animate-fade-in-up stagger-3">{insightsRow}</div>
      <div className="animate-fade-in-up stagger-4">{actividadReciente}</div>
    </div>
  );
}
