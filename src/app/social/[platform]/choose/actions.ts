"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSocialPlatform, type ConnectableAccount } from "@/lib/social";

const PENDING_COOKIE = "social_oauth_pending";

export async function confirmSocialAccount(formData: FormData) {
  const { business } = await getCurrentBusiness();
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get(PENDING_COOKIE)?.value;
  if (!pendingCookie) redirect("/dashboard/redes-sociales?error=oauth_failed");

  cookieStore.set(PENDING_COOKIE, "", { maxAge: 0, path: "/social" });

  let pending: { businessId: string; platform: string; accounts: ConnectableAccount[] };
  try {
    pending = JSON.parse(pendingCookie);
  } catch {
    redirect("/dashboard/redes-sociales?error=oauth_failed");
  }

  if (pending.businessId !== business.id || !isSocialPlatform(pending.platform)) {
    redirect("/dashboard/redes-sociales?error=oauth_failed");
  }
  const platform = pending.platform;

  const index = Number(formData.get("accountIndex"));
  const account = pending.accounts[index];
  if (!account) redirect("/dashboard/redes-sociales?error=oauth_failed");

  const supabase = createServiceRoleClient();

  const { data: connection, error: connectionError } = await supabase
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

  const { error: tokenError } = await supabase.from("social_connection_tokens").upsert({
    connection_id: connection.id,
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expires_at: account.expiresAt,
  });
  if (tokenError) redirect("/dashboard/redes-sociales?error=oauth_failed");

  redirect(`/dashboard/redes-sociales?connected=${platform}`);
}
