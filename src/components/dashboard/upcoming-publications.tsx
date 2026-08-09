import { Clapperboard, ImageIcon } from "lucide-react";
import { formatScheduledDate } from "@/lib/content/labels";
import type { Database } from "@/lib/supabase/types";

type ContentKind = Database["public"]["Enums"]["content_kind"];

export interface UpcomingItem {
  id: string;
  topic: string;
  contentKind: ContentKind;
  scheduledDate: string;
  recommendedPublishTime: string | null;
  mediaUrl: string | null;
}

const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  video: "Video",
  imagen: "Imagen",
};

function formatTime(time: string | null) {
  if (!time) return null;
  const [hours, minutes] = time.split(":");
  const d = new Date();
  d.setHours(Number(hours), Number(minutes));
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" }).format(d);
}

export function UpcomingPublications({ items }: { items: UpcomingItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No tienes publicaciones programadas por ahora.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.contentKind === "video" ? Clapperboard : ImageIcon;
        const time = formatTime(item.recommendedPublishTime);
        return (
          <div key={item.id} className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
              {item.mediaUrl ? (
                item.contentKind === "video" ? (
                  <video src={item.mediaUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.mediaUrl} alt={item.topic} className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                  <Icon className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900">{item.topic}</p>
              <p className="text-xs text-zinc-500">
                {formatScheduledDate(item.scheduledDate)}
                {time ? ` · ${time}` : ""}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              {CONTENT_KIND_LABELS[item.contentKind]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
