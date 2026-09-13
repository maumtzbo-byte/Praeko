import type { Tables } from "@/lib/supabase/types";

/**
 * Cómo se lee el historial de desempeño.
 *
 * Todo lo que compara piezas entre sí vive aquí, en un solo lugar, porque
 * la trampa es siempre la misma y es fácil de pisar: **el engagement se
 * acumula con el tiempo**. Una pieza medida a las dos horas siempre se ve
 * peor que una medida a los siete días, aunque haya funcionado mejor.
 *
 * Comparar sin corregir eso hace que el sistema aprenda que lo viejo
 * funciona mejor que lo nuevo, que es exactamente lo contrario de lo que
 * uno quiere que aprenda.
 */

export type Medicion = Pick<
  Tables<"post_insights">,
  "content_calendar_id" | "impressions" | "likes" | "comments" | "shares" | "horas_publicada" | "medido_at"
>;

/**
 * La edad mínima para que una pieza cuente al comparar.
 *
 * Tres días. La mayor parte del alcance de una publicación en Instagram
 * ocurre en las primeras 48 horas; antes de eso, lo que se mide es el azar
 * de a quién le tocó verla, no si la pieza es buena.
 */
export const HORAS_PARA_COMPARAR = 72;

/** Interacciones de una medición. Suma lo que haya; null solo si no hubo
 *  ni una métrica, que es distinto de cero. */
export function interacciones(m: Medicion): number | null {
  const partes = [m.likes, m.comments, m.shares].filter(
    (v): v is number => typeof v === "number",
  );
  return partes.length === 0 ? null : partes.reduce((a, b) => a + b, 0);
}

/**
 * Qué tan bien le fue a una pieza, en una sola cifra comparable.
 *
 * Interacciones sobre alcance, no interacciones a secas. Un cliente que
 * duplicó seguidores tendría más likes en todo lo nuevo aunque el contenido
 * fuera peor; dividir entre el alcance quita ese efecto y deja la pregunta
 * que importa: de los que la vieron, ¿a cuántos les movió algo?
 *
 * Sin alcance —Meta retiró la métrica para algunos formatos— cae a
 * interacciones crudas, que sirve para ordenar piezas del mismo mes.
 */
export function tasaDeEnganche(m: Medicion): number | null {
  const total = interacciones(m);
  if (total === null) return null;
  if (typeof m.impressions === "number" && m.impressions > 0) {
    return total / m.impressions;
  }
  return total;
}

/** La medición más reciente de cada pieza, ya filtrada a las que tienen
 *  edad suficiente para compararse. */
export function ultimaPorPieza(mediciones: Medicion[]): Map<string, Medicion> {
  const mapa = new Map<string, Medicion>();
  for (const m of mediciones) {
    if (m.horas_publicada < HORAS_PARA_COMPARAR) continue;
    const previa = mapa.get(m.content_calendar_id);
    if (!previa || m.medido_at > previa.medido_at) {
      mapa.set(m.content_calendar_id, m);
    }
  }
  return mapa;
}

export type PiezaConDesempeno = {
  id: string;
  topic: string;
  format: string;
  contentKind: string;
  publicadaAt: string | null;
  medicion: Medicion;
  tasa: number;
};

/**
 * Ordena las piezas de mejor a peor.
 *
 * Devuelve solo las que tienen medición utilizable: una pieza sin datos no
 * es una pieza que funcionó mal, y meterla al fondo de la lista le
 * enseñaría al agente a evitar formatos que en realidad nunca se midieron.
 */
export function ordenarPorDesempeno(
  piezas: { id: string; topic: string; format: string; content_kind: string; published_at: string | null }[],
  mediciones: Medicion[],
): PiezaConDesempeno[] {
  const ultimas = ultimaPorPieza(mediciones);

  return piezas
    .flatMap((pieza) => {
      const medicion = ultimas.get(pieza.id);
      if (!medicion) return [];
      const tasa = tasaDeEnganche(medicion);
      if (tasa === null) return [];
      return [
        {
          id: pieza.id,
          topic: pieza.topic,
          format: pieza.format,
          contentKind: pieza.content_kind,
          publicadaAt: pieza.published_at,
          medicion,
          tasa,
        },
      ];
    })
    .sort((a, b) => b.tasa - a.tasa);
}

/**
 * A qué hora local responde mejor esta audiencia.
 *
 * Devuelve null cuando no hay con qué: menos de `MINIMO_PARA_HORA` piezas
 * medidas. Es deliberado que devuelva null y no una hora dudosa — el
 * sistema ya tiene una hora razonada para ese caso, y una hora "medida"
 * sobre cuatro publicaciones es peor que una razonada, porque suena a dato.
 */
export const MINIMO_PARA_HORA = 12;

export function mejorHora(
  piezas: PiezaConDesempeno[],
  zonaHoraria = "America/Monterrey",
): { hora: number; piezas: number } | null {
  const conHora = piezas.filter((p) => p.publicadaAt);
  if (conHora.length < MINIMO_PARA_HORA) return null;

  const formato = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: zonaHoraria,
  });

  // Se agrupa en bloques de tres horas y no por hora exacta: con veinte
  // publicaciones, veinticuatro casillas dejan una o dos por casilla y el
  // "mejor" sale de puro ruido.
  const bloques = new Map<number, { suma: number; cuantas: number }>();
  for (const pieza of conHora) {
    const hora = Number(formato.format(new Date(pieza.publicadaAt!)));
    if (!Number.isFinite(hora)) continue;
    const bloque = Math.floor(hora / 3) * 3;
    const previo = bloques.get(bloque) ?? { suma: 0, cuantas: 0 };
    bloques.set(bloque, { suma: previo.suma + pieza.tasa, cuantas: previo.cuantas + 1 });
  }

  let mejor: { hora: number; promedio: number; cuantas: number } | null = null;
  for (const [bloque, { suma, cuantas }] of bloques) {
    // Un bloque con una sola pieza no es evidencia de nada.
    if (cuantas < 2) continue;
    const promedio = suma / cuantas;
    if (!mejor || promedio > mejor.promedio) {
      mejor = { hora: bloque + 1, promedio, cuantas };
    }
  }

  return mejor ? { hora: mejor.hora, piezas: conHora.length } : null;
}
