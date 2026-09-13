"use server";

import { revalidatePath } from "next/cache";

import { esOperador } from "@/lib/operacion/acceso";
import { createServiceRoleClient } from "@/lib/supabase/server";

type Resultado = { success: true } | { success: false; error: string };

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const METRICAS = ["alcance", "interacciones", "seguidores", "mensajes"] as const;

/**
 * Escribe la meta que acordaste con el cliente.
 *
 * La escribe el operador porque se acuerda hablando, no llenando un
 * formulario: la meta útil sale de una conversación donde tú le dices qué
 * es realista y él te dice qué le importa. Lo que queda aquí es el acta de
 * eso, para poder volver a leerla en tres meses.
 *
 * En las palabras de él. "Que me pregunten más por DM" es mejor meta que
 * "subir engagement 20%": la primera la reconoce cuando pasa.
 */
export async function fijarMeta(datos: {
  businessId: unknown;
  texto: unknown;
  metrica: unknown;
  valorInicial: unknown;
  valorObjetivo: unknown;
  paraFecha: unknown;
}): Promise<Resultado> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { businessId, texto, metrica, valorInicial, valorObjetivo, paraFecha } = datos;

  if (typeof businessId !== "string" || !ES_UUID.test(businessId)) {
    return { success: false, error: "Negocio no válido." };
  }
  const frase = typeof texto === "string" ? texto.trim().slice(0, 300) : "";
  if (frase.length < 5) return { success: false, error: "Escribe la meta." };

  const cual =
    typeof metrica === "string" && (METRICAS as readonly string[]).includes(metrica)
      ? metrica
      : null;

  const numero = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null;

  // Una fecha en el pasado no es una meta, es un reproche.
  const fecha =
    typeof paraFecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(paraFecha) ? paraFecha : null;

  const { error } = await createServiceRoleClient().from("metas").insert({
    business_id: businessId,
    texto: frase,
    metrica: cual,
    valor_inicial: numero(valorInicial),
    valor_objetivo: numero(valorObjetivo),
    para_fecha: fecha,
  });

  if (error) {
    console.error("fijarMeta falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/clientes");
  return { success: true };
}

/** Marca una meta como cumplida. Se hace a mano y a propósito: que un
 *  número llegue al objetivo no siempre significa que el cliente sienta
 *  que se cumplió, y lo que importa para que se quede es lo segundo. */
export async function marcarMetaCumplida(datos: { metaId: unknown }): Promise<Resultado> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { metaId } = datos;
  if (typeof metaId !== "string" || !ES_UUID.test(metaId)) {
    return { success: false, error: "Meta no válida." };
  }

  const { error } = await createServiceRoleClient()
    .from("metas")
    .update({ cumplida_at: new Date().toISOString() })
    .eq("id", metaId);

  if (error) {
    console.error("marcarMetaCumplida falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/clientes");
  return { success: true };
}
