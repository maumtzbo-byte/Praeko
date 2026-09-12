"use server";

import { revalidatePath } from "next/cache";

import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { nuevoToken } from "@/lib/aprobacion/liga";

/**
 * Crear la liga con la que el cliente aprueba su mes.
 *
 * A diferencia de la página pública, aquí SÍ hay sesión: esto lo dispara
 * quien opera la cuenta, y `getCurrentBusiness` ya resuelve a qué negocio
 * pertenece y redirige a /login si no hay nadie. El business_id sale de
 * ahí y nunca del formulario.
 *
 * El insert va con service-role porque `approval_links` tiene RLS activo y
 * cero políticas —el mismo patrón que `leads`—, así que ni el usuario con
 * sesión puede escribirla directo. La autorización la hace esta función
 * antes, no la base.
 */

type Resultado<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** El mes que se manda a aprobar no se elige: se deduce.
 *
 *  Es el mes calendario de la pieza más próxima que el cliente todavía no
 *  ha contestado. Se deduce en vez de preguntarse porque un selector de
 *  mes es una decisión que quien opera no necesita tomar —siempre quiere
 *  mandar lo que sigue— y cada decisión de más en un panel es un paso que
 *  se equivoca alguna vez.
 *
 *  Se recorta a un mes calendario y no al rango completo de lo pendiente
 *  para que la liga no crezca sola: doce piezas se revisan de una sentada,
 *  cuarenta no. */
function mesDe(fechaIso: string): { desde: string; hasta: string } {
  const [anio, mes] = fechaIso.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const dosDigitos = String(mes).padStart(2, "0");
  return { desde: `${anio}-${dosDigitos}-01`, hasta: `${anio}-${dosDigitos}-${ultimo}` };
}

export async function crearLigaDeAprobacion(): Promise<
  Resultado<{ token: string; desde: string; hasta: string }>
> {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  // La pieza sin contestar más próxima. Con RLS normal, así que solo
  // puede ver las de su propio negocio.
  const { data: siguiente } = await supabase
    .from("content_calendar")
    .select("scheduled_date")
    .eq("business_id", business.id)
    .is("client_verdict", null)
    .order("scheduled_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!siguiente) {
    return {
      success: false,
      error: "No hay piezas pendientes de aprobar. Genera el mes primero.",
    };
  }

  const { desde, hasta } = mesDe(siguiente.scheduled_date);
  const token = nuevoToken();

  const { error } = await createServiceRoleClient()
    .from("approval_links")
    .insert({ business_id: business.id, token, desde, hasta });

  if (error) {
    console.error("crearLigaDeAprobacion falló", error);
    return { success: false, error: "No se pudo crear la liga. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/publicaciones");
  return { success: true, data: { token, desde, hasta } };
}
