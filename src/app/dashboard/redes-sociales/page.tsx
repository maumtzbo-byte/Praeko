import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lock, MessageCircle } from "lucide-react";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";
import { getAdapter, isPublishablePlatform, SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FacebookIcon, InstagramIcon, TikTokIcon, GoogleBusinessIcon } from "@/components/dashboard/social-icons";
import { ConnectAtLimitButton } from "@/components/dashboard/connect-at-limit-button";
import { RefreshGoogleReviewsButton } from "@/components/dashboard/refresh-google-reviews-button";
import { disconnectSocialAccount, setAutoReplyEnabled } from "./actions";

const REPLY_STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  respondido: { label: "Respondido", variant: "success" },
  necesita_revision: { label: "Necesita revisión", variant: "warning" },
  fallido: { label: "Falló", variant: "danger" },
};

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  comentario: "Comentario",
  mensaje_directo: "Mensaje directo",
  reseña: "Reseña de Google",
};

const PLATFORMS: { key: SocialPlatform; Icon: typeof InstagramIcon; brandClass: string }[] = [
  { key: "instagram", Icon: InstagramIcon, brandClass: "bg-gradient-to-br from-fuchsia-500 to-amber-400" },
  { key: "facebook", Icon: FacebookIcon, brandClass: "bg-blue-600" },
  { key: "tiktok", Icon: TikTokIcon, brandClass: "bg-zinc-950" },
  { key: "google_business", Icon: GoogleBusinessIcon, brandClass: "bg-amber-500" },
];

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Esa red todavía no está configurada — vuelve más tarde.",
  plan_limit: "Ya conectaste el máximo de redes de tu plan.",
  oauth_failed: "No se pudo completar la conexión. Intenta de nuevo.",
  no_accounts: "No encontramos ninguna cuenta para conectar con ese usuario.",
  unknown_platform: "Red no reconocida.",
};

export default async function RedesSocialesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const { error, connected } = await searchParams;
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: connections }, { data: subscription }, { data: interactions }] = await Promise.all([
    supabase
      .from("social_connections")
      .select("id, platform, external_account_name, external_account_avatar_url, status")
      .eq("business_id", business.id),
    supabase.from("subscriptions").select("plan_key").eq("business_id", business.id).maybeSingle(),
    supabase
      .from("social_interactions")
      .select("id, platform, interaction_type, author_name, inbound_text, reply_text, reply_status, rating, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const { data: plan } = await supabase
    .from("plans")
    .select("social_network_limit")
    .eq("key", subscription?.plan_key ?? "basico")
    .single();

  const connectionsByPlatform = new Map((connections ?? []).map((c) => [c.platform, c]));
  const limit = plan?.social_network_limit ?? 1;
  // Google Business Profile is a data source, not a publishing slot — see
  // isPublishablePlatform — so it's excluded from the "de tu plan" count.
  // Solo las que de verdad sirven. Una conexión en "error" es un token
  // muerto: sigue en la tabla pero ya no puede publicar. Contarla como
  // conectada llenaba el cupo del plan y dejaba al dueño sin poder
  // reconectar la que se cayó — justo el caso que el aviso de conexión por
  // vencer del Dashboard existe para evitar.
  const publishableConnections = (connections ?? []).filter(
    (c) => isPublishablePlatform(c.platform) && c.status === "active",
  );
  const connectedCount = publishableConnections.length;
  const atLimit = connectedCount >= limit;

  return (
    <div>
      <PageHeader
        title="Redes sociales"
        description={`Conectadas ${connectedCount} de ${limit} redes según tu plan. Esto autoriza a Frames a publicar por ti — para editar tus @usuarios visibles, ve a Configuración.`}
      />

      <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-[var(--hairline)] bg-white/60 px-4 py-3 text-xs text-zinc-500 ">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          La conexión usa el inicio de sesión oficial de cada red (Meta / TikTok / Google) — nunca
          vemos ni guardamos tu contraseña. Google Business Profile no cuenta contra tu límite de
          redes del plan — es una fuente de datos (reseñas), no un canal de publicación. Puedes
          desconectar cualquier cuenta cuando quieras.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ">
          {ERROR_MESSAGES[error] ?? "Ocurrió un error inesperado."}
        </div>
      )}
      {connected && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ">
          {SOCIAL_PLATFORM_LABELS[connected as SocialPlatform] ?? "Cuenta"} conectada correctamente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLATFORMS.map(({ key, Icon, brandClass }) => {
          const connection = connectionsByPlatform.get(key);
          const configured = getAdapter(key).isConfigured();

          return (
            <Card key={key} className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${brandClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="font-semibold text-zinc-900">{SOCIAL_PLATFORM_LABELS[key]}</p>
              </div>

              {connection ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    {connection.external_account_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={connection.external_account_avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-zinc-200" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-800">{connection.external_account_name}</p>
                      {/* El estado real, no un palomita fija. Antes esta
                          línea decía "Conectada" en verde para cualquier
                          fila que existiera, aunque su token estuviera
                          muerto: la consulta ni siquiera traía la columna
                          `status`. O sea que la pantalla cuyo único trabajo
                          es decirte si tus redes están conectadas era la
                          última en enterarse de que una no. */}
                      {connection.status === "active" ? (
                        <p className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Conectada
                        </p>
                      ) : (
                        <p className="flex items-center gap-1 text-xs text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Se desconectó, vuelve a conectarla
                        </p>
                      )}
                    </div>
                  </div>
                  {key === "google_business" && connection.status === "active" && <RefreshGoogleReviewsButton />}
                  {connection.status !== "active" && (
                    <Link href={`/social/${key}/start`}>
                      <Button size="sm" className="w-full">
                        Reconectar
                      </Button>
                    </Link>
                  )}
                  <form action={disconnectSocialAccount}>
                    <input type="hidden" name="connectionId" value={connection.id} />
                    <Button type="submit" variant="secondary" size="sm" className="w-full">
                      Desconectar
                    </Button>
                  </form>
                </div>
              ) : !configured ? (
                <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-500 ">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Próximamente — falta configuración
                </div>
              ) : atLimit && isPublishablePlatform(key) ? (
                <ConnectAtLimitButton />
              ) : (
                <Link href={`/social/${key}/start`}>
                  <Button size="sm" className="w-full">
                    Conectar
                  </Button>
                </Link>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 flex flex-col gap-4 p-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-zinc-900">Agente de Respuestas</p>
              <p className="mt-0.5 max-w-md text-sm text-zinc-500">
                Contesta comentarios y mensajes directos de Instagram/Facebook, y reseñas de Google
                Business Profile, usando tus preguntas frecuentes, horario y precios de Configuración →
                Marca. Si no está seguro, no contesta — lo deja aquí para que tú respondas.
              </p>
            </div>
          </div>
          <form action={setAutoReplyEnabled}>
            <input type="hidden" name="enabled" value={(!business.auto_reply_enabled).toString()} />
            <Button type="submit" variant={business.auto_reply_enabled ? "secondary" : "primary"} size="sm">
              {business.auto_reply_enabled ? "Desactivar" : "Activar"}
            </Button>
          </form>
        </div>

        {interactions && interactions.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-[var(--hairline)] pt-4">
            {interactions.map((interaction) => {
              const status = REPLY_STATUS_LABELS[interaction.reply_status] ?? REPLY_STATUS_LABELS.necesita_revision;
              return (
                <div key={interaction.id} className="flex flex-col gap-1.5 rounded-xl bg-zinc-50 p-3 text-sm ">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-500">
                      {SOCIAL_PLATFORM_LABELS[interaction.platform]} ·{" "}
                      {INTERACTION_TYPE_LABELS[interaction.interaction_type] ?? interaction.interaction_type}
                      {interaction.rating ? ` · ${"★".repeat(interaction.rating)}${"☆".repeat(5 - interaction.rating)}` : ""}
                      {interaction.author_name ? ` · ${interaction.author_name}` : ""}
                    </p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-zinc-700">{interaction.inbound_text}</p>
                  {interaction.reply_text && <p className="text-zinc-500">↳ {interaction.reply_text}</p>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
