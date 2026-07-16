import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

/**
 * Every /dashboard page needs "the current user's business" — loaded here
 * once so pages don't re-implement the membership lookup + redirect rules.
 * Redirects to /login (no session) or /onboarding (no business yet, or
 * onboarding incomplete) instead of ever rendering a dashboard page without
 * a usable business record.
 */
export async function getCurrentBusiness(): Promise<{
  business: Tables<"businesses">;
  userId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", membership.business_id)
    .single();

  if (!business) redirect("/onboarding");
  if (!business.onboarding_completed_at) redirect("/onboarding");

  return { business, userId: user.id };
}
