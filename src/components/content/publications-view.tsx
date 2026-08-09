"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, CalendarDays } from "lucide-react";
import { PublicationsList } from "./publications-list";
import { CalendarView } from "@/components/calendar/calendar-view";
import { GenerateAction } from "./generate-action";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;
type SocialConnection = Pick<Tables<"social_connections">, "id" | "external_account_name"> & {
  platform: "instagram" | "facebook" | "tiktok";
};

/** Calendario and Publicaciones used to be two separate pages showing the
 * exact same content_calendar data — one as a read-only month grid, one as
 * a list with the real generate/publish actions. Merged into one page with
 * a view toggle instead of two near-duplicate routes, and "Generar plan de
 * 7 días" (previously its own standalone page) now lives here too. */
export function PublicationsView({
  businessId,
  initialItems,
  inFlightByItemId,
  connections = [],
}: {
  businessId: string;
  initialItems: ContentCalendarRow[];
  inFlightByItemId?: Map<string, string>;
  connections?: SocialConnection[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const generateAction = <GenerateAction businessId={businessId} onGenerated={() => router.refresh()} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-0.5 rounded-lg bg-zinc-100 p-0.5">
          <button
            type="button"
            onClick={() => setView("lista")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "lista" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700",
            )}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
          <button
            type="button"
            onClick={() => setView("calendario")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "calendario" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendario
          </button>
        </div>
        {initialItems.length > 0 && generateAction}
      </div>

      {view === "lista" ? (
        <PublicationsList
          initialItems={initialItems}
          inFlightByItemId={inFlightByItemId}
          connections={connections}
          generateAction={generateAction}
        />
      ) : (
        <CalendarView initialItems={initialItems} generateAction={generateAction} />
      )}
    </div>
  );
}
