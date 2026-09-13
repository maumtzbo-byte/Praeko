"use server";

import { revalidatePath } from "next/cache";

import { conLimite, mensajeDeEspera } from "@/lib/espera";
import {
  PROVEEDOR_DE_MUESTRA,
  SEGUNDOS_DE_MUESTRA,
  TOPE_MENSUAL_MUESTRAS_USD,
  promptDeMuestra,
} from "@/lib/marketing/muestra";
import { esOperador } from "@/lib/operacion/acceso";
import { FalGenerationProvider } from "@/lib/providers/generation/fal-provider";
import { TARIFA_POR_PROVEEDOR } from "@/lib/providers/generation/tarifas";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CATEGORIAS_PRODUCTO, normalizaInstagram } from "@/lib/validation/lead";

type Resultado<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMITE_MS = 25_000;

/**
 * Agrega a mano una marca que encontraste en Instagram.
 *
 * Es la contraparte de /prueba: allá el prospecto llega solo y deja sus
 * datos; aquí lo encuentras tú y no tiene idea de que existes. Por eso no
 * lleva teléfono —llega cuando conteste— y por eso `origen` queda en
 * "prospeccion": lo que sale de buscar a mano tiene que poderse comparar
 * contra lo que traen los anuncios, o no hay forma de saber cuál sirve.
 */
export async function agregarMarca(datos: {
  negocio: unknown;
  giro: unknown;
  instagram: unknown;
  vende: unknown;
}): Promise<Resultado<{ id: string }>> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { negocio, giro, instagram, vende } = datos;

  const nombreMarca = typeof negocio === "string" ? negocio.trim() : "";
  if (nombreMarca.length < 2) return { success: false, error: "Escribe el nombre de la marca." };

  if (typeof giro !== "string" || !(CATEGORIAS_PRODUCTO as readonly string[]).includes(giro)) {
    return { success: false, error: "Elige la categoría de producto." };
  }

  const usuario = typeof instagram === "string" ? normalizaInstagram(instagram) : null;
  if (!usuario) return { success: false, error: "Escribe su usuario de Instagram." };

  const serviceRole = createServiceRoleClient();

  // Que no se agregue dos veces la misma marca en una tarde de búsqueda.
  const { data: yaEsta } = await serviceRole
    .from("leads")
    .select("id, negocio")
    .eq("instagram", usuario)
    .maybeSingle();

  if (yaEsta) {
    return { success: false, error: `Ya tienes a ${yaEsta.negocio} en la lista.` };
  }

  const { data: creado, error } = await serviceRole
    .from("leads")
    .insert({
      // `nombre` es NOT NULL y todavía no sabes quién lleva la cuenta. El
      // respaldo se ve vacío a propósito, en vez de inventar un nombre que
      // después alguien use para saludar por mensaje.
      nombre: "—",
      negocio: nombreMarca,
      giro,
      instagram: usuario,
      vende: typeof vende === "string" && vende.trim() ? vende.trim().slice(0, 300) : null,
      origen: "prospeccion",
      estado: "nuevo",
    })
    .select("id")
    .single();

  if (error || !creado) {
    console.error("agregarMarca falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/prospectos");
  return { success: true, data: { id: creado.id } };
}

/** Lo que se lleva gastado en muestras este mes, en dólares. */
async function gastoDelMes(
  serviceRole: ReturnType<typeof createServiceRoleClient>,
): Promise<number> {
  const primero = new Date();
  primero.setDate(1);
  primero.setHours(0, 0, 0, 0);

  const { data } = await serviceRole
    .from("muestras")
    .select("costo_usd")
    .gte("created_at", primero.toISOString());

  return (data ?? []).reduce((suma, m) => suma + Number(m.costo_usd), 0);
}

/**
 * Produce una pieza de muestra con el producto del prospecto.
 *
 * No consume cupo de ningún plan y no pertenece a ningún negocio: es gasto
 * de venta, no entrega. Lo único que la limita es el tope mensual, que está
 * ahí porque sin él nada detiene una tarde de clics distraídos.
 */
export async function generarMuestra(datos: {
  leadId: unknown;
}): Promise<Resultado<{ muestraId: string }>> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { leadId } = datos;
  if (typeof leadId !== "string" || !ES_UUID.test(leadId)) {
    return { success: false, error: "Prospecto no válido." };
  }

  const serviceRole = createServiceRoleClient();

  const { data: lead } = await serviceRole
    .from("leads")
    .select("id, negocio, giro, estilos, vende, fotos")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return { success: false, error: "Prospecto no encontrado." };

  // Sin foto del producto la muestra no sirve: saldría un frasco genérico
  // que no es el suyo, que es justo lo contrario de lo que la muestra
  // tiene que demostrar.
  if (lead.fotos.length === 0) {
    return { success: false, error: "Sube al menos una foto de su producto antes de generar." };
  }

  const costoEstimado = SEGUNDOS_DE_MUESTRA * (TARIFA_POR_PROVEEDOR[PROVEEDOR_DE_MUESTRA] ?? 0);
  const gastado = await gastoDelMes(serviceRole);
  if (gastado + costoEstimado > TOPE_MENSUAL_MUESTRAS_USD) {
    return {
      success: false,
      error: `Llegaste al tope de $${TOPE_MENSUAL_MUESTRAS_USD} USD en muestras este mes (llevas $${gastado.toFixed(2)}). Súbelo en TOPE_MUESTRAS_USD si quieres seguir.`,
    };
  }

  // La foto tiene que ser alcanzable por fal.ai, así que va firmada. Una
  // hora es de sobra: el trabajo se encola en segundos.
  const { data: firmada } = await serviceRole.storage
    .from("fotos-prospecto")
    .createSignedUrl(lead.fotos[0]!, 3600);

  if (!firmada?.signedUrl) {
    return { success: false, error: "No se pudo leer la foto del producto." };
  }

  const prompt = promptDeMuestra({
    negocio: lead.negocio,
    giro: lead.giro,
    estilos: lead.estilos,
    vende: lead.vende,
  });

  let handle;
  try {
    handle = await conLimite(
      new FalGenerationProvider().submitVideo({
        prompt,
        durationSeconds: SEGUNDOS_DE_MUESTRA,
        referenceAssetUrls: [firmada.signedUrl],
        brandContext: `Marca: ${lead.negocio}`,
        provider: PROVEEDOR_DE_MUESTRA,
      }),
      LIMITE_MS,
    );
  } catch (err) {
    console.error("generarMuestra: no se pudo encolar", err);
    return {
      success: false,
      error: mensajeDeEspera(err, "El generador tardó demasiado. Vuelve a intentar."),
    };
  }

  const { data: muestra, error } = await serviceRole
    .from("muestras")
    .insert({
      lead_id: leadId,
      estilo: lead.estilos[0] ?? null,
      prompt,
      proveedor: PROVEEDOR_DE_MUESTRA,
      provider_job_id: handle.providerJobId,
      job_status: "queued",
      segundos: SEGUNDOS_DE_MUESTRA,
    })
    .select("id")
    .single();

  if (error || !muestra) {
    // El trabajo ya está encolado y se va a cobrar, pero sin este renglón
    // nadie puede consultarlo ni ver el resultado. Se avisa en claro en vez
    // de dejar el gasto invisible.
    console.error("generarMuestra: no se pudo registrar", error);
    return { success: false, error: "Se encoló la generación pero no se pudo registrar. Revisa fal.ai." };
  }

  revalidatePath("/prospectos");
  return { success: true, data: { muestraId: muestra.id } };
}

/** Consulta si la muestra ya salió y guarda el resultado. */
export async function revisarMuestra(datos: {
  muestraId: unknown;
}): Promise<Resultado<{ estado: string; url: string | null }>> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { muestraId } = datos;
  if (typeof muestraId !== "string" || !ES_UUID.test(muestraId)) {
    return { success: false, error: "Muestra no válida." };
  }

  const serviceRole = createServiceRoleClient();
  const { data: muestra } = await serviceRole
    .from("muestras")
    .select("id, provider_job_id, job_status, url")
    .eq("id", muestraId)
    .maybeSingle();

  if (!muestra?.provider_job_id) return { success: false, error: "Muestra no encontrada." };
  if (muestra.job_status === "completed" || muestra.job_status === "failed") {
    return { success: true, data: { estado: muestra.job_status, url: muestra.url } };
  }

  const proveedor = new FalGenerationProvider();

  try {
    const estado = await conLimite(proveedor.checkStatus(muestra.provider_job_id), LIMITE_MS);

    if (estado.status !== "completed") {
      await serviceRole.from("muestras").update({ job_status: estado.status }).eq("id", muestraId);
      return { success: true, data: { estado: estado.status, url: null } };
    }

    const resultado = await conLimite(
      proveedor.fetchResult(muestra.provider_job_id),
      LIMITE_MS,
    );

    await serviceRole
      .from("muestras")
      .update({
        job_status: resultado.status === "completed" ? "completed" : "failed",
        url: resultado.outputUrl ?? null,
        costo_usd: resultado.costUsd,
      })
      .eq("id", muestraId);

    revalidatePath("/prospectos");
    return {
      success: true,
      data: { estado: resultado.status, url: resultado.outputUrl ?? null },
    };
  } catch (err) {
    console.error("revisarMuestra falló", err);
    return {
      success: false,
      error: mensajeDeEspera(err, "El generador tardó demasiado. Vuelve a intentar."),
    };
  }
}

/**
 * Prende o apaga el agregado de comentarios de un cliente.
 *
 * Lo mueve el operador y no el cliente, a propósito: es una venta, y una
 * venta se cierra hablando. El interruptor solo refleja lo que ya se
 * acordó.
 *
 * `primer_agregado_at` se escribe una sola vez, la primera. Es el dato con
 * el que después se ve quién lleva meses con un solo producto — el 62% de
 * los clientes a los que no se les vendió nada en los primeros tres meses
 * se fue antes de dos años.
 */
export async function moverAgregadoDeComentarios(datos: {
  businessId: unknown;
  activo: unknown;
  precio: unknown;
}): Promise<Resultado> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { businessId, activo, precio } = datos;
  if (typeof businessId !== "string" || !ES_UUID.test(businessId)) {
    return { success: false, error: "Negocio no válido." };
  }
  if (typeof activo !== "boolean") return { success: false, error: "Valor no válido." };

  const monto =
    typeof precio === "number" && Number.isFinite(precio) && precio > 0
      ? Math.round(precio)
      : null;

  const serviceRole = createServiceRoleClient();

  const { data: actual } = await serviceRole
    .from("subscriptions")
    .select("primer_agregado_at")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!actual) return { success: false, error: "Ese negocio no tiene suscripción." };

  const parche: {
    agregado_comentarios: boolean;
    agregado_comentarios_precio: number | null;
    primer_agregado_at?: string;
  } = {
    agregado_comentarios: activo,
    agregado_comentarios_precio: activo ? monto : null,
  };
  // Solo la primera vez. Si se apaga y se vuelve a prender, la fecha que
  // importa sigue siendo la de la primera venta.
  if (activo && !actual.primer_agregado_at) {
    parche.primer_agregado_at = new Date().toISOString();
  }

  const { error } = await serviceRole
    .from("subscriptions")
    .update(parche)
    .eq("business_id", businessId);

  if (error) {
    console.error("moverAgregadoDeComentarios falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/clientes");
  return { success: true };
}
