"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveBusinessCookie } from "@/lib/dashboard/get-current-business";

/** Switches which of the user's businesses subsequent /dashboard pages
 * resolve as "current" (see getCurrentBusiness) — used by the workspace
 * switcher in the sidebar. Verifies membership server-side before trusting
 * the id a client component sent, same pattern as every other business_id
 * write in this codebase, rather than trusting the client-supplied id. */
export async function switchBusiness(businessId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!membership) return;

  await setActiveBusinessCookie(businessId);
  redirect("/dashboard");
}
