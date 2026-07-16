"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Clapperboard, ImageIcon, Clock } from "lucide-react";
import { generateContentPlan } from "@/app/dashboard/generar-contenido/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;

const FORMAT_LABELS: Record<ContentCalendarRow["format"], string> = {
  reel: "Reel",
  carrusel: "Carrusel",
  imagen_unica: "Imagen única",
  promocion: "Promoción",
};

const STATUS_VARIANTS: Record<ContentCalendarRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  pendiente: "neutral",
  generada: "success",
  en_revision: "warning",
  publicada: "success",
  fallida: "danger",
};

const STATUS_LABELS: Record<ContentCalendarRow["status"], string> = {
  pendiente: "Pendiente",
  generada: "Generada",
  en_revision: "En revisión",
  publicada: "Publicada",
  fallida: "Fallida",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function formatScheduledDate(isoDate: string) {
  // Force UTC parsing so the calendar date shown matches what's stored (no local-timezone shift).
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

export function GenerateContentPanel({
  businessId,
  initialItems,
}: {
  businessId: string;
  initialItems: ContentCalendarRow[];
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await generateContentPlan(businessId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(`Se generaron ${res.data.created} piezas de contenido.`);
      router.refresh();
    } finally {
      setGenerating(false);
    }
  }

  const generateButton = (
    <Button onClick={handleGenerate} loading={generating}>
      <Sparkles className="h-4 w-4" />
      Generar plan de 7 días
    </Button>
  );

  if (initialItems.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Todavía no hay contenido generado"
        description="Pídele a tus agentes de IA de estrategia y guionista que propongan los próximos 7 días de contenido para tu negocio."
        action={generateButton}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">{generateButton}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialItems.map((item) => {
          const Icon = item.content_kind === "video" ? Clapperboard : ImageIcon;
          return (
            <Card key={item.id} className="bg-white/70">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-zinc-500">
                    {formatScheduledDate(item.scheduled_date)}
                  </span>
                  <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                    <Icon className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{item.topic}</p>
                    <p className="text-xs text-zinc-500">{FORMAT_LABELS[item.format]}</p>
                  </div>
                </div>
                {item.script && <p className="line-clamp-4 text-sm text-zinc-600">{item.script}</p>}
                {item.recommended_publish_time && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
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
