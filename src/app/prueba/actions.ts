"use server";

import { headers } from "next/headers";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { leadSchema, normalizaInstagram, normalizaWhatsapp } from "@/lib/validation/lead";

type ActionResult = { success: true } | { success: false; error: string };

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
export async function registrarProspecto(datos: unknown): Promise<ActionResult> {
  const revisado = leadSchema.safeParse(datos);
  if (!revisado.success) {
    return { success: false, error: revisado.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { nombre, negocio, giro, whatsapp, instagram, origen } = revisado.data;
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
      // es que su solicitud está recibida, no un regaño.
      return { success: true };
    }

    const { error } = await serviceRole.from("leads").insert({
      nombre,
      negocio,
      giro,
      whatsapp: telefono,
      instagram: instagram ? normalizaInstagram(instagram) : null,
      origen: origen || null,
    });

    if (error) {
      console.error("registrarProspecto insert failed", error);
      return { success: false, error: "No se pudo enviar. Intenta de nuevo." };
    }

    // El aviso a quien opera. Sin cron ni cola en este proyecto (la única
    // ruta de API es el webhook de Meta), un prospecto que nadie ve es un
    // prospecto perdido, y la promesa de la página son 24 horas.
    await avisar({ nombre, negocio, giro, telefono, instagram: instagram ?? null, origen: origen ?? null });

    return { success: true };
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
  instagram: string | null;
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
