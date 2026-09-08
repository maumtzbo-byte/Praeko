import type { createClient } from "@/lib/supabase/server";

/**
 * El archivo ya generado de cada pieza, en una sola consulta.
 *
 * Hasta ahora el video o la imagen solo se traía de uno en uno, para la
 * vista de detalle de una pieza (ver getPublicationDetail en
 * dashboard/publicaciones/actions.ts). Las listas mostraban un icono
 * genérico, así que el dueño veía "Nueva colección Yacht Club" y tenía que
 * abrirla para saber qué era. Con la miniatura no hace falta abrir nada.
 *
 * Un detalle del esquema que engaña: `generations.storage_path` NO es una
 * ruta de Supabase Storage a pesar del nombre — es la URL completa que
 * devuelve fal.ai (ver FalGenerationProvider). Por eso no hay que firmar
 * nada ni pasar por el bucket; se usa tal cual.
 *
 * Se queda con la generación completada más reciente de cada pieza: una
 * pieza puede tener varias si se regeneró, y la que vale es la última.
 */
export async function fetchMediaUrlsByItemId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  itemIds: string[],
): Promise<Map<string, string>> {
  if (itemIds.length === 0) return new Map();

  const { data } = await supabase
    .from("generations")
    .select("content_calendar_id, storage_path, created_at")
    .eq("business_id", businessId)
    .eq("job_status", "completed")
    .in("content_calendar_id", itemIds)
    .not("storage_path", "is", null)
    // Ascendente + sobrescritura en el recorrido: la última que entra al
    // mapa es la más nueva. Sale más barato que ordenar descendente y
    // preguntar si la clave ya existe en cada vuelta.
    .order("created_at", { ascending: true });

  const porPieza = new Map<string, string>();
  for (const fila of data ?? []) {
    if (!fila.content_calendar_id || !fila.storage_path) continue;
    porPieza.set(fila.content_calendar_id, fila.storage_path);
  }
  return porPieza;
}

/** El primer cuadro de un video, forzado.
 *
 *  `<video preload="metadata">` enseña el primer cuadro en escritorio, pero
 *  Safari de iOS deja el recuadro en negro hasta que alguien le pica —y los
 *  usuarios de Frames abren esto desde el teléfono—. El fragmento `#t=0.1`
 *  le pide al navegador que se posicione en el segundo 0.1, y eso sí lo
 *  obliga a decodificar y pintar ese cuadro.
 *
 *  Se aplica solo si la URL no trae ya un fragmento, para no romper una
 *  que venga con uno propio. */
export function primerCuadro(url: string): string {
  return url.includes("#") ? url : `${url}#t=0.1`;
}
