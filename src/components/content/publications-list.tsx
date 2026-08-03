"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clapperboard, ImageIcon, Clock, Send, Sparkles, RotateCcw, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { retryFailedContent } from "@/lib/content/actions";
import {
  generateMediaForContent,
  refreshMediaGenerationStatus,
  publishContentNow,
} from "@/app/dashboard/publicaciones/actions";
import { cn } from "@/lib/utils";
import { FORMAT_LABELS, STATUS_VARIANTS, STATUS_LABELS, formatScheduledDate } from "@/lib/content/labels";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/social";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/dashboard/social-icons";
import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;
type ContentStatus = ContentCalendarRow["status"];
type SocialConnection = Pick<Tables<"social_connections">, "id" | "platform" | "external_account_name">;

const PLATFORM_ICONS = { instagram: InstagramIcon, facebook: FacebookIcon, tiktok: TikTokIcon } as const;

const STATUS_ORDER: ContentStatus[] = ["pendiente", "generada", "en_revision", "publicada", "fallida"];

function RetryButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    const res = await retryFailedContent(itemId);
    if (!res.success) {
      toast.error(res.error);
      setRetrying(false);
      return;
    }
    toast.success("Se volvió a poner en cola para generarse.");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleRetry} loading={retrying}>
      <RotateCcw className="h-3.5 w-3.5" />
      Reintentar
    </Button>
  );
}

/** Agente Creativo trigger — only meaningful once FAL_API_KEY is configured
 * server-side; the action itself fails with a clear message otherwise. */
function GenerateMediaButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    const res = await generateMediaForContent(itemId);
    if (!res.success) {
      toast.error(res.error);
      setGenerating(false);
      return;
    }
    toast.success("Se envió a generar. Revisa el estado en unos minutos.");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleGenerate} loading={generating}>
      <Wand2 className="h-3.5 w-3.5" />
      Generar
    </Button>
  );
}

/** Shown instead of GenerateMediaButton once a job is already in flight for
 * this piece — polling is manual (a button click), not a background
 * worker, since there's no queue/cron infra to drive it automatically yet. */
function RefreshStatusButton({ generationId }: { generationId: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleCheck() {
    setChecking(true);
    const res = await refreshMediaGenerationStatus(generationId);
    setChecking(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    if (res.data.jobStatus === "completed") toast.success("¡Listo! Ya se generó.");
    else if (res.data.jobStatus === "failed") toast.error("La generación falló.");
    else toast("Todavía en proceso — intenta de nuevo en un momento.");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleCheck} loading={checking}>
      <RotateCcw className="h-3.5 w-3.5" />
      Revisar estado
    </Button>
  );
}

/** Agente de Publicación trigger — one small icon button per connected
 * account, since a business can have Instagram + Facebook + TikTok
 * connected at once and each piece publishes to exactly one of them (v1,
 * see publish action for why). */
function PublishButtons({ itemId, connections }: { itemId: string; connections: SocialConnection[] }) {
  const router = useRouter();
  const [publishingId, setPublishingId] = useState<string | null>(null);

  async function handlePublish(connection: SocialConnection) {
    setPublishingId(connection.id);
    const res = await publishContentNow(itemId, connection.id);
    setPublishingId(null);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success(`Publicado en ${SOCIAL_PLATFORM_LABELS[connection.platform]}.`);
    router.refresh();
  }

  if (connections.length === 0) {
    return <span className="text-xs text-zinc-400">Conecta una red para publicar</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {connections.map((connection) => {
        const Icon = PLATFORM_ICONS[connection.platform];
        return (
          <button
            key={connection.id}
            type="button"
            onClick={() => handlePublish(connection)}
            disabled={publishingId !== null}
            aria-label={`Publicar en ${connection.external_account_name} (${SOCIAL_PLATFORM_LABELS[connection.platform]})`}
            title={`Publicar en ${connection.external_account_name} (${SOCIAL_PLATFORM_LABELS[connection.platform]})`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 "
          >
            {publishingId === connection.id ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PublicationsList({
  initialItems,
  inFlightByItemId,
  connections = [],
}: {
  initialItems: ContentCalendarRow[];
  inFlightByItemId?: Map<string, string>;
  connections?: SocialConnection[];
}) {
  const [filter, setFilter] = useState<ContentStatus | "todas">("todas");

  const counts = useMemo(() => {
    const base: Record<ContentStatus | "todas", number> = {
      todas: initialItems.length,
      pendiente: 0,
      generada: 0,
      en_revision: 0,
      publicada: 0,
      fallida: 0,
    };
    for (const item of initialItems) base[item.status] += 1;
    return base;
  }, [initialItems]);

  const filtered = useMemo(
    () => (filter === "todas" ? initialItems : initialItems.filter((item) => item.status === filter)),
    [initialItems, filter],
  );

  if (initialItems.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="Todavía no tienes publicaciones en cola"
        description="En cuanto generes contenido, cada pieza va a aparecer aquí con su estado hasta que se publique."
        action={
          <Link href="/dashboard/generar-contenido">
            <Button size="sm">
              <Sparkles className="h-4 w-4" />
              Generar contenido
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(["todas", ...STATUS_ORDER] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              filter === key
                ? "border-zinc-900 bg-zinc-900 text-white "
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 ",
            )}
          >
            {key === "todas" ? "Todas" : STATUS_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Nada en este estado"
          description="Prueba con otro filtro para ver el resto de tus publicaciones."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const Icon = item.content_kind === "video" ? Clapperboard : ImageIcon;
            return (
              <Card key={item.id} className="bg-white/70">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">{formatScheduledDate(item.scheduled_date)}</p>
                      <p className="text-xs text-zinc-400">{FORMAT_LABELS[item.format]}</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{item.topic}</p>
                    {item.script && <p className="line-clamp-1 text-sm text-zinc-500">{item.script}</p>}
                    {item.status === "en_revision" && item.review_feedback && (
                      <p className="mt-1 line-clamp-2 text-xs text-amber-700">
                        Agente revisor: {item.review_feedback}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 sm:gap-3">
                    {item.recommended_publish_time && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="h-3.5 w-3.5" />
                        {item.recommended_publish_time.slice(0, 5)}
                        {item.target_duration_seconds ? ` · ${item.target_duration_seconds}s` : ""}
                      </div>
                    )}
                    {item.status === "fallida" && <RetryButton itemId={item.id} />}
                    {item.status === "pendiente" &&
                      (inFlightByItemId?.get(item.id) ? (
                        <RefreshStatusButton generationId={inFlightByItemId.get(item.id)!} />
                      ) : (
                        <GenerateMediaButton itemId={item.id} />
                      ))}
                    {item.status === "generada" && <PublishButtons itemId={item.id} connections={connections} />}
                    <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
