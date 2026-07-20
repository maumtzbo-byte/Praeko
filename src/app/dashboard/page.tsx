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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

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
  ]);

  const hasNoConnections = (connectionsCount ?? 0) === 0;

  const displayName = (user?.user_metadata?.full_name as string | undefined) || firstNameFromEmail(user?.email);
  const videosUsed = usage?.videos_used ?? 0;
  const imagesUsed = usage?.images_used ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-in-up">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-zinc-950">
          Hola{displayName ? `, ${displayName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Este es el resumen de <span className="font-medium text-zinc-700">{business.name}</span>.
        </p>
      </div>

      <div className="animate-fade-in-up stagger-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/70 sm:col-span-2">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-zinc-500">ESTADO DE SUSCRIPCIÓN</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
                <Gem className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-500">Elige tu plan para empezar a generar contenido.</p>
                <Link href="/dashboard/plan" className="shrink-0">
                  <Button size="sm">Elegir plan</Button>
                </Link>
              </div>
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
      </div>

      <div className="animate-fade-in-up stagger-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Rendimiento de publicaciones</CardTitle>
              <BarChart3 className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Publicaciones programadas</CardTitle>
            <Send className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-3xl font-semibold tracking-tight text-zinc-950">{scheduledCount ?? 0}</p>
            <p className="text-sm text-zinc-500">
              {scheduledCount ? "piezas en camino." : "Aún no tienes piezas en cola."}
            </p>
          </CardContent>
        </Card>
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
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
                          <Icon className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
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
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => {
              const isPrimary = href === "/dashboard/redes-sociales" && hasNoConnections;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5",
                    isPrimary
                      ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_8px_20px_-12px_rgba(0,0,0,0.4)] hover:bg-zinc-800"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.25)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isPrimary ? "text-white" : "text-zinc-600")} strokeWidth={1.75} />
                  <span className={cn("text-xs font-medium", isPrimary ? "text-white" : "text-zinc-700")}>
                    {label}
                  </span>
                  {isPrimary && <span className="text-[10px] font-medium text-zinc-400">Empieza aquí</span>}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
