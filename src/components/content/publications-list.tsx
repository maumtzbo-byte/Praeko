"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clapperboard, ImageIcon, Clock, Send, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn } from "@/lib/utils";
import { FORMAT_LABELS, STATUS_VARIANTS, STATUS_LABELS, formatScheduledDate } from "@/lib/content/labels";
import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;
type ContentStatus = ContentCalendarRow["status"];

const STATUS_ORDER: ContentStatus[] = ["pendiente", "generada", "en_revision", "publicada", "fallida"];

export function PublicationsList({ initialItems }: { initialItems: ContentCalendarRow[] }) {
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
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
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
                      <Icon className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">{formatScheduledDate(item.scheduled_date)}</p>
                      <p className="text-xs text-zinc-400">{FORMAT_LABELS[item.format]}</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{item.topic}</p>
                    {item.script && <p className="line-clamp-1 text-sm text-zinc-500">{item.script}</p>}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {item.recommended_publish_time && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="h-3.5 w-3.5" />
                        {item.recommended_publish_time.slice(0, 5)}
                        {item.target_duration_seconds ? ` · ${item.target_duration_seconds}s` : ""}
                      </div>
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
  );
}
