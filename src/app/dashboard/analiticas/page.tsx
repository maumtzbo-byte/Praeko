import { BarChart3, Eye, Heart, MessageCircle, Share2, TrendingUp, Trophy, PieChart as PieChartIcon } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DualAreaChart } from "@/components/dashboard/dual-area-chart";
import { TopVideosList } from "@/components/dashboard/top-videos-list";
import { PlatformBreakdownDonut } from "@/components/dashboard/platform-breakdown-donut";
import { FollowerGrowthChart, type FollowerSeries } from "@/components/dashboard/follower-growth-chart";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  gatherPublishedPostInsights,
  summarizeInsights,
  buildDailyEngagementBreakdown,
  rankTopPosts,
  summarizeByPlatform,
} from "@/lib/agents/results-agent";
import { fetchAccountFollowers } from "@/lib/social/insights";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";
import { formatScheduledDate } from "@/lib/content/labels";
import { formatInsightNumber } from "@/lib/content/format-insights";

// Bounds how many posts fetch live metrics on each page load — this project
// has no background job to precompute analytics yet, so this endpoint pays
// the API cost synchronously; kept small to keep the page fast and stay
// well under any platform rate limit.
const MAX_POSTS_PER_LOAD = 30;
const ENGAGEMENT_WINDOW_DAYS = 30;
const FOLLOWER_HISTORY_DAYS = 30;

/**
 * Captures today's follower count for every connection (best-effort, one
 * bad platform call doesn't block the others) and reads back the real
 * history accumulated so far. There's no way to backfill past counts —
 * Meta/TikTok don't expose that — so this only ever grows forward from
 * whenever a business first loads this page.
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

export default async function AnaliticasPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: publishedItems }, { data: connections }] = await Promise.all([
    supabase
      .from("content_calendar")
      .select("id, topic, scheduled_date, published_platform, external_post_id, content_kind")
      .eq("business_id", business.id)
      .eq("status", "publicada")
      .not("external_post_id", "is", null)
      .order("scheduled_date", { ascending: false })
      .limit(MAX_POSTS_PER_LOAD),
    supabase
      .from("social_connections")
      .select("id, platform, external_account_id")
      .eq("business_id", business.id),
  ]);

  const publishedWithPost = (publishedItems ?? []).filter(
    (item): item is typeof item & { published_platform: SocialPlatform; external_post_id: string } =>
      item.published_platform !== null && item.external_post_id !== null,
  );

  const allConnections = connections ?? [];

  if (publishedWithPost.length === 0 && allConnections.length === 0) {
    return (
      <ComingSoonPage
        icon={BarChart3}
        title="Analíticas"
        description="Alcance, seguidores y engagement, traducidos a lenguaje de negocio."
        emptyTitle="Todavía no hay datos que mostrar"
        emptyDescription="Cuando conectes tus redes y acumules al menos una semana de resultados, aquí vas a ver tu crecimiento y tu mejor publicación del mes."
      />
    );
  }

  const connectionIdByPlatform = new Map(allConnections.map((c) => [c.platform, c.id]));
  const serviceRole = createServiceRoleClient();
  const connectionIds = allConnections.map((c) => c.id);
  const { data: tokenRows } = connectionIds.length
    ? await serviceRole.from("social_connection_tokens").select("connection_id, access_token").in("connection_id", connectionIds)
    : { data: [] };
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

  const [results, followerSeries] = await Promise.all([
    postsToFetch.length > 0 ? gatherPublishedPostInsights(postsToFetch) : Promise.resolve([]),
    captureAndFetchFollowerSeries(supabase, business.id, allConnections),
  ]);

  const summary = summarizeInsights(results);
  const engagementSeries = buildDailyEngagementBreakdown(results, ENGAGEMENT_WINDOW_DAYS);
  const topVideos = rankTopPosts(results, 3, "video");
  const platformBreakdown = summarizeByPlatform(results);
  const hasResults = results.length > 0;

  return (
    <div>
      <PageHeader title="Analíticas" description="Alcance, seguidores y engagement, traducidos a lenguaje de negocio." />

      <div className="animate-fade-in-up stagger-1 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="Impresiones" value={formatInsightNumber(summary.totalImpressions)} sublabel={`${summary.totalPosts} publicaciones`} />
        <StatCard icon={Heart} label="Me gusta" value={formatInsightNumber(summary.totalLikes)} />
        <StatCard icon={MessageCircle} label="Comentarios" value={formatInsightNumber(summary.totalComments)} />
        <StatCard icon={Share2} label="Compartidos" value={formatInsightNumber(summary.totalShares)} />
      </div>

      {allConnections.length > 0 && (
        <div className="animate-fade-in-up stagger-2 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
              <CardTitle>Crecimiento de seguidores</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <FollowerGrowthChart series={followerSeries} />
            </CardContent>
          </Card>
        </div>
      )}

      {hasResults && (
        <div className="animate-fade-in-up stagger-2 mt-4">
          <Card>
            <CardHeader className="p-4 pb-0 sm:p-6 sm:pb-0">
              <CardTitle>Me gusta y comentarios en el tiempo</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <DualAreaChart
                data={engagementSeries}
                series={[
                  { key: "likes", label: "Me gusta", color: "var(--accent)" },
                  { key: "comentarios", label: "Comentarios", color: "var(--accent-strong)" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {hasResults && (
        <div className="animate-fade-in-up stagger-3 mt-4 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
              <CardTitle>Top 3 videos más virales</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <TopVideosList posts={topVideos} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between p-4 pb-0 sm:p-6 sm:pb-0">
              <CardTitle>Mejor red social</CardTitle>
              <PieChartIcon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {platformBreakdown.length > 0 ? (
                <PlatformBreakdownDonut data={platformBreakdown} />
              ) : (
                <p className="text-sm text-zinc-500">Sin datos de engagement por red todavía.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="animate-fade-in-up stagger-4 mt-4">
        <Card>
          <CardHeader className="p-4 pb-0 sm:p-6 sm:pb-0">
            <CardTitle>Detalle por publicación</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {hasResults ? (
              <div className="flex flex-col gap-3">
                {results.map((result) => (
                  <Card key={result.itemId} className="bg-white/70">
                    <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">{result.topic}</p>
                        <p className="text-xs text-zinc-500">
                          {formatScheduledDate(result.scheduledDate)} · {SOCIAL_PLATFORM_LABELS[result.platform]}
                        </p>
                      </div>
                      {result.insights ? (
                        <div className="flex shrink-0 gap-4 text-xs text-zinc-600">
                          <span>{formatInsightNumber(result.insights.impressions)} impresiones</span>
                          <span>{formatInsightNumber(result.insights.likes)} me gusta</span>
                          <span>{formatInsightNumber(result.insights.comments)} comentarios</span>
                        </div>
                      ) : (
                        <span className="shrink-0 text-xs text-zinc-400">Sin datos por ahora</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Todavía no hay publicaciones"
                description="En cuanto publiques tu primera pieza vas a ver aquí el detalle de cada una."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
