"use server";

import { headers } from "next/headers";

import { randomUUID } from "node:crypto";

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";
import {
  contextoSchema,
  leadSchema,
  normalizaInstagram,
  normalizaSitio,
  normalizaWhatsapp,
  TIPOS_DE_FOTO,
  TOPE_FOTOS,
} from "@/lib/validation/lead";

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

  const { leadId, vende, ciudad, preguntan, instagram, sitioWeb, estilos } = revisado.data;

  try {
    // El parche lleva SOLO lo que vino en esta llamada.
    //
    // Antes se escribían las cinco columnas siempre, poniendo null en las
    // que no venían. Eso funcionaba cuando el paso 2 era un formulario
    // único que se mandaba completo. Con el asistente por secciones se
    // vuelve un borrador: la sección de fotos llamaría sin sitio web y
    // dejaría en null el que la sección anterior acababa de guardar.
    //
    // Se distingue "no me mandaron este campo" de "me lo mandaron vacío":
    // lo primero no se toca, lo segundo sí se limpia.
    // Tipado contra el Update de la tabla y no como Record<string,
    // unknown>: el cliente de Supabase rechaza índices abiertos, y de paso
    // así un nombre de columna mal escrito se cae al compilar y no en
    // silencio contra la base.
    const parche: TablesUpdate<"leads"> = {};
    if (vende !== undefined) parche.vende = vende || null;
    if (ciudad !== undefined) parche.ciudad = ciudad || null;
    if (preguntan !== undefined) parche.preguntan = preguntan || null;
    if (instagram !== undefined) parche.instagram = instagram ? normalizaInstagram(instagram) : null;
    if (sitioWeb !== undefined) parche.sitio_web = sitioWeb ? normalizaSitio(sitioWeb) : null;
    if (estilos !== undefined) parche.estilos = estilos;

    if (Object.keys(parche).length === 0) return { success: true };

    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.from("leads").update(parche).eq("id", leadId);

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


/**
 * Le entrega al navegador permiso para subir UNA foto, y nada más.
 *
 * El archivo no pasa por el servidor a propósito. Una server action con
 * tres fotos de celular adentro son doce megas de cuerpo de petición, y
 * Next.js las limita a uno por omisión — subirlo sería pelearse con ese
 * límite para acabar gastando memoria del servidor en mover bytes que
 * Supabase puede recibir directo.
 *
 * En vez de eso, aquí se valida y se emite una URL firmada. La cubeta
 * `fotos-prospecto` tiene RLS con cero políticas, así que la URL firmada
 * es la única forma de escribir en ella, y la emite este código después de
 * comprobar tres cosas: que el lead existe, que el tipo de archivo es una
 * imagen, y que no lleva ya el tope de fotos.
 *
 * La ruta la arma el servidor (`${leadId}/${uuid}.ext`) y nunca la manda el
 * cliente: si la mandara, alguien con un lead válido podría pedir una
 * firma para escribir encima de la carpeta de otro prospecto.
 */
export async function pedirSubidaDeFoto(datos: {
  leadId: unknown;
  tipo: unknown;
}): Promise<
  { success: true; ruta: string; token: string } | { success: false; error: string }
> {
  const { leadId, tipo } = datos;

  if (typeof leadId !== "string" || !/^[0-9a-f-]{36}$/i.test(leadId)) {
    return { success: false, error: "Solicitud no válida." };
  }
  if (typeof tipo !== "string" || !(TIPOS_DE_FOTO as readonly string[]).includes(tipo)) {
    return { success: false, error: "Solo aceptamos JPG, PNG o WEBP." };
  }

  try {
    const serviceRole = createServiceRoleClient();

    const { data: lead } = await serviceRole
      .from("leads")
      .select("id, fotos")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead) return { success: false, error: "Solicitud no válida." };
    if ((lead.fotos?.length ?? 0) >= TOPE_FOTOS) {
      return { success: false, error: `Con ${TOPE_FOTOS} fotos nos alcanza de sobra.` };
    }

    const extension = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
    const ruta = `${leadId}/${randomUUID()}.${extension}`;

    const { data, error } = await serviceRole.storage
      .from("fotos-prospecto")
      .createSignedUploadUrl(ruta);

    if (error || !data) {
      console.error("pedirSubidaDeFoto falló", error);
      return { success: false, error: "No se pudo preparar la subida. Intenta de nuevo." };
    }

    return { success: true, ruta: data.path, token: data.token };
  } catch (err) {
    console.error("pedirSubidaDeFoto reventó", err);
    return { success: false, error: "No se pudo preparar la subida. Intenta de nuevo." };
  }
}

/**
 * Apunta en el prospecto una foto que ya se subió.
 *
 * Va aparte de la subida porque son dos momentos distintos: la URL firmada
 * se emite antes, el archivo viaja directo a Supabase, y hasta que ese
 * viaje termina tiene sentido anotarlo. Si el navegador se cierra a media
 * subida, queda un archivo huérfano en la cubeta y ninguna fila mintiendo
 * sobre él — que es el lado correcto por el que fallar.
 *
 * Comprueba que el archivo EXISTE antes de anotarlo, para que nadie mande
 * una ruta inventada y llene el registro de referencias a nada.
 */
export async function registrarFoto(datos: {
  leadId: unknown;
  ruta: unknown;
}): Promise<ActionResult> {
  const { leadId, ruta } = datos;

  if (typeof leadId !== "string" || typeof ruta !== "string") {
    return { success: false, error: "Solicitud no válida." };
  }
  // La ruta tiene que vivir dentro de la carpeta de ESTE prospecto.
  if (!ruta.startsWith(`${leadId}/`)) {
    return { success: false, error: "Solicitud no válida." };
  }

  try {
    const serviceRole = createServiceRoleClient();

    const { data: lead } = await serviceRole
      .from("leads")
      .select("fotos")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead) return { success: false, error: "Solicitud no válida." };

    const yaEstan = lead.fotos ?? [];
    if (yaEstan.includes(ruta)) return { success: true };
    if (yaEstan.length >= TOPE_FOTOS) {
      return { success: false, error: `Con ${TOPE_FOTOS} fotos nos alcanza de sobra.` };
    }

    const { data: archivo } = await serviceRole.storage
      .from("fotos-prospecto")
      .createSignedUrl(ruta, 60);
    if (!archivo) return { success: false, error: "No encontramos esa foto. Vuelve a subirla." };

    const { error } = await serviceRole
      .from("leads")
      .update({ fotos: [...yaEstan, ruta] })
      .eq("id", leadId);

    if (error) {
      console.error("registrarFoto falló", error);
      return { success: false, error: "No se pudo guardar la foto. Intenta de nuevo." };
    }

    return { success: true };
  } catch (err) {
    console.error("registrarFoto reventó", err);
    return { success: false, error: "No se pudo guardar la foto. Intenta de nuevo." };
  }
}
