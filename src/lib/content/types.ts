/** Mirrors the Postgres enums in supabase/migrations/0001_init.sql. */

export type ContentKind = "imagen" | "video";

/** "portavoz" se agregó en 0037: una persona sosteniendo el producto y
 *  hablando de él. Es video siempre, y solo se produce para marcas que
 *  tienen portavoz definido y aceptado por el dueño. */
export type ContentFormat =
  | "reel"
  | "carrusel"
  | "imagen_unica"
  | "promocion"
  | "portavoz";

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
