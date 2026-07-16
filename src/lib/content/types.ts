/** Mirrors the Postgres enums in supabase/migrations/0001_init.sql. */

export type ContentKind = "imagen" | "video";

export type ContentFormat = "reel" | "carrusel" | "imagen_unica" | "promocion";

export type ContentStatus =
  | "pendiente"
  | "generada"
  | "en_revision"
  | "publicada"
  | "fallida";

export type QualityReviewResult =
  | "aprobado"
  | "necesita_revision_humana"
  | "rechazado";
