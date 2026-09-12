"use server";

import { estadoDeLiga } from "@/lib/aprobacion/liga";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * El veredicto del cliente sobre una pieza, desde la liga pública.
 *
 * Va con service-role porque no hay sesión: quien abre esta página no
 * tiene cuenta en Frames y nunca la va a tener. El token es la única
 * credencial, y por eso todo aquí empieza canjeándolo por un negocio y un
 * rango de fechas.
 *
 * La regla que no se rompe: el business_id y el rango salen del token,
 * jamás del formulario.
 */

type Resultado = { success: true } | { success: false; error: string };

const TOPE_COMENTARIO = 1000;

type LigaVigente = {
  id: string;
  business_id: string;
  desde: string;
  hasta: string;
  expires_at: string;
  opened_at: string | null;
  completed_at: string | null;
};

/** Lo que puede pasar al canjear un token.
 *
 *  Es una unión y no un `null` a secas porque los fallos no son
 *  equivalentes: "tu liga caducó" y "no pude preguntarle a la base" se
 *  veían iguales desde afuera, así que a un cliente con una liga
 *  perfectamente buena le salía "Esta liga ya no es válida. Pídenos una
 *  nueva." cuando lo que había fallado era la conexión. Ese mensaje lo
 *  manda a pedir algo que no necesita y te cuesta una conversación para
 *  descubrir que nunca hubo problema con su liga. */
type Canje =
  | { ok: true; serviceRole: ReturnType<typeof createServiceRoleClient>; liga: LigaVigente }
  | { ok: false; motivo: "no_valida" | "sin_conexion" };

async function resolverLiga(token: unknown): Promise<Canje> {
  if (typeof token !== "string" || token.length < 20) return { ok: false, motivo: "no_valida" };

  const serviceRole = createServiceRoleClient();
  const { data: liga, error } = await serviceRole
    .from("approval_links")
    .select("id, business_id, desde, hasta, expires_at, opened_at, completed_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("resolverLiga: no se pudo consultar approval_links", error);
    return { ok: false, motivo: "sin_conexion" };
  }
  // Una sola definición de "vigente", la misma que usa la página.
  if (!liga || estadoDeLiga(liga) !== "vigente") return { ok: false, motivo: "no_valida" };

  return { ok: true, serviceRole, liga };
}

function mensajeDeFallo(motivo: "no_valida" | "sin_conexion"): string {
  return motivo === "sin_conexion"
    ? "No pudimos conectarnos. Vuelve a intentar en un momento."
    : "Esta liga ya no es válida. Pídenos una nueva.";
}

/** Deja marcado que la liga ya se abrió.
 *
 *  `opened_at` se escribe una sola vez (solo si está en null) porque lo
 *  que interesa es la primera vez que la vio, no la última: es el dato que
 *  separa "no la ha abierto, hay que recordarle" de "la abrió y no
 *  contestó, algo no le gustó". */
export async function marcarAbierta(token: unknown): Promise<void> {
  const canje = await resolverLiga(token);
  if (!canje.ok || canje.liga.opened_at) return;

  await canje.serviceRole
    .from("approval_links")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", canje.liga.id)
    // Condición de carrera: dos pestañas abiertas a la vez escribirían dos
    // veces y la segunda movería la fecha. Con esto gana la primera.
    .is("opened_at", null);
}

export async function responderPieza(datos: {
  token: unknown;
  piezaId: unknown;
  veredicto: unknown;
  comentario?: unknown;
}): Promise<Resultado> {
  const { token, piezaId, veredicto } = datos;

  if (veredicto !== "aprobado" && veredicto !== "cambios") {
    return { success: false, error: "Veredicto no válido." };
  }
  if (typeof piezaId !== "string" || piezaId.length === 0) {
    return { success: false, error: "Pieza no válida." };
  }

  const comentario =
    typeof datos.comentario === "string" ? datos.comentario.trim().slice(0, TOPE_COMENTARIO) : "";

  // Pedir un cambio sin decir cuál no le sirve a nadie: la pieza vuelve a
  // producción y quien la rehace no sabe qué mover. Aprobar, en cambio, no
  // necesita explicación.
  if (veredicto === "cambios" && comentario.length === 0) {
    return { success: false, error: "Cuéntanos qué le cambiamos." };
  }

  const canje = await resolverLiga(token);
  if (!canje.ok) return { success: false, error: mensajeDeFallo(canje.motivo) };

  const { serviceRole, liga } = canje;

  const { error, count } = await serviceRole
    .from("content_calendar")
    .update(
      {
        client_verdict: veredicto,
        client_feedback: comentario || null,
        client_reviewed_at: new Date().toISOString(),
      },
      { count: "exact" },
    )
    .eq("id", piezaId)
    // Las tres condiciones juntas SON la autorización. El id de la pieza lo
    // manda el navegador, así que es un dato sin confianza; el negocio y el
    // rango salen del token. Sin el negocio y el rango, alguien con una
    // liga válida podría escribirle un veredicto a la pieza de otra marca.
    .eq("business_id", liga.business_id)
    .gte("scheduled_date", liga.desde)
    .lte("scheduled_date", liga.hasta);

  if (error) {
    console.error("responderPieza falló", error);
    return { success: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
  if (count === 0) {
    // No se encontró la pieza DENTRO de esta liga. Es lo que pasaría con un
    // id de otra marca, y también si la pieza se movió de fecha.
    return { success: false, error: "Esa pieza ya no está en este mes." };
  }

  // El aviso a quien produce. No hay cron ni cola en este proyecto, así que
  // esto es un renglón en el log de Vercel — buscable, y suficiente
  // mientras haya pocos clientes. Lo que importa es que un cambio pedido NO
  // se quede esperando a que alguien abra el panel por casualidad.
  //
  // Solo se registra "cambios": una aprobación no pide acción, y un log por
  // cada pieza aprobada de cada mes de cada cliente ahogaría al que sí
  // importa.
  if (veredicto === "cambios") {
    console.log(
      "[cliente pidió cambio]",
      JSON.stringify({
        businessId: liga.business_id,
        piezaId,
        comentario,
        cuando: new Date().toISOString(),
      }),
    );
  }

  return { success: true };
}

/** El cierre: el cliente dice que ya acabó de revisar.
 *
 *  Es un botón aparte y no algo que se deduzca de "ya no faltan piezas"
 *  porque las dos cosas son distintas: puede dejar tres sin contestar a
 *  propósito y querer cerrar igual, y puede contestar todas y seguir
 *  pensándolo. Quien produce necesita saber cuándo puede empezar. */
export async function cerrarRevision(token: unknown): Promise<Resultado> {
  const canje = await resolverLiga(token);
  if (!canje.ok) return { success: false, error: mensajeDeFallo(canje.motivo) };

  const { error } = await canje.serviceRole
    .from("approval_links")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", canje.liga.id);

  if (error) {
    console.error("cerrarRevision falló", error);
    return { success: false, error: "No se pudo guardar. Intenta de nuevo." };
  }

  console.log(
    "[cliente cerró su revisión]",
    JSON.stringify({ businessId: canje.liga.business_id, cuando: new Date().toISOString() }),
  );
  return { success: true };
}
