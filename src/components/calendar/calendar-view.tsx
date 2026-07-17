"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clapperboard, ImageIcon, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FORMAT_LABELS, STATUS_VARIANTS, STATUS_LABELS } from "@/lib/content/labels";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonthUTC(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1));
}

/** Monday-first 6-week grid covering the given month. */
function buildMonthGrid(monthStart: Date): Date[] {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const firstWeekday = (monthStart.getUTCDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(Date.UTC(year, month, 1 - firstWeekday));
  return Array.from({ length: 42 }, (_, i) =>
    new Date(Date.UTC(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate() + i)),
  );
}

export function CalendarView({ initialItems }: { initialItems: ContentCalendarRow[] }) {
  const today = useMemo(() => new Date(), []);

  const defaultSelectedDate = useMemo(() => {
    const todayISO = toISODate(today);
    const sortedDates = [...initialItems].map((item) => item.scheduled_date).sort();
    return sortedDates.find((date) => date >= todayISO) ?? sortedDates[0] ?? null;
  }, [initialItems, today]);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = defaultSelectedDate ? new Date(`${defaultSelectedDate}T00:00:00Z`) : today;
    return startOfMonthUTC(base.getUTCFullYear(), base.getUTCMonth());
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(defaultSelectedDate);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ContentCalendarRow[]>();
    for (const item of initialItems) {
      const list = map.get(item.scheduled_date) ?? [];
      list.push(item);
      map.set(item.scheduled_date, list);
    }
    return map;
  }, [initialItems]);

  const grid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  if (initialItems.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Todavía no hay nada en tu calendario"
        description="En cuanto generes contenido desde “Generar contenido”, vas a poder verlo organizado aquí por fecha."
      />
    );
  }

  const todayISO = toISODate(today);
  const selectedItems = selectedDate ? (itemsByDate.get(selectedDate) ?? []) : [];

  function goToMonth(offset: number) {
    setVisibleMonth((prev) => startOfMonthUTC(prev.getUTCFullYear(), prev.getUTCMonth() + offset));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="bg-white/70">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold capitalize text-zinc-900">{MONTH_FORMATTER.format(visibleMonth)}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => goToMonth(-1)} aria-label="Mes anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => goToMonth(1)} aria-label="Mes siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date) => {
              const iso = toISODate(date);
              const items = itemsByDate.get(iso) ?? [];
              const inMonth = date.getUTCMonth() === visibleMonth.getUTCMonth();
              const isToday = iso === todayISO;
              const isSelected = iso === selectedDate;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  disabled={items.length === 0}
                  className={cn(
                    "flex min-h-16 flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition-colors",
                    inMonth ? "border-zinc-200" : "border-transparent opacity-40",
                    isSelected ? "border-zinc-900 bg-zinc-50" : "hover:border-zinc-300",
                    items.length === 0 && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white"
                        : "text-zinc-600",
                    )}
                  >
                    {date.getUTCDate()}
                  </span>
                  {items.length > 0 && (
                    <span className="flex flex-wrap gap-0.5">
                      {items.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            item.content_kind === "video" ? "bg-violet-500" : "bg-sky-500",
                          )}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {selectedItems.length === 0 && (
          <Card className="bg-white/50">
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <CalendarDays className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
              <p className="text-sm text-zinc-500">Selecciona un día con contenido para ver el detalle.</p>
            </CardContent>
          </Card>
        )}
        {selectedItems.map((item) => {
          const Icon = item.content_kind === "video" ? Clapperboard : ImageIcon;
          return (
            <Card key={item.id} className="bg-white/70">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100">
                    <Icon className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.75} />
                  </span>
                  <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{item.topic}</p>
                <p className="text-xs text-zinc-500">{FORMAT_LABELS[item.format]}</p>
                {item.script && <p className="text-sm text-zinc-600">{item.script}</p>}
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
