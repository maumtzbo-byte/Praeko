import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

/** Which of the user's businesses /dashboard pages should treat as
 * "current" — a user can belong to more than one (business_members is
 * many-to-many by design, see 0001_init.sql), e.g. a freelancer running a
 * separate workspace per client. Set on switch (see business-actions.ts)
 * and right when a new business is created (see /onboarding/actions.ts). */
export const ACTIVE_BUSINESS_COOKIE = "active_business_id";

export interface BusinessSummary {
  id: string;
  name: string;
}

export async function setActiveBusinessCookie(businessId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * Every /dashboard page needs "the current user's business" — loaded here
 * once so pages don't re-implement the membership lookup + redirect rules.
 * Resolves which business is "current" from the active_business_id cookie,
 * falling back to the oldest completed one if the cookie is missing, stale,
 * or points at a business this user isn't (or is no longer) a member of —
 * e.g. right after creating a second business but abandoning its onboarding
 * partway through. Redirects to /login (no session) or /onboarding (no
 * completed business at all) instead of ever rendering a dashboard page
 * without a usable business record.
 */
export async function getCurrentBusiness(): Promise<{
  business: Tables<"businesses">;
  userId: string;
  businesses: BusinessSummary[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membershipRows } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id);

  const businessIds = (membershipRows ?? []).map((m) => m.business_id);
  if (businessIds.length === 0) redirect("/onboarding");

  const { data: allBusinesses } = await supabase
    .from("businesses")
    .select("*")
    .in("id", businessIds)
    .order("created_at", { ascending: true });

  const completed = (allBusinesses ?? []).filter((b) => b.onboarding_completed_at !== null);
  if (completed.length === 0) redirect("/onboarding");

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const business = completed.find((b) => b.id === activeId) ?? completed[0];

  return {
    business,
    userId: user.id,
    businesses: completed.map((b) => ({ id: b.id, name: b.name })),
  };
}
