"use server";

import { revalidatePath } from "next/cache";

import { extraerProspecto, type ProspectoExtraido } from "@/lib/agents/prospecto-agent";
import { conLimite, mensajeDeEspera } from "@/lib/espera";
import { esOperador } from "@/lib/operacion/acceso";
import { esEstado } from "@/lib/operacion/prospectos";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";
import { normalizaSitio, normalizaWhatsapp } from "@/lib/validation/lead";

type Resultado = { success: true } | { success: false; error: string };

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mueve un prospecto de estado.
 *
 * Con service-role porque `leads` tiene RLS y cero políticas. La
 * autorización la hace `esOperador` ANTES, no la base — y por eso es lo
 * primero que corre: sin esa comprobación, esta función sería una API
 * abierta para reescribir el embudo completo. Una server action es un
 * endpoint público aunque el botón que la llama esté detrás de una
 * pantalla que nadie puede abrir.
 */
export async function moverProspecto(datos: {
  id: unknown;
  estado: unknown;
}): Promise<Resultado> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { id, estado } = datos;
  if (typeof id !== "string" || !ES_UUID.test(id)) {
    return { success: false, error: "Prospecto no válido." };
  }
  if (typeof estado !== "string" || !esEstado(estado)) {
    return { success: false, error: "Estado no válido." };
  }

  const { error } = await createServiceRoleClient()
    .from("leads")
    .update({ estado })
    .eq("id", id);

  if (error) {
    console.error("moverProspecto falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/prospectos");
  return { success: true };
}

/** Guarda una nota sobre el prospecto. Texto libre y a mano: con diez
 *  prospectos, un campo de notas gana a cualquier CRM. */
export async function anotarProspecto(datos: {
  id: unknown;
  notas: unknown;
}): Promise<Resultado> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { id, notas } = datos;
  if (typeof id !== "string" || !ES_UUID.test(id)) {
    return { success: false, error: "Prospecto no válido." };
  }

  const texto = typeof notas === "string" ? notas.trim().slice(0, 2000) : "";

  const { error } = await createServiceRoleClient()
    .from("leads")
    .update({ notas: texto || null })
    .eq("id", id);

  if (error) {
    console.error("anotarProspecto falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/prospectos");
  return { success: true };
}

/** Lo que la pantalla necesita saber después de importar una conversación. */
export type Importacion =
  | {
      success: true;
      id: string;
      /** Si se creó un prospecto nuevo o se enriqueció uno que ya existía.
       *  La pantalla lo dice en voz alta: "ya existía y le sumé lo nuevo"
       *  evita que alguien crea que se duplicó. */
      creado: boolean;
      negocio: string;
      resumen: string;
      faltantes: string[];
    }
  | { success: false; error: string; faltaTelefono?: boolean };

/** Tope del texto que se acepta. Una conversación exportada de meses son
 *  cientos de miles de caracteres y el límite del cuerpo de una server
 *  action es 1 MB; se corta aquí para dar un error legible en vez de que
 *  falle la petición entera. El agente además recorta a lo último. */
const TOPE_CONVERSACION = 200_000;

/** La ventana del extractor. Más larga que LIMITE_MS porque del otro lado
 *  hay un modelo y no una base de datos, y menor que el maxDuration de la
 *  página para que se devuelva un error en vez de que Vercel corte. */
const LIMITE_AGENTE_MS = 45_000;

/**
 * Convierte una conversación de WhatsApp en un prospecto.
 *
 * Hoy el texto se pega a mano y mañana lo entrega el webhook de
 * Coexistence. Esta función no sabe de dónde vino y así debe quedarse.
 *
 * Sobre juntar con un prospecto que ya existe: gana SIEMPRE lo que el
 * prospecto escribió en el formulario. Lo del formulario lo tecleó él; lo
 * de aquí lo dedujo un modelo leyendo un chat. Por eso solo se rellenan
 * los campos que están vacíos — jamás se pisa uno que ya tiene algo.
 */
export async function importarConversacion(datos: {
  conversacion: unknown;
  whatsapp: unknown;
}): Promise<Importacion> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { conversacion, whatsapp } = datos;
  if (typeof conversacion !== "string" || conversacion.trim().length < 20) {
    return { success: false, error: "Pega la conversación completa." };
  }
  if (conversacion.length > TOPE_CONVERSACION) {
    return { success: false, error: "La conversación es demasiado larga. Pega los últimos mensajes." };
  }

  let extraido: ProspectoExtraido;
  try {
    extraido = await conLimite(extraerProspecto(conversacion), LIMITE_AGENTE_MS);
  } catch (err) {
    console.error("extraerProspecto falló", err);
    return {
      success: false,
      error: mensajeDeEspera(err, "El agente tardó demasiado. Vuelve a intentar."),
    };
  }

  // El teléfono decide todo: es la llave con la que se junta con lo que ya
  // existe y es lo único sin lo cual el prospecto no sirve de nada. El
  // número de quien escribe casi nunca aparece en el cuerpo del chat, así
  // que lo normal es que lo ponga el operador.
  const escrito = typeof whatsapp === "string" ? normalizaWhatsapp(whatsapp) : "";
  const delTexto = extraido.whatsapp ? normalizaWhatsapp(extraido.whatsapp) : "";
  const telefono = escrito.length === 10 ? escrito : delTexto.length === 10 ? delTexto : "";

  if (!telefono) {
    return {
      success: false,
      faltaTelefono: true,
      error: "No encontré el número en la conversación. Escríbelo tú y vuelve a importar.",
    };
  }

  const serviceRole = createServiceRoleClient();

  const { data: existente, error: errorBusqueda } = await serviceRole
    .from("leads")
    .select("*")
    .eq("whatsapp", telefono)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorBusqueda) {
    console.error("importarConversacion: búsqueda falló", errorBusqueda);
    return { success: false, error: "No se pudo leer la base." };
  }

  const hoy = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "America/Monterrey",
  }).format(new Date());

  const nota = `[${hoy}] ${extraido.resumen}`;

  if (existente) {
    // Solo lo que falta. Ver la nota de arriba sobre por qué.
    const parche: TablesUpdate<"leads"> = {
      notas: existente.notas ? `${existente.notas}\n\n${nota}` : nota,
    };
    if (!existente.instagram && extraido.instagram) parche.instagram = extraido.instagram;
    if (!existente.sitio_web && extraido.sitioWeb) {
      parche.sitio_web = normalizaSitio(extraido.sitioWeb);
    }
    if (!existente.ciudad && extraido.ciudad) parche.ciudad = extraido.ciudad;
    if (!existente.vende && extraido.vende) parche.vende = extraido.vende;
    if (!existente.preguntan && extraido.preguntan) parche.preguntan = extraido.preguntan;
    // El estado solo avanza desde 'nuevo'. Si una persona ya lo movió a
    // 'cliente' o 'perdido', el agente no tiene con qué contradecirla: no
    // estuvo en la llamada.
    if (existente.estado === "nuevo" && extraido.estadoSugerido !== "nuevo") {
      parche.estado = extraido.estadoSugerido;
    }

    const { error } = await serviceRole.from("leads").update(parche).eq("id", existente.id);
    if (error) {
      console.error("importarConversacion: update falló", error);
      return { success: false, error: "No se pudo guardar." };
    }

    revalidatePath("/prospectos");
    return {
      success: true,
      id: existente.id,
      creado: false,
      negocio: existente.negocio,
      resumen: extraido.resumen,
      faltantes: extraido.faltantes,
    };
  }

  // `nombre`, `negocio` y `giro` son NOT NULL en la tabla, y el agente
  // devuelve null cuando no se dijeron. Los respaldos dejan ver a simple
  // vista que ese dato falta, en vez de inventarlo.
  const { data: creado, error } = await serviceRole
    .from("leads")
    .insert({
      nombre: extraido.nombre ?? "Sin nombre",
      negocio: extraido.negocio ?? `Marca sin nombre (${telefono})`,
      giro: extraido.giro ?? "Otro producto empacado",
      whatsapp: telefono,
      instagram: extraido.instagram,
      sitio_web: extraido.sitioWeb ? normalizaSitio(extraido.sitioWeb) : null,
      ciudad: extraido.ciudad,
      vende: extraido.vende,
      preguntan: extraido.preguntan,
      estado: extraido.estadoSugerido,
      notas: nota,
      origen: "whatsapp",
    })
    .select("id, negocio")
    .single();

  if (error || !creado) {
    console.error("importarConversacion: insert falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/prospectos");
  return {
    success: true,
    id: creado.id,
    creado: true,
    negocio: creado.negocio,
    resumen: extraido.resumen,
    faltantes: extraido.faltantes,
  };
}
