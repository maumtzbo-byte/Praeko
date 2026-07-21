"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Clapperboard, ImageIcon, Clock } from "lucide-react";
import { generateContentPlan } from "@/app/dashboard/generar-contenido/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FORMAT_LABELS, STATUS_VARIANTS, STATUS_LABELS, formatScheduledDate } from "@/lib/content/labels";
import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;

/** Generation costs real money (Claude API), so this asks for confirmation before spending. */
function GenerateAction({ businessId, onGenerated }: { businessId: string; onGenerated: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleConfirm() {
    setGenerating(true);
    try {
      const res = await generateContentPlan(businessId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Se generaron ${res.data.created} piezas de contenido. Te quedan ${res.data.runsRemainingToday} generaciones hoy.`,
      );
      setConfirming(false);
      onGenerated();
    } finally {
      setGenerating(false);
    }
  }

  if (confirming) {
    return (
      <Alert variant="info" className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>Esto va a usar tu API key de Claude (cuesta unos centavos de dólar). ¿Generar de todas formas?</span>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm} loading={generating}>
            Confirmar generación
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Button onClick={() => setConfirming(true)}>
      <Sparkles className="h-4 w-4" />
      Generar plan de 7 días
    </Button>
  );
}

export function GenerateContentPanel({
  businessId,
  initialItems,
}: {
  businessId: string;
  initialItems: ContentCalendarRow[];
}) {
  const router = useRouter();
  const generateAction = <GenerateAction businessId={businessId} onGenerated={() => router.refresh()} />;

  if (initialItems.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Todavía no hay contenido generado"
        description="Pídele a tus agentes de IA de estrategia y guionista que propongan los próximos 7 días de contenido para tu negocio."
        action={generateAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">{generateAction}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialItems.map((item) => {
          const Icon = item.content_kind === "video" ? Clapperboard : ImageIcon;
          return (
            <Card key={item.id} className="bg-white/70">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                    {formatScheduledDate(item.scheduled_date)}
                  </span>
                  <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.topic}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{FORMAT_LABELS[item.format]}</p>
                  </div>
                </div>
                {item.script && <p className="line-clamp-4 text-sm text-zinc-600 dark:text-zinc-400">{item.script}</p>}
                {item.recommended_publish_time && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3.5 w-3.5" />
                    {item.recommended_publish_time.slice(0, 5)}
                    {item.target_duration_seconds ? ` · ${item.target_duration_seconds}s` : ""}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
