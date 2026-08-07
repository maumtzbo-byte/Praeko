import { BarChart3, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { gatherPublishedPostInsights, summarizeInsights } from "@/lib/agents/results-agent";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";
import { formatScheduledDate } from "@/lib/content/labels";
import { formatInsightNumber } from "@/lib/content/format-insights";

// Bounds how many posts fetch live metrics on each page load — this project
// has no background job to precompute analytics yet, so this endpoint pays
// the API cost synchronously; kept small to keep the page fast and stay
// well under any platform rate limit.
const MAX_POSTS_PER_LOAD = 12;

export default async function AnaliticasPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: publishedItems } = await supabase
    .from("content_calendar")
    .select("id, topic, scheduled_date, published_platform, external_post_id")
    .eq("business_id", business.id)
    .eq("status", "publicada")
    .not("external_post_id", "is", null)
    .order("scheduled_date", { ascending: false })
    .limit(MAX_POSTS_PER_LOAD);

  const publishedWithPost = (publishedItems ?? []).filter(
    (item): item is typeof item & { published_platform: SocialPlatform; external_post_id: string } =>
      item.published_platform !== null && item.external_post_id !== null,
  );

  if (publishedWithPost.length === 0) {
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

  const platforms = Array.from(new Set(publishedWithPost.map((item) => item.published_platform)));
  const { data: connections } = await supabase
    .from("social_connections")
    .select("id, platform")
    .eq("business_id", business.id)
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
        externalPostId: item.external_post_id,
        accessToken,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const results = await gatherPublishedPostInsights(postsToFetch);
  const summary = summarizeInsights(results);

  return (
    <div>
      <PageHeader title="Analíticas" description="Alcance, seguidores y engagement, traducidos a lenguaje de negocio." />

      <div className="animate-fade-in-up stagger-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="Impresiones" value={formatInsightNumber(summary.totalImpressions)} sublabel={`${summary.totalPosts} publicaciones`} />
        <StatCard icon={Heart} label="Me gusta" value={formatInsightNumber(summary.totalLikes)} />
        <StatCard icon={MessageCircle} label="Comentarios" value={formatInsightNumber(summary.totalComments)} />
        <StatCard icon={Share2} label="Compartidos" value={formatInsightNumber(summary.totalShares)} />
      </div>

      <div className="animate-fade-in-up stagger-2 mt-6 flex flex-col gap-3">
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
    </div>
  );
}
