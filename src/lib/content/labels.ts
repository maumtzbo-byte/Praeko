import type { Tables } from "@/lib/supabase/types";

type ContentCalendarRow = Tables<"content_calendar">;

export const FORMAT_LABELS: Record<ContentCalendarRow["format"], string> = {
  reel: "Reel",
  carrusel: "Carrusel",
  imagen_unica: "Imagen única",
  promocion: "Promoción",
};

export const STATUS_VARIANTS: Record<ContentCalendarRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  pendiente: "neutral",
  generada: "success",
  en_revision: "warning",
  publicada: "success",
  fallida: "danger",
};

export const STATUS_LABELS: Record<ContentCalendarRow["status"], string> = {
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

/** Force UTC parsing so the date shown matches what's stored (no local-timezone shift). */
export function formatScheduledDate(isoDate: string) {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}
