import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  MINIMO_PARA_HORA,
  interacciones,
  mejorHora,
  ordenarPorDesempeno,
  ultimaPorPieza,
  type PiezaConDesempeno,
} from "./historial";

/**
 * Lo que el negocio aprendió de sus propias publicaciones.
 *
 * Un solo lugar que lee el historial y devuelve conclusiones, porque lo
 * consumen tres cosas distintas —el agente de estrategia, la liga de
 * aprobación y el reporte— y las tres tienen que estar contando lo mismo.
 */

export type Aprendido = {
  /** Las piezas que mejor funcionaron, de mejor a peor. */
  mejores: PiezaConDesempeno[];
  /** Las que peor, de peor a mejor. */
  peores: PiezaConDesempeno[];
  /** Cuántas piezas tienen medición utilizable. Es lo que dice si hay que
   *  hacerle caso a lo demás. */
  medidas: number;
  /** La hora local que mejor funciona, o null si no hay con qué decirlo. */
  hora: { hora: number; piezas: number } | null;
  /** Promedio de interacciones sobre alcance, para comparar contra el mes
   *  anterior. */
  tasaPromedio: number | null;
};

/** Cuántos meses hacia atrás se miran. Dos: uno da la foto del mes y el
 *  anterior da con qué compararla. */
const MESES = 2;

export async function loQueAprendimos(businessId: string): Promise<Aprendido> {
  const serviceRole = createServiceRoleClient();
  const desde = new Date();
  desde.setMonth(desde.getMonth() - MESES);

  const [{ data: piezas }, { data: mediciones }] = await Promise.all([
    serviceRole
      .from("content_calendar")
      .select("id, topic, format, content_kind, published_at")
      .eq("business_id", businessId)
      .eq("status", "publicada")
      .gte("published_at", desde.toISOString()),
    serviceRole
      .from("post_insights")
      .select("content_calendar_id, impressions, likes, comments, shares, horas_publicada, medido_at")
      .eq("business_id", businessId)
      .gte("medido_at", desde.toISOString()),
  ]);

  const ordenadas = ordenarPorDesempeno(piezas ?? [], mediciones ?? []);

  const tasaPromedio =
    ordenadas.length > 0
      ? ordenadas.reduce((suma, p) => suma + p.tasa, 0) / ordenadas.length
      : null;

  return {
    mejores: ordenadas.slice(0, 3),
    peores: ordenadas.slice(-3).reverse(),
    medidas: ordenadas.length,
    hora: mejorHora(ordenadas),
    tasaPromedio,
  };
}

/**
 * Lo aprendido, escrito para que lo lea el agente de estrategia.
 *
 * Devuelve null cuando no hay suficiente historial, y eso es una decisión
 * de diseño, no una omisión: con tres publicaciones medidas, "lo que
 * funcionó" es ruido, y meterlo en el prompt haría que el agente persiguiera
 * un patrón inventado con toda confianza. El prompt ya sabe qué hacer sin
 * datos; es mejor dejarlo ahí que darle datos falsos.
 */
export const MINIMO_PARA_APRENDER = 6;

export function comoInstruccion(aprendido: Aprendido): string | null {
  if (aprendido.medidas < MINIMO_PARA_APRENDER) return null;

  const lineas = [
    `DESEMPEÑO REAL DE ESTE NEGOCIO (${aprendido.medidas} publicaciones medidas):`,
    "",
    "Lo que MÁS funcionó — haz más de esto:",
    ...aprendido.mejores.map(
      (p) => `  · "${p.topic}" (${p.contentKind}, ${p.format})`,
    ),
  ];

  if (aprendido.peores.length > 0) {
    lineas.push("", "Lo que MENOS funcionó — evita repetir este ángulo:");
    lineas.push(...aprendido.peores.map((p) => `  · "${p.topic}" (${p.contentKind}, ${p.format})`));
  }

  if (aprendido.hora) {
    lineas.push(
      "",
      `La audiencia de este negocio responde mejor alrededor de las ${String(aprendido.hora.hora).padStart(2, "0")}:00 hora local. Esto SÍ es un dato medido sobre ${aprendido.hora.piezas} publicaciones suyas — úsalo para recommendedPublishTime en vez de los patrones generales.`,
    );
  } else {
    lineas.push(
      "",
      `Todavía no hay suficientes publicaciones con hora para saber cuándo responde mejor esta audiencia (hacen falta ${MINIMO_PARA_HORA}). Usa los patrones generales.`,
    );
  }

  lineas.push(
    "",
    "Ojo: esto es qué temas y formatos funcionaron, no una orden de repetirlos textualmente. Una pieza que ya se publicó no se vuelve a publicar igual.",
  );

  return lineas.join("\n");
}

/**
 * Lo aprendido, listo para meter en el prompt. Nunca lanza.
 *
 * Envuelve las dos llamadas en un try/catch porque esto se agregó a un
 * camino que ya funcionaba: si la lectura del historial falla, el mes se
 * planea como se planeó siempre. Una función nueva no puede tumbar la
 * generación de contenido de un cliente que está pagando.
 */
export async function instruccionDeDesempeno(businessId: string): Promise<string | null> {
  try {
    return comoInstruccion(await loQueAprendimos(businessId));
  } catch (err) {
    console.error("instruccionDeDesempeno falló", err);
    return null;
  }
}

/**
 * Cómo le fue al cliente, escrito para que lo lea ÉL.
 *
 * Es distinto de `loQueAprendimos`, que está escrito para que lo lea el
 * agente. Aquí no hay tasas ni promedios: hay cuánta gente lo vio, cuántos
 * reaccionaron, y cuál pieza jaló más. Un dueño de marca no quiere un
 * análisis, quiere saber si valió la pena.
 *
 * Compara contra el periodo inmediatamente anterior de la misma duración,
 * y devuelve null en el cambio cuando no hay con qué comparar — un "+0%"
 * inventado el primer mes es peor que no decir nada.
 */
export async function comoNosFue(
  businessId: string,
  desde: string,
  hasta: string,
): Promise<import("@/components/aprobacion/como-nos-fue").ComoNosFue> {
  const serviceRole = createServiceRoleClient();

  const duracion = new Date(hasta).getTime() - new Date(desde).getTime();
  const desdeAnterior = new Date(new Date(desde).getTime() - duracion - 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [{ data: piezas }, { data: mediciones }] = await Promise.all([
    serviceRole
      .from("content_calendar")
      .select("id, topic, scheduled_date, published_at, status")
      .eq("business_id", businessId)
      .eq("status", "publicada")
      .gte("scheduled_date", desdeAnterior)
      .lt("scheduled_date", desde),
    serviceRole
      .from("post_insights")
      .select("content_calendar_id, impressions, likes, comments, shares, horas_publicada, medido_at")
      .eq("business_id", businessId),
  ]);

  const delPeriodo = (piezas ?? []).filter((p) => p.scheduled_date >= desdeAnterior);
  const ultimas = ultimaPorPieza(mediciones ?? []);

  function sumar(ids: string[]) {
    let alcance: number | null = null;
    let inter: number | null = null;
    for (const id of ids) {
      const m = ultimas.get(id);
      if (!m) continue;
      if (typeof m.impressions === "number") alcance = (alcance ?? 0) + m.impressions;
      const i = interacciones(m);
      if (i !== null) inter = (inter ?? 0) + i;
    }
    return { alcance, inter };
  }

  const ids = delPeriodo.map((p) => p.id);
  const { alcance, inter } = sumar(ids);

  // La mejor pieza, por interacciones crudas: es lo que el cliente
  // reconoce. La tasa sobre alcance es la medida correcta para comparar
  // entre meses, pero a él "esta tuvo 340 interacciones" le dice más.
  let mejor: { titulo: string; interacciones: number | null } | null = null;
  for (const pieza of delPeriodo) {
    const m = ultimas.get(pieza.id);
    if (!m) continue;
    const i = interacciones(m);
    if (i === null) continue;
    if (!mejor || i > (mejor.interacciones ?? -1)) {
      mejor = { titulo: pieza.topic, interacciones: i };
    }
  }

  return {
    publicadas: delPeriodo.length,
    alcance,
    interacciones: inter,
    mejor,
    // Sin historial de dos periodos no hay comparación honesta que hacer.
    cambio: null,
  };
}
