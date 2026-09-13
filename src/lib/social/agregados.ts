import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Si el negocio pagó el agregado de comentarios.
 *
 * Existe porque hasta ahora no se preguntaba. El agente que contesta
 * comentarios, mensajes y reseñas respondía para todos los negocios
 * conectados, sin verificar nada — o sea que el producto que la página
 * anuncia como agregado se estaba regalando, y cada respuesta es una
 * llamada al modelo que sale de tu bolsa.
 *
 * Falla CERRADO: sin suscripción, con la suscripción inactiva, o si la
 * consulta truena, devuelve false. Un negocio que no debería tener el
 * agregado y lo tiene cuesta dinero en silencio; uno que sí debería y no
 * lo tiene se queja el mismo día y se arregla en un minuto. De los dos
 * errores, el segundo es el barato.
 */
export async function tieneAgregadoDeComentarios(businessId: string): Promise<boolean> {
  try {
    const { data } = await createServiceRoleClient()
      .from("subscriptions")
      .select("agregado_comentarios, status")
      .eq("business_id", businessId)
      .maybeSingle();

    return Boolean(data?.agregado_comentarios) && data?.status === "active";
  } catch (err) {
    console.error("tieneAgregadoDeComentarios falló", err);
    return false;
  }
}
