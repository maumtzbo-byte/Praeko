"use server";

import { revalidatePath } from "next/cache";

import { gatherPublishedPostInsights } from "@/lib/agents/results-agent";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/social/tokens";

type Resultado =
  | { success: true; medidas: number; sinDatos: number }
  | { success: false; error: string };

/** Cuántas piezas se miden por corrida. Cada una es una llamada a la API de
 *  Meta, y con el límite de 60 s de Vercel no caben muchas más. Las más
 *  recientes primero: el mes en curso es el que se va a enseñar. */
const TOPE_POR_CORRIDA = 40;

/** Se vuelve a medir una pieza durante sus primeras dos semanas. Después,
 *  el engagement ya no se mueve lo suficiente como para pagar la llamada. */
const DIAS_QUE_SE_SIGUEN_MIDIENDO = 14;

/**
 * Mide cómo van las publicaciones y guarda el resultado.
 *
 * Corre a mano desde un botón y no en un cron, por la misma razón que todo
 * lo demás en este proyecto: no hay infraestructura de tareas programadas.
 * Se llama también antes de generar un mes nuevo, que es cuando el dato de
 * verdad hace falta.
 *
 * Guardar y no solo consultar tiene un motivo que no es obvio: Meta retira
 * métricas cada tanto —varias de Instagram se fueron en 2025, "impressions"
 * entre ellas para algunos formatos— y el día que retira una, el histórico
 * se pierde para siempre si nunca se copió.
 */
export async function medirDesempeno(): Promise<Resultado> {
  try {
    const { business } = await getCurrentBusiness();
    const supabase = await createClient();
    const serviceRole = createServiceRoleClient();

    const desde = new Date(Date.now() - DIAS_QUE_SE_SIGUEN_MIDIENDO * 86_400_000).toISOString();

    const { data: publicadas } = await supabase
      .from("content_calendar")
      .select("id, topic, content_kind, scheduled_date, external_post_id, published_platform, published_at")
      .eq("business_id", business.id)
      .eq("status", "publicada")
      .not("external_post_id", "is", null)
      .not("published_at", "is", null)
      .gte("published_at", desde)
      .order("published_at", { ascending: false })
      .limit(TOPE_POR_CORRIDA);

    if (!publicadas?.length) {
      return { success: true, medidas: 0, sinDatos: 0 };
    }

    // Un token por plataforma, no uno por pieza: doce publicaciones de
    // Instagram son doce refrescos del mismo token si no se guarda.
    type Plataforma = NonNullable<(typeof publicadas)[number]["published_platform"]>;
    const tokenPorPlataforma = new Map<Plataforma, string | null>();
    async function token(plataforma: Plataforma): Promise<string | null> {
      const guardado = tokenPorPlataforma.get(plataforma);
      if (guardado !== undefined) return guardado;

      const { data: conexion } = await supabase
        .from("social_connections")
        .select("id")
        .eq("business_id", business.id)
        .eq("platform", plataforma)
        .eq("status", "active")
        .maybeSingle();

      let valor: string | null = null;
      if (conexion) {
        const resultado = await getValidAccessToken(serviceRole, conexion.id, plataforma);
        valor = resultado.ok ? resultado.accessToken : null;
      }
      tokenPorPlataforma.set(plataforma, valor);
      return valor;
    }

    const paraMedir = [];
    for (const pieza of publicadas) {
      const plataforma = pieza.published_platform;
      if (!plataforma || !pieza.external_post_id) continue;
      const accessToken = await token(plataforma);
      if (!accessToken) continue;
      paraMedir.push({
        itemId: pieza.id,
        topic: pieza.topic,
        scheduledDate: pieza.scheduled_date,
        contentKind: pieza.content_kind,
        platform: plataforma,
        externalPostId: pieza.external_post_id,
        accessToken,
        publishedAt: pieza.published_at!,
      });
    }

    if (paraMedir.length === 0) {
      return { success: false, error: "No hay una cuenta conectada con la que medir." };
    }

    const resultados = await gatherPublishedPostInsights(paraMedir);

    const ahora = Date.now();
    const filas = [];
    let sinDatos = 0;

    for (const resultado of resultados) {
      const original = paraMedir.find((p) => p.itemId === resultado.itemId);
      if (!original) continue;

      if (!resultado.insights) {
        sinDatos += 1;
        continue;
      }

      const horas = Math.max(
        0,
        Math.floor((ahora - new Date(original.publishedAt).getTime()) / 3_600_000),
      );

      filas.push({
        business_id: business.id,
        content_calendar_id: resultado.itemId,
        platform: original.platform,
        impressions: resultado.insights.impressions,
        likes: resultado.insights.likes,
        comments: resultado.insights.comments,
        shares: resultado.insights.shares,
        horas_publicada: horas,
      });
    }

    if (filas.length > 0) {
      // `ignoreDuplicates` contra la restricción de una-por-día: volver a
      // apretar el botón el mismo día no duplica ni pisa lo medido.
      //
      // El conflicto se nombra sobre `medido_dia`, que es una columna
      // generada y no una expresión en el índice: un upsert por lista de
      // columnas no puede apuntar a una expresión, y con el índice de
      // expresión esto fallaba en tiempo de ejecución.
      const { error } = await serviceRole
        .from("post_insights")
        .upsert(filas, { onConflict: "content_calendar_id,medido_dia", ignoreDuplicates: true });

      if (error) {
        console.error("medirDesempeno: no se pudo guardar", error);
        return { success: false, error: "No se pudieron guardar los resultados." };
      }
    }

    revalidatePath("/dashboard");
    return { success: true, medidas: filas.length, sinDatos };
  } catch (err) {
    console.error("medirDesempeno falló", err);
    return { success: false, error: "No se pudieron medir los resultados." };
  }
}
