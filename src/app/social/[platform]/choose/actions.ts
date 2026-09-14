"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolverPendiente, borrarPendiente } from "../pendiente";

const PENDING_COOKIE = "social_oauth_pending";

export async function confirmSocialAccount(formData: FormData) {
  const { business } = await getCurrentBusiness();
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(PENDING_COOKIE)?.value;

  cookieStore.set(PENDING_COOKIE, "", { maxAge: 0, path: "/social" });

  // Esta acción no recibe el platform por param (es un action de formulario):
  // sale de la fila del pendiente, que ya se validó contra el negocio de la
  // sesión. El id de la cookie ata a una sola fila y la fila es la autoridad
  // sobre a qué red pertenece.
  const pendiente = await resolverPendiente(cookieId, business.id);
  if (!pendiente) redirect("/dashboard/redes-sociales?error=oauth_failed");
  const platform = pendiente.platform;

  const serviceRole = createServiceRoleClient();

  const index = Number(formData.get("accountIndex"));
  const account = pendiente.accounts[index];
  if (!account) redirect("/dashboard/redes-sociales?error=oauth_failed");

  const { data: connection, error: connectionError } = await serviceRole
    .from("social_connections")
    .upsert(
      {
        business_id: business.id,
        platform,
        external_account_id: account.externalAccountId,
        external_account_name: account.name,
        external_account_avatar_url: account.avatarUrl,
        status: "active",
      },
      { onConflict: "business_id,platform" },
    )
    .select("id")
    .single();

  if (connectionError || !connection) redirect("/dashboard/redes-sociales?error=oauth_failed");

  const { error: tokenError } = await serviceRole.from("social_connection_tokens").upsert({
    connection_id: connection.id,
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expires_at: account.expiresAt,
  });
  if (tokenError) redirect("/dashboard/redes-sociales?error=oauth_failed");

  // El flujo terminó: la fila con los tokens ya no tiene por qué seguir ahí.
  await borrarPendiente(pendiente.id);

  redirect(`/dashboard/redes-sociales?connected=${platform}`);
}
