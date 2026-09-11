"use server";

import { headers } from "next/headers";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { contextoSchema, leadSchema, normalizaInstagram, normalizaWhatsapp } from "@/lib/validation/lead";

type ActionResult = { success: true } | { success: false; error: string };
/** El paso 1 devuelve el id para que el paso 2 sepa a qué fila pegarle. */
type AltaResult = { success: true; leadId: string | null } | { success: false; error: string };

/** Cuántos prospectos se aceptan por número de WhatsApp. Alguien que
 *  manda el formulario dos veces es normal —se le fue un dato, se
 *  arrepintió del giro—; cinco veces en el mismo día es alguien jugando.
 *  Se limita por teléfono y no por IP porque en México una buena parte del
 *  tráfico móvil comparte IP de operador, y limitar por IP dejaría fuera a
 *  prospectos reales. */
const TOPE_POR_TELEFONO = 3;
const VENTANA_HORAS = 24;

/**
 * Guarda un prospecto de /prueba.
 *
 * Va con el cliente de service-role a propósito. La tabla `leads` tiene
 * RLS activo y CERO políticas, o sea que niega todo: el formulario es
 * público y una política de insert abierta a `anon` dejaría que cualquiera
 * escribiera filas directo contra la API sin pasar por esta validación ni
 * por el tope de abajo. Con un formulario que vive detrás de anuncios
 * pagados, eso es una invitación a que te lo llenen de basura.
 *
 * Esta es la única entrada a la tabla, y valida antes de escribir.
 */
export async function registrarProspecto(datos: unknown): Promise<AltaResult> {
  const revisado = leadSchema.safeParse(datos);
  if (!revisado.success) {
    return { success: false, error: revisado.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { nombre, negocio, giro, whatsapp, origen } = revisado.data;
  const telefono = normalizaWhatsapp(whatsapp);

  try {
    const serviceRole = createServiceRoleClient();

    const desde = new Date(Date.now() - VENTANA_HORAS * 3_600_000).toISOString();
    const { count } = await serviceRole
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("whatsapp", telefono)
      .gte("created_at", desde);

    if ((count ?? 0) >= TOPE_POR_TELEFONO) {
      // Se le dice que ya quedó en vez de "ya mandaste muchos": para un
      // prospecto legítimo que reenvió el formulario, el mensaje correcto
      // es que su solicitud está recibida, no un regaño. Sin id, así que
      // el paso 2 no se muestra — ya se registró antes.
      return { success: true, leadId: null };
    }

    const { data: fila, error } = await serviceRole
      .from("leads")
      .insert({
        nombre,
        negocio,
        giro,
        whatsapp: telefono,
        origen: origen || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("registrarProspecto insert failed", error);
      return { success: false, error: "No se pudo enviar. Intenta de nuevo." };
    }

    // El aviso a quien opera. Sin cron ni cola en este proyecto (la única
    // ruta de API es el webhook de Meta), un prospecto que nadie ve es un
    // prospecto perdido, y la promesa de la página son 24 horas.
    await avisar({ nombre, negocio, giro, telefono, origen: origen ?? null });

    return { success: true, leadId: fila?.id ?? null };
  } catch (err) {
    console.error("registrarProspecto failed", err);
    return { success: false, error: "No se pudo enviar. Intenta de nuevo." };
  }
}

/** Manda el aviso del prospecto nuevo a donde se pueda.
 *
 *  Hoy solo escribe en el log del servidor, que en Vercel es un renglón
 *  buscable y alcanza para los primeros clientes. Cuando haya volumen, se
 *  le agrega aquí el envío por correo o por WhatsApp — el punto de que sea
 *  una función aparte es que ese cambio no toque nada más.
 *
 *  Nunca tumba el guardado: si el aviso falla, el prospecto YA quedó en la
 *  base y se ve en el panel de Supabase. Perder el aviso es molesto;
 *  perder el prospecto porque el aviso falló sería absurdo. */
async function avisar(prospecto: {
  nombre: string;
  negocio: string;
  giro: string;
  telefono: string;
  origen: string | null;
}) {
  try {
    const encabezados = await headers();
    console.log(
      "[prospecto nuevo]",
      JSON.stringify({
        ...prospecto,
        referer: encabezados.get("referer") ?? null,
        cuando: new Date().toISOString(),
      }),
    );
  } catch (err) {
    console.error("aviso de prospecto falló (el prospecto sí se guardó)", err);
  }
}


/**
 * Paso 2: el contexto con el que la muestra deja de ser genérica.
 *
 * Se guarda encima de una fila que YA existe, y por eso puede fallar sin
 * consecuencias: el prospecto está capturado desde el paso 1. Esa es toda
 * la razón de partirlo en dos — el formulario largo va después de tener al
 * prospecto, no antes.
 *
 * No valida que la fila sea "tuya" porque no hay sesión: es un formulario
 * público. Lo que la protege es que el id es un uuid v4 que solo conoce
 * quien acaba de mandar el paso 1, y que estas columnas son texto libre
 * sin efecto en nada — lo peor que logra alguien adivinando un uuid es
 * escribirle basura a la nota de un prospecto.
 */
export async function completarContexto(datos: unknown): Promise<ActionResult> {
  const revisado = contextoSchema.safeParse(datos);
  if (!revisado.success) {
    return { success: false, error: revisado.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { leadId, vende, ciudad, preguntan, instagram } = revisado.data;

  try {
    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole
      .from("leads")
      .update({
        vende: vende || null,
        ciudad: ciudad || null,
        preguntan: preguntan || null,
        instagram: instagram ? normalizaInstagram(instagram) : null,
      })
      .eq("id", leadId);

    if (error) {
      console.error("completarContexto update failed", error);
      return { success: false, error: "No se pudo guardar. Intenta de nuevo." };
    }

    console.log("[prospecto con contexto]", JSON.stringify({ leadId, ciudad, instagram }));
    return { success: true };
  } catch (err) {
    console.error("completarContexto failed", err);
    return { success: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
}
