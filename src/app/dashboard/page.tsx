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
  Settings,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { gatherPublishedPostInsights, summarizeInsights, type InsightsSummary } from "@/lib/agents/results-agent";
import { formatInsightNumber } from "@/lib/content/format-insights";
import type { SocialPlatform } from "@/lib/social";
import type { Tables } from "@/lib/supabase/types";

// Below this, the Agente Creativo has too little to work with — it falls
// back to generic prompts instead of grounding output in what the business
// actually looks like. Matches the reference-image cap already used in
// generateMediaForContent (publicaciones/actions.ts).
const LOW_PHOTO_THRESHOLD = 3;

// The dashboard home is a teaser, not the full picture — /dashboard/analiticas
// already does the real deep-dive with up to 12 posts (MAX_POSTS_PER_LOAD
// there). Fetching live metrics from Meta/TikTok on every dashboard-home
// load too means the API cost is now paid on two pages instead of one, so
// this pulls a smaller, more recent slice rather than duplicating the full
// fetch — just enough to prove the product is actually working.
const MAX_POSTS_FOR_DASHBOARD_TEASER = 6;

/** Same fetch shape as /dashboard/analiticas (gatherPublishedPostInsights +
 * summarizeInsights), just bounded smaller and returning only the summary
 * — the dashboard home links out to Analíticas for the per-post breakdown. */
async function getRecentInsightsSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<InsightsSummary | null> {
  const { data: publishedItems } = await supabase
    .from("content_calendar")
    .select("id, topic, scheduled_date, published_platform, external_post_id")
    .eq("business_id", businessId)
    .eq("status", "publicada")
    .not("external_post_id", "is", null)
    .order("scheduled_date", { ascending: false })
    .limit(MAX_POSTS_FOR_DASHBOARD_TEASER);

  const publishedWithPost = (publishedItems ?? []).filter(
    (item): item is typeof item & { published_platform: SocialPlatform; external_post_id: string } =>
      item.published_platform !== null && item.external_post_id !== null,
  );
  if (publishedWithPost.length === 0) return null;

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
        externalPostId: item.external_post_id,
        accessToken,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (postsToFetch.length === 0) return null;

  const results = await gatherPublishedPostInsights(postsToFetch);
  return summarizeInsights(results);
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

const QUICK_ACTIONS = [
  { href: "/dashboard/generar-contenido", label: "Generar contenido", icon: Sparkles },
  { href: "/dashboard/calendario", label: "Ver calendario", icon: CalendarDays },
  { href: "/dashboard/redes-sociales", label: "Conectar redes", icon: Share2 },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

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
    { count: connectionsCount },
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
      .select("id", { count: "exact", head: true })
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

  const hasNoConnections = (connectionsCount ?? 0) === 0;
  const hasPublishedContent = (publishedCount ?? 0) > 0;
  const hasLowPhotoCount = (photoCount ?? 0) < LOW_PHOTO_THRESHOLD;

  // Only worth the live Meta/TikTok calls when there's actually something
  // published to ask about.
  const insightsSummary = hasPublishedContent ? await getRecentInsightsSummary(supabase, business.id) : null;

  const onboardingSteps = [
    { label: "Elige tu plan", href: "/dashboard/plan", done: Boolean(subscription) },
    { label: "Conecta una red social", href: "/dashboard/redes-sociales", done: !hasNoConnections },
    { label: "Genera tu primer contenido", href: "/dashboard/generar-contenido", done: (anyContentCount ?? 0) > 0 },
    { label: "Publica tu primera pieza", href: "/dashboard/publicaciones", done: hasPublishedContent },
  ];

  const displayName = (user?.user_metadata?.full_name as string | undefined) || firstNameFromEmail(user?.email);
  const videosUsed = usage?.videos_used ?? 0;
  const imagesUsed = usage?.images_used ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Hola{displayName ? `, ${displayName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Este es el resumen de <span className="font-medium text-zinc-700">{business.name}</span>.
        </p>
      </div>

      <div className="animate-fade-in-up">
        <OnboardingChecklist steps={onboardingSteps} />
      </div>

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

      {/* Resultados first — a business owner opening the dashboard wants to
          know "is this working", not the raw generation count, so results
          lead the page instead of sharing a row with unrelated stats. */}
      <div className="animate-fade-in-up stagger-1">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Rendimiento de publicaciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            {hasPublishedContent ? (
              <div className="flex flex-col gap-4 py-2">
                {insightsSummary ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span className="text-[10px] font-medium tracking-wide">IMPRESIONES</span>
                      </div>
                      <p className="mt-1 text-xl font-semibold text-zinc-900">
                        {formatInsightNumber(insightsSummary.totalImpressions)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Heart className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span className="text-[10px] font-medium tracking-wide">ME GUSTA</span>
                      </div>
                      <p className="mt-1 text-xl font-semibold text-zinc-900">
                        {formatInsightNumber(insightsSummary.totalLikes)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span className="text-[10px] font-medium tracking-wide">COMENTARIOS</span>
                      </div>
                      <p className="mt-1 text-xl font-semibold text-zinc-900">
                        {formatInsightNumber(insightsSummary.totalComments)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span className="text-[10px] font-medium tracking-wide">COMPARTIDOS</span>
                      </div>
                      <p className="mt-1 text-xl font-semibold text-zinc-900">
                        {formatInsightNumber(insightsSummary.totalShares)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    Ya tienes <span className="font-semibold text-zinc-900">{publishedCount}</span>{" "}
                    {publishedCount === 1 ? "pieza publicada" : "piezas publicadas"} — sin datos de alcance por
                    ahora.
                  </p>
                )}
                <Link href="/dashboard/analiticas" className="w-fit">
                  <Button size="sm" variant="secondary">
                    <BarChart3 className="h-4 w-4" />
                    Ver el detalle completo
                  </Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Todavía no hay datos que mostrar"
                description="Conecta tus redes sociales y publica tu primera pieza para empezar a ver alcance y engagement aquí."
                action={
                  hasNoConnections ? (
                    <Link href="/dashboard/redes-sociales">
                      <Button size="sm">
                        <Share2 className="h-4 w-4" />
                        Conectar redes sociales
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* One consistent stat rail — subscription status alongside the raw
          generation/queue numbers, all the same size/weight, instead of
          the previous mismatched 2-col-span + separate-row layout. */}
      <div className="animate-fade-in-up stagger-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/70">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-zinc-500">ESTADO DE SUSCRIPCIÓN</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] ">
                <Gem className="h-4 w-4 text-accent" strokeWidth={1.75} />
              </span>
            </div>
            {subscription ? (
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold text-zinc-950">{subscription.plan_key}</p>
                <Badge variant={subscription.status === "active" ? "success" : "warning"}>
                  {subscription.status}
                </Badge>
              </div>
            ) : (
              <Link href="/dashboard/plan" className="w-fit">
                <Button size="sm">Elegir plan</Button>
              </Link>
            )}
          </CardContent>
        </Card>

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
      </div>

      <div className="animate-fade-in-up stagger-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Actividad reciente</CardTitle>
              <Activity className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="flex flex-col divide-y divide-zinc-100">
                  {recentActivity.map((item) => {
                    const Icon = item.content_kind === "video" ? Clapperboard : ImageIcon;
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] ">
                          <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
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
                <EmptyState
                  icon={Activity}
                  title="Sin actividad todavía"
                  description="Aquí vas a ver cada generación, publicación y revisión de calidad en cuanto empiece a correr tu ciclo diario."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-start gap-2 rounded-xl border border-zinc-200 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.25)] "
              >
                <Icon className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
                <span className="text-xs font-medium text-zinc-700">{label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
