"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clapperboard, ImageIcon, Clock, Send, RotateCcw, Wand2, Megaphone, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { UpgradePlanModal } from "@/components/dashboard/upgrade-plan-modal";
import { ContentDetailModal } from "@/components/content/content-detail-modal";
import { retryFailedContent, approveReviewedContent } from "@/lib/content/actions";
import {
  generateMediaForContent,
  refreshMediaGenerationStatus,
  publishContentNow,
  getPromoteLink,
} from "@/app/dashboard/publicaciones/actions";
import { cn } from "@/lib/utils";
import { FORMAT_LABELS, STATUS_VARIANTS, STATUS_LABELS, REVIEW_RESULT_LABELS, formatScheduledDate } from "@/lib/content/labels";
import { primerCuadro } from "@/lib/content/media";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/social";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/dashboard/social-icons";
import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;
type ContentStatus = ContentCalendarRow["status"];
// Publishable platforms only — Google Business Profile is a data source
// (reviews), never something Frames publishes content to, so it's
// narrowed out here rather than needing a dead icon-map entry.
type SocialConnection = Pick<Tables<"social_connections">, "id" | "external_account_name"> & {
  platform: "instagram" | "facebook" | "tiktok";
};

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

/** "en_revision" used to be a dead end — the Agente Revisor de Marca flags
 * a piece for the owner to look at, but nothing ever moved it forward.
 * This lets the owner read the feedback and, if they're fine with it,
 * clear it back to "pendiente" themselves. */
function ApproveButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);

  async function handleApprove() {
    setApproving(true);
    const res = await approveReviewedContent(itemId);
    if (!res.success) {
      toast.error(res.error);
      setApproving(false);
      return;
    }
    toast.success("Aprobado — ya puedes generar y publicar esta pieza.");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleApprove} loading={approving}>
      <Check className="h-3.5 w-3.5" />
      Aprobar
    </Button>
  );
}

/** Agente Creativo trigger — only meaningful once FAL_API_KEY is configured
 * server-side; the action itself fails with a clear message otherwise. */
function GenerateMediaButton({ itemId, contentKind }: { itemId: string; contentKind: "imagen" | "video" }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    const res = await generateMediaForContent(itemId);
    if (!res.success) {
      if (res.code === "plan_limit") {
        setShowUpgrade(true);
      } else {
        toast.error(res.error);
      }
      setGenerating(false);
      return;
    }
    toast.success("Se envió a generar. Revisa el estado en unos minutos.");
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={handleGenerate} loading={generating}>
        <Wand2 className="h-3.5 w-3.5" />
        Generar
      </Button>
      {showUpgrade && (
        <UpgradePlanModal reason={contentKind === "video" ? "videos" : "images"} onClose={() => setShowUpgrade(false)} />
      )}
    </>
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

/** "Promocionar" — opens the real published post on Facebook/Instagram in a
 * new tab, where Meta's own native Boost/Promote button already lives.
 * Frames doesn't create or touch the ad itself (no ads_management
 * permission, no spend, no cut) — this is a doorway, not an integration. */
function PromoteButton({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePromote() {
    setLoading(true);
    const res = await getPromoteLink(itemId);
    setLoading(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    window.open(res.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button variant="secondary" size="sm" onClick={handlePromote} loading={loading}>
      <Megaphone className="h-3.5 w-3.5" />
      Promocionar
    </Button>
  );
}

export function PublicationsList({
  initialItems,
  inFlightByItemId,
  connections = [],
  generateAction,
  mediaByItemId,
}: {
  initialItems: ContentCalendarRow[];
  inFlightByItemId?: Map<string, string>;
  connections?: SocialConnection[];
  /** URL del archivo ya generado por pieza (ver lib/content/media.ts). */
  mediaByItemId?: Map<string, string>;
  generateAction?: ReactNode;
}) {
  const [filter, setFilter] = useState<ContentStatus | "todas">("todas");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
        action={generateAction}
      />
    );
  }

  return (
    <>
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(["todas", ...STATUS_ORDER] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              // El filtro activo se queda oprimido, los otros sobresalen:
              // el mismo par que usan los botones y las opciones.
              filter === key
                ? "bg-[image:var(--plastico-oscuro)] text-white shadow-[var(--relieve-oscuro)] "
                : "bg-[image:var(--plastico)] text-zinc-600 shadow-[var(--relieve-pieza)] hover:brightness-[1.02] active:translate-y-px active:shadow-[var(--relieve-oprimido)] ",
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
            const mediaUrl = mediaByItemId?.get(item.id) ?? null;
            return (
              <Card
                key={item.id}
                className="cursor-pointer bg-white/70 transition-colors hover:border-zinc-300"
                onClick={() => setSelectedItemId(item.id)}
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                    {/* La pieza cuando ya existe, el icono cuando no.
                        Un icono de "video" repetido en las diez filas no
                        distingue nada; la miniatura sí, y es el dato con
                        el que el dueño reconoce lo que está aprobando. */}
                    {mediaUrl ? (
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(15,23,42,0.09)]">
                        {item.content_kind === "video" ? (
                          <video src={primerCuadro(mediaUrl)} className="h-full w-full object-cover" preload="metadata" muted playsInline />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 shadow-[var(--relieve-hundido)]">
                        <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                      </span>
                    )}
                    <div>
                      <p className="text-xs font-medium text-zinc-500">{formatScheduledDate(item.scheduled_date)}</p>
                      <p className="text-xs text-zinc-400">{FORMAT_LABELS[item.format]}</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{item.topic}</p>
                    {item.script && <p className="line-clamp-1 text-sm text-zinc-500">{item.script}</p>}
                    {item.status === "en_revision" && (
                      <p className="mt-1 line-clamp-2 text-xs text-amber-700">
                        {item.review_result && <span className="font-medium">{REVIEW_RESULT_LABELS[item.review_result]}: </span>}
                        {item.review_feedback ?? "El Agente Revisor de Marca marcó esta pieza para tu revisión."}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 sm:gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.recommended_publish_time && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="h-3.5 w-3.5" />
                        {item.recommended_publish_time.slice(0, 5)}
                        {item.target_duration_seconds ? ` · ${item.target_duration_seconds}s` : ""}
                      </div>
                    )}
                    {item.status === "fallida" && <RetryButton itemId={item.id} />}
                    {item.status === "en_revision" && <ApproveButton itemId={item.id} />}
                    {item.status === "pendiente" &&
                      (inFlightByItemId?.get(item.id) ? (
                        <RefreshStatusButton generationId={inFlightByItemId.get(item.id)!} />
                      ) : (
                        <GenerateMediaButton itemId={item.id} contentKind={item.content_kind} />
                      ))}
                    {item.status === "generada" && <PublishButtons itemId={item.id} connections={connections} />}
                    {item.status === "publicada" &&
                      (item.published_platform === "facebook" || item.published_platform === "instagram") && (
                        <PromoteButton itemId={item.id} />
                      )}
                    <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
    <ContentDetailModal itemId={selectedItemId} onClose={() => setSelectedItemId(null)} />
    </>
  );
}
