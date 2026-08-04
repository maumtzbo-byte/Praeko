"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

// social_connections has no delete policy for regular users (writes are
// service-role only, see migration 0010) — this action is the only way a
// business member can remove a connection, after verifying it's theirs.
export async function disconnectSocialAccount(formData: FormData) {
  const { business } = await getCurrentBusiness();
  const connectionId = formData.get("connectionId");
  if (typeof connectionId !== "string" || !connectionId) return;

  const supabase = createServiceRoleClient();
  await supabase
    .from("social_connections")
    .delete()
    .eq("id", connectionId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/redes-sociales");
}

// Cookie-bound client, not service-role: businesses_update's RLS policy
// (business members only) does the ownership check for free.
export async function setAutoReplyEnabled(formData: FormData) {
  const { business } = await getCurrentBusiness();
  const enabled = formData.get("enabled") === "true";

  const supabase = await createClient();
  await supabase.from("businesses").update({ auto_reply_enabled: enabled }).eq("id", business.id);

  revalidatePath("/dashboard/redes-sociales");
}
