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

// "rechazado" is more serious than "necesita_revision_humana" (the Agente
// Revisor de Marca thinks it contradicts the brand or invents specifics
// like prices/hours, not just a weak hook) — labeled distinctly so the
// owner knows how much scrutiny to give it before approving.
export const REVIEW_RESULT_LABELS: Record<NonNullable<ContentCalendarRow["review_result"]>, string> = {
  aprobado: "Aprobado",
  necesita_revision_humana: "Revisar antes de aprobar",
  rechazado: "Rechazado por el revisor",
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
