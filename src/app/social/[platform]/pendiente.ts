import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSocialPlatform, type ConnectableAccount, type SocialPlatform } from "@/lib/social";

/**
 * El pendiente de OAuth, resuelto desde el id que trae la cookie.
 *
 * Vive aquí, y no repetido en la página y en la acción, porque las dos
 * necesitan la misma comprobación y divergir sería la forma más fácil de
 * dejar un hueco: el id de la cookie se canjea por una fila, esa fila tiene
 * que ser de ESTE negocio y no haber caducado. Los tokens de las cuentas
 * nunca salieron del servidor; esto es lo que los vuelve a poner en mano de
 * quien los va a guardar.
 *
 * La plataforma NO se recibe como requisito: sale de la propia fila. El id
 * de la cookie ya ata a una sola fila, así que la fila es la autoridad
 * sobre a qué red pertenece. Quien tiene un param de URL (la página) lo
 * compara después contra lo que devuelve esto.
 */
export type Pendiente = {
  id: string;
  businessId: string;
  platform: SocialPlatform;
  accounts: ConnectableAccount[];
};

/** Un id de cookie que ni siquiera parece un uuid no vale la pena
 *  consultarlo. */
const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolverPendiente(
  cookieId: string | undefined,
  businessId: string,
): Promise<Pendiente | null> {
  if (!cookieId || !ES_UUID.test(cookieId)) return null;

  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole
    .from("social_oauth_pending")
    .select("id, business_id, platform, accounts, expires_at")
    .eq("id", cookieId)
    .maybeSingle();

  if (error || !data) return null;

  // La fila tiene que ser de este negocio. Que el negocio salga de
  // getCurrentBusiness (sesión verificada) y no de la cookie es lo que
  // impide que alguien con un id de pendiente ajeno lo canjee.
  if (data.business_id !== businessId) return null;
  if (!isSocialPlatform(data.platform)) return null;

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    // Caducado: se borra al pasar y se trata como inexistente.
    await serviceRole.from("social_oauth_pending").delete().eq("id", data.id);
    return null;
  }

  return {
    id: data.id,
    businessId: data.business_id,
    platform: data.platform,
    accounts: (data.accounts ?? []) as unknown as ConnectableAccount[],
  };
}

/** Se llama al confirmar: el flujo terminó, la fila con los tokens ya no
 *  tiene por qué existir. */
export async function borrarPendiente(id: string): Promise<void> {
  await createServiceRoleClient().from("social_oauth_pending").delete().eq("id", id);
}
