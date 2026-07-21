import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";
import { getAdapter, SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/dashboard/social-icons";
import { disconnectSocialAccount } from "./actions";

const PLATFORMS: { key: SocialPlatform; Icon: typeof InstagramIcon; brandClass: string }[] = [
  { key: "instagram", Icon: InstagramIcon, brandClass: "bg-gradient-to-br from-fuchsia-500 to-amber-400" },
  { key: "facebook", Icon: FacebookIcon, brandClass: "bg-blue-600" },
  { key: "tiktok", Icon: TikTokIcon, brandClass: "bg-zinc-950" },
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

  const [{ data: connections }, { data: subscription }] = await Promise.all([
    supabase
      .from("social_connections")
      .select("id, platform, external_account_name, external_account_avatar_url")
      .eq("business_id", business.id),
    supabase.from("subscriptions").select("plan_key").eq("business_id", business.id).maybeSingle(),
  ]);

  const { data: plan } = await supabase
    .from("plans")
    .select("social_network_limit")
    .eq("key", subscription?.plan_key ?? "basico")
    .single();

  const connectionsByPlatform = new Map((connections ?? []).map((c) => [c.platform, c]));
  const limit = plan?.social_network_limit ?? 1;
  const connectedCount = connections?.length ?? 0;
  const atLimit = connectedCount >= limit;

  return (
    <div>
      <PageHeader
        title="Redes sociales"
        description={`Conectadas ${connectedCount} de ${limit} redes según tu plan. Esto autoriza a Praeko a publicar por ti — para editar tus @usuarios visibles, ve a Configuración.`}
      />

      <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-[var(--hairline)] bg-white/60 px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          La conexión usa el inicio de sesión oficial de cada red (Meta / TikTok) — nunca vemos ni
          guardamos tu contraseña, y solo obtenemos permiso para publicar en tu nombre. Puedes
          desconectar cualquier cuenta cuando quieras.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {ERROR_MESSAGES[error] ?? "Ocurrió un error inesperado."}
        </div>
      )}
      {connected && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
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
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{SOCIAL_PLATFORM_LABELS[key]}</p>
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
                      <span className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{connection.external_account_name}</p>
                      <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Conectada
                      </p>
                    </div>
                  </div>
                  <form action={disconnectSocialAccount}>
                    <input type="hidden" name="connectionId" value={connection.id} />
                    <Button type="submit" variant="secondary" size="sm" className="w-full">
                      Desconectar
                    </Button>
                  </form>
                </div>
              ) : !configured ? (
                <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Próximamente — falta configuración
                </div>
              ) : atLimit ? (
                <Link href="/dashboard/plan" className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                  Alcanzaste el límite de tu plan — mejora tu plan para conectar más
                </Link>
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
    </div>
  );
}
